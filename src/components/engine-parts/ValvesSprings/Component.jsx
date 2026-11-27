import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

// Educational procedural representation: four cylinders, four valves each.
// Two intake/exhaust pairs per cylinder; exact variant-specific dimensions
// and bore centers are not claimed as factory specifications.
const CYLINDER_X = [-45.5, -41.5, -37.5, -33.5];
const ROW_Z = [127.5, 132.0];
const VALVE_PAIR_OFFSETS = [-0.62, 0.62];
const INSTALLED_Y = 16.5;
const PREVIEW_OFFSET = new THREE.Vector3(0, 9, 12);

const valveMetal = new THREE.MeshStandardMaterial({
  color: '#b9c2c9', metalness: 0.88, roughness: 0.26
});
const springMetal = new THREE.MeshStandardMaterial({
  color: '#87939d', metalness: 0.92, roughness: 0.22
});
const retainerMetal = new THREE.MeshStandardMaterial({
  color: '#cbd1d6', metalness: 0.9, roughness: 0.2
});

function makeSpringGeometry() {
  const points = [];
  const turns = 7;
  const segments = 112;
  const radius = 0.24;
  const height = 1.12;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const angle = t * turns * Math.PI * 2;
    points.push(new THREE.Vector3(
      Math.cos(angle) * radius,
      t * height,
      Math.sin(angle) * radius
    ));
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), segments, 0.045, 8, false);
}

function ValveAssembly({ position, index, installed, springGeometry }) {
  const group = useRef(null);
  const progress = useRef(0);
  useFrame((_, delta) => {
    if (!group.current) return;
    progress.current = THREE.MathUtils.damp(progress.current, installed ? 1 : 0, 2.0, delta);
    const stagger = THREE.MathUtils.clamp((progress.current - index * 0.018) / (1 - index * 0.018), 0, 1);
    const eased = stagger * stagger * (3 - 2 * stagger);
    group.current.position.set(
      position[0] + PREVIEW_OFFSET.x * (1 - eased),
      INSTALLED_Y + PREVIEW_OFFSET.y * (1 - eased),
      position[2] + PREVIEW_OFFSET.z * (1 - eased)
    );
    group.current.rotation.y = Math.PI * 1.5 * eased;
  });

  return (
    <group ref={group} position={[position[0] + PREVIEW_OFFSET.x, INSTALLED_Y + PREVIEW_OFFSET.y, position[2] + PREVIEW_OFFSET.z]}>
      {/* Valve stem and poppet head extend down into the cylinder head. */}
      <mesh position={[0, -1.12, 0]} material={valveMetal} castShadow>
        <cylinderGeometry args={[0.095, 0.095, 2.15, 16]} />
      </mesh>
      <mesh position={[0, -2.25, 0]} rotation={[0, 0, 0]} material={valveMetal} castShadow>
        <cylinderGeometry args={[0.34, 0.34, 0.12, 32]} />
      </mesh>
      {/* Coil spring surrounding the upper valve stem. */}
      <mesh geometry={springGeometry} material={springMetal} position={[0, -0.12, 0]} castShadow />
      <mesh position={[0, 1.04, 0]} material={retainerMetal} castShadow>
        <cylinderGeometry args={[0.34, 0.27, 0.14, 32]} />
      </mesh>
      {/* Small keeper pair visible above the retainer. */}
      <mesh position={[-0.075, 1.17, 0]} material={valveMetal}>
        <sphereGeometry args={[0.075, 12, 8]} />
      </mesh>
      <mesh position={[0.075, 1.17, 0]} material={valveMetal}>
        <sphereGeometry args={[0.075, 12, 8]} />
      </mesh>
    </group>
  );
}

export default function ValvesSprings({ installed = false }) {
  const springGeometry = useMemo(makeSpringGeometry, []);
  const assemblies = useMemo(() => {
    const result = [];
    let index = 0;
    CYLINDER_X.forEach((centerX) => {
      ROW_Z.forEach((z) => {
        VALVE_PAIR_OFFSETS.forEach((offset) => {
          result.push({ position: [centerX + offset, INSTALLED_Y, z], index: index++ });
        });
      });
    });
    return result;
  }, []);

  return (
    <group name="b16-valves-and-springs">
      {assemblies.map(({ position, index }) => (
        <ValveAssembly
          key={index}
          position={position}
          index={index}
          installed={installed}
          springGeometry={springGeometry}
        />
      ))}
    </group>
  );
}
