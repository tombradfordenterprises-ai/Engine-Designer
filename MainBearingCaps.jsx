import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

// Provisional positions based on the visible B16 block/crankshaft scene.
// These are educational placeholder geometry, not production B16 CAD dimensions.
const MAIN_X_POSITIONS = [-46.0, -43.0, -40.0, -37.0, -34.0];
const PREVIEW_OFFSET = new THREE.Vector3(0, 9, 10);
const CAP_Y = 6.7;
const CRANK_Z = 131.0;

const capMaterial = new THREE.MeshStandardMaterial({
  color: '#68737c',
  metalness: 0.78,
  roughness: 0.3,
});

const shellMaterial = new THREE.MeshStandardMaterial({
  color: '#b8a27a',
  metalness: 0.72,
  roughness: 0.24,
});

const boltMaterial = new THREE.MeshStandardMaterial({
  color: '#9aa3aa',
  metalness: 0.88,
  roughness: 0.22,
});

function BearingCap({ index, installed }) {
  const groupRef = useRef(null);
  const progressRef = useRef(0);
  const clockRef = useRef(0);

  const target = new THREE.Vector3(MAIN_X_POSITIONS[index], CAP_Y, CRANK_Z);
  const preview = target.clone().add(PREVIEW_OFFSET);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    if (installed) {
      clockRef.current += delta;
      // One click triggers all five caps, with a short stagger between them.
      const localTime = Math.max(0, clockRef.current - index * 0.22);
      progressRef.current = THREE.MathUtils.clamp(localTime / 0.82, 0, 1);
    } else {
      clockRef.current = 0;
      progressRef.current = Math.max(0, progressRef.current - delta * 2.2);
    }

    const t = progressRef.current;
    const eased = t * t * (3 - 2 * t);
    groupRef.current.position.lerpVectors(preview, target, eased);

    // The bolt heads become visible only after the cap has seated.
    const boltScale = THREE.MathUtils.clamp((t - 0.82) / 0.18, 0, 1);
    groupRef.current.children.forEach((child) => {
      if (child.userData.isBoltGroup) {
        child.scale.y = Math.max(0.001, boltScale);
      }
    });
  });

  return (
    <group ref={groupRef} position={preview.toArray()} name={`main-bearing-cap-${index + 1}`}>
      {/* Main cap bridge */}
      <mesh material={capMaterial} castShadow receiveShadow>
        <boxGeometry args={[0.95, 1.1, 2.25]} />
      </mesh>

      {/* Lower bearing shell: a half-ring oriented around the crankshaft axis */}
      <mesh
        position={[0, 1.3, 0]}
        rotation={[0, Math.PI / 2, Math.PI]}
        material={shellMaterial}
        castShadow
        receiveShadow
      >
        <torusGeometry args={[0.82, 0.12, 10, 28, Math.PI]} />
      </mesh>

      {/* Two cap fasteners per bearing cap */}
      {[-0.91, 0.91].map((z, boltIndex) => (
        <group key={boltIndex} position={[0, 0.34, z]} userData={{ isBoltGroup: true }}>
          <mesh position={[0, 0.08, 0]} material={boltMaterial} castShadow>
            <cylinderGeometry args={[0.12, 0.12, 0.82, 12]} />
          </mesh>
          <mesh
            position={[0, 0.48, 0]}
            material={boltMaterial}
            castShadow
          >
            <cylinderGeometry args={[0.2, 0.2, 0.16, 6]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default function MainBearingCaps({ installed = false }) {
  return (
    <group name="main-bearing-cap-assembly">
      {MAIN_X_POSITIONS.map((_, index) => (
        <BearingCap key={index} index={index} installed={installed} />
      ))}
    </group>
  );
}
