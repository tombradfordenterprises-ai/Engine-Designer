import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';

// The camshaft GLBs use source-model coordinates. Each shaft needs its own
// rotation pivot centered on its actual shaft axis, not the block/world origin.
const CAMSHAFT_1_URL = '/models/source-b16/camshaft-1.glb';
const CAMSHAFT_2_URL = '/models/source-b16/camshaft-2.glb';
const CAMSHAFT_LOBES_URL = '/models/source-b16/camshaft-lobes.glb';
const SECOND_CAMSHAFT_OFFSET = [0, 0, -4];

const PREVIEW = new THREE.Vector3(0, 9, 12);
const INSTALLED = new THREE.Vector3(0, 0, 0);
const CAMSHAFT_SPEED = 2.0;

function CamshaftMesh({ url }) {
  const { scene } = useGLTF(url);
  const model = useMemo(() => {
    const copy = scene.clone(true);
    copy.traverse((node) => {
      if (!node.isMesh) return;
      node.castShadow = true;
      node.receiveShadow = true;
      if (Array.isArray(node.material)) {
        node.material = node.material.map((material) => {
          const cloned = material.clone();
          if (cloned.color) cloned.color.set('#8b949e');
          if ('metalness' in cloned) cloned.metalness = Math.max(cloned.metalness ?? 0, 0.82);
          if ('roughness' in cloned) cloned.roughness = Math.max(cloned.roughness ?? 0.24, 0.28);
          return cloned;
        });
      } else if (node.material) {
        node.material = node.material.clone();
        if (node.material.color) node.material.color.set('#8b949e');
        if ('metalness' in node.material) node.material.metalness = Math.max(node.material.metalness ?? 0, 0.82);
        if ('roughness' in node.material) node.material.roughness = Math.max(node.material.roughness ?? 0.24, 0.28);
      }
    });
    return copy;
  }, [scene]);

  return <primitive object={model} dispose={null} />;
}

function CompleteCamshaft() {
  return (
    <group name="complete-b16-camshaft">
      <CamshaftMesh url={CAMSHAFT_1_URL} />
      <CamshaftMesh url={CAMSHAFT_2_URL} />
      <CamshaftMesh url={CAMSHAFT_LOBES_URL} />
    </group>
  );
}

export default function Camshafts({ installed = false, rotating = false }) {
  const assembly = useRef(null);
  const firstPivot = useRef(null);
  const firstContent = useRef(null);
  const secondPivot = useRef(null);
  const secondContent = useRef(null);
  const progress = useRef(0);
  const pivotsReady = useRef(false);

  useFrame((state, delta) => {
    if (!assembly.current) return;

    // Determine the Y/Z centerline from the loaded source geometry once.
    // Rotation is around local X, so X position does not affect the pivot.
    if (!pivotsReady.current && firstContent.current && secondContent.current) {
      [ [firstPivot.current, firstContent.current],
        [secondPivot.current, secondContent.current] ].forEach(([pivot, content]) => {
        const bounds = new THREE.Box3().setFromObject(content);
        const center = new THREE.Vector3();
        bounds.getCenter(center);
        pivot.position.set(0, center.y, center.z);
        content.position.set(0, -center.y, -center.z);
      });
      pivotsReady.current = true;
    }

    const angle = rotating && installed ? -state.clock.elapsedTime * CAMSHAFT_SPEED : 0;
    if (firstPivot.current) firstPivot.current.rotation.x = angle;
    if (secondPivot.current) secondPivot.current.rotation.x = angle;

    progress.current = THREE.MathUtils.damp(progress.current, installed ? 1 : 0, 2.0, delta);
    const t = progress.current;
    const eased = t * t * (3 - 2 * t);
    assembly.current.position.lerpVectors(PREVIEW, INSTALLED, eased);
  });

  return (
    <group ref={assembly} position={PREVIEW.toArray()} name="b16-dual-camshaft-assembly">
      <group ref={firstPivot} name="intake-camshaft-rotation-pivot">
        <group ref={firstContent}>
          <CompleteCamshaft />
        </group>
      </group>
      <group position={SECOND_CAMSHAFT_OFFSET} name="second-camshaft-offset">
        <group ref={secondPivot} name="exhaust-camshaft-rotation-pivot">
          <group ref={secondContent}>
            <CompleteCamshaft />
          </group>
        </group>
      </group>
    </group>
  );
}

useGLTF.preload(CAMSHAFT_1_URL);
useGLTF.preload(CAMSHAFT_2_URL);
useGLTF.preload(CAMSHAFT_LOBES_URL);
