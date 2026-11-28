import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

// Educational procedural model. The assembly sits on the timing-drive face;
// the pulley is a separate sub-group so only the rotating element spins.
const INSTALLED = new THREE.Vector3(-30.0, 10.2, 126.0);
const PREVIEW = INSTALLED.clone().add(new THREE.Vector3(0, 8, 10));
const housing = new THREE.MeshStandardMaterial({ color: '#687681', metalness: 0.82, roughness: 0.3 });
const machined = new THREE.MeshStandardMaterial({ color: '#aeb8bf', metalness: 0.9, roughness: 0.22 });
const pulleyMetal = new THREE.MeshStandardMaterial({ color: '#59656f', metalness: 0.88, roughness: 0.25 });

function AxialCylinder({ radius, depth, material, position = [0, 0, 0] }) {
  return <mesh position={position} rotation={[0, 0, Math.PI / 2]} material={material} castShadow receiveShadow><cylinderGeometry args={[radius, radius, depth, 40]} /></mesh>;
}

export default function WaterPump({ installed = false, rotating = false }) {
  const group = useRef(null);
  const pulley = useRef(null);
  const progress = useRef(0);
  useFrame((_, delta) => {
    if (!group.current) return;
    progress.current = THREE.MathUtils.damp(progress.current, installed ? 1 : 0, 2, delta);
    const t = progress.current;
    group.current.position.lerpVectors(PREVIEW, INSTALLED, t * t * (3 - 2 * t));
    if (pulley.current && installed && rotating) pulley.current.rotation.x -= delta * 2.0;
  });
  return (
    <group ref={group} position={PREVIEW.toArray()} name="b16-water-pump">
      <AxialCylinder radius={1.48} depth={0.78} material={housing} />
      <AxialCylinder radius={1.2} depth={0.16} material={machined} position={[-0.48, 0, 0]} />
      <AxialCylinder radius={0.62} depth={0.22} material={machined} position={[-0.62, 0, 0]} />
      <AxialCylinder radius={0.28} depth={0.72} material={machined} position={[-0.9, 0, 0]} />
      <group ref={pulley} position={[0.5, 0, 0]} name="water-pump-pulley">
        <AxialCylinder radius={1.12} depth={0.22} material={pulleyMetal} />
        <AxialCylinder radius={0.82} depth={0.12} material={machined} position={[0.14, 0, 0]} />
        {Array.from({ length: 6 }, (_, i) => {
          const a = i * Math.PI / 3;
          return <mesh key={i} position={[0.18, Math.cos(a) * 0.91, Math.sin(a) * 0.91]} material={machined}><cylinderGeometry args={[0.11, 0.11, 0.16, 12]} /></mesh>;
        })}
      </group>
    </group>
  );
}