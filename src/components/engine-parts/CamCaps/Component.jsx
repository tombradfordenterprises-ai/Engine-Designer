import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

// Rounded educational camshaft-cap bridges: five stations per camshaft.
// Locations follow the current B16 camshaft galleries; visual dimensions
// are approximations and must not be used as factory service dimensions.
const CAP_X = [-47.5, -43.5, -39.5, -35.5, -31.5];
const CAM_ROWS_Z = [132.0, 128.0];
const CAP_Y = 17.0;
const PREVIEW_OFFSET = new THREE.Vector3(0, 9, 12);

const capMetal = new THREE.MeshStandardMaterial({ color: '#687681', metalness: 0.86, roughness: 0.28 });
const bearingMetal = new THREE.MeshStandardMaterial({ color: '#b5a27e', metalness: 0.78, roughness: 0.24 });
const fastenerMetal = new THREE.MeshStandardMaterial({ color: '#aeb8c0', metalness: 0.94, roughness: 0.2 });
const darkMetal = new THREE.MeshStandardMaterial({ color: '#3f4a52', metalness: 0.8, roughness: 0.3 });

function makeCapArch() {
  // A rounded half-ring follows the camshaft journal cross-section.
  const points = [];
  for (let i = 0; i <= 24; i++) {
    const angle = Math.PI - (Math.PI * i) / 24;
    points.push(new THREE.Vector3(0, Math.sin(angle) * 0.66, Math.cos(angle) * 0.78));
  }
  const curve = new THREE.CatmullRomCurve3(points);
  return new THREE.TubeGeometry(curve, 48, 0.17, 12, false);
}

function CamCap({ x, z, index, archGeometry }) {
  return (
    <group position={[x, CAP_Y, z]} name={`rounded-camshaft-cap-${index + 1}`}>
      {/* Rounded arch spanning over the cam journal rather than a square block. */}
      <mesh geometry={archGeometry} material={capMetal} castShadow receiveShadow />
      {/* Rounded mounting feet at the two sides of the journal. */}
      {[-0.78, 0.78].map((side) => (
        <group key={side} position={[0, -0.06, side]}>
          <mesh material={capMetal} castShadow receiveShadow>
            <cylinderGeometry args={[0.24, 0.27, 0.48, 24]} />
          </mesh>
          <mesh position={[0, -0.245, 0]} material={bearingMetal}>
            <cylinderGeometry args={[0.19, 0.19, 0.045, 24]} />
          </mesh>
        </group>
      ))}
      {/* Small, proportionate paired cap bolts. */}
      {[-0.91, 0.91].map((side) => (
        <group key={side} position={[0, -0.08, side]}>
          <mesh position={[0, 0.18, 0]} material={fastenerMetal} castShadow>
            <cylinderGeometry args={[0.085, 0.085, 0.28, 16]} />
          </mesh>
          <mesh position={[0, 0.34, 0]} material={fastenerMetal} castShadow>
            <cylinderGeometry args={[0.145, 0.145, 0.105, 12]} />
          </mesh>
          <mesh position={[0, 0.397, 0]} material={darkMetal}>
            <boxGeometry args={[0.025, 0.018, 0.17]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default function CamCaps({ installed = false }) {
  const group = useRef(null);
  const progress = useRef(0);
  const archGeometry = useMemo(makeCapArch, []);

  useFrame((_, delta) => {
    if (!group.current) return;
    progress.current = THREE.MathUtils.damp(progress.current, installed ? 1 : 0, 2.0, delta);
    const t = progress.current;
    const eased = t * t * (3 - 2 * t);
    group.current.position.lerpVectors(PREVIEW_OFFSET, new THREE.Vector3(0, 0, 0), eased);
  });

  let index = 0;
  return (
    <group ref={group} position={PREVIEW_OFFSET.toArray()} name="b16-rounded-camshaft-cap-assembly">
      {CAM_ROWS_Z.map((z) => CAP_X.map((x) => (
        <CamCap key={`${x}-${z}`} x={x} z={z} index={index++} archGeometry={archGeometry} />
      )))}
    </group>
  );
}
