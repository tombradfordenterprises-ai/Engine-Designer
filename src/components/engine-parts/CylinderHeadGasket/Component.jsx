
import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

// Visual prototype footprint tuned to the imported block/head deck envelope:
// approximately 17.0 x 9.0 scene units. This is not an OEM gasket drawing
// or factory service dimension.
const INSTALLED = new THREE.Vector3(-40.0, 12.0, 130.5);
const PREVIEW = INSTALLED.clone().add(new THREE.Vector3(0, 8, 10));

const gasketMaterial = new THREE.MeshStandardMaterial({
  color: '#9da7ad', metalness: 0.82, roughness: 0.3, side: THREE.DoubleSide,
});
const fireRingMaterial = new THREE.MeshStandardMaterial({
  color: '#c2c8cc', metalness: 0.9, roughness: 0.22,
});

function createGasketGeometry() {
  const shape = new THREE.Shape();
  // Rounded outer perimeter: 17.0 x 9.0, just inside the imported deck edge.
  shape.moveTo(-8.05, -4.5);
  shape.lineTo(8.05, -4.5);
  shape.quadraticCurveTo(8.5, -4.5, 8.5, -4.05);
  shape.lineTo(8.5, 4.05);
  shape.quadraticCurveTo(8.5, 4.5, 8.05, 4.5);
  shape.lineTo(-8.05, 4.5);
  shape.quadraticCurveTo(-8.5, 4.5, -8.5, 4.05);
  shape.lineTo(-8.5, -4.05);
  shape.quadraticCurveTo(-8.5, -4.5, -8.05, -4.5);
  shape.closePath();

  // Four cylinder openings retain the established piston spacing.
  [-5.25, -1.75, 1.75, 5.25].forEach((x) => {
    const hole = new THREE.Path();
    hole.absellipse(x, -0.5, 1.48, 1.48, 0, Math.PI * 2, true, 0);
    shape.holes.push(hole);
  });

  // Ten bolt-clearance holes follow the same 5-by-2 layout as the
  // cylinder-head bolt locations in the current scene.
  [-6.8, -3.4, 0, 3.4, 6.8].forEach((x) => {
    [-3.75, 3.75].forEach((z) => {
      const hole = new THREE.Path();
      hole.absellipse(x, z, 0.28, 0.28, 0, Math.PI * 2, true, 0);
      shape.holes.push(hole);
    });
  });

  return new THREE.ExtrudeGeometry(shape, {
    depth: 0.12, bevelEnabled: false, curveSegments: 32,
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
      <mesh geometry={gasketGeometry} position={[0, 0.12, 0]}
        rotation={[Math.PI / 2, 0, 0]} material={gasketMaterial}
        castShadow receiveShadow />
      {[-5.25, -1.75, 1.75, 5.25].map((x) => (
        <mesh key={x} position={[x, 0.135, -0.5]}
          rotation={[Math.PI / 2, 0, 0]} material={fireRingMaterial} castShadow>
          <torusGeometry args={[1.49, 0.075, 8, 48]} />
        </mesh>
      ))}
    </group>
  );
}
