import React from 'react';
import Crankshaft from './engine-parts/Crankshaft.jsx';
import MainBearingCaps from './engine-parts/MainBearingCaps.jsx';
import PistonsRods from './engine-parts/PistonsRods.jsx';
import OilPump from './engine-parts/OilPump.jsx';

/**
 * Central registry for independently maintained engine components.
 * Each new engine part will get its own file and be registered here.
 */
export default function EnginePartLayer({
  installed = [],
  showCrankshaft = false,
  showMainBearingCaps = false,
  showPistonsRods = false,
  showOilPump = false,
}) {
  const crankshaftInstalled = installed.includes('crankshaft');
  const crankshaftVisible = showCrankshaft || crankshaftInstalled;
  const bearingCapsInstalled = installed.includes('mainBearingCaps');
  const bearingCapsVisible = showMainBearingCaps || bearingCapsInstalled;
  const pistonsRodsInstalled = installed.includes('pistonsRods');
  const pistonsRodsVisible = showPistonsRods || pistonsRodsInstalled;
  const oilPumpInstalled = installed.includes('oilPump');
  const oilPumpVisible = showOilPump || oilPumpInstalled;

  return (
    <group name="engine-part-layer">
      {crankshaftVisible && (
        <Crankshaft installed={crankshaftInstalled} />
      )}
      {bearingCapsVisible && (
        <MainBearingCaps installed={bearingCapsInstalled} />
      )}
      {pistonsRodsVisible && (
        <PistonsRods installed={pistonsRodsInstalled} />
      )}
      {oilPumpVisible && <OilPump installed={oilPumpInstalled} />}
    </group>
  );
}
