import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

// Both camshafts extend toward the timing-drive end at the positive-X
// end of their measured source bounds. The two camshaft rows are separated
// along Z by 4 units in the installed assembly.
const CAMSHAFT_ENDS = [
  { x: -30.0, z: 132.0 },
  { x: -30.0, z: 128.0 },
];
const CENTER_Y = 16.5;
const PREVIEW = new THREE.Vector3(0, 8, 10);
const INSTALLED = new THREE.Vector3(0, 0, 0);
const steel = new THREE.MeshStandardMaterial({ color: '#87939d', metalness: 0.9, roughness: 0.24 });
const hubMetal = new THREE.MeshStandardMaterial({ color: '#56636d', metalness: 0.86, roughness: 0.28 });
const markMetal = new THREE.MeshStandardMaterial({ color: '#e0b75b', metalness: 0.72, roughness: 0.3 });

function Sprocket({ x, z, index }) {
  return (
    <group position={[x, CENTER_Y, z]} name={`camshaft-sprocket-${index + 1}`}>
      {/* Cylinder axis is X, matching the supplied camshaft shaft axis. */}
      <mesh rotation={[0, 0, Math.PI / 2]} material={steel} castShadow receiveShadow>
        <cylinderGeometry args={[1.72, 1.72, 0.42, 48]} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]} material={hubMetal} castShadow>
        <cylinderGeometry args={[0.68, 0.68, 0.62, 32]} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]} material={markMetal}>
        <cylinderGeometry args={[0.22, 0.22, 0.66, 24]} />
      </mesh>
      {Array.from({ length: 24 }, (_, tooth) => {
        const angle = (tooth / 24) * Math.PI * 2;
        return (
          <mesh key={tooth} position={[0, Math.cos(angle) * 1.76, Math.sin(angle) * 1.76]} rotation={[angle, 0, 0]} material={steel} castShadow>
            <boxGeometry args={[0.48, 0.32, 0.34]} />
          </mesh>
        );
      })}
      <mesh position={[0.24, 1.32, 0]} material={markMetal}>
        <boxGeometry args={[0.08, 0.34, 0.13]} />
      </mesh>
    </group>
  );
}

export default function CamGears({ installed = false }) {
  const group = useRef(null);
  const progress = useRef(0);
  useFrame((_, delta) => {
    if (!group.current) return;
    progress.current = THREE.MathUtils.damp(progress.current, installed ? 1 : 0, 2, delta);
    const t = progress.current;
    group.current.position.lerpVectors(PREVIEW, INSTALLED, t * t * (3 - 2 * t));
  });
  return (
    <group ref={group} position={PREVIEW.toArray()} name="b16-camshaft-gears">
      {CAMSHAFT_ENDS.map((shaft, index) => (
        <Sprocket key={index} x={shaft.x} z={shaft.z} index={index} />
      ))}
    </group>
  );
}