// [020] Imports React state, the CAD-based engine scene, toolbar, and component guide.
import React, { useState } from 'react';
import EngineCADScene from './components/EngineCADScene.jsx';
import Toolbar from './components/Toolbar.jsx';
import InfoPanel from './components/InfoPanel.jsx';
import './App.css';

// [021] Component explanations correspond to the separate groups in the supplied CC0 CAD model.
export const PARTS = {
  engineBlock: {
    name: 'Honda B16 engine block', group: 'Foundation',
    what: 'The B16 block is the main aluminum-alloy structure of Honda’s 1.6-liter DOHC VTEC inline-four. It houses the four cylinders and supports the crankshaft and cylinder head.',
    why: 'It keeps the cylinders aligned and carries the loads produced by combustion and the rotating assembly.',
    where: 'It forms the lower central structure of the engine. The four cylinder bores are machined into the deck at the top, with the crankcase below.'
  },
  crankshaft: {
    name: 'Crankshaft', group: 'Rotating assembly',
    what: 'The crankshaft converts the pistons’ up-and-down movement into rotation.',
    why: 'Its rotation is the mechanical output that ultimately drives the transmission.',
    where: 'It sits inside the lower crankcase and is supported by the main bearing bridges.'
  },
  mainBearingCaps: {
    name: 'Main bearings and bearing caps', group: 'Rotating assembly',
    what: 'Five main bearing locations support the crankshaft. The bearing shells provide the precision surfaces, while the caps secure the crankshaft from below.',
    why: 'The main bearings support the crankshaft while allowing it to rotate with a controlled oil film.',
    where: 'The bearing shells sit at the five main journal supports, with the lower caps fitted underneath the crankshaft.'
  },
  pistonsRods: {
    name: 'Pistons and connecting rods', group: 'Rotating assembly',
    what: 'Four pistons slide inside the cylinder liners. Connecting rods link each piston to a crankshaft throw.',
    why: 'Combustion pressure pushes the pistons down, and the connecting rods transfer that force to the crankshaft.',
    where: 'The pistons fit into the four cylinder bores, with their connecting rods extending down to the crankshaft.'
  },
  headGasket: {
    name: 'Cylinder head gasket', group: 'Cylinder head',
    what: 'The head gasket is a thin, carefully sealed layer between the engine block and cylinder head.',
    why: 'It seals combustion pressure and keeps coolant and engine oil passages separated.',
    where: 'It sits on the machined deck surface at the top of the engine block.'
  },
  cylinderHead: {
    name: 'Cylinder head', group: 'Cylinder head',
    what: 'The cylinder head closes the top of the cylinders and contains the combustion chambers and valve passages.',
    why: 'It seals the cylinders and routes incoming air and outgoing exhaust gases.',
    where: 'It bolts to the top of the engine block over the head gasket.'
  },
  valvetrain: {
    name: 'Valvetrain and dual overhead camshafts', group: 'Valvetrain',
    what: 'The valvetrain includes the intake and exhaust valves, valve springs, retainers, camshafts, and cam bearing bridges.',
    why: 'The camshafts open and close the valves at the correct time so the cylinders can breathe.',
    where: 'It is installed in and on the cylinder head, underneath the valve cover.'
  },
  valveCover: {
    name: 'Valve cover', group: 'Upper engine',
    what: 'The valve cover encloses the upper valvetrain and helps keep oil inside the cylinder head.',
    why: 'It protects the camshaft area from dirt and prevents oil from escaping.',
    where: 'It bolts over the camshafts at the very top of the engine.'
  },
  oilPump: {
    name: 'Oil pump assembly', group: 'Lubrication',
    what: 'The oil pump draws oil from the sump and pressurizes it so oil can circulate through the engine.',
    why: 'A steady supply of pressurized oil lubricates the crankshaft bearings and other moving parts.',
    where: 'The pump mounts to the timing-belt end of the B-series block, around the front of the crankshaft. The pickup tube will connect to the pump in a later assembly step.'
  },
  oilPan: {
    name: 'Oil pan / sump', group: 'Lubrication',
    what: 'The oil pan is the reservoir that holds engine oil when it is not circulating through the engine.',
    why: 'The oil pump draws oil from the sump and sends it to bearings and other moving parts.',
    where: 'It bolts to the underside of the crankcase.'
  },
  timingCovers: {
    name: 'Timing and end covers', group: 'Engine covers',
    what: 'These covers close the ends of the engine and protect the timing and rotating components.',
    why: 'They help keep the assembly enclosed and protect internal components from contamination.',
    where: 'They attach at the front and rear ends of the engine block.'
  },
  crankPulley: {
    name: 'Crankshaft accessory pulley', group: 'Accessory drive',
    what: 'The grooved crankshaft pulley is driven directly by the crankshaft.',
    why: 'It transfers crankshaft rotation to the accessory belt. A production engine commonly combines this function with a harmonic balancer.',
    where: 'It mounts at the front end of the crankshaft, outside the timing cover.'
  },
  alternator: {
    name: 'Alternator assembly', group: 'Electrical system',
    what: 'The alternator converts mechanical rotation into electrical power.',
    why: 'It supplies electrical power while the engine runs and recharges the vehicle battery.',
    where: 'It mounts on a bracket at the front accessory drive and is driven by the belt.'
  },
  accessoryBelt: {
    name: 'Accessory drive belt', group: 'Accessory drive',
    what: 'The accessory belt transfers rotation from the crankshaft pulley to the alternator pulley.',
    why: 'It allows the crankshaft to drive engine accessories.',
    where: 'It loops around the crankshaft pulley and alternator pulley in this CAD model.'
  },
  intakeManifold: {
    name: 'Intake manifold', group: 'Air intake',
    what: 'The intake manifold distributes incoming air to the four cylinders.',
    why: 'It helps each cylinder receive the air needed for combustion.',
    where: 'It bolts to one side of the cylinder head and routes air through four runners.'
  },
  exhaustManifold: {
    name: 'Exhaust manifold', group: 'Exhaust',
    what: 'The exhaust manifold collects hot gases leaving the four cylinders.',
    why: 'It routes exhaust from each cylinder into a common outlet.',
    where: 'It bolts to the opposite side of the cylinder head and aligns with the exhaust ports.'
  },
  oilFilter: {
    name: 'Oil filter assembly', group: 'Lubrication',
    what: 'The oil filter removes contaminants from the engine oil.',
    why: 'Filtering debris helps protect bearings and other precision moving surfaces.',
    where: 'It mounts to an angled boss on the side of the engine block.'
  }
};

// [022] The block is the fixed foundation. Other groups become available when their prerequisites are installed.
const INSTALL_RULES = {
  crankshaft: {
    requires: [],
    reason: 'The crankshaft is installed in the block and supported by the main bearing bridges.'
  },
  mainBearingCaps: {
    requires: ['crankshaft'],
    reason: 'Install the crankshaft first. The five main bearing cap assemblies are then fitted and secured beneath the crankshaft.'
  },
  pistonsRods: {
    requires: ['crankshaft', 'mainBearingCaps'],
    reason: 'The connecting rods need the crankshaft in place so their big ends can attach to the crank throws.'
  },
  headGasket: {
    requires: ['pistonsRods'],
    reason: 'Install the piston and rod assemblies before sealing the top of the block with the head gasket.'
  },
  cylinderHead: {
    requires: ['headGasket'],
    reason: 'The cylinder head sits on the head gasket. The gasket must be in place first.'
  },
  valvetrain: {
    requires: ['cylinderHead'],
    reason: 'The valves, springs, and camshafts are installed in the cylinder head.'
  },
  valveCover: {
    requires: ['valvetrain'],
    reason: 'The valve cover encloses the camshafts and must be installed after the valvetrain.'
  },
  oilPump: {
    requires: ['crankshaft', 'mainBearingCaps', 'pistonsRods'],
    reason: 'Install the rotating assembly first. The oil pump mounts at the timing-belt end of the block around the crankshaft nose.'
  },
  oilPan: {
    requires: ['oilPump', 'crankshaft', 'pistonsRods'],
    reason: 'Install the crankshaft and connecting rod assemblies before closing the bottom of the crankcase with the oil pan.'
  },
  timingCovers: {
    requires: ['crankshaft'],
    reason: 'The crankshaft must be in place before the end covers are fitted around the rotating assembly.'
  },
  crankPulley: {
    requires: ['crankshaft', 'timingCovers'],
    reason: 'The crankshaft pulley mounts on the crankshaft nose outside the front cover.'
  },
  alternator: {
    requires: ['crankPulley'],
    reason: 'The alternator is driven by the accessory belt, so the crankshaft pulley must be installed first.'
  },
  accessoryBelt: {
    requires: ['crankPulley', 'alternator'],
    reason: 'The accessory belt must route around the installed crankshaft and alternator pulleys.'
  },
  intakeManifold: {
    requires: ['cylinderHead'],
    reason: 'The intake manifold bolts to the cylinder head and must align with its intake ports.'
  },
  exhaustManifold: {
    requires: ['cylinderHead'],
    reason: 'The exhaust manifold bolts to the cylinder head and must align with its exhaust ports.'
  },
  oilFilter: {
    requires: [],
    reason: 'The oil filter mounts to the side of the engine block.'
  }
};

// [023] Recommended teaching order. Dependencies are checked separately, so valid alternate orders are allowed.
const RECOMMENDED_SEQUENCE = [
  'crankshaft', 'mainBearingCaps', 'pistonsRods', 'oilPump', 'oilPan', 'headGasket', 'cylinderHead',
  'valvetrain', 'valveCover', 'timingCovers', 'crankPulley', 'alternator',
  'accessoryBelt', 'intakeManifold', 'exhaustManifold', 'oilFilter'
];
const INSTALLABLE_COUNT = Object.keys(INSTALL_RULES).length;

// [024] App owns installation state so progress, the toolbar, and the CAD scene stay synchronized.
export default function App() {
  const [selected, setSelected] = useState('engineBlock');
  const [installed, setInstalled] = useState([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [view, setView] = useState('isometric');
  const [showCrankshaft, setShowCrankshaft] = useState(false);
  const [showMainBearingCaps, setShowMainBearingCaps] = useState(false);
  const [showPistonsRods, setShowPistonsRods] = useState(false);
  const [showOilPump, setShowOilPump] = useState(false);
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
    setShowCrankshaft(id === 'crankshaft');
    setShowMainBearingCaps(id === 'mainBearingCaps');
    setShowPistonsRods(id === 'pistonsRods');
    setShowOilPump(id === 'oilPump');

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
  const installPart = () => {
    if (selected === 'engineBlock') {
      setMessage('The engine block is already present. Select another component location on the 3D model first.');
      setPanelOpen(true);
      return;
    }
    const rule = INSTALL_RULES[selected];
    if (!rule || !PARTS[selected]) {
      setMessage('Select a valid component location on the 3D engine first.');
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
      setMessage(`✓ ${PARTS[selected].name} installed. All ${INSTALLABLE_COUNT} modeled component groups are now installed.`);
    } else {
      setMessage(`✓ ${PARTS[selected].name} installed successfully.${next ? ` Recommended next step: ${next}.` : ''}`);
    }
    setPanelOpen(false);
  };

  // [028] Undo removes the most recently installed group, preserving dependency order.
  const undo = () => {
    if (installed.length === 0) {
      setMessage('There is nothing to undo yet. Install a component first.');
      return;
    }
    const removed = installed[installed.length - 1];
    const updated = installed.slice(0, -1);
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
            <strong>{installed.length}/{INSTALLABLE_COUNT} PARTS</strong>
          </div>
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
          showCrankshaft={showCrankshaft}
          showMainBearingCaps={showMainBearingCaps}
          showPistonsRods={showPistonsRods}
          showOilPump={showOilPump}
          view={view}
        />
        <div className="status-message" role="status" aria-live="polite">{message}</div>
        <div className="view-label">{view.toUpperCase()} VIEW</div>
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
        onBack={() => {
          setSelected('engineBlock');
          setMessage('Engine overview. Select a component location directly on the CAD model to continue.');
          setPanelOpen(false);
        }}
      />

      {/* [034] Educational panel for the selected CAD component. */}
      <InfoPanel part={PARTS[selected] || PARTS.engineBlock} open={panelOpen} onClose={() => setPanelOpen(false)} />
    </main>
  );
}
