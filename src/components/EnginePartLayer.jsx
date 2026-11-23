import React from 'react';
import Crankshaft from './engine-parts/Crankshaft.jsx';

/**
 * Central registry/render layer for separately maintained engine parts.
 *
 * Add future component imports here, then render each one when its preview
 * flag is active or its ID appears in the installed list.
 */
export default function EnginePartLayer({
  installed = [],
  showCrankshaft = false,
}) {
  const crankshaftVisible =
    showCrankshaft || installed.includes('crankshaft');

  return (
    <group name="engine-part-layer">
      {crankshaftVisible && <Crankshaft />}
    </group>
  );
}
