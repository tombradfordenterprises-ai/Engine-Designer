import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';

// These two meshes are the supplied B16 camshaft OBJ conversions.
// Their source coordinates are retained so they stay aligned with the supplied head.
const INTAKE_URL = '/models/source-b16/camshaft-1.glb';
const EXHAUST_URL = '/models/source-b16/camshaft-2.glb';
const PREVIEW = new THREE.Vector3(0, 9, 12);
const INSTALLED = new THREE.Vector3(0, 0, 0);

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
          if ('metalness' in cloned) cloned.metalness = Math.max(cloned.metalness ?? 0, 0.82);
          if ('roughness' in cloned) cloned.roughness = Math.max(cloned.roughness ?? 0.24, 0.28);
          return cloned;
        });
      } else if (node.material) {
        node.material = node.material.clone();
        if ('metalness' in node.material) node.material.metalness = Math.max(node.material.metalness ?? 0, 0.82);
        if ('roughness' in node.material) node.material.roughness = Math.max(node.material.roughness ?? 0.24, 0.28);
      }
    });
    return copy;
  }, [scene]);

  return <primitive object={model} dispose={null} />;
}

export default function Camshafts({ installed = false }) {
  const group = useRef(null);
  const progress = useRef(0);

  useFrame((_, delta) => {
    if (!group.current) return;
    progress.current = THREE.MathUtils.damp(progress.current, installed ? 1 : 0, 2.0, delta);
    const t = progress.current;
    const eased = t * t * (3 - 2 * t);
    group.current.position.lerpVectors(PREVIEW, INSTALLED, eased);
  });

  return (
    <group ref={group} position={PREVIEW.toArray()} name="b16-intake-exhaust-camshafts">
      <CamshaftMesh url={INTAKE_URL} />
      <CamshaftMesh url={EXHAUST_URL} />
    </group>
  );
}

useGLTF.preload(INTAKE_URL);
useGLTF.preload(EXHAUST_URL);
