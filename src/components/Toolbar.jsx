// [040] Imports the icon library used by the fixed six-button game toolbar.
import { Rotate3D, Wrench, Package, BookOpen, Undo2, ArrowLeft } from 'lucide-react';

// [041] Renders persistent controls for view changes, installation, parts, explanations, undo, and back navigation.
export default function Toolbar({ selected, onInstall, onExplain, onView, onUndo, onBack }) {
  const actions = [
    { label: 'Change view', icon: Rotate3D, click: onView },
    { label: 'Install part', icon: Wrench, click: onInstall },
    { label: 'Parts', icon: Package, click: onExplain },
    { label: 'Explain part', icon: BookOpen, click: onExplain },
    { label: 'Undo', icon: Undo2, click: onUndo },
    { label: 'Back', icon: ArrowLeft, click: onBack }
  ];
  return (
    <nav className="toolbar" aria-label="Engine builder controls">
      {actions.map(({ label, icon: Icon, click }) => (
        <button className="tool-button" key={label} onClick={click} title={label}>
          <Icon size={21} strokeWidth={1.8} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
