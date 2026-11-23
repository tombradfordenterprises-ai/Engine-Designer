import React from 'react';
import Crankshaft from './engine-parts/Crankshaft.jsx';

/**
 * Central registry for independently maintained engine components.
 * Each new engine part will get its own file and be registered here.
 */
export default function EnginePartLayer({
  installed = [],
  showCrankshaft = false,
}) {
  const crankshaftInstalled = installed.includes('crankshaft');
  const crankshaftVisible = showCrankshaft || crankshaftInstalled;

  return (
    <group name="engine-part-layer">
      {crankshaftVisible && (
        <Crankshaft installed={crankshaftInstalled} />
      )}
    </group>
  );
}
