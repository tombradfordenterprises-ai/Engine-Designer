import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

// Simplified visual tensioner assembly. Geometry and coordinates are
// educational approximations, not verified B16 factory dimensions.
const INSTALLED = new THREE.Vector3(-26.5, 13.5, 130);
const PREVIEW = INSTALLED.clone().add(new THREE.Vector3(0, 8, 10));
const steel = new THREE.MeshStandardMaterial({ color: '#77848e', metalness: 0.9, roughness: 0.24 });
const dark = new THREE.MeshStandardMaterial({ color: '#3f4a52', metalness: 0.84, roughness: 0.28 });
const bright = new THREE.MeshStandardMaterial({ color: '#c1c9cf', metalness: 0.94, roughness: 0.2 });

function AxialCylinder({ radius, depth, material, position = [0, 0, 0] }) {
  return (
    <mesh position={position} rotation={[0, 0, Math.PI / 2]} material={material} castShadow receiveShadow>
      <cylinderGeometry args={[radius, radius, depth, 40]} />
    </mesh>
  );
}

export default function TimingTensioner({ installed = false }) {
  const group = useRef(null);
  const progress = useRef(0);
  useFrame((_, delta) => {
    if (!group.current) return;
    progress.current = THREE.MathUtils.damp(progress.current, installed ? 1 : 0, 2, delta);
    const t = progress.current;
    group.current.position.lerpVectors(PREVIEW, INSTALLED, t * t * (3 - 2 * t));
  });
  return (
    <group ref={group} position={PREVIEW.toArray()} name="b16-timing-belt-tensioner">
      {/* Mounting plate and offset tensioner arm. */}
      <mesh position={[-0.38, -0.18, 0]} rotation={[0, 0, 0.28]} material={dark} castShadow>
        <boxGeometry args={[0.46, 1.9, 1.35]} />
      </mesh>
      <mesh position={[-0.12, 0.68, 0]} rotation={[0, 0, -0.28]} material={steel} castShadow>
        <boxGeometry args={[0.34, 1.25, 0.72]} />
      </mesh>
      {/* Pulley and bearing stack. */}
      <AxialCylinder radius={1.18} depth={0.42} material={dark} position={[0.22, 0.95, 0]} />
      <AxialCylinder radius={0.96} depth={0.18} material={steel} position={[0.48, 0.95, 0]} />
      <AxialCylinder radius={0.36} depth={0.58} material={bright} position={[0.58, 0.95, 0]} />
      <AxialCylinder radius={0.16} depth={0.68} material={dark} position={[0.72, 0.95, 0]} />
      {/* Adjustment/retaining fastener. */}
      <mesh position={[0.3, -0.82, 0]} rotation={[0, 0, Math.PI / 2]} material={bright}>
        <cylinderGeometry args={[0.19, 0.19, 0.28, 6]} />
      </mesh>
    </group>
  );
}
