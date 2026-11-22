import React, { Suspense, useMemo, useState } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { Bounds, Environment, OrbitControls, useGLTF } from '@react-three/drei';
import manifest from '../data/enginePartManifest.json';

const MODEL_URL = '/models/inline_four_engine.glb';

// These are broad interaction zones in the source model's coordinates.
// They are deliberately rendered as invisible boxes; only the active zone
// gets a subtle wireframe so it cannot cover the actual CAD geometry.
const PART_TARGETS = [
  { id: 'engineBlock', position: [0, 0, 0.292], size: [0.49, 0.27, 0.40] },
  { id: 'crankshaft', position: [-0.006, 0, 0.225], size: [0.61, 0.15, 0.15] },
  { id: 'pistonsRods', position: [0, 0, 0.3112], size: [0.40, 0.15, 0.32] },
  { id: 'oilPan', position: [0, 0, 0.0525], size: [0.49, 0.28, 0.13] },
  { id: 'headGasket', position: [0, 0, 0.486], size: [0.45, 0.22, 0.025] },
  { id: 'cylinderHead', position: [0, 0, 0.5347], size: [0.46, 0.25, 0.11] },
  { id: 'valvetrain', position: [0, 0, 0.5465], size: [0.44, 0.20, 0.12] },
  { id: 'valveCover', position: [0, 0, 0.6245], size: [0.46, 0.25, 0.10] },
  { id: 'timingCovers', position: [-0.25, 0, 0.36], size: [0.08, 0.25, 0.54] },
  { id: 'crankPulley', position: [-0.2855, 0, 0.225], size: [0.07, 0.18, 0.18] },
  { id: 'alternator', position: [-0.204, -0.1555, 0.3401], size: [0.18, 0.17, 0.14] },
  { id: 'accessoryBelt', position: [-0.274, -0.065, 0.2625], size: [0.04, 0.31, 0.25] },
  { id: 'intakeManifold', position: [0.026, -0.1905, 0.5535], size: [0.46, 0.18, 0.14] },
  { id: 'exhaustManifold', position: [0.026, 0.187, 0.4785], size: [0.46, 0.17, 0.16] },
  { id: 'oilFilter', position: [0.155, 0.166, 0.32], size: [0.12, 0.18, 0.12] },
];

function ClickTarget({ target, selected, hovered, onSelect, onHover }) {
  const active = selected === target.id;
  const over = hovered === target.id;
  return (
    <mesh
      position={target.position}
      onPointerOver={(event) => { event.stopPropagation(); onHover(target.id); }}
      onPointerOut={(event) => { event.stopPropagation(); onHover(null); }}
      onClick={(event) => { event.stopPropagation(); onSelect?.(target.id); }}
    >
      <boxGeometry args={target.size} />
      <meshBasicMaterial
        color="#168bff"
        transparent
        opacity={active ? 0.13 : over ? 0.07 : 0}
        wireframe
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function CADModel({ installed = [], selected, hovered, onSelect, onHover }) {
  const { scene } = useGLTF(MODEL_URL);
  const model = useMemo(() => {
    // Clone the loaded scene so visibility changes never mutate Drei's cached GLB.
    const copy = scene.clone(true);
    const meshToPart = new Map();
    Object.entries(manifest.parts || {}).forEach(([partId, part]) => {
      (part.meshes || []).forEach((meshName) => meshToPart.set(meshName, partId));
    });

    copy.traverse((node) => {
      node.visible = true;
      if (!node.isMesh) return;
      const partId = meshToPart.get(node.name);
      node.userData.enginePartId = partId || null;
      // Bare-block starting state. Unclassified meshes are retained rather
      // than hidden, so a manifest mismatch cannot make the model disappear.
      node.visible = partId ? (partId === 'engineBlock') : true;
      node.castShadow = true;
      node.receiveShadow = true;
      if (node.material) {
        node.material = Array.isArray(node.material)
          ? node.material.map((material) => material.clone())
          : node.material.clone();
      }
    });
    return copy;
  }, [scene]);

  // Show the relevant component group when the app records it as installed.
  React.useEffect(() => {
    const installedSet = new Set(installed);
    model.traverse((node) => {
      if (!node.isMesh) return;
      const partId = node.userData.enginePartId;
      node.visible = partId ? (partId === 'engineBlock' || installedSet.has(partId)) : true;
    });
  }, [model, installed]);

  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      <primitive object={model} dispose={null} />
      {PART_TARGETS.map((target) => (
        <ClickTarget key={target.id} target={target} selected={selected} hovered={hovered} onSelect={onSelect} onHover={onHover} />
      ))}
    </group>
  );
}

function SceneContents(props) {
  return <>
    <ambientLight intensity={1.25} />
    <hemisphereLight args={['#ffffff', '#8995a2', 1.0]} />
    <directionalLight position={[4, 7, 6]} intensity={2.2} />
    <directionalLight position={[-5, 3, -4]} intensity={1.0} />
    <Suspense fallback={null}>
      <Bounds fit clip observe margin={1.25}>
        <CADModel {...props} />
      </Bounds>
    </Suspense>
    <OrbitControls makeDefault enableDamping dampingFactor={0.08} minDistance={0.6} maxDistance={8} />
    <Environment preset="studio" />
  </>;
}

export default function EngineCADScene({ selected, installed = [], onSelect, view }) {
  const [hovered, setHovered] = useState(null);
  return (
    <Canvas
      shadows
      camera={{ position: [2.6, 2.0, 3.0], fov: 38, near: 0.01, far: 100 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: false }}
      style={{ cursor: hovered ? 'pointer' : 'grab' }}
    >
      <color attach="background" args={['#f5f7fa']} />
      <SceneContents selected={selected} installed={installed} onSelect={onSelect} hovered={hovered} onHover={setHovered} />
    </Canvas>
  );
}

useGLTF.preload(MODEL_URL);
