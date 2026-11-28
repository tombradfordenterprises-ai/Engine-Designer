import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

// Visual prototype coordinates follow the current camshaft gallery layout.
// Gear size and placement are illustrative, not factory B16 dimensions.
const CAM_X = -29.5;
const ROW_Z = [128, 132];
const CENTER_Y = 17.2;
const PREVIEW = new THREE.Vector3(0, 8, 10);
const INSTALLED = new THREE.Vector3(0, 0, 0);
const steel = new THREE.MeshStandardMaterial({ color: '#87939d', metalness: 0.9, roughness: 0.24 });
const hubMetal = new THREE.MeshStandardMaterial({ color: '#56636d', metalness: 0.86, roughness: 0.28 });
const markMetal = new THREE.MeshStandardMaterial({ color: '#e0b75b', metalness: 0.72, roughness: 0.3 });

function Sprocket({ z, index }) {
  const teeth = Array.from({ length: 24 }, (_, i) => i);
  return (
    <group position={[CAM_X, CENTER_Y, z]} name={`camshaft-sprocket-${index + 1}`}>
      {/* The sprocket face lies in the Y/Z plane; its shaft axis is X. */}
      <mesh rotation={[0, 0, Math.PI / 2]} material={steel} castShadow receiveShadow>
        <cylinderGeometry args={[1.72, 1.72, 0.42, 48]} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]} material={hubMetal} castShadow>
        <cylinderGeometry args={[0.68, 0.68, 0.62, 32]} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]} material={markMetal}>
        <cylinderGeometry args={[0.22, 0.22, 0.66, 24]} />
      </mesh>
      {teeth.map((tooth) => {
        const angle = (tooth / teeth.length) * Math.PI * 2;
        return (
          <mesh key={tooth} position={[0, Math.cos(angle) * 1.76, Math.sin(angle) * 1.76]} rotation={[angle, 0, 0]} material={steel} castShadow>
            <boxGeometry args={[0.48, 0.32, 0.34]} />
          </mesh>
        );
      })}
      {/* A small timing index mark on the outer rim. */}
      <mesh position={[0.24, 1.32, 0]} material={markMetal}>
        <boxGeometry args={[0.08, 0.34, 0.13]} />
      </mesh>
      <mesh position={[0.25, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={hubMetal}>
        <cylinderGeometry args={[0.16, 0.16, 0.08, 6]} />
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
      {ROW_Z.map((z, i) => <Sprocket key={z} z={z} index={i} />)}
    </group>
  );
}
