import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

// Prototype positions are inferred from the current crankshaft/cap scene.
// They are visual placeholders, not measured Honda B16 bore or crank-pin coordinates.
const CYLINDER_X = [-45.25, -41.75, -38.25, -34.75];
const INSTALLED_Y = 11.05;
const CENTER_Z = 130.0;
const PREVIEW_OFFSET = new THREE.Vector3(17, 5, 12);

const pistonMaterial = new THREE.MeshStandardMaterial({
  color: '#aeb8bf',
  metalness: 0.78,
  roughness: 0.28,
});
const ringMaterial = new THREE.MeshStandardMaterial({
  color: '#42494f',
  metalness: 0.86,
  roughness: 0.24,
});
const rodMaterial = new THREE.MeshStandardMaterial({
  color: '#78858e',
  metalness: 0.82,
  roughness: 0.27,
});
const pinMaterial = new THREE.MeshStandardMaterial({
  color: '#c0c8ce',
  metalness: 0.9,
  roughness: 0.2,
});

function PistonRodUnit({ index, installed }) {
  const groupRef = useRef(null);
  const progressRef = useRef(0);
  const elapsedRef = useRef(0);

  const target = new THREE.Vector3(CYLINDER_X[index], INSTALLED_Y, CENTER_Z);
  const preview = target.clone().add(PREVIEW_OFFSET);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    if (installed) {
      elapsedRef.current += delta;
      // One Install click triggers all four units with a short stagger.
      const localTime = Math.max(0, elapsedRef.current - index * 0.3);
      progressRef.current = THREE.MathUtils.clamp(localTime / 1.25, 0, 1);
    } else {
      elapsedRef.current = 0;
      progressRef.current = Math.max(0, progressRef.current - delta * 2.0);
    }

    const t = progressRef.current;
    const eased = t * t * (3 - 2 * t);
    groupRef.current.position.lerpVectors(preview, target, eased);
  });

  return (
    <group
      ref={groupRef}
      position={preview.toArray()}
      name={`piston-connecting-rod-${index + 1}`}
    >
      {/* Piston skirt and crown; cylinder axis is vertical (Y). */}
      <mesh position={[0, 0.0, 0]} material={pistonMaterial} castShadow receiveShadow>
        <cylinderGeometry args={[1.38, 1.42, 1.25, 48]} />
      </mesh>
      <mesh position={[0, 0.68, 0]} material={pistonMaterial} castShadow receiveShadow>
        <cylinderGeometry args={[1.40, 1.38, 0.16, 48]} />
      </mesh>

      {/* Three piston rings around the upper skirt. */}
      {[-0.38, -0.19, 0.0].map((y, ringIndex) => (
        <mesh
          key={ringIndex}
          position={[0, y, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          material={ringMaterial}
          castShadow
        >
          <torusGeometry args={[1.43, 0.035, 8, 48]} />
        </mesh>
      ))}

      {/* Wrist pin passes through the piston and small end of the rod. */}
      <mesh
        position={[0, -0.25, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        material={pinMaterial}
        castShadow
      >
        <cylinderGeometry args={[0.19, 0.19, 1.55, 20]} />
      </mesh>

      {/* Connecting-rod beam descends from wrist pin toward the crank throw. */}
      <mesh position={[0, -1.55, 0]} material={rodMaterial} castShadow receiveShadow>
        <boxGeometry args={[0.42, 3.05, 0.32]} />
      </mesh>

      {/* Small-end and big-end rings, with the big end near the crankshaft. */}
      <mesh
        position={[0, -0.88, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        material={rodMaterial}
        castShadow
      >
        <torusGeometry args={[0.36, 0.14, 12, 28]} />
      </mesh>
      <mesh
        position={[0, -3.05, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        material={rodMaterial}
        castShadow
      >
        <torusGeometry args={[0.58, 0.16, 12, 32]} />
      </mesh>
      <mesh
        position={[0, -3.05, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        material={pinMaterial}
        castShadow
      >
        <cylinderGeometry args={[0.38, 0.38, 0.34, 24]} />
      </mesh>
    </group>
  );
}

export default function PistonsRods({ installed = false }) {
  return (
    <group name="four-piston-connecting-rod-assembly">
      {CYLINDER_X.map((_, index) => (
        <PistonRodUnit
          key={index}
          index={index}
          installed={installed}
        />
      ))}
    </group>
  );
}
