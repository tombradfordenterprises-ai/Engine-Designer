import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';

const CRANKSHAFT_URL = '/models/crankshaft.glb';

// Provisional scene coordinates: preview beside the B16 block, then move
// toward the lower crankcase. These are visual prototype coordinates,
// not verified Honda B16 installation measurements.
const PREVIEW_POSITION = new THREE.Vector3(-22.25, 8.0, 130.5);
const INSTALLED_POSITION = new THREE.Vector3(-40.0, 8.0, 131.0);

export default function Crankshaft({ installed = false }) {
  const groupRef = useRef(null);
  const progressRef = useRef(0);
  const { scene } = useGLTF(CRANKSHAFT_URL);

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

    // Scale the imported crankshaft to a visible size relative to the block.
    copy.scale.setScalar(28);
    copy.updateMatrixWorld(true);

    // Center the model around its own origin.
    const bounds = new THREE.Box3().setFromObject(copy);
    const center = new THREE.Vector3();
    bounds.getCenter(center);
    copy.position.sub(center);

    return copy;
  }, [scene]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Ease smoothly toward preview (0) or installed (1).
    const target = installed ? 1 : 0;
    const speed = Math.min(1, delta * 2.8);
    progressRef.current += (target - progressRef.current) * speed;

    // Smoothstep easing prevents a harsh start/stop.
    const t = progressRef.current;
    const eased = t * t * (3 - 2 * t);

    groupRef.current.position.lerpVectors(
      PREVIEW_POSITION,
      INSTALLED_POSITION,
      eased
    );
  });

  return (
    <group ref={groupRef} position={PREVIEW_POSITION.toArray()}>
      <primitive object={model} dispose={null} />
    </group>
  );
}

useGLTF.preload(CRANKSHAFT_URL);
