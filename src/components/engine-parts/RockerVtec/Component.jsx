import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

// Educational B16-style VTEC rocker representation.
// Three rocker fingers are shown for each cylinder on each camshaft row:
// primary, secondary, and the center high-lift rocker. Dimensions are
// illustrative, not factory measurements or a service-accurate CAD model.
const CYLINDER_X = [-45.5, -41.5, -37.5, -33.5];
const ROW_Z = [127.5, 132.0];
const FINGER_Z = [-0.30, 0, 0.30];
const INSTALLED_Y = 17.35;
const PREVIEW_OFFSET = new THREE.Vector3(0, 8, 11);

const rockerMetal = new THREE.MeshStandardMaterial({
  color: '#687681', metalness: 0.88, roughness: 0.27
});
const centerMetal = new THREE.MeshStandardMaterial({
  color: '#87949e', metalness: 0.9, roughness: 0.24
});
const pinMetal = new THREE.MeshStandardMaterial({
  color: '#c0c8ce', metalness: 0.94, roughness: 0.2
});
const darkMetal = new THREE.MeshStandardMaterial({
  color: '#3f4a52', metalness: 0.82, roughness: 0.3
});

function RockerFinger({ x, y, z, center = false }) {
  const material = center ? centerMetal : rockerMetal;
  return (
    <group position={[x, y, z]}>
      {/* Long rocker body spanning the paired valve contact points. */}
      <mesh material={material} castShadow receiveShadow>
        <boxGeometry args={[1.62, 0.24, 0.22]} />
      </mesh>
      {/* Rounded-looking raised cam contact pad. */}
      <mesh position={[0, 0.17, 0]} material={center ? pinMetal : darkMetal} castShadow>
        <boxGeometry args={[0.48, 0.16, 0.25]} />
      </mesh>
      {/* Contact pads at the two valve ends. */}
      {[-0.59, 0.59].map((dx) => (
        <mesh key={dx} position={[dx, -0.14, 0]} material={pinMetal} castShadow>
          <cylinderGeometry args={[0.105, 0.105, 0.09, 20]} />
        </mesh>
      ))}
      {/* Center pivot boss. */}
      <mesh position={[0, 0.01, 0]} rotation={[Math.PI / 2, 0, 0]} material={darkMetal} castShadow>
        <cylinderGeometry args={[0.16, 0.16, 0.28, 24]} />
      </mesh>
      <mesh position={[0, 0.01, 0.17]} rotation={[Math.PI / 2, 0, 0]} material={pinMetal}>
        <cylinderGeometry args={[0.075, 0.075, 0.055, 20]} />
      </mesh>
    </group>
  );
}

function RockerBank({ centerX, centerZ }) {
  return (
    <group>
      {FINGER_Z.map((offset, index) => (
        <RockerFinger
          key={offset}
          x={centerX}
          y={INSTALLED_Y + (index === 1 ? 0.025 : 0)}
          z={centerZ + offset}
          center={index === 1}
        />
      ))}
      {/* Small VTEC oil-control/locking pin representation beside the rocker trio. */}
      <mesh position={[centerX + 0.91, INSTALLED_Y + 0.03, centerZ]} rotation={[0, 0, Math.PI / 2]} material={pinMetal} castShadow>
        <cylinderGeometry args={[0.09, 0.09, 0.42, 20]} />
      </mesh>
      <mesh position={[centerX - 0.91, INSTALLED_Y + 0.03, centerZ]} rotation={[0, 0, Math.PI / 2]} material={darkMetal} castShadow>
        <cylinderGeometry args={[0.11, 0.11, 0.22, 20]} />
      </mesh>
    </group>
  );
}

export default function RockerVtec({ installed = false }) {
  const group = useRef(null);
  const progress = useRef(0);
  const banks = useMemo(() => CYLINDER_X.flatMap((centerX) =>
    ROW_Z.map((centerZ) => ({ centerX, centerZ }))
  ), []);

  useFrame((_, delta) => {
    if (!group.current) return;
    progress.current = THREE.MathUtils.damp(progress.current, installed ? 1 : 0, 2.0, delta);
    const t = progress.current;
    const eased = t * t * (3 - 2 * t);
    group.current.position.lerpVectors(PREVIEW_OFFSET, new THREE.Vector3(0, 0, 0), eased);
  });

  return (
    <group ref={group} position={PREVIEW_OFFSET.toArray()} name="b16-rocker-arms-vtec-assembly">
      {banks.map(({ centerX, centerZ }, index) => (
        <RockerBank key={index} centerX={centerX} centerZ={centerZ} />
      ))}
    </group>
  );
}
