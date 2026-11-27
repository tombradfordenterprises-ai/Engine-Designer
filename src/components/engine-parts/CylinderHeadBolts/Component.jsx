import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

// Ten fasteners follow the ten marked head-bolt bores: five along each side.
// The bore-center layout matches the registered installation targets. The
// imported OBJ index does not expose drilled-hole center data, so this is
// visually aligned to the visible bores and still needs an in-app fit check.
const INSTALLED_Y = 15.08;
const X_POSITIONS = [-6.8, -3.4, 0, 3.4, 6.8];
const Z_POSITIONS = [-3.25, 3.25];

// Tightening order works from the middle outward, alternating sides.
const TIGHTEN_ORDER = [4, 5, 3, 6, 2, 7, 1, 8, 0, 9];

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

function HeadBolt({ x, z, order, installed }) {
  const group = useRef(null);
  const progress = useRef(0);

  useFrame((_, delta) => {
    if (!group.current) return;
    progress.current = THREE.MathUtils.damp(
      progress.current,
      installed ? 1 : 0,
      2.8,
      delta
    );

    // Stagger the bolts in a center-out tightening sequence. Each one turns
    // two full revolutions while descending into its bore, then stops seated.
    const staggered = THREE.MathUtils.clamp(
      (progress.current - order * 0.055) / (1 - order * 0.055),
      0,
      1
    );
    const eased = staggered * staggered * (3 - 2 * staggered);
    group.current.position.set(
      -40 + x,
      INSTALLED_Y + THREE.MathUtils.lerp(8, 0, eased),
      130 + THREE.MathUtils.lerp(z + 10, z, eased)
    );
    group.current.rotation.y = Math.PI * 4 * eased;
  });

  return (
    <group ref={group} position={[-40 + x, INSTALLED_Y + 8, 130 + z + 10]}>
      {/* Shank extends through the head and down into the block. */}
      <mesh position={[0, -1.55, 0]} material={boltMaterial} castShadow>
        <cylinderGeometry args={[0.22, 0.22, 5.3, 16]} />
      </mesh>
      <mesh position={[0, 1.48, 0]} material={washerMaterial} castShadow>
        <cylinderGeometry args={[0.34, 0.34, 0.12, 32]} />
      </mesh>
      <mesh position={[0, 1.72, 0]} material={boltMaterial} castShadow>
        <cylinderGeometry args={[0.37, 0.37, 0.34, 6]} />
      </mesh>
    </group>
  );
}

export default function CylinderHeadBolts({ installed = false }) {
  return (
    <group name="b16-cylinder-head-bolts">
      {X_POSITIONS.flatMap((x, xIndex) => Z_POSITIONS.map((z, rowIndex) => {
        const index = xIndex * 2 + rowIndex;
        return (
          <HeadBolt
            key={index}
            x={x}
            z={z}
            order={TIGHTEN_ORDER.indexOf(index)}
            installed={installed}
          />
        );
      }))}
    </group>
  );
}
