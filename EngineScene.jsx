// [030] Imports the React Three Fiber canvas, camera controls, and Three.js materials.
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { useMemo } from 'react';
import * as THREE from 'three';

// [031] Creates a reusable clickable engine component with hover highlighting and installed-state styling.
function EnginePart({ id, selected, installed, onSelect, position, args, color, radius = 0.08 }) {
  const active = selected === id;
  const done = installed.includes(id);
  const material = useMemo(() => new THREE.MeshStandardMaterial({
    color: active ? '#55a9e8' : done ? '#8b969e' : color,
    metalness: 0.62, roughness: 0.34,
    emissive: active ? '#17649c' : '#000000',
    emissiveIntensity: active ? 0.35 : 0
  }), [active, done, color]);

  return (
    <mesh
      position={position}
      material={material}
      onClick={(event) => { event.stopPropagation(); onSelect(id); }}
      onPointerOver={(event) => { event.stopPropagation(); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'default'; }}
      castShadow receiveShadow
    >
      {args ? <boxGeometry args={args} /> : <cylinderGeometry args={[radius, radius, 0.22, 32]} />}
    </mesh>
  );
}

// [032] Builds a simplified inline-four engine block and separate selectable components as a starter 3D model.
function EngineModel({ selected, installed, onSelect }) {
  return (
    <group rotation={[0.12, -0.45, 0]}>
      {/* [033] Main block geometry provides the base shape and four visible cylinder positions. */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.35, 0.78, 1.05]} />
        <meshStandardMaterial color="#aeb6bd" metalness={0.72} roughness={0.38} />
      </mesh>
      {[-1.18, -0.39, 0.39, 1.18].map((x, index) => (
        <group key={index} position={[x, 0.43, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.29, 0.29, 0.16, 40]} />
            <meshStandardMaterial color="#555e66" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.09, 0]}>
            <cylinderGeometry args={[0.23, 0.23, 0.025, 40]} />
            <meshStandardMaterial color="#20272d" metalness={0.55} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* [034] Selectable crankshaft, piston set, cylinder head, and oil pan are represented as separate scene objects. */}
      <EnginePart id="crankshaft" selected={selected} installed={installed} onSelect={onSelect} position={[0, -0.55, 0.62]} args={[2.7, 0.16, 0.15]} color="#8d969d" />
      <EnginePart id="pistons" selected={selected} installed={installed} onSelect={onSelect} position={[0, 0.64, 0]} args={[2.8, 0.12, 0.68]} color="#c2c9ce" />
      <EnginePart id="head" selected={selected} installed={installed} onSelect={onSelect} position={[0, 0.83, 0]} args={[3.48, 0.42, 1.13]} color="#89949d" />
      <EnginePart id="oilpan" selected={selected} installed={installed} onSelect={onSelect} position={[0, -0.62, 0]} args={[3.05, 0.34, 0.95]} color="#555f68" />
      {/* [035] Decorative side ribs make the block read more clearly as a mechanical casting. */}
      {Array.from({ length: 7 }, (_, i) => (
        <mesh key={i} position={[-1.35 + i * 0.45, -0.05, 0.54]}>
          <boxGeometry args={[0.055, 0.52, 0.055]} />
          <meshStandardMaterial color="#7d878f" metalness={0.65} roughness={0.42} />
        </mesh>
      ))}
    </group>
  );
}

// [036] Controls camera starting positions for the view cycle while retaining mouse orbit and zoom.
export default function EngineScene({ selected, installed, onSelect, view }) {
  const cameraPositions = {
    isometric: [4.7, 3.5, 5.6], front: [0, 1.1, 7],
    top: [0, 8, 0.01], side: [7, 1.2, 0], bottom: [0, -7, 0.01]
  };
  return (
    <Canvas shadows camera={{ position: cameraPositions[view], fov: 38 }} dpr={[1, 2]}>
      <color attach="background" args={['#ffffff']} />
      <ambientLight intensity={1.15} />
      <directionalLight position={[4, 7, 5]} intensity={2.1} castShadow shadow-mapSize={[2048, 2048]} />
      <directionalLight position={[-5, 2, -4]} intensity={0.65} />
      <EngineModel selected={selected} installed={installed} onSelect={onSelect} />
      <ContactShadows position={[0, -1.05, 0]} opacity={0.18} scale={8} blur={2.5} far={3} />
      <Environment preset="studio" />
      <OrbitControls makeDefault enableDamping dampingFactor={0.08} minDistance={3.2} maxDistance={11} target={[0, 0, 0]} />
    </Canvas>
  );
}