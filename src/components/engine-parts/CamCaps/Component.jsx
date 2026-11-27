import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

// Educational B16-style camshaft cap set. Five cap stations support each
// camshaft, for ten caps total. Scene coordinates follow the existing
// camshaft galleries; dimensions are illustrative, not factory CAD values.
const CAP_X = [-47.5, -43.5, -39.5, -35.5, -31.5];
const CAM_ROWS_Z = [132.0, 128.0];
const CAP_Y = 17.85;
const PREVIEW_OFFSET = new THREE.Vector3(0, 9, 12);

const capMetal = new THREE.MeshStandardMaterial({
  color: '#687681', metalness: 0.86, roughness: 0.28
});
const bearingMetal = new THREE.MeshStandardMaterial({
  color: '#b5a27e', metalness: 0.78, roughness: 0.24
});
const fastenerMetal = new THREE.MeshStandardMaterial({
  color: '#aeb8c0', metalness: 0.94, roughness: 0.2
});
const darkMetal = new THREE.MeshStandardMaterial({
  color: '#3f4a52', metalness: 0.8, roughness: 0.3
});

function CamCap({ x, z, index }) {
  return (
    <group position={[x, CAP_Y, z]} name={`camshaft-cap-${index + 1}`}>
      {/* Bridge across the cam journal, leaving the journal center visible. */}
      <mesh material={capMetal} castShadow receiveShadow>
        <boxGeometry args={[0.92, 0.48, 2.15]} />
      </mesh>
      {/* Two feet descend to the cylinder-head bearing surface. */}
      {[-0.78, 0.78].map((side) => (
        <mesh key={side} position={[0, -0.39, side]} material={capMetal} castShadow receiveShadow>
          <boxGeometry args={[0.92, 0.42, 0.58]} />
        </mesh>
      ))}
      {/* Bearing insert detail on the underside of the cap. */}
      <mesh position={[0, -0.235, 0]} rotation={[Math.PI / 2, 0, Math.PI / 2]} material={bearingMetal}>
        <torusGeometry args={[0.43, 0.055, 10, 28, Math.PI]} />
      </mesh>
      {/* Cap fasteners, one at either side of the camshaft journal. */}
      {[-0.91, 0.91].map((side) => (
        <group key={side} position={[0, 0.22, side]}>
          <mesh position={[0, 0.12, 0]} material={fastenerMetal} castShadow>
            <cylinderGeometry args={[0.105, 0.105, 0.24, 16]} />
          </mesh>
          <mesh position={[0, 0.265, 0]} material={fastenerMetal} castShadow>
            <cylinderGeometry args={[0.19, 0.19, 0.12, 6]} />
          </mesh>
          <mesh position={[0, 0.329, 0]} material={darkMetal}>
            <boxGeometry args={[0.17, 0.025, 0.035]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default function CamCaps({ installed = false }) {
  const group = useRef(null);
  const progress = useRef(0);

  useFrame((_, delta) => {
    if (!group.current) return;
    progress.current = THREE.MathUtils.damp(progress.current, installed ? 1 : 0, 2.0, delta);
    const t = progress.current;
    const eased = t * t * (3 - 2 * t);
    group.current.position.lerpVectors(PREVIEW_OFFSET, new THREE.Vector3(0, 0, 0), eased);
  });

  let index = 0;
  return (
    <group ref={group} position={PREVIEW_OFFSET.toArray()} name="b16-camshaft-cap-assembly">
      {CAM_ROWS_Z.map((z) => CAP_X.map((x) => (
        <CamCap key={`${x}-${z}`} x={x} z={z} index={index++} />
      )))}
    </group>
  );
}
