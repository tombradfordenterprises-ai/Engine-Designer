
import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

// Visual prototype footprint measured from the imported cylinder-head deck
// mesh: approximately 17.02 x 7.42 scene units. The gasket is kept slightly
// inside that outline; it is not an OEM gasket drawing or service dimension.
const INSTALLED = new THREE.Vector3(-40.0, 12.0, 130.0);
const PREVIEW = INSTALLED.clone().add(new THREE.Vector3(0, 8, 10));

const gasketMaterial = new THREE.MeshStandardMaterial({
  color: '#9da7ad', metalness: 0.82, roughness: 0.3, side: THREE.DoubleSide,
});
const fireRingMaterial = new THREE.MeshStandardMaterial({
  color: '#c2c8cc', metalness: 0.9, roughness: 0.22,
});

function createGasketGeometry() {
  const shape = new THREE.Shape();
  // Rounded outer perimeter: 16.7 x 7.1, just inside the imported deck edge.
  shape.moveTo(-7.9, -3.55);
  shape.lineTo(7.9, -3.55);
  shape.quadraticCurveTo(8.35, -3.55, 8.35, -3.10);
  shape.lineTo(8.35, 3.10);
  shape.quadraticCurveTo(8.35, 3.55, 7.9, 3.55);
  shape.lineTo(-7.9, 3.55);
  shape.quadraticCurveTo(-8.35, 3.55, -8.35, 3.10);
  shape.lineTo(-8.35, -3.10);
  shape.quadraticCurveTo(-8.35, -3.55, -7.9, -3.55);
  shape.closePath();

  // Four cylinder openings retain the established piston spacing.
  [-5.25, -1.75, 1.75, 5.25].forEach((x) => {
    const hole = new THREE.Path();
    hole.absellipse(x, -0.5, 1.48, 1.48, 0, Math.PI * 2, true, 0);
    shape.holes.push(hole);
  });

  // Small illustrative oil/coolant passages moved inside the narrower edge.
  [[-7.55, -2.75], [-7.55, 2.75], [7.55, -2.75], [7.55, 2.75], [0, -3.05], [0, 3.05]].forEach(([x, y]) => {
    const hole = new THREE.Path();
    hole.absellipse(x, y, 0.24, 0.24, 0, Math.PI * 2, true, 0);
    shape.holes.push(hole);
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
