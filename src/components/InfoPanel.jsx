import React, { useEffect, useMemo, useState } from 'react';

const GUIDE_SECTIONS = [
  ['OVERVIEW', 'overview'],
  ['HOW IT WORKS', 'operation'],
  ['CONSTRUCTION & MATERIALS', 'construction'],
  ['SPECIFICATIONS', 'specifications'],
  ['INSPECTION & SERVICE', 'inspection'],
  ['COMMON FAILURE POINTS', 'failureModes'],
];

function buildGuide(part) {
  const guide = part?.guide || {};
  return [
    { title: GUIDE_SECTIONS[0][0], text: guide.overview || part?.what || 'Overview information will be added.' },
    { title: GUIDE_SECTIONS[1][0], text: guide.operation || 'Placeholder: detailed operating principle and sequence to be researched and added.' },
    { title: GUIDE_SECTIONS[2][0], text: guide.construction || 'Placeholder: materials, subcomponents, and construction details to be researched and added.' },
    { title: GUIDE_SECTIONS[3][0], text: guide.specifications || 'Placeholder: verified B16 dimensions, tolerances, clearances, torque values, and service limits to be added.' },
    { title: GUIDE_SECTIONS[4][0], text: guide.inspection || 'Placeholder: inspection steps, measurement methods, and service procedures to be added.' },
    { title: GUIDE_SECTIONS[5][0], text: guide.failureModes || 'Placeholder: common failure modes, symptoms, causes, and diagnostic checks to be added.' },
  ];
}

export default function InfoPanel({ part, open, onClose, onInstall, installed }) {
  const [expanded, setExpanded] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const guideSections = useMemo(() => buildGuide(part), [part]);

  useEffect(() => {
    setExpanded(false);
    setGuideOpen(false);
  }, [part?.id, part?.name]);

  useEffect(() => {
    if (!open) setGuideOpen(false);
  }, [open]);

  return (
    <div className={`info-panel-stack ${open ? 'is-open' : ''}`}>
      {open && guideOpen && (
        <section className="part-guide-window" aria-label={`Detailed guide for ${part.name}`}>
          <div className="guide-window-header">
            <div>
              <div className="guide-kicker">TECHNICAL REFERENCE · {part.group || 'ENGINE COMPONENT'}</div>
              <h3>{part.name} — Detailed Guide</h3>
            </div>
            <button className="guide-close-button" type="button" onClick={() => setGuideOpen(false)} aria-label="Close detailed guide">×</button>
          </div>
          <div className="guide-window-body">
            <p className="guide-intro">{part.where || 'Component location information will be added.'}</p>
            {guideSections.map((section) => (
              <article className="guide-section" key={section.title}>
                <h4>{section.title}</h4>
                <p>{section.text}</p>
              </article>
            ))}
            {part.installationReason && (
              <article className="guide-section">
                <h4>ASSEMBLY NOTES</h4>
                <p>{part.installationReason}</p>
              </article>
            )}
            <div className="guide-data-note">Some sections are placeholders. Factory specifications and service procedures will be researched and verified before being treated as authoritative.</div>
          </div>
        </section>
      )}

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
          <button className="more-button" type="button" onClick={() => setExpanded((value) => !value)}>{expanded ? 'Less' : 'More'}</button>
          <button className={`guide-button ${guideOpen ? 'is-active' : ''}`} type="button" onClick={() => setGuideOpen((value) => !value)} aria-expanded={guideOpen}>Guide</button>
          {part.name !== 'Honda B16 engine block' && <button className="install-button" type="button" onClick={onInstall} disabled={installed}>{installed ? 'Installed' : 'Install Part'}</button>}
        </div>
      </section>
    </div>
  );
}
