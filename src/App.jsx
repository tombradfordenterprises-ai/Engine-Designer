// [020] Imports React state, the interactive 3D engine scene, toolbar, and component guide.
import React, { useState } from 'react';
import EngineScene from './components/EngineScene.jsx';
import Toolbar from './components/Toolbar.jsx';
import InfoPanel from './components/InfoPanel.jsx';
import './App.css';

// [021] Defines the selectable engine components and plain-language explanations shown in the guide.
export const PARTS = {
  block: {
    name: 'Engine block', group: 'Foundation',
    what: 'The engine block is the main structure of the engine. It contains four cylinders and supports the moving parts.',
    why: 'It keeps the cylinders aligned and provides the structure that holds the crankshaft, pistons, and cylinder head.',
    where: 'The block is the foundation of the entire engine assembly.'
  },
  crankshaft: {
    name: 'Crankshaft', group: 'Rotating assembly',
    what: 'The crankshaft turns the pistons’ up-and-down movement into rotation.',
    why: 'That rotation is eventually transferred through the transmission to turn the wheels.',
    where: 'It sits in the lower crankcase, supported by bearing caps.'
  },
  pistons: {
    name: 'Pistons and connecting rods', group: 'Rotating assembly',
    what: 'Four pistons slide inside the cylinders. Each piston connects to the crankshaft through a strong connecting rod.',
    why: 'Combustion pushes the pistons down. The connecting rods transfer that force to the crankshaft.',
    where: 'The pistons fit inside the four cylinder bores. Their connecting rods reach down to the crankshaft.',
    note: 'Install the crankshaft before installing the piston-and-rod set.'
  },
  head: {
    name: 'Cylinder head', group: 'Cylinder head',
    what: 'The cylinder head closes the top of the cylinders and contains the valves and other parts that control airflow.',
    why: 'It seals the cylinders and helps control the air and exhaust moving through the engine.',
    where: 'It bolts to the top of the engine block, with a head gasket between them.'
  },
  oilpan: {
    name: 'Oil pan', group: 'Lubrication',
    what: 'The oil pan is a reservoir that holds engine oil when it is not circulating through the engine.',
    why: 'It supplies the oil pickup so the oil pump can send oil around the engine.',
    where: 'It bolts to the underside of the engine.'
  },
  exhaustManifold: {
    name: 'Exhaust manifold', group: 'Exhaust system',
    what: 'The exhaust manifold collects hot exhaust gases leaving the four cylinders.',
    why: 'It routes the exhaust from each cylinder into a single outlet that connects to the rest of the exhaust system.',
    where: 'It bolts to the side of the cylinder head, aligning with the four exhaust ports.'
  }
};

// [022] Defines realistic assembly prerequisites and a recommended teaching sequence.
const INSTALL_RULES = {
  crankshaft: { requires: [], order: 1, reason: 'The crankshaft must be seated in the block before the connecting rods can attach to it.' },
  pistons: { requires: ['crankshaft'], order: 2, reason: 'The connecting rods need the crankshaft in place so their lower ends can attach to the crank throws.' },
  oilpan: { requires: ['crankshaft', 'pistons'], order: 3, reason: 'The crankshaft and pistons belong inside the crankcase before the oil pan closes the bottom of the engine.' },
  head: { requires: ['pistons'], order: 4, reason: 'The piston assemblies need to be in the cylinders before the cylinder head covers the top of the block.' },
  exhaustManifold: { requires: ['head'], order: 5, reason: 'The exhaust manifold bolts to the cylinder head and must line up with its exhaust ports.' }
};

const RECOMMENDED_SEQUENCE = ['crankshaft', 'pistons', 'oilpan', 'head', 'exhaustManifold'];

// [023] Manages selection, installation checks, progress, view presets, and the information panel.
export default function App() {
  const [selected, setSelected] = useState('block');
  const [installed, setInstalled] = useState([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [view, setView] = useState('isometric');
  const [message, setMessage] = useState('Start with the crankshaft. Select an installation location on the engine, then click Install Part.');

  const selectPart = (id) => {
    setSelected(id);
    if (id === 'block') {
      setMessage('Engine block selected. It is the foundation and is already in place.');
    } else if (installed.includes(id)) {
      setMessage(`${PARTS[id].name} is already installed. Select another installation location to continue.`);
    } else {
      setMessage(`${PARTS[id].name} selected. Click Install Part to check the assembly requirements.`);
    }
  };

  // [024] Suggests the next uninstalled part in the recommended learning sequence.
  const getNextSuggestion = (parts) => {
    const nextId = RECOMMENDED_SEQUENCE.find((id) => !parts.includes(id));
    return nextId ? PARTS[nextId].name : null;
  };

  // [025] Validates prerequisites before installing and gives a useful explanation when order is wrong.
  const installPart = () => {
    if (selected === 'block') {
      setMessage('The engine block is already installed. Select the crankshaft location underneath the block to begin.');
      setPanelOpen(true);
      return;
    }
    if (installed.includes(selected)) {
      setMessage(`${PARTS[selected].name} is already installed. Choose a different part to continue.`);
      return;
    }

    const missing = (INSTALL_RULES[selected]?.requires || []).filter((id) => !installed.includes(id));
    if (missing.length) {
      const names = missing.map((id) => PARTS[id].name);
      setMessage(`⚠️ Assembly order warning: install ${names.join(' and ')} first. ${INSTALL_RULES[selected].reason}`);
      setPanelOpen(true);
      return;
    }

    const updated = [...installed, selected];
    setInstalled(updated);
    const next = getNextSuggestion(updated);
    if (next) {
      setMessage(`✓ ${PARTS[selected].name} installed. Suggested next step: ${next}.`);
    } else {
      setMessage('✓ Engine assembly complete! All five components have been installed.');
    }
  };

  // [026] Removes the most recently installed component to support simple undo.
  const undo = () => {
    if (!installed.length) {
      setMessage('There is nothing to undo yet.');
      return;
    }
    const removed = installed[installed.length - 1];
    const updated = installed.slice(0, -1);
    setInstalled(updated);
    setSelected(removed);
    setMessage(`${PARTS[removed].name} installation undone. You can reinstall it or choose another part.`);
  };

  // [025] Cycles through the preset camera angles while keeping mouse orbit available.
  const changeView = () => {
    const views = ['isometric', 'front', 'top', 'side', 'bottom'];
    setView((current) => views[(views.indexOf(current) + 1) % views.length]);
  };

  return <main className="app-shell">
    {/* [026] Shows the game title, current assembly status, and short interaction guidance. */}
    <header className="topbar">
      <div>
        <div className="eyebrow">INTERACTIVE MECHANICAL WORKSHOP</div>
        <h1>Inline Four <span>Engine Builder</span></h1>
      </div>
      <div className="progress-wrap">
        <div className="progress-label"><span>ASSEMBLY</span><strong>{installed.length}/5 PARTS</strong></div>
        <div className="progress-track"><div style={{ width: `${installed.length / 5 * 100}%` }} /></div>
      </div>
    </header>

    {/* [027] Hosts the detailed 3D engine block and automatically installed engine components. */}
    <section className="workspace">
      <div className="scene-hint"><span className="hint-dot" /> ROTATE THE ENGINE · HOVER TO HIGHLIGHT · CLICK A PART LOCATION</div>
      <EngineScene selected={selected} installed={installed} onSelect={selectPart} view={view} />
      <div className="status-message">{message}</div>
      <div className="view-label">{view.toUpperCase()} VIEW</div>
    </section>

    {/* [028] Keeps the six-button gray toolbar fixed at the bottom of the game interface. */}
    <Toolbar selected={selected} onInstall={installPart}
      onGuide={() => { setMessage('Recommended order: crankshaft → pistons and connecting rods → oil pan → cylinder head → exhaust manifold. The simulator checks prerequisites and explains any step that is attempted too early. Rotate the engine and click the matching installation area to select a part.'); setPanelOpen(true); }}
      onExplain={() => setPanelOpen(true)}
      onView={changeView} onUndo={undo}
      onBack={() => setMessage('You are at the beginning of the engine build. Select an installation area directly on the engine.')} />

    {/* [029] Slides the selected component's educational explanation upward from the toolbar. */}
    <InfoPanel part={PARTS[selected]} open={panelOpen} onClose={() => setPanelOpen(false)} />
  </main>;
}
