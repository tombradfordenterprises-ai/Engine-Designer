import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

// A simplified liquid-gasket/sealing-bead teaching model, not a dimensioned OEM gasket.
const INSTALLED = new THREE.Vector3(-39.75, 4.12, 130.5);
const PREVIEW = INSTALLED.clone().add(new THREE.Vector3(0, 7, 9));
const sealant = new THREE.MeshStandardMaterial({ color: '#30363a', metalness: 0.12, roughness: 0.72 });

export default function OilPanGasket({ installed = false }) {
  const group = useRef(null);
  const progress = useRef(0);
  useFrame((_, delta) => {
    if (!group.current) return;
    progress.current += ((installed ? 1 : 0) - progress.current) * Math.min(1, delta * 2.8);
    const t = progress.current;
    group.current.position.lerpVectors(PREVIEW, INSTALLED, t * t * (3 - 2 * t));
  });
  return (
    <group ref={group} position={PREVIEW.toArray()} name="b16-oil-pan-sealing-bead">
      {/* Four continuous-looking bead runs around the pan rail. */}
      <mesh position={[0, 0, -4.05]} material={sealant} castShadow><boxGeometry args={[16.1, 0.12, 0.16]} /></mesh>
      <mesh position={[0, 0, 4.05]} material={sealant} castShadow><boxGeometry args={[16.1, 0.12, 0.16]} /></mesh>
      <mesh position={[-7.98, 0, 0]} material={sealant} castShadow><boxGeometry args={[0.16, 0.12, 8.0]} /></mesh>
      <mesh position={[7.98, 0, 0]} material={sealant} castShadow><boxGeometry args={[0.16, 0.12, 8.0]} /></mesh>
      {[-7.65, 7.65].flatMap((x) => [-3.75, 3.75].map((z, i) => (
        <mesh key={`${x}-${z}`} position={[x, 0, z]} material={sealant} castShadow>
          <sphereGeometry args={[0.12, 12, 8]} />
        </mesh>
      )))}
    </group>
  );
}
