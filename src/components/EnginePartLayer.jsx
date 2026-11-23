import React from 'react';
import Crankshaft from './engine-parts/Crankshaft.jsx';
import MainBearingCaps from './engine-parts/MainBearingCaps.jsx';

/**
 * Central registry for independently maintained engine components.
 * Each new engine part will get its own file and be registered here.
 */
export default function EnginePartLayer({
  installed = [],
  showCrankshaft = false,
  showMainBearingCaps = false,
}) {
  const crankshaftInstalled = installed.includes('crankshaft');
  const crankshaftVisible = showCrankshaft || crankshaftInstalled;
  const bearingCapsInstalled = installed.includes('mainBearingCaps');
  const bearingCapsVisible = showMainBearingCaps || bearingCapsInstalled;

  return (
    <group name="engine-part-layer">
      {crankshaftVisible && (
        <Crankshaft installed={crankshaftInstalled} />
      )}
      {bearingCapsVisible && (
        <MainBearingCaps installed={bearingCapsInstalled} />
      )}
    </group>
  );
}
