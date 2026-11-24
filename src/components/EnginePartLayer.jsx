
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
  onInstallPart = () => {},
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
      {/* Transparent mesh hit targets sit directly over each visible preview/model so the part itself can be clicked to install. */}
      {crankshaftVisible && !crankshaftInstalled && <mesh position={[-22.25, 8, 130.5]} onClick={(e) => { e.stopPropagation(); onInstallPart('crankshaft'); }}><boxGeometry args={[18, 3.2, 3.2]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} /></mesh>}
      {bearingCapsVisible && !bearingCapsInstalled && <mesh position={[-40, 15.7, 141]} onClick={(e) => { e.stopPropagation(); onInstallPart('mainBearingCaps'); }}><boxGeometry args={[15, 3.8, 5.2]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} /></mesh>}
      {pistonsRodsVisible && !pistonsRodsInstalled && <mesh position={[-22, 16, 142]} onClick={(e) => { e.stopPropagation(); onInstallPart('pistonsRods'); }}><boxGeometry args={[14, 8, 5.5]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} /></mesh>}
      {oilPumpVisible && !oilPumpInstalled && <mesh position={[-47.8, 16.5, 140]} onClick={(e) => { e.stopPropagation(); onInstallPart('oilPump'); }}><boxGeometry args={[5, 5, 5]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} /></mesh>}
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
