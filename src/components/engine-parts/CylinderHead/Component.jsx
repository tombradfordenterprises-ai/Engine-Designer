
import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';

// This OBJ was supplied together with the matching bare-block OBJ.
// Its original coordinates already align to the block deck and end faces.
// Source-to-scene axis mapping was applied during OBJ-to-GLB conversion;
// no additional scale or installed offset is needed.
const MODEL_URL = '/models/source-b16/cylinder-head-source.glb';
const INSTALLED = new THREE.Vector3(0, 0, 0);
const PREVIEW = new THREE.Vector3(0, 9, 12);

function ImportedCylinderHeadMesh() {
  const { scene } = useGLTF(MODEL_URL);
  const model = useMemo(() => {
    const copy = scene.clone(true);
    copy.traverse((node) => {
      if (!node.isMesh) return;
      node.castShadow = true;
      node.receiveShadow = true;
      if (Array.isArray(node.material)) {
        node.material = node.material.map((material) => {
          const cloned = material.clone();
          if ('metalness' in cloned) cloned.metalness = Math.max(cloned.metalness ?? 0, 0.68);
          if ('roughness' in cloned) cloned.roughness = Math.max(cloned.roughness ?? 0.3, 0.3);
          return cloned;
        });
      } else if (node.material) {
        node.material = node.material.clone();
        if ('metalness' in node.material) node.material.metalness = Math.max(node.material.metalness ?? 0, 0.68);
        if ('roughness' in node.material) node.material.roughness = Math.max(node.material.roughness ?? 0.3, 0.3);
      }
    });
    return copy;
  }, [scene]);

  return <primitive object={model} dispose={null} />;
}

export default function CylinderHead({ installed = false }) {
  const group = useRef(null);
  const progress = useRef(0);

  useFrame((_, delta) => {
    if (!group.current) return;
    progress.current += ((installed ? 1 : 0) - progress.current) * Math.min(1, delta * 2.2);
    const t = progress.current;
    const eased = t * t * (3 - 2 * t);
    group.current.position.lerpVectors(PREVIEW, INSTALLED, eased);
  });

  return (
    <group ref={group} position={PREVIEW.toArray()} name="b16-cylinder-head-source-obj">
      <ImportedCylinderHeadMesh />
    </group>
  );
}

useGLTF.preload(MODEL_URL);
