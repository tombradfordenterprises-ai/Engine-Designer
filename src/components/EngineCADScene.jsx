
import React, { Suspense, useMemo } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { Bounds, Center, Environment, OrbitControls, useGLTF } from '@react-three/drei';
import manifest from '../data/enginePartManifest.json';

const MODEL_URL = '/models/inline_four_engine.glb';

function buildMeshLookup() {
  const lookup = new Map();
  Object.entries(manifest.parts).forEach(([partId, part]) => {
    (part.meshes || []).forEach((meshName) => lookup.set(meshName, partId));
  });
  return lookup;
}

const MESH_TO_PART = buildMeshLookup();

function CADNode({ node, selected, onSelect }) {
  const partId = node.isMesh ? MESH_TO_PART.get(node.name) : null;
  const material = useMemo(() => {
    if (!node.isMesh || !partId || partId !== selected) return node.material;
    const highlight = (source) => {
      const copy = source.clone();
      if (copy.color) copy.color.lerp(new THREE.Color('#38a8ff'), 0.48);
      if ('emissive' in copy) {
        copy.emissive = new THREE.Color('#087bd2');
        copy.emissiveIntensity = 0.55;
      }
      return copy;
    };
    return Array.isArray(node.material) ? node.material.map(highlight) : highlight(node.material);
  }, [node, partId, selected]);

  const transform = {
    matrix: node.matrix,
    matrixAutoUpdate: false,
    name: node.name || undefined,
  };

  if (node.isMesh) {
    return (
      <mesh
        {...transform}
        geometry={node.geometry}
        material={material}
        castShadow
        receiveShadow
        onClick={(event) => {
          if (!partId) return;
          event.stopPropagation();
          onSelect(partId);
        }}
        onPointerOver={(event) => {
          if (!partId) return;
          event.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => { document.body.style.cursor = 'auto'; }}
      />
    );
  }

  return (
    <group {...transform}>
      {node.children?.map((child) => (
        <CADNode key={child.uuid} node={child} selected={selected} onSelect={onSelect} />
      ))}
    </group>
  );
}

function CompleteCADModel({ selected, onSelect }) {
  const { scene } = useGLTF(MODEL_URL);
  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      <CADNode node={scene} selected={selected} onSelect={onSelect} />
    </group>
  );
}

function SceneContents({ selected, onSelect }) {
  return (
    <>
      <ambientLight intensity={1.5} />
      <hemisphereLight args={['#ffffff', '#8995a2', 1.2]} />
      <directionalLight position={[4, 7, 6]} intensity={2.4} />
      <directionalLight position={[-5, 3, -4]} intensity={1.3} />
      <Suspense fallback={null}>
        <Bounds fit clip observe margin={1.35}>
          <Center>
            <CompleteCADModel selected={selected} onSelect={onSelect} />
          </Center>
        </Bounds>
      </Suspense>
      <OrbitControls makeDefault enableDamping dampingFactor={0.08} minDistance={0.6} maxDistance={8} />
      <Environment preset="studio" />
    </>
  );
}

export default function EngineCADScene({ selected, installed, onSelect, view }) {
  return (
    <Canvas
      shadows
      camera={{ position: [2.6, 2.0, 3.0], fov: 38, near: 0.01, far: 100 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: false }}
    >
      <color attach="background" args={['#f5f7fa']} />
      <SceneContents selected={selected} onSelect={onSelect} />
    </Canvas>
  );
}

useGLTF.preload(MODEL_URL);
