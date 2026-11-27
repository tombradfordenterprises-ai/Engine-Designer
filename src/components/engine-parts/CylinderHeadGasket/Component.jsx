import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';

// Use the supplied B16 head-gasket mesh in its original shared CAD coordinate
// system. The converted model sits on the block deck at scene Y ~= 12.0.
// It is intentionally not stretched to the block's outside perimeter.
const MODEL_URL = '/models/source-b16/head-gasket-source.glb';
const INSTALLED = new THREE.Vector3(0, 0, 0);
const PREVIEW = new THREE.Vector3(0, 8, 10);

function ImportedHeadGasketMesh() {
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

  return <primitive object={model} dispose={null} />;
}

export default function CylinderHeadGasket({ installed = false }) {
  const group = useRef(null);
  const progress = useRef(0);

  useFrame((_, delta) => {
    if (!group.current) return;
    progress.current += ((installed ? 1 : 0) - progress.current) * Math.min(1, delta * 2.8);
    const t = progress.current;
    const eased = t * t * (3 - 2 * t);
    group.current.position.lerpVectors(PREVIEW, INSTALLED, eased);
  });

  return (
    <group ref={group} position={PREVIEW.toArray()} name="b16-head-gasket-source-obj">
      <ImportedHeadGasketMesh />
    </group>
  );
}

useGLTF.preload(MODEL_URL);
