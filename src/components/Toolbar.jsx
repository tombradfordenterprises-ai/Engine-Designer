
import React from 'react';
// [040] Imports icons for the fixed engine-builder toolbar.
import { Rotate3D, Wrench, MousePointer2, BookOpen, Undo2, ArrowLeft } from 'lucide-react';

// [041] Keeps the six-button toolbar while making direct 3D selection the primary way to choose components.
export default function Toolbar({ selected, onInstall, onGuide, onExplain, onView, onUndo, onBack }) {
  const actions = [
    { label: 'Change view', icon: Rotate3D, click: onView },
    { label: 'Install part', icon: Wrench, click: onInstall, title: selected === 'block' ? 'Select a component on the engine first' : `Install selected component: ${selected}` },
    { label: 'How to', icon: MousePointer2, click: onGuide },
    { label: 'Explain part', icon: BookOpen, click: onExplain },
    { label: 'Undo', icon: Undo2, click: onUndo },
    { label: 'Back', icon: ArrowLeft, click: onBack }
  ];
  return (
    <nav className="toolbar" aria-label="Engine builder controls">
      {actions.map(({ label, icon: Icon, click, title }) => (
        <button className="tool-button" key={label} onClick={click} title={title || label} aria-label={title || label}>
          <Icon size={21} strokeWidth={1.8} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
