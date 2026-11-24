import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

// Simplified teaching geometry positioned to the current B16 block.
// This is a visual prototype, not factory CAD or a dimensionally accurate head.
const INSTALLED = new THREE.Vector3(-40.0, 13.75, 130.5);
const PREVIEW = INSTALLED.clone().add(new THREE.Vector3(0, 9, 12));

const headMaterial = new THREE.MeshStandardMaterial({
  color: '#929da4',
  metalness: 0.78,
  roughness: 0.34,
});
const machinedMaterial = new THREE.MeshStandardMaterial({
  color: '#b8c0c5',
  metalness: 0.86,
  roughness: 0.25,
});
const portMaterial = new THREE.MeshStandardMaterial({
  color: '#3e474d',
  metalness: 0.38,
  roughness: 0.55,
});
const wellMaterial = new THREE.MeshStandardMaterial({
  color: '#343b40',
  metalness: 0.55,
  roughness: 0.42,
});

export default function CylinderHead({ installed = false }) {
  const group = useRef(null);
  const progress = useRef(0);

  useFrame((_, delta) => {
    if (!group.current) return;
    progress.current += ((installed ? 1 : 0) - progress.current) * Math.min(1, delta * 2.2);
    const t = progress.current;
    const eased = t * t * (3 - 2 * t);
    group.current.position.lerpVectors(PREVIEW, INSTALLED, eased);
  });

  return (
    <group ref={group} position={PREVIEW.toArray()} name="b16-cylinder-head">
      {/* Main aluminum casting. */}
      <mesh material={headMaterial} castShadow receiveShadow>
        <boxGeometry args={[17.2, 2.65, 10.35]} />
      </mesh>

      {/* Lower combustion-chamber bosses, one above each cylinder. */}
      {[-5.25, -1.75, 1.75, 5.25].map((x) => (
        <mesh
          key={`chamber-${x}`}
          position={[x, -1.25, -0.5]}
          scale={[1.55, 0.32, 1.55]}
          material={headMaterial}
          castShadow
          receiveShadow
        >
          <sphereGeometry args={[1, 24, 16]} />
        </mesh>
      ))}

      {/* Twin camshaft bearing rails across the length of the DOHC head. */}
      {[-2.35, 2.35].map((z) => (
        <mesh key={`cam-rail-${z}`} position={[0, 1.38, z]} material={machinedMaterial} castShadow>
          <boxGeometry args={[16.7, 0.34, 1.05]} />
        </mesh>
      ))}

      {/* Valve-cover perimeter rails. */}
      {[-4.75, 4.75].map((z) => (
        <mesh key={`cover-rail-${z}`} position={[0, 1.38, z]} material={machinedMaterial} castShadow>
          <boxGeometry args={[16.9, 0.3, 0.35]} />
        </mesh>
      ))}

      {/* Four illustrative spark-plug wells along the centerline. */}
      {[-5.25, -1.75, 1.75, 5.25].map((x) => (
        <group key={`plug-well-${x}`} position={[x, 1.42, -0.5]}>
          <mesh material={portMaterial} castShadow>
            <cylinderGeometry args={[0.48, 0.48, 0.18, 24]} />
          </mesh>
          <mesh position={[0, 0.1, 0]} material={wellMaterial}>
            <cylinderGeometry args={[0.31, 0.31, 0.08, 24]} />
          </mesh>
          <mesh position={[0, 0.105, 0]} material={machinedMaterial}>
            <torusGeometry args={[0.39, 0.075, 8, 32]} />
          </mesh>
        </group>
      ))}

      {/* Simplified intake and exhaust port bosses on opposite sides. */}
      {[-5.25, -1.75, 1.75, 5.25].map((x) => (
        <group key={`ports-${x}`}>
          <mesh position={[x, -0.25, 5.05]} rotation={[Math.PI / 2, 0, 0]} material={portMaterial} castShadow>
            <cylinderGeometry args={[0.58, 0.68, 0.8, 24]} />
          </mesh>
          <mesh position={[x, -0.25, -5.05]} rotation={[Math.PI / 2, 0, 0]} material={portMaterial} castShadow>
            <cylinderGeometry args={[0.58, 0.68, 0.8, 24]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
