import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

// Ten simplified fasteners in two rows. Their heads are raised to the imported
// casting's top face (world Y ~= 17.68); shanks extend down through the head.
// Pattern is a visual alignment prototype, not verified factory hole coordinates.
const INSTALLED = new THREE.Vector3(-40.0, 15.8, 130.5);
const PREVIEW = INSTALLED.clone().add(new THREE.Vector3(0, 8, 10));
const X_POSITIONS = [-6.8, -3.4, 0, 3.4, 6.8];
const Z_POSITIONS = [-3.75, 3.75];

const boltMaterial = new THREE.MeshStandardMaterial({
  color: '#aeb8bf',
  metalness: 0.9,
  roughness: 0.23,
});
const washerMaterial = new THREE.MeshStandardMaterial({
  color: '#c5cbd0',
  metalness: 0.92,
  roughness: 0.2,
});

export default function CylinderHeadBolts({ installed = false }) {
  const group = useRef(null);
  const progress = useRef(0);

  useFrame((_, delta) => {
    if (!group.current) return;
    progress.current += ((installed ? 1 : 0) - progress.current) * Math.min(1, delta * 2.7);
    const t = progress.current;
    const eased = t * t * (3 - 2 * t);
    group.current.position.lerpVectors(PREVIEW, INSTALLED, eased);
  });

  return (
    <group ref={group} position={PREVIEW.toArray()} name="b16-cylinder-head-bolts">
      {X_POSITIONS.flatMap((x, xIndex) => Z_POSITIONS.map((z, rowIndex) => (
        <group key={`${xIndex}-${rowIndex}`} position={[x, 0, z]}>
          {/* Long shank passing through the head and into the block. */}
          <mesh position={[0, -1.55, 0]} material={boltMaterial} castShadow>
            <cylinderGeometry args={[0.22, 0.22, 5.3, 16]} />
          </mesh>
          {/* Washer and external hex head. */}
          <mesh position={[0, 1.48, 0]} material={washerMaterial} castShadow>
            <cylinderGeometry args={[0.34, 0.34, 0.12, 32]} />
          </mesh>
          <mesh position={[0, 1.72, 0]} material={boltMaterial} castShadow>
            <cylinderGeometry args={[0.37, 0.37, 0.34, 6]} />
          </mesh>
        </group>
      )))}
    </group>
  );
}
