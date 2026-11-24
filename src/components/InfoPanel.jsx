import React, { useState, useEffect } from 'react';
export default function InfoPanel({ part, open, onClose, onInstall, installed }) {
  const [expanded, setExpanded] = useState(false);
  useEffect(() => { setExpanded(false); }, [part?.name]);
  return (
    <section className={`info-panel ${open ? 'is-open' : ''} ${expanded ? 'is-expanded' : ''}`} aria-hidden={!open}>
      <div className="panel-header">
        <div><div className="eyebrow">COMPONENT GUIDE · {part.group}</div><h2>{part.name}</h2></div>
        <button className="close-button" onClick={onClose} aria-label="Close explanation">×</button>
      </div>
      <div className="explanation-grid">
        <article><span>WHAT IT DOES</span><p>{part.what}</p></article>
        {expanded && <><article><span>WHY IT MATTERS</span><p>{part.why}</p></article><article><span>WHERE IT GOES</span><p>{part.where}</p></article></>}
      </div>
      <div className="panel-actions">
        <button className="more-button" type="button" onClick={() => setExpanded((v) => !v)}>{expanded ? 'Less' : 'More'}</button>
        {part.name !== 'Honda B16 engine block' && <button className="install-button" type="button" onClick={onInstall} disabled={installed}>{installed ? 'Installed' : 'Install Part'}</button>}
      </div>
    </section>
  );
}
