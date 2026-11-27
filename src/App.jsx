// [020] Imports React state, the CAD-based engine scene, toolbar, and component guide.
import React, { useState } from 'react';
import EngineCADScene from './components/EngineCADScene.jsx';
import Toolbar from './components/Toolbar.jsx';
import InfoPanel from './components/InfoPanel.jsx';
import './App.css';
import b16Catalog from './data/engines/B16/parts.json';
import { enginePartList } from './data/enginePartRegistry.js';


// The static catalog supplies the full 52-part roadmap; folder metadata registers modeled parts.
const registeredMetadata = enginePartList.map(({ Component, ...metadata }) => metadata);
const PARTS = Object.fromEntries(
  [...b16Catalog.parts, ...registeredMetadata].map((part) => [part.id, part])
);
const INSTALL_RULES = Object.fromEntries(
  Object.values(PARTS).map((part) => [part.id, {
    requires: part.requires || [],
    reason: part.installationReason || 'Install this component after its listed prerequisites are in place.'
  }])
);
const RECOMMENDED_SEQUENCE = Object.values(PARTS)
  .filter((part) => part.installable)
  .sort((a, b) => (a.recommendedOrder ?? a.sequence ?? 9999) - (b.recommendedOrder ?? b.sequence ?? 9999))
  .map((part) => part.id);
const ACTIVE_PART_IDS = RECOMMENDED_SEQUENCE;
const INSTALLABLE_COUNT = ACTIVE_PART_IDS.length;
const CATALOG_COUNT = Object.keys(PARTS).length;

// [024] App owns installation state so progress, the toolbar, and the CAD scene stay synchronized.
export default function App() {
  const [selected, setSelected] = useState('engineBlock');
  const [installed, setInstalled] = useState([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [showHotspots, setShowHotspots] = useState(true);
  const [engineRotating, setEngineRotating] = useState(false);
  const [view, setView] = useState('isometric');
  const [message, setMessage] = useState(
    'Hover over a highlighted installation area and click it to select a component.'
  );

  // [025] Finds the next uninstalled item in the recommended sequence.
  const getNextSuggestion = (parts) => {
    const nextId = RECOMMENDED_SEQUENCE.find((id) => !parts.includes(id));
    return nextId ? PARTS[nextId].name : null;
  };

  // [026] Handles selection from actual CAD meshes and installation hotspots.
  const selectPart = (id) => {
    setSelected(id);

    if (id === 'engineBlock') {
      setMessage('Engine block selected. Choose a highlighted installation area to select a component.');
      return;
    }
    if (installed.includes(id)) {
      setMessage(`${PARTS[id]?.name || 'This component'} is already installed.`);
      setPanelOpen(true);
      return;
    }
    const rule = INSTALL_RULES[id];
    const missing = rule ? rule.requires.filter((requiredId) => !installed.includes(requiredId)) : [];
    if (missing.length) {
      setMessage(`This area is locked until ${missing.map((partId) => PARTS[partId].name).join(' and ')} are installed.`);
    } else {
      setMessage(`${PARTS[id]?.name || 'Component'} selected. Review the part, then click Install Part.`);
    }
    setPanelOpen(true);
  };

  // [027] Validates component dependencies before revealing the CAD meshes.
  const installPart = (partId = selected) => {
    const targetId = partId;
    if (targetId !== selected) setSelected(targetId);
    if (targetId === 'engineBlock') {
      setMessage('The engine block is already present. Select another component location on the 3D model first.');
      setPanelOpen(true);
      return;
    }
    const rule = INSTALL_RULES[targetId];
    if (!rule || !PARTS[targetId]) {
      setMessage('Select a valid component location on the 3D engine first.');
      setPanelOpen(true);
      return;
    }
    if (installed.includes(targetId)) {
      setMessage(`${PARTS[targetId].name} is already installed. Choose another uninstalled component.`);
      setPanelOpen(true);
      return;
    }
    const missing = rule.requires.filter((requiredId) => !installed.includes(requiredId));
    if (missing.length > 0) {
      const missingNames = missing.map((id) => PARTS[id].name);
      const next = getNextSuggestion(installed);
      setMessage(
        `Assembly order warning: install ${missingNames.join(' and ')} first. ${rule.reason}` +
        (next ? ` Suggested next step: ${next}.` : '')
      );
      setPanelOpen(true);
      return;
    }
    const updated = [...installed, targetId];
    setInstalled(updated);
    const next = getNextSuggestion(updated);
    if (updated.length === INSTALLABLE_COUNT) {
      setMessage(`✓ ${PARTS[targetId].name} installed. The assembly animation is playing.`);
    } else {
      setMessage(`✓ ${PARTS[targetId].name} installed. The assembly animation is playing.${next ? ` Recommended next step: ${next}.` : ''}`);
    }
    setPanelOpen(true);
    setView(`install:${targetId}`);
  };

  // [028] Undo removes the most recently installed group, preserving dependency order.
  const undo = () => {
    if (installed.length === 0) {
      setMessage('There is nothing to undo yet. Install a component first.');
      return;
    }
    const removed = installed[installed.length - 1];
    const updated = installed.slice(0, -1);
    if (!updated.includes('pistonsRods')) setEngineRotating(false);
    setInstalled(updated);
    setSelected(removed);
    setMessage(`${PARTS[removed].name} installation undone.`);
    setPanelOpen(false);
  };

  // [029] Cycles camera presets; free orbit, pan, and zoom remain available in the scene.
  const changeView = () => {
    const views = ['isometric', 'front', 'top', 'side', 'bottom'];
    setView((current) => views[(views.indexOf(current) + 1) % views.length]);
  };

  // [030] Shows the suggested order and remaining steps.
  const showGuide = () => {
    const remaining = RECOMMENDED_SEQUENCE
      .filter((id) => !installed.includes(id))
      .map((id, index) => `${index + 1}. ${PARTS[id].name}`);
    setMessage(
      `Suggested assembly order: ${RECOMMENDED_SEQUENCE.map((id) => PARTS[id].name).join(' → ')}. ` +
      `Installed: ${installed.length} of ${INSTALLABLE_COUNT}. ` +
      (remaining.length ? `Remaining: ${remaining.join('; ')}. ` : 'This modeled assembly stage is complete. ') +
      'Select a highlighted installation area on the CAD model, review the component, and click Install Part. The simulator checks prerequisites before installing it.'
    );
    setPanelOpen(true);
  };

  const progress = Math.round((installed.length / INSTALLABLE_COUNT) * 100);

  return (
    <main className="app-shell">
      {/* [031] Header and live installation progress. */}
      <header className="topbar">
        <div>
          <div className="eyebrow">INTERACTIVE MECHANICAL WORKSHOP</div>
          <h1>Honda B16 <span>Engine Builder</span></h1>
        </div>
        <div className="progress-wrap">
          <div className="progress-label">
            <span>ASSEMBLY</span>
            <strong>{installed.length}/{INSTALLABLE_COUNT} MODELED PARTS</strong>
          </div>
          <div className="catalog-count">{CATALOG_COUNT} PARTS IN B16 CATALOG</div>
          <div className="progress-track"><div style={{ width: `${progress}%` }} /></div>
        </div>
      </header>

      {/* [032] Honda B16 bare-block CAD scene. */}
      <section className="workspace">
        <div className="scene-hint"><span className="hint-dot" /> HONDA B16 · BARE BLOCK</div>
        <EngineCADScene
          selected={selected}
          installed={installed}
          onSelect={selectPart}
          view={view}
          onInstallPart={installPart}
          showHotspots={showHotspots}
        />
        <div className="status-message" role="status" aria-live="polite">{message}</div>
        <div className="view-label">{view.startsWith('install:') ? 'INSTALLATION VIEW' : `${view.toUpperCase()} VIEW`}</div>
      </section>

      {/* [033] Existing toolbar retained while B16 component groups are mapped. */}
      <Toolbar
        selected={selected}
        installed={installed}
        onInstall={installPart}
        onGuide={showGuide}
        onExplain={() => setPanelOpen(true)}
        onView={changeView}
        onUndo={undo}
        showHotspots={showHotspots}
        onToggleHotspots={() => setShowHotspots((visible) => !visible)}
        engineRotating={engineRotating}
        canRotateEngine={installed.includes('pistonsRods')}
        onToggleEngineRotation={() => setEngineRotating((rotating) => !rotating)}
        onBack={() => {
          setSelected('engineBlock');
          setMessage('Engine overview. Select a component location directly on the CAD model to continue.');
          setPanelOpen(false);
        }}
      />

      {/* [034] Educational panel for the selected CAD component. */}
      <InfoPanel part={PARTS[selected] || PARTS.engineBlock} open={panelOpen} onClose={() => setPanelOpen(false)} onInstall={() => installPart(selected)} installed={installed.includes(selected)} />
    </main>
  );
}
