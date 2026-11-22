import React, { Suspense, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { Bounds, Center, Environment, OrbitControls, useGLTF } from '@react-three/drei';
import manifest from '../data/enginePartManifest.json';

const MODEL_URL = '/models/inline_four_engine.glb';

function CompleteCADModel({ onSelect }) {
  const { scene } = useGLTF(MODEL_URL);

  // Build a lookup from the exact CAD mesh names to the simulator component IDs.
  const meshToPart = useMemo(() => {
    const map = new Map();
    Object.entries(manifest.parts).forEach(([partId, part]) => {
      (part.meshes || []).forEach((meshName) => map.set(meshName, partId));
    });
    return map;
  }, []);

  // Prepare the loaded CAD scene once. Keep its hierarchy and transforms untouched.
  useEffect(() => {
    scene.traverse((node) => {
      node.visible = true;
      if (!node.isMesh) return;

      node.castShadow = true;
      node.receiveShadow = true;
      node.userData.enginePartId = meshToPart.get(node.name) || null;

      if (node.material && !node.userData.engineBuilderMaterialPrepared) {
        const brighten = (source) => {
          const material = source.clone();
          if (material.color) material.color.lerp(new THREE.Color('#aeb8c2'), 0.62);
          if ('roughness' in material) material.roughness = Math.max(material.roughness, 0.42);
          if ('metalness' in material) material.metalness = Math.min(material.metalness, 0.38);
          return material;
        };
        node.material = Array.isArray(node.material)
          ? node.material.map(brighten)
          : brighten(node.material);
        node.userData.engineBuilderMaterialPrepared = true;
      }
    });
  }, [scene, meshToPart]);

  // These are React Three Fiber events. They receive the actual intersected mesh,
  // and automatically distinguish a click from an OrbitControls drag.
  const handleClick = (event) => {
    const hitObject = event.object;
    const partId = hitObject?.userData?.enginePartId || meshToPart.get(hitObject?.name);
    if (!partId) return;
    event.stopPropagation();
    onSelect?.(partId);
  };

  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      <primitive
        object={scene}
        dispose={null}
        onClick={handleClick}
      />
    </group>
  );
}

function SceneContents({ onSelect }) {
  return (
    <>
      <ambientLight intensity={1.6} />
      <hemisphereLight args={['#ffffff', '#8995a2', 1.35]} />
      <directionalLight position={[4, 7, 6]} intensity={2.6} />
      <directionalLight position={[-5, 3, -4]} intensity={1.5} />
      <Suspense fallback={null}>
        <Bounds fit clip observe margin={1.35}>
          <Center>
            <CompleteCADModel onSelect={onSelect} />
          </Center>
        </Bounds>
      </Suspense>
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={0.6}
        maxDistance={8}
      />
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
      <SceneContents onSelect={onSelect} />
    </Canvas>
  );
}

useGLTF.preload(MODEL_URL);
