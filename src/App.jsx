// [020] Imports React state, the 3D engine scene, and the persistent bottom toolbar.
import React, { useState } from 'react';
import EngineScene from './components/EngineScene.jsx';
import Toolbar from './components/Toolbar.jsx';
import InfoPanel from './components/InfoPanel.jsx';
import './App.css';

// [021] Defines the selectable engine components and their beginner-friendly explanations.
export const PARTS = {
  block: {
    name: 'Engine block', group: 'Foundation',
    what: 'The engine block is the main structure of the engine. It contains the cylinders and supports many of the moving and stationary components.',
    why: 'It keeps the cylinders aligned and provides the structure that holds the crankshaft, pistons, and cylinder head.',
    where: 'The block is the foundation of the entire engine assembly.'
  },
  crankshaft: {
    name: 'Crankshaft', group: 'Rotating assembly',
    what: 'The crankshaft converts the pistons’ up-and-down movement into rotational movement.',
    why: 'That rotation is transferred through the flywheel and transmission to drive the vehicle.',
    where: 'It sits in the lower part of the engine block, supported by main bearings.'
  },
  pistons: {
    name: 'Pistons', group: 'Rotating assembly',
    what: 'Pistons move up and down inside the cylinder bores. Combustion pressure pushes them downward during the power stroke.',
    why: 'They transfer the force created by combustion to the connecting rods.',
    where: 'One piston fits inside each cylinder and connects to the crankshaft through a connecting rod.'
  },
  head: {
    name: 'Cylinder head', group: 'Cylinder head',
    what: 'The cylinder head closes the top of the cylinders and houses the combustion chambers and valve gear.',
    why: 'It helps seal the cylinders and controls the flow of air, fuel, and exhaust gases.',
    where: 'It bolts to the top deck of the engine block, with a head gasket between them.'
  },
  oilpan: {
    name: 'Oil pan', group: 'Lubrication',
    what: 'The oil pan is a reservoir that stores engine oil when it is not circulating through the engine.',
    why: 'It supplies the oil pickup so the oil pump can send oil to lubricate moving parts.',
    where: 'It bolts to the bottom of the engine block.'
  }
};

// [022] Stores the game state and coordinates the scene, part selection, installation, and information drawer.
export default function App() {
  const [selected, setSelected] = useState('block');
  const [installed, setInstalled] = useState([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [view, setView] = useState('isometric');
  const [message, setMessage] = useState('Select a highlighted engine area to begin.');

  const selectPart = (id) => {
    setSelected(id);
    setMessage(`${PARTS[id].name} selected.`);
  };

  const installPart = () => {
    if (selected === 'block') {
      setMessage('The engine block is the starting foundation.');
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

  const changeView = () => {
    const views = ['isometric', 'front', 'top', 'side', 'bottom'];
    setView((current) => views[(views.indexOf(current) + 1) % views.length]);
  };

  return (
    <main className="app-shell">
      {/* [023] Shows the game title, current assembly status, and short interaction guidance. */}
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

      {/* [024] Hosts the interactive 3D engine model on a clean white workspace. */}
      <section className="workspace">
        <div className="scene-hint"><span className="hint-dot" /> HOVER TO HIGHLIGHT · CLICK TO SELECT</div>
        <EngineScene selected={selected} installed={installed} onSelect={selectPart} view={view} />
        <div className="status-message">{message}</div>
        <div className="view-label">{view.toUpperCase()} VIEW</div>
      </section>

      {/* [025] Keeps the six-button gray control bar fixed at the bottom of the game interface. */}
      <Toolbar
        selected={selected}
        onInstall={installPart}
        onExplain={() => setPanelOpen(true)}
        onView={changeView}
        onUndo={undo}
        onBack={() => setMessage('You are at the beginning of the engine build.')}
      />

      {/* [026] Slides the selected component's educational explanation upward from the toolbar. */}
      <InfoPanel part={PARTS[selected]} open={panelOpen} onClose={() => setPanelOpen(false)} />
    </main>
  );
}
