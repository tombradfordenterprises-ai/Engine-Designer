import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

// Visual prototype coordinates based on the current engine scene. These are
// not factory B16 CAD dimensions. The pump is placed at the OPPOSITE
// longitudinal end of the block, beside the short protruding end feature.
// The crankshaft runs on the X axis at y=5.5, z=130.0; keep the pump's
// rotor opening concentric with that axis.
const INSTALLED = new THREE.Vector3(-48.0, 5.5, 130.0);
const PREVIEW = INSTALLED.clone().add(new THREE.Vector3(0, 8.5, 9.0));

const housing = new THREE.MeshStandardMaterial({ color: '#69747d', metalness: 0.78, roughness: 0.3 });
const machined = new THREE.MeshStandardMaterial({ color: '#aeb8bf', metalness: 0.88, roughness: 0.22 });
const gear = new THREE.MeshStandardMaterial({ color: '#b58b52', metalness: 0.78, roughness: 0.27 });
const bolt = new THREE.MeshStandardMaterial({ color: '#d0d5d9', metalness: 0.92, roughness: 0.2 });

function AxialCylinder({ radius, depth, material, position = [0, 0, 0], segments = 40 }) {
  return (
    <mesh position={position} rotation={[0, 0, Math.PI / 2]} material={material} castShadow receiveShadow>
      <cylinderGeometry args={[radius, radius, depth, segments]} />
    </mesh>
  );
}

export default function OilPump({ installed = false }) {
  const group = useRef(null);
  const progress = useRef(0);

  useFrame((_, delta) => {
    if (!group.current) return;
    const target = installed ? 1 : 0;
    progress.current += (target - progress.current) * Math.min(1, delta * 2.5);
    const t = progress.current;
    const eased = t * t * (3 - 2 * t);
    group.current.position.lerpVectors(PREVIEW, INSTALLED, eased);
  });

  return (
    <group ref={group} position={PREVIEW.toArray()} name="b16-oil-pump-assembly">
      {/* Cast pump body and raised machined front face. */}
      <AxialCylinder radius={2.05} depth={0.9} material={housing} />
      <AxialCylinder radius={1.68} depth={0.16} material={machined} position={[-0.53, 0, 0]} />
      <AxialCylinder radius={1.36} depth={0.12} material={housing} position={[-0.64, 0, 0]} />

      {/* Two visible gear faces represent the inner and outer pump rotors. */}
      <AxialCylinder radius={0.67} depth={0.12} material={gear} position={[-0.74, 0.15, 0.1]} />
      <AxialCylinder radius={0.91} depth={0.12} material={gear} position={[-0.75, -0.43, -0.1]} />
      <AxialCylinder radius={0.2} depth={0.2} material={machined} position={[-0.84, 0.15, 0.1]} />

      {/* Raised perimeter bosses and four mounting fasteners. */}
      {[[0, 1.55], [0, -1.55], [1.55, 0], [-1.55, 0]].map(([y, z], i) => (
        <group key={i} position={[-0.52, y, z]}>
          <mesh material={machined} castShadow>
            <cylinderGeometry args={[0.24, 0.28, 0.16, 16]} />
          </mesh>
          <mesh position={[-0.14, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={bolt} castShadow>
            <cylinderGeometry args={[0.12, 0.12, 0.28, 6]} />
          </mesh>
        </group>
      ))}

      {/* Lower outlet boss for the future oil-pickup connection. */}
      <mesh position={[0.25, -1.55, 0.2]} rotation={[0, 0, Math.PI / 2]} material={housing} castShadow>
        <cylinderGeometry args={[0.42, 0.52, 0.8, 24]} />
      </mesh>
      <mesh position={[-0.2, -1.55, 0.2]} rotation={[0, 0, Math.PI / 2]} material={machined}>
        <cylinderGeometry args={[0.3, 0.3, 0.12, 24]} />
      </mesh>
    </group>
  );
}
