import React, { Suspense, useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, OrbitControls, useGLTF } from '@react-three/drei';
import manifest from '../data/enginePartManifest.json';

const MODEL_URL = '/models/inline_four_engine.glb';
const CAMERA_POSITIONS = {
  isometric: [-3.4, 2.7, 4.2],
  front: [-4.5, 1.0, 0.15],
  top: [0, 5.2, 0.01],
  side: [0.1, 1.5, 4.6],
  bottom: [0, -5.0, 0.01]
};

const ACTIVE_PART_IDS = [
  'engineBlock', 'crankshaft', 'pistonsRods', 'headGasket', 'cylinderHead',
  'valvetrain', 'valveCover', 'oilPan', 'timingCovers', 'crankPulley',
  'alternator', 'accessoryBelt', 'intakeManifold', 'exhaustManifold', 'oilFilter'
];

// Keep the GLTF's original hierarchy intact. Its parent nodes contain important
// transforms; extracting/cloning individual meshes can make the model disappear.
function indexModel(scene) {
  scene.updateMatrixWorld(true);
  const nameToPart = new Map();
  for (const id of ACTIVE_PART_IDS) {
    for (const meshName of manifest.parts[id]?.meshes || []) nameToPart.set(meshName, id);
  }

  const bounds = {};
  const meshesByPart = {};
  ACTIVE_PART_IDS.forEach((id) => {
    bounds[id] = new THREE.Box3();
    meshesByPart[id] = [];
  });

  scene.traverse((node) => {
    if (!node.isMesh) return;
    const id = nameToPart.get(node.name);
    node.userData.enginePartId = id || null;
    node.castShadow = true;
    node.receiveShadow = true;
    if (!id) {
      // The source also contains a manual flywheel; this simulator is configured
      // for an automatic transmission, so unassigned meshes stay hidden.
      node.visible = false;
      return;
    }
    meshesByPart[id].push(node);
    const meshBounds = new THREE.Box3().setFromObject(node);
    bounds[id].union(meshBounds);
  });

  const pickBounds = {};
  for (const id of ACTIVE_PART_IDS) {
    if (bounds[id].isEmpty()) continue;
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    bounds[id].getCenter(center);
    bounds[id].getSize(size);
    pickBounds[id] = {
      center: center.toArray(),
      size: size.toArray().map((value) => Math.max(value * 1.25, 0.045))
    };
  }
  return { meshesByPart, pickBounds };
}

function CameraPreset({ view }) {
  const { camera } = useThree();
  useEffect(() => {
    const position = CAMERA_POSITIONS[view] || CAMERA_POSITIONS.isometric;
    camera.position.set(...position);
    camera.lookAt(0, 0, 0);
  }, [camera, view]);
  return null;
}

function CADModel({ selected, installed, onSelect, view }) {
  const { scene } = useGLTF(MODEL_URL);
  const { meshesByPart, pickBounds } = useMemo(() => indexModel(scene), [scene]);
  const [hovered, setHovered] = useState(null);
  const installedSet = useMemo(() => new Set(installed), [installed]);

  useEffect(() => {
    for (const id of ACTIVE_PART_IDS) {
      const shouldShow = id === 'engineBlock' || installedSet.has(id);
      for (const mesh of meshesByPart[id] || []) mesh.visible = shouldShow;
    }
  }, [installedSet, meshesByPart]);

  const handleMeshClick = (event) => {
    const id = event.object?.userData?.enginePartId;
    if (id) {
      event.stopPropagation();
      onSelect(id);
    }
  };

  const handleMeshHover = (event) => {
    const id = event.object?.userData?.enginePartId;
    if (id) {
      event.stopPropagation();
      setHovered(id);
    }
  };

  return (
    <>
      {/* Original GLTF hierarchy and all parent transforms are preserved. */}
      <group rotation={[-Math.PI / 2, 0, 0]} scale={3} position={[0, -1, 0]}>
        <primitive
          object={scene}
          dispose={null}
          onClick={handleMeshClick}
          onPointerOver={handleMeshHover}
          onPointerOut={() => setHovered(null)}
        />

        {/* Invisible, accurately bounded targets let users select parts before installation. */}
        {ACTIVE_PART_IDS.filter((id) => id !== 'engineBlock' && !installedSet.has(id) && pickBounds[id]).map((id) => {
          const box = pickBounds[id];
          const active = selected === id || hovered === id;
          return (
            <mesh
              key={id}
              position={box.center}
              onClick={(event) => { event.stopPropagation(); onSelect(id); }}
              onPointerOver={(event) => { event.stopPropagation(); setHovered(id); }}
              onPointerOut={() => setHovered(null)}
            >
              <boxGeometry args={box.size} />
              <meshBasicMaterial
                color="#299de0"
                wireframe={active}
                transparent
                opacity={active ? 0.45 : 0.001}
                depthWrite={false}
              />
            </mesh>
          );
        })}

        {selected && pickBounds[selected] && (
          <mesh position={pickBounds[selected].center}>
            <boxGeometry args={pickBounds[selected].size.map((v) => v * 1.04)} />
            <meshBasicMaterial color="#299de0" wireframe transparent opacity={0.55} />
          </mesh>
        )}
      </group>

      <ContactShadows position={[0, -1.03, 0]} opacity={0.22} scale={4.5} blur={2.5} far={3} />
      <OrbitControls makeDefault enableDamping dampingFactor={0.08} minDistance={2.2} maxDistance={8.5} target={[0, 0, 0]} />
      <Environment preset="studio" />
      <CameraPreset view={view} />
    </>
  );
}

export default function EngineCADScene({ selected, installed, onSelect, view }) {
  return (
    <Canvas
      shadows
      camera={{ position: CAMERA_POSITIONS.isometric, fov: 39, near: 0.01, far: 100 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: false }}
    >
      <color attach="background" args={['#ffffff']} />
      <ambientLight intensity={1.15} />
      <directionalLight position={[-3, 6, 5]} intensity={2.2} castShadow shadow-mapSize={[2048, 2048]} />
      <directionalLight position={[4, 3, -4]} intensity={1.0} />
      <spotLight position={[0, 5, 2]} intensity={0.65} angle={0.7} penumbra={0.8} />
      <Suspense fallback={null}>
        <CADModel selected={selected} installed={installed} onSelect={onSelect} view={view} />
      </Suspense>
    </Canvas>
  );
}

useGLTF.preload(MODEL_URL);
