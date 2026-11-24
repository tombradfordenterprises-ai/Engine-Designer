import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

// Educational prototype geometry. Placement is aligned to the existing B16 scene;
// it is not a dimensionally verified OEM gasket model.
const INSTALLED = new THREE.Vector3(-40.0, 12.0, 130.5);
const PREVIEW = INSTALLED.clone().add(new THREE.Vector3(0, 8, 10));

const gasketMaterial = new THREE.MeshStandardMaterial({
  color: '#9da7ad',
  metalness: 0.82,
  roughness: 0.3,
  side: THREE.DoubleSide,
});
const fireRingMaterial = new THREE.MeshStandardMaterial({
  color: '#c2c8cc',
  metalness: 0.9,
  roughness: 0.22,
});

function createGasketGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(-8.6, -5.25);
  shape.lineTo(8.6, -4.75);
  shape.lineTo(8.6, 4.75);
  shape.lineTo(-8.6, 4.75);
  shape.closePath();

  // Four cylinder openings, centered on the existing piston/rod assembly.
  [-5.25, -1.75, 1.75, 5.25].forEach((x) => {
    const hole = new THREE.Path();
    hole.absellipse(x, -0.5, 1.48, 1.48, 0, Math.PI * 2, true, 0);
    shape.holes.push(hole);
  });

  // Small illustrative fluid-passage openings.
  [[-7.6, -3.25], [-7.6, 3.25], [7.6, -3.25], [7.6, 3.25], [0, -4.15], [0, 4.15]].forEach(([x, y]) => {
    const hole = new THREE.Path();
    hole.absellipse(x, y, 0.32, 0.32, 0, Math.PI * 2, true, 0);
    shape.holes.push(hole);
  });

  return new THREE.ExtrudeGeometry(shape, {
    depth: 0.12,
    bevelEnabled: false,
    curveSegments: 32,
  });
}

const gasketGeometry = createGasketGeometry();

export default function CylinderHeadGasket({ installed = false }) {
  const group = useRef(null);
  const progress = useRef(0);

  useFrame((_, delta) => {
    if (!group.current) return;
    progress.current += ((installed ? 1 : 0) - progress.current) * Math.min(1, delta * 2.8);
    const t = progress.current;
    const eased = t * t * (3 - 2 * t);
    group.current.position.lerpVectors(PREVIEW, INSTALLED, eased);
  });

  return (
    <group ref={group} position={PREVIEW.toArray()} name="b16-cylinder-head-gasket">
      {/* Extruded sheet rotated flat onto the block deck. */}
      <mesh
        geometry={gasketGeometry}
        position={[0, 0.12, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        material={gasketMaterial}
        castShadow
        receiveShadow
      />
      {/* Raised fire-ring outlines around the four cylinder openings. */}
      {[-5.25, -1.75, 1.75, 5.25].map((x) => (
        <mesh
          key={x}
          position={[x, 0.135, -0.5]}
          rotation={[Math.PI / 2, 0, 0]}
          material={fireRingMaterial}
          castShadow
        >
          <torusGeometry args={[1.49, 0.075, 8, 48]} />
        </mesh>
      ))}
    </group>
  );
}
