import React, { Suspense, useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { Bounds, Environment, OrbitControls, useGLTF } from '@react-three/drei';

const MODEL_URL = '/models/b16_bare_block_dark_graphite.glb';

function BareB16Block({ selected, onSelect, setHovered }) {
  const { scene } = useGLTF(MODEL_URL);
  const model = useMemo(() => {
    const copy = scene.clone(true);
    copy.traverse((node) => {
      if (!node.isMesh) return;
      node.castShadow = true;
      node.receiveShadow = true;
      if (Array.isArray(node.material)) {
        node.material = node.material.map((material) => material.clone());
      } else if (node.material) {
        node.material = node.material.clone();
      }
    });
    return copy;
  }, [scene]);

  useEffect(() => {
    model.traverse((node) => {
      if (!node.isMesh || !node.material) return;
      const materials = Array.isArray(node.material) ? node.material : [node.material];
      materials.forEach((material) => {
        if (!material.emissive) return;
        material.emissive.set(selected ? '#173d60' : '#000000');
        material.emissiveIntensity = selected ? 0.12 : 0;
      });
    });
  }, [model, selected]);

  return (
    <primitive
      object={model}
      dispose={null}
      onPointerOver={(event) => { event.stopPropagation(); setHovered(true); }}
      onPointerOut={(event) => { event.stopPropagation(); setHovered(false); }}
      onClick={(event) => { event.stopPropagation(); onSelect('engineBlock'); }}
    />
  );
}

function SceneContents({ selected, onSelect, setHovered }) {
  return (
    <>
      <ambientLight intensity={0.8} />
      <hemisphereLight args={['#ffffff', '#747b84', 1.1]} />
      <directionalLight position={[5, 8, 6]} intensity={2.1} castShadow />
      <directionalLight position={[-5, 3, -4]} intensity={0.85} />
      <Suspense fallback={null}>
        <Bounds fit clip observe margin={1.35}>
          <BareB16Block selected={selected === 'engineBlock'} onSelect={onSelect} setHovered={setHovered} />
        </Bounds>
      </Suspense>
      <OrbitControls makeDefault enableDamping dampingFactor={0.08} minDistance={0.6} maxDistance={80} />
      <Environment preset="studio" />
    </>
  );
}

export default function EngineCADScene({ selected, onSelect }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Canvas
      shadows
      camera={{ position: [2.8, 2.2, 3.4], fov: 38, near: 0.01, far: 500 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: false }}
      style={{ cursor: hovered ? 'pointer' : 'grab' }}
    >
      <color attach="background" args={['#ffffff']} />
      <SceneContents selected={selected} onSelect={onSelect} setHovered={setHovered} />
    </Canvas>
  );
}

useGLTF.preload(MODEL_URL);
