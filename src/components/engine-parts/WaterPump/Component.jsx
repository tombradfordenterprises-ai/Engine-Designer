import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

// Simplified educational water-pump model in the current engine scene.
// Placement and dimensions are visual approximations, not factory CAD data.
const INSTALLED = new THREE.Vector3(-29.5, 10.2, 130);
const PREVIEW = INSTALLED.clone().add(new THREE.Vector3(0, 8, 10));
const housing = new THREE.MeshStandardMaterial({ color: '#687681', metalness: 0.82, roughness: 0.3 });
const machined = new THREE.MeshStandardMaterial({ color: '#aeb8bf', metalness: 0.9, roughness: 0.22 });
const pulleyMetal = new THREE.MeshStandardMaterial({ color: '#59656f', metalness: 0.88, roughness: 0.25 });

function AxialCylinder({ radius, depth, material, position = [0, 0, 0] }) {
  return (
    <mesh position={position} rotation={[0, 0, Math.PI / 2]} material={material} castShadow receiveShadow>
      <cylinderGeometry args={[radius, radius, depth, 40]} />
    </mesh>
  );
}

export default function WaterPump({ installed = false }) {
  const group = useRef(null);
  const progress = useRef(0);
  useFrame((_, delta) => {
    if (!group.current) return;
    progress.current = THREE.MathUtils.damp(progress.current, installed ? 1 : 0, 2, delta);
    const t = progress.current;
    group.current.position.lerpVectors(PREVIEW, INSTALLED, t * t * (3 - 2 * t));
  });
  return (
    <group ref={group} position={PREVIEW.toArray()} name="b16-water-pump">
      <AxialCylinder radius={1.48} depth={0.78} material={housing} />
      <AxialCylinder radius={1.2} depth={0.16} material={machined} position={[-0.48, 0, 0]} />
      <AxialCylinder radius={0.62} depth={0.22} material={machined} position={[-0.62, 0, 0]} />
      <AxialCylinder radius={0.28} depth={0.72} material={machined} position={[-0.9, 0, 0]} />
      {/* Simplified pulley flange on the belt-facing side. */}
      <AxialCylinder radius={1.12} depth={0.22} material={pulleyMetal} position={[0.5, 0, 0]} />
      <AxialCylinder radius={0.82} depth={0.12} material={machined} position={[0.64, 0, 0]} />
      {Array.from({ length: 6 }, (_, i) => {
        const angle = i * Math.PI / 3;
        return (
          <mesh key={i} position={[0.68, Math.cos(angle) * 0.91, Math.sin(angle) * 0.91]} material={machined}>
            <cylinderGeometry args={[0.11, 0.11, 0.16, 12]} />
          </mesh>
        );
      })}
    </group>
  );
}
