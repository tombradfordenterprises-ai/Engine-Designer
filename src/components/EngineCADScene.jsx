import React, { Suspense, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { Canvas, useThree } from '@react-three/fiber';
import { Bounds, Center, Environment, OrbitControls, useGLTF } from '@react-three/drei';
import manifest from '../data/enginePartManifest.json';

const MODEL_URL = '/models/inline_four_engine.glb';

function CADRaycastController({ scene, onSelect }) {
  const { camera, gl } = useThree();

  useEffect(() => {
    const element = gl.domElement;
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let downX = 0;
    let downY = 0;
    let downPointerId = null;
    let hovered = null;
    const previousCursor = element.style.cursor;

    const findPartAt = (event) => {
      const rect = element.getBoundingClientRect();
      if (!rect.width || !rect.height) return null;
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObject(scene, true);
      for (const hit of hits) {
        const id = hit.object?.userData?.enginePartId;
        if (id) return { id, object: hit.object };
      }
      return null;
    };

    const handleDown = (event) => {
      downX = event.clientX;
      downY = event.clientY;
      downPointerId = event.pointerId;
    };

    const handleMove = (event) => {
      const hit = findPartAt(event);
      const next = hit?.object || null;
      if (next !== hovered) {
        hovered = next;
        element.style.cursor = hovered ? 'pointer' : 'grab';
      }
    };

    const handleUp = (event) => {
      if (downPointerId !== event.pointerId) return;
      const moved = Math.hypot(event.clientX - downX, event.clientY - downY);
      downPointerId = null;
      // OrbitControls uses drag gestures. Only treat a near-stationary release as a click.
      if (moved > 6) return;
      const hit = findPartAt(event);
      if (hit) onSelect?.(hit.id);
    };

    element.addEventListener('pointerdown', handleDown, true);
    element.addEventListener('pointermove', handleMove, true);
    element.addEventListener('pointerup', handleUp, true);
    return () => {
      element.removeEventListener('pointerdown', handleDown, true);
      element.removeEventListener('pointermove', handleMove, true);
      element.removeEventListener('pointerup', handleUp, true);
      element.style.cursor = previousCursor;
    };
  }, [camera, gl, onSelect, scene]);

  return null;
}

function CompleteCADModel({ onSelect }) {
  const { scene } = useGLTF(MODEL_URL);

  const meshToPart = useMemo(() => {
    const map = new Map();
    Object.entries(manifest.parts).forEach(([partId, part]) => {
      (part.meshes || []).forEach((meshName) => map.set(meshName, partId));
    });
    return map;
  }, []);

  // Keep the original CAD hierarchy and every source mesh visible.
  useMemo(() => {
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

  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      <primitive object={scene} dispose={null} />
      <CADRaycastController scene={scene} onSelect={onSelect} />
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
      <SceneContents onSelect={onSelect} />
    </Canvas>
  );
}

useGLTF.preload(MODEL_URL);
