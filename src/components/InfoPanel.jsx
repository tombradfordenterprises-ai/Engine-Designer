// [050] Defines the upward-sliding educational drawer for the currently selected engine component.
export default function InfoPanel({ part, open, onClose }) {
  return (
    <section className={`info-panel ${open ? 'is-open' : ''}`} aria-hidden={!open}>
      {/* [051] Drawer header identifies the selected part and provides a close control. */}
      <div className="panel-header">
        <div><div className="eyebrow">COMPONENT GUIDE</div><h2>{part.name}</h2></div>
        <button className="close-button" onClick={onClose} aria-label="Close explanation">×</button>
      </div>
      {/* [052] Presents concise explanations of the part's function, importance, and installation location. */}
      <div className="explanation-grid">
        <article><span>01 · WHAT IT DOES</span><p>{part.what}</p></article>
        <article><span>02 · WHY IT MATTERS</span><p>{part.why}</p></article>
        <article><span>03 · WHERE IT GOES</span><p>{part.where}</p></article>
      </div>
    </section>
  );
}
