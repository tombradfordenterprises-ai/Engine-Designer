import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

// Simplified steel sump model positioned beneath the B16 block. Visual prototype only.
const INSTALLED = new THREE.Vector3(-39.75, 3.45, 130.5);
const PREVIEW = INSTALLED.clone().add(new THREE.Vector3(0, 9, 12));
const panMaterial = new THREE.MeshStandardMaterial({ color: '#59646c', metalness: 0.82, roughness: 0.3 });
const flangeMaterial = new THREE.MeshStandardMaterial({ color: '#aab3b9', metalness: 0.88, roughness: 0.22 });
const plugMaterial = new THREE.MeshStandardMaterial({ color: '#c0c7cc', metalness: 0.92, roughness: 0.2 });

export default function OilPan({ installed = false }) {
  const group = useRef(null);
  const progress = useRef(0);
  useFrame((_, delta) => {
    if (!group.current) return;
    progress.current += ((installed ? 1 : 0) - progress.current) * Math.min(1, delta * 2.35);
    const t = progress.current;
    group.current.position.lerpVectors(PREVIEW, INSTALLED, t * t * (3 - 2 * t));
  });

  return (
    <group ref={group} position={PREVIEW.toArray()} name="b16-oil-pan-sump">
      {/* Pan shell: broad shallow sump with a deeper central reservoir. */}
      <mesh position={[0, -0.65, 0]} material={panMaterial} castShadow receiveShadow>
        <boxGeometry args={[16.0, 0.48, 8.0]} />
      </mesh>
      <mesh position={[0, 0.0, -3.78]} material={panMaterial} castShadow><boxGeometry args={[16.0, 1.15, 0.42]} /></mesh>
      <mesh position={[0, 0.0, 3.78]} material={panMaterial} castShadow><boxGeometry args={[16.0, 1.15, 0.42]} /></mesh>
      <mesh position={[-7.78, 0.0, 0]} material={panMaterial} castShadow><boxGeometry args={[0.42, 1.15, 7.2]} /></mesh>
      <mesh position={[7.78, 0.0, 0]} material={panMaterial} castShadow><boxGeometry args={[0.42, 1.15, 7.2]} /></mesh>
      {/* Bright upper flange and visible perimeter fasteners. */}
      <mesh position={[0, 0.62, -3.92]} material={flangeMaterial} castShadow><boxGeometry args={[16.2, 0.16, 0.5]} /></mesh>
      <mesh position={[0, 0.62, 3.92]} material={flangeMaterial} castShadow><boxGeometry args={[16.2, 0.16, 0.5]} /></mesh>
      <mesh position={[-7.9, 0.62, 0]} material={flangeMaterial} castShadow><boxGeometry args={[0.5, 0.16, 7.7]} /></mesh>
      <mesh position={[7.9, 0.62, 0]} material={flangeMaterial} castShadow><boxGeometry args={[0.5, 0.16, 7.7]} /></mesh>
      {[-6.8, -3.4, 0, 3.4, 6.8].flatMap((x) => [-3.95, 3.95].map((z, i) => (
        <mesh key={`${x}-${z}`} position={[x, 0.73, z]} material={plugMaterial} castShadow>
          <cylinderGeometry args={[0.13, 0.13, 0.13, 6]} />
        </mesh>
      )))}
      {/* Drain plug on the underside of the sump. */}
      <mesh position={[5.4, -0.94, 2.4]} material={plugMaterial} castShadow>
        <cylinderGeometry args={[0.28, 0.28, 0.24, 6]} />
      </mesh>
    </group>
  );
}
