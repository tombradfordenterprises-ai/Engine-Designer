// [020] Imports React state, the interactive 3D engine scene, toolbar, and component guide.
import React, { useState } from 'react';
import EngineScene from './components/EngineScene.jsx';
import Toolbar from './components/Toolbar.jsx';
import InfoPanel from './components/InfoPanel.jsx';
import './App.css';

// [021] Defines the selectable engine components and plain-language explanations.
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
    where: 'It sits in the lower crankcase, supported by the main bearings.'
  },
  pistons: {
    name: 'Pistons and connecting rods', group: 'Rotating assembly',
    what: 'Four pistons slide inside the cylinders. Each piston connects to the crankshaft through a connecting rod.',
    why: 'Combustion pushes the pistons down. The connecting rods transfer that force to the crankshaft.',
    where: 'The pistons fit inside the four cylinder bores. Their connecting rods reach down to the crankshaft.',
    note: 'The crankshaft must be installed before the connecting rods can be attached.'
  },
  head: {
    name: 'Cylinder head', group: 'Cylinder head',
    what: 'The cylinder head closes the top of the cylinders and contains the valves and combustion chambers.',
    why: 'It seals the cylinders and helps control the air and exhaust moving through the engine.',
    where: 'It bolts to the top of the engine block, with a head gasket between them.'
  },
  oilpan: {
    name: 'Oil pan', group: 'Lubrication',
    what: 'The oil pan is a reservoir that holds engine oil when it is not circulating through the engine.',
    why: 'It supplies the oil pickup so the oil pump can send oil around the engine.',
    where: 'It bolts to the underside of the engine.',
    note: 'Install the internal rotating parts before closing the bottom of the crankcase.'
  },
  exhaustManifold: {
    name: 'Exhaust manifold', group: 'Exhaust system',
    what: 'The exhaust manifold collects hot exhaust gases leaving the four cylinders.',
    why: 'It routes exhaust from each cylinder into a single outlet that connects to the rest of the exhaust system.',
    where: 'It bolts to the side of the cylinder head, aligning with the four exhaust ports.'
  },
  // [021A] Front accessory-drive components.
  crankshaftPulley: {
    name: 'Crankshaft pulley / harmonic balancer', group: 'Accessory drive',
    what: 'The crankshaft pulley attaches to the front of the crankshaft. The harmonic balancer also helps reduce torsional vibration.',
    why: 'It transfers crankshaft rotation to the serpentine belt, which drives the engine accessories.',
    where: 'It mounts on the front end of the crankshaft, ahead of the timing cover.'
  },
  waterPump: {
    name: 'Water pump', group: 'Cooling system',
    what: 'The water pump circulates coolant through the engine and radiator.',
    why: 'Coolant flow carries heat away from the engine and helps maintain a safe operating temperature.',
    where: 'It mounts at the front of the engine. Its pulley is driven by the serpentine belt in this simplified layout.'
  },
  alternator: {
    name: 'Alternator', group: 'Electrical system',
    what: 'The alternator converts engine rotation into electrical power.',
    why: 'It supplies electrical power while the engine runs and recharges the vehicle battery.',
    where: 'It mounts on the front accessory bracket and is driven by the serpentine belt.'
  },
  powerSteeringPump: {
    name: 'Power steering pump', group: 'Steering system',
    what: 'The power steering pump supplies pressurized hydraulic fluid to the steering system.',
    why: 'Hydraulic pressure helps reduce the effort needed to turn the steering wheel.',
    where: 'It mounts on the front accessory bracket and is driven by the serpentine belt.'
  },
  beltTensioner: {
    name: 'Belt tensioner', group: 'Accessory drive',
    what: 'The spring-loaded belt tensioner maintains the correct tension on the serpentine belt.',
    why: 'Correct tension helps prevent belt slip, noise, and loss of accessory drive.',
    where: 'It mounts to the front of the engine among the accessory pulleys.'
  },
  idlerPulley: {
    name: 'Idler pulley', group: 'Accessory drive',
    what: 'An idler pulley guides the serpentine belt along its route.',
    why: 'It helps the belt contact the accessory pulleys at the correct angle.',
    where: 'It mounts on the front accessory bracket and does not directly power an accessory.'
  },
  serpentineBelt: {
    name: 'Serpentine belt', group: 'Accessory drive',
    what: 'The serpentine belt is one continuous belt that loops around the crankshaft pulley and accessory pulleys.',
    why: 'It transfers crankshaft rotation to the alternator, water pump, and power steering pump.',
    where: 'It runs around the grooved pulleys and the smooth tensioner and idler pulleys at the front of the engine.',
    note: 'Install the belt only after the crankshaft pulley, accessories, tensioner, and idler are installed.'
  }
};

// [022] Rules enforce real component dependencies rather than an arbitrary fixed order.
// A component is allowed as soon as all of its required components are installed.
const INSTALL_RULES = {
  crankshaft: {
    requires: [],
    reason: 'The crankshaft is supported inside the engine block and forms the rotating foundation for the piston assemblies.'
  },
  pistons: {
    requires: ['crankshaft'],
    reason: 'The connecting rods need the crankshaft in place so their lower ends can attach to the crank throws.'
  },
  head: {
    requires: ['pistons'],
    reason: 'The piston assemblies need to be in the cylinders before the cylinder head closes the top of the block.'
  },
  oilpan: {
    requires: ['crankshaft', 'pistons'],
    reason: 'The crankshaft and piston assemblies belong inside the crankcase before the oil pan closes the bottom.'
  },
  exhaustManifold: {
    requires: ['head'],
    reason: 'The exhaust manifold bolts to the cylinder head and must line up with its exhaust ports.'
  },
  crankshaftPulley: {
    requires: ['crankshaft'],
    reason: 'The crankshaft pulley mounts directly to the front of the crankshaft, so the crankshaft must be installed first.'
  },
  waterPump: {
    requires: ['crankshaftPulley'],
    reason: 'The water pump mounts on the front accessory drive. Install the crankshaft pulley first so the accessory-drive assembly can be built in sequence.'
  },
  alternator: {
    requires: ['crankshaftPulley'],
    reason: 'The alternator must be mounted on the front accessory bracket before the serpentine belt can be routed.'
  },
  powerSteeringPump: {
    requires: ['crankshaftPulley'],
    reason: 'The power steering pump mounts on the front accessory bracket and must be in place before the belt is routed.'
  },
  beltTensioner: {
    requires: ['crankshaftPulley'],
    reason: 'The tensioner mounts to the front of the engine and must be installed before the serpentine belt.'
  },
  idlerPulley: {
    requires: ['crankshaftPulley'],
    reason: 'The idler pulley must be installed in its guide position before the serpentine belt is routed.'
  },
  serpentineBelt: {
    requires: ['crankshaftPulley', 'waterPump', 'alternator', 'powerSteeringPump', 'beltTensioner', 'idlerPulley'],
    reason: 'The belt must route around the crankshaft pulley, water pump, alternator, power steering pump, tensioner, and idler. Install all of those components first.'
  }
};

// [023] This is the suggested teaching order. Other mechanically valid orders remain allowed.
const RECOMMENDED_SEQUENCE = [
  'crankshaft', 'pistons', 'head', 'oilpan', 'exhaustManifold',
  'crankshaftPulley', 'waterPump', 'alternator', 'powerSteeringPump',
  'beltTensioner', 'idlerPulley', 'serpentineBelt'
];
const INSTALLABLE_COUNT = Object.keys(INSTALL_RULES).length;

// [024] App owns the installation state so the toolbar, progress display, and 3D scene stay in sync.
export default function App() {
  const [selected, setSelected] = useState('block');
  const [installed, setInstalled] = useState([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [view, setView] = useState('isometric');
  const [message, setMessage] = useState(
    'Start with the crankshaft, then build the engine and its front accessory drive. Select a part location on the 3D model and click Install Part.'
  );

  // [025] Finds the next uninstalled item in the recommended learning sequence.
  const getNextSuggestion = (parts) => {
    const nextId = RECOMMENDED_SEQUENCE.find((id) => !parts.includes(id));
    return nextId ? PARTS[nextId].name : null;
  };

  // [026] Handles direct selection from the 3D model and explains the current selection.
  const selectPart = (id) => {
    setSelected(id);
    if (id === 'block') {
      setMessage('Engine block selected. It is the foundation of the assembly and is already in place.');
      return;
    }
    if (installed.includes(id)) {
      setMessage(`${PARTS[id]?.name || 'This component'} is already installed. Select an uninstalled location to continue.`);
      return;
    }
    setMessage(`${PARTS[id]?.name || 'Component'} selected. Click Install Part to check its installation requirements.`);
  };

  // [027] Validates dependencies before changing the installed list.
  const installPart = () => {
    if (selected === 'block') {
      setMessage('The engine block is already installed. Select an uninstalled component location on the 3D engine first.');
      setPanelOpen(true);
      return;
    }

    const rule = INSTALL_RULES[selected];
    if (!rule || !PARTS[selected]) {
      setMessage('Select a valid component installation location on the 3D engine first.');
      setPanelOpen(true);
      return;
    }

    if (installed.includes(selected)) {
      setMessage(`${PARTS[selected].name} is already installed. Choose another uninstalled component.`);
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

    const updated = [...installed, selected];
    setInstalled(updated);
    const next = getNextSuggestion(updated);

    if (updated.length === INSTALLABLE_COUNT) {
      setMessage(`✓ ${PARTS[selected].name} installed. Engine assembly stage complete! All ${INSTALLABLE_COUNT} currently modeled components are installed.`);
    } else {
      setMessage(`✓ ${PARTS[selected].name} installed successfully.${next ? ` Recommended next step: ${next}.` : ''}`);
    }
    setPanelOpen(false);
  };

  // [028] Undo removes the most recently installed part. Since prerequisites must come first,
  // last-in-first-out undo also preserves the dependency order.
  const undo = () => {
    if (installed.length === 0) {
      setMessage('There is nothing to undo yet. Install a component first.');
      return;
    }
    const removed = installed[installed.length - 1];
    const updated = installed.slice(0, -1);
    setInstalled(updated);
    setSelected(removed);
    setMessage(`${PARTS[removed].name} installation undone. Select Install Part to put it back, or choose another available component.`);
    setPanelOpen(false);
  };

  // [029] Cycles through camera presets while mouse orbit remains available in the 3D scene.
  const changeView = () => {
    const views = ['isometric', 'front', 'top', 'side', 'bottom'];
    setView((current) => views[(views.indexOf(current) + 1) % views.length]);
  };

  // [030] Opens a concise guide that shows the suggested order and explains that dependencies are checked.
  const showGuide = () => {
    const remaining = RECOMMENDED_SEQUENCE
      .filter((id) => !installed.includes(id))
      .map((id, index) => `${index + 1}. ${PARTS[id].name}`);
    setMessage(
      `Suggested assembly order: ${RECOMMENDED_SEQUENCE.map((id) => PARTS[id].name).join(' → ')}. ` +
      `Already installed: ${installed.length} of ${INSTALLABLE_COUNT}. ` +
      (remaining.length ? `Remaining suggested steps: ${remaining.join('; ')}. ` : 'This modeled assembly stage is complete. ') +
      'Select a component directly on the 3D engine and click Install Part. The simulator checks prerequisites and explains any step attempted too early.'
    );
    setPanelOpen(true);
  };

  const progress = Math.round((installed.length / INSTALLABLE_COUNT) * 100);

  return (
    <main className="app-shell">
      {/* [031] Shows the title and live assembly progress. */}
      <header className="topbar">
        <div>
          <div className="eyebrow">INTERACTIVE MECHANICAL WORKSHOP</div>
          <h1>Inline Four <span>Engine Builder</span></h1>
        </div>
        <div className="progress-wrap">
          <div className="progress-label">
            <span>ASSEMBLY</span>
            <strong>{installed.length}/{INSTALLABLE_COUNT} PARTS</strong>
          </div>
          <div className="progress-track">
            <div style={{ width: `${progress}%` }} />
          </div>
        </div>
      </header>

      {/* [032] Hosts the selectable engine and installed components. */}
      <section className="workspace">
        <div className="scene-hint"><span className="hint-dot" /> ROTATE THE ENGINE · HOVER TO HIGHLIGHT · CLICK A PART LOCATION</div>
        <EngineScene selected={selected} installed={installed} onSelect={selectPart} view={view} />
        <div className="status-message" role="status" aria-live="polite">{message}</div>
        <div className="view-label">{view.toUpperCase()} VIEW</div>
      </section>

      {/* [033] Toolbar actions all call real application handlers. */}
      <Toolbar
        selected={selected}
        installed={installed}
        onInstall={installPart}
        onGuide={showGuide}
        onExplain={() => setPanelOpen(true)}
        onView={changeView}
        onUndo={undo}
        onBack={() => {
          setSelected('block');
          setMessage('You are viewing the engine assembly. Select an uninstalled component location directly on the 3D model to continue.');
          setPanelOpen(false);
        }}
      />

      {/* [034] Displays the selected component's explanation. */}
      <InfoPanel part={PARTS[selected] || PARTS.block} open={panelOpen} onClose={() => setPanelOpen(false)} />
    </main>
  );
}
