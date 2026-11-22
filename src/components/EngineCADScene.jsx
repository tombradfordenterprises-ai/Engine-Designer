import React, { Suspense, useMemo, useState } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { Bounds, Center, Environment, OrbitControls, useGLTF } from '@react-three/drei';

const MODEL_URL = '/models/inline_four_engine.glb';

// Click targets are based on the measured bounds of the named CAD meshes.
// Coordinates are in the original GLB coordinate system (before the Z-up rotation).
const PART_TARGETS = [
  { id: 'oilPan', label: 'Oil pan / sump', position: [0, 0, 0.0525], size: [0.49, 0.28, 0.13] },
  { id: 'crankshaft', label: 'Crankshaft', position: [-0.006, 0, 0.225], size: [0.61, 0.15, 0.15] },
  { id: 'pistonsRods', label: 'Pistons and connecting rods', position: [0, 0, 0.3112], size: [0.40, 0.15, 0.32] },
  { id: 'headGasket', label: 'Cylinder head gasket', position: [0, 0, 0.486], size: [0.45, 0.22, 0.012] },
  { id: 'cylinderHead', label: 'Cylinder head', position: [0, 0, 0.5347], size: [0.46, 0.25, 0.11] },
  { id: 'valvetrain', label: 'Valvetrain and camshafts', position: [0, 0, 0.5465], size: [0.44, 0.20, 0.12] },
  { id: 'valveCover', label: 'Valve cover', position: [0, 0, 0.6245], size: [0.46, 0.25, 0.10] },
  { id: 'timingCovers', label: 'Timing and end covers', position: [-0.25, 0, 0.36], size: [0.06, 0.25, 0.54] },
  { id: 'crankPulley', label: 'Crankshaft accessory pulley', position: [-0.2855, 0, 0.225], size: [0.07, 0.18, 0.18] },
  { id: 'alternator', label: 'Alternator assembly', position: [-0.204, -0.1555, 0.3401], size: [0.18, 0.17, 0.14] },
  { id: 'accessoryBelt', label: 'Accessory drive belt', position: [-0.274, -0.065, 0.2625], size: [0.04, 0.31, 0.25] },
  { id: 'intakeManifold', label: 'Intake manifold', position: [0.026, -0.1905, 0.5535], size: [0.46, 0.18, 0.14] },
  { id: 'exhaustManifold', label: 'Exhaust manifold', position: [0.026, 0.187, 0.4785], size: [0.46, 0.17, 0.16] },
  { id: 'oilFilter', label: 'Oil filter assembly', position: [0.155, 0.166, 0.32], size: [0.10, 0.17, 0.10] },
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
        opacity={active ? 0.28 : 0.001}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function CompleteCADModel({ selected, onSelect, onHover }) {
  const { scene } = useGLTF(MODEL_URL);
  useMemo(() => {
    scene.traverse((node) => {
      node.visible = true;
      if (!node.isMesh) return;
      node.castShadow = true;
      node.receiveShadow = true;
      if (!node.userData.engineBuilderMaterialPrepared && node.material) {
        const prepare = (source) => {
          const material = source.clone();
          if (material.color) material.color.lerp(new THREE.Color('#aeb8c2'), 0.62);
          if ('roughness' in material) material.roughness = Math.max(material.roughness, 0.42);
          if ('metalness' in material) material.metalness = Math.min(material.metalness, 0.38);
          return material;
        };
        node.material = Array.isArray(node.material) ? node.material.map(prepare) : prepare(node.material);
        node.userData.engineBuilderMaterialPrepared = true;
      }
    });
  }, [scene]);

  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      <primitive object={scene} dispose={null} />
      {PART_TARGETS.map((target) => (
        <ClickTarget key={target.id} target={target} selected={selected} onSelect={onSelect} onHover={onHover} />
      ))}
    </group>
  );
}

function SceneContents({ selected, onSelect, onHover }) {
  return (
    <>
      <ambientLight intensity={1.6} />
      <hemisphereLight args={['#ffffff', '#8995a2', 1.35]} />
      <directionalLight position={[4, 7, 6]} intensity={2.6} />
      <directionalLight position={[-5, 3, -4]} intensity={1.5} />
      <Suspense fallback={null}>
        <Bounds fit clip observe margin={1.35}>
          <Center>
            <CompleteCADModel selected={selected} onSelect={onSelect} onHover={onHover} />
          </Center>
        </Bounds>
      </Suspense>
      <OrbitControls makeDefault enableDamping dampingFactor={0.08} minDistance={0.6} maxDistance={8} />
      <Environment preset="studio" />
    </>
  );
}

export default function EngineCADScene({ selected, installed, onSelect, view }) {
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
      <SceneContents selected={selected} onSelect={onSelect} onHover={setHovered} />
    </Canvas>
  );
}

useGLTF.preload(MODEL_URL);
