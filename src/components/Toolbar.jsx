import React from 'react';
import { Rotate3D, Wrench, BookOpen, Undo2, ArrowLeft, EyeOff, Eye, Play, Pause } from 'lucide-react';

// [040] Fixed toolbar. Every control invokes an application action and gives the user clear feedback.
export default function Toolbar({
  selected,
  installed = [],
  onInstall,
  onExplain,
  onView,
  onUndo,
  onBack,
  showHotspots = true,
  onToggleHotspots,
  engineRotating = false,
  canRotateEngine = false,
  onToggleEngineRotation
}) {
  const isAlreadyInstalled = installed.includes(selected);
  const installTitle = selected === 'engineBlock'
    ? 'Select a component installation location first'
    : isAlreadyInstalled
      ? 'This component is already installed'
      : `Check requirements and install ${selected}`;

  const actions = [
    { label: 'Change view', icon: Rotate3D, click: onView, title: 'Cycle through camera views' },
    { label: engineRotating ? 'Stop engine' : 'Rotate engine', icon: engineRotating ? Pause : Play, click: onToggleEngineRotation, title: canRotateEngine ? (engineRotating ? 'Stop the rotating assembly' : 'Turn the crankshaft and watch the installed moving parts') : 'Install pistons and connecting rods to enable engine rotation', disabled: !canRotateEngine },
    { label: 'Install part', icon: Wrench, click: onInstall, title: installTitle },
    { label: 'Explain part', icon: BookOpen, click: onExplain, title: 'Explain the selected component' },
    { label: 'Undo', icon: Undo2, click: onUndo, title: 'Undo the most recently installed component' },
    { label: 'Back', icon: ArrowLeft, click: onBack, title: 'Return to the engine overview' },
    { label: showHotspots ? 'Hide all' : 'Show all', icon: showHotspots ? EyeOff : Eye, click: onToggleHotspots, title: showHotspots ? 'Hide all blue installation markers and instruction labels' : 'Show installation markers and instruction labels' }
  ];

  return (
    <nav className="toolbar" aria-label="Engine builder controls">
      {actions.map(({ label, icon: Icon, click, title, disabled = false }) => (
        <button
          key={label}
          type="button"
          onClick={click}
          title={title || label}
          aria-label={title || label}
          disabled={disabled}
          className={`tool-button${disabled ? ' is-disabled' : ''}${label === 'Stop engine' ? ' is-active' : ''}`}
        >
          <Icon size={21} strokeWidth={1.8} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
