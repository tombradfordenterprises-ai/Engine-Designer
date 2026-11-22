import React, { Suspense, useMemo, useState } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { Bounds, Center, Environment, OrbitControls, useGLTF } from '@react-three/drei';
import manifest from '../data/enginePartManifest.json';

const MODEL_URL = '/models/inline_four_engine.glb';

// Invisible interaction volumes are kept separate from the CAD meshes so
// selection remains reliable while the model is assembled one component at a time.
const PART_TARGETS = [
  { id: 'engineBlock', label: 'Engine block', position: [0, 0, 0.292], size: [0.49, 0.27, 0.40] },
  { id: 'crankshaft', label: 'Crankshaft', position: [-0.006, 0, 0.225], size: [0.61, 0.15, 0.15] },
  { id: 'pistonsRods', label: 'Pistons and connecting rods', position: [0, 0, 0.3112], size: [0.40, 0.15, 0.32] },
  { id: 'oilPan', label: 'Oil pan / sump', position: [0, 0, 0.0525], size: [0.49, 0.28, 0.13] },
  { id: 'headGasket', label: 'Cylinder head gasket', position: [0, 0, 0.486], size: [0.45, 0.22, 0.025] },
  { id: 'cylinderHead', label: 'Cylinder head', position: [0, 0, 0.5347], size: [0.46, 0.25, 0.11] },
  { id: 'valvetrain', label: 'Valvetrain and camshafts', position: [0, 0, 0.5465], size: [0.44, 0.20, 0.12] },
  { id: 'valveCover', label: 'Valve cover', position: [0, 0, 0.6245], size: [0.46, 0.25, 0.10] },
  { id: 'timingCovers', label: 'Timing and end covers', position: [-0.25, 0, 0.36], size: [0.08, 0.25, 0.54] },
  { id: 'crankPulley', label: 'Crankshaft accessory pulley', position: [-0.2855, 0, 0.225], size: [0.07, 0.18, 0.18] },
  { id: 'alternator', label: 'Alternator assembly', position: [-0.204, -0.1555, 0.3401], size: [0.18, 0.17, 0.14] },
  { id: 'accessoryBelt', label: 'Accessory drive belt', position: [-0.274, -0.065, 0.2625], size: [0.04, 0.31, 0.25] },
  { id: 'intakeManifold', label: 'Intake manifold', position: [0.026, -0.1905, 0.5535], size: [0.46, 0.18, 0.14] },
  { id: 'exhaustManifold', label: 'Exhaust manifold', position: [0.026, 0.187, 0.4785], size: [0.46, 0.17, 0.16] },
  { id: 'oilFilter', label: 'Oil filter assembly', position: [0.155, 0.166, 0.32], size: [0.12, 0.18, 0.12] },
];

function ClickTarget({ target, selected, onSelect, onHover }) {
  const active = selected === target.id;
  return (
    <mesh
      position={target.position}
      onPointerOver={(event) => { event.stopPropagation(); onHover(target.id); }}
      onPointerOut={(event) => { event.stopPropagation(); onHover(null); }}
      onClick={(event) => { event.stopPropagation(); onSelect(target.id); }}
    >
      <boxGeometry args={target.size} />
      <meshBasicMaterial
        color={active ? '#087cff' : '#20a8ff'}
        transparent
        opacity={active ? 0.30 : 0.001}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function ComponentModel({ installed = [] }) {
  const { scene } = useGLTF(MODEL_URL);
  const model = useMemo(() => {
    // Clone the cached GLTF scene. Never mutate useGLTF's shared scene directly.
    const copy = scene.clone(true);
    const meshToPart = new Map();
    Object.entries(manifest.parts).forEach(([partId, part]) => {
      (part.meshes || []).forEach((meshName) => meshToPart.set(meshName, partId));
    });

    let matched = 0;
    copy.traverse((node) => {
      if (!node.isMesh) return;
      const partId = meshToPart.get(node.name);
      node.userData.enginePartId = partId || null;
      // The block is the only visible component at the beginning.
      node.visible = Boolean(partId && (partId === 'engineBlock' || installed.includes(partId)));
      if (node.visible) matched += 1;
      node.castShadow = true;
      node.receiveShadow = true;
      if (node.material) {
        const tune = (source) => {
          const material = source.clone();
          if (material.color) material.color.lerp(new THREE.Color('#aeb8c2'), 0.58);
          if ('roughness' in material) material.roughness = Math.max(material.roughness, 0.42);
          if ('metalness' in material) material.metalness = Math.min(material.metalness, 0.38);
          return material;
        };
        node.material = Array.isArray(node.material) ? node.material.map(tune) : tune(node.material);
      }
    });
    copy.userData.visibleMeshCount = matched;
    return copy;
  }, [scene, installed.join('|')]);

  return <primitive object={model} dispose={null} />;
}

function SceneContents({ selected, installed, onSelect, onHover }) {
  return (
    <>
      <ambientLight intensity={1.6} />
      <hemisphereLight args={['#ffffff', '#8995a2', 1.35]} />
      <directionalLight position={[4, 7, 6]} intensity={2.6} />
      <directionalLight position={[-5, 3, -4]} intensity={1.5} />
      <Suspense fallback={null}>
        <Bounds fit clip observe margin={1.35}>
          <Center>
            <group rotation={[-Math.PI / 2, 0, 0]}>
              <ComponentModel installed={installed} />
              {PART_TARGETS.map((target) => (
                <ClickTarget key={target.id} target={target} selected={selected} onSelect={onSelect} onHover={onHover} />
              ))}
            </group>
          </Center>
        </Bounds>
      </Suspense>
      <OrbitControls makeDefault enableDamping dampingFactor={0.08} minDistance={0.6} maxDistance={8} />
      <Environment preset="studio" />
    </>
  );
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
      <SceneContents selected={selected} installed={installed} onSelect={onSelect} onHover={setHovered} />
    </Canvas>
  );
}

useGLTF.preload(MODEL_URL);
