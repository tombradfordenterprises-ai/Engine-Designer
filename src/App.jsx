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
  }
};

// [022] Manages selection, assembly order, progress, view presets, and the sliding information panel.
export default function App() {
  const [selected, setSelected] = useState('block');
  const [installed, setInstalled] = useState([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [view, setView] = useState('isometric');
  const [message, setMessage] = useState('Rotate the engine and click a part location: top deck for pistons, underside for crankshaft, lower edge for oil pan.');

  const selectPart = (id) => {
    setSelected(id);
    setMessage(`${PARTS[id].name} selected.`);
  };

  // [023] Installs parts automatically while requiring the crankshaft before the piston-and-rod assembly.
  const installPart = () => {
    if (selected === 'block') {
      setMessage('The engine block is the foundation and is already in place.');
      setPanelOpen(true);
      return;
    }
    if (selected === 'pistons' && !installed.includes('crankshaft')) {
      setMessage('Install the crankshaft first, then add the pistons and connecting rods.');
      setPanelOpen(true);
      return;
    }
    if (installed.includes(selected)) {
      setMessage(`${PARTS[selected].name} is already installed.`);
      return;
    }
    setInstalled((current) => [...current, selected]);
    setMessage(`${PARTS[selected].name} installed.`);
  };

  // [024] Removes the most recently installed component to support simple undo.
  const undo = () => {
    setInstalled((current) => {
      if (!current.length) {
        setMessage('There is nothing to undo yet.');
        return current;
      }
      const removed = current[current.length - 1];
      setMessage(`${PARTS[removed].name} installation undone.`);
      return current.slice(0, -1);
    });
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
        <div className="progress-label"><span>ASSEMBLY</span><strong>{installed.length}/4 PARTS</strong></div>
        <div className="progress-track"><div style={{ width: `${installed.length / 4 * 100}%` }} /></div>
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
      onGuide={() => setMessage('Rotate the engine with your mouse. Click the top deck to select pistons, or switch to Bottom View and click the lower crankcase for the crankshaft. After pistons are installed, the top deck selects the cylinder head. Click the lower outer edge for the oil pan.')}
      onExplain={() => setPanelOpen(true)}
      onView={changeView} onUndo={undo}
      onBack={() => setMessage('You are at the beginning of the engine build. Select an installation area directly on the engine.')} />

    {/* [029] Slides the selected component's educational explanation upward from the toolbar. */}
    <InfoPanel part={PARTS[selected]} open={panelOpen} onClose={() => setPanelOpen(false)} />
  </main>;
}
