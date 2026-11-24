import React from 'react';
import { Rotate3D, Wrench, MousePointer2, BookOpen, Undo2, ArrowLeft } from 'lucide-react';

// [040] Fixed toolbar. Every control invokes an application action and gives the user clear feedback.
export default function Toolbar({
  selected,
  installed = [],
  onInstall,
  onGuide,
  onExplain,
  onView,
  onUndo,
  onBack
}) {
  const isAlreadyInstalled = installed.includes(selected);
  const installTitle = selected === 'engineBlock'
    ? 'Select a component installation location first'
    : isAlreadyInstalled
      ? 'This component is already installed'
      : `Check requirements and install ${selected}`;

  const actions = [
    { label: 'Change view', icon: Rotate3D, click: onView, title: 'Cycle through camera views' },
    { label: 'Install part', icon: Wrench, click: onInstall, title: installTitle },
    { label: 'How to', icon: MousePointer2, click: onGuide, title: 'Show the suggested assembly order' },
    { label: 'Explain part', icon: BookOpen, click: onExplain, title: 'Explain the selected component' },
    { label: 'Undo', icon: Undo2, click: onUndo, title: 'Undo the most recently installed component' },
    { label: 'Back', icon: ArrowLeft, click: onBack, title: 'Return to the engine overview' }
  ];

  return (
    <nav className="toolbar" aria-label="Engine builder controls">
      {actions.map(({ label, icon: Icon, click, title }) => (
        <button
          className="tool-button"
          key={label}
          type="button"
          onClick={click}
          title={title || label}
          aria-label={title || label}
        >
          <Icon size={21} strokeWidth={1.8} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
