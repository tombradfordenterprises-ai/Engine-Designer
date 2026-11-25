import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';

const CRANKSHAFT_URL = '/models/crankshaft.glb';

// Provisional scene coordinates: preview beside the B16 block, then move
// toward the lower crankcase. These are visual prototype coordinates,
// not verified Honda B16 installation measurements.
const PREVIEW_POSITION = new THREE.Vector3(-22.25, 8.0, 130.5);
const INSTALLED_POSITION = new THREE.Vector3(-39.749, 8.002, 130.5);

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

    // Match the crankshaft's longitudinal span to the imported block.
    // The source GLB is about 0.589 units long; the block spans about 17.50
    // scene units along X. Keep the crankshaft's cross-section unchanged.
    copy.scale.set(29.75, 28, 28);
    copy.updateMatrixWorld(true);

    // Center the imported geometry around its own origin.
    const bounds = new THREE.Box3().setFromObject(copy);
    const center = new THREE.Vector3();
    bounds.getCenter(center);
    copy.position.sub(center);

    // Keep the shaft on the block's longitudinal X axis. The 180-degree
    // reversal presents the flange toward the visible end opening. The
    // flywheel and accessory pulley remain separate components.
    copy.rotation.y = Math.PI;
    copy.updateMatrixWorld(true);

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
