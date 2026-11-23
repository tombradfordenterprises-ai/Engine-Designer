import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';

const CRANKSHAFT_URL = '/models/crankshaft.glb';

/**
 * Reusable Honda B16 engine-part model component.
 *
 * This is currently a visual preview asset. Its position and scale are
 * provisional and will need calibration against the B16 block before we
 * treat it as a mechanically accurate installation.
 */
export default function Crankshaft({ position = [0.78, 0.02, 0] }) {
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

    // Normalize the imported asset to a predictable preview size.
    const bounds = new THREE.Box3().setFromObject(copy);
    const size = new THREE.Vector3();
    bounds.getSize(size);

    const longest = Math.max(size.x, size.y, size.z) || 1;
    copy.scale.setScalar(0.48 / longest);
    copy.updateMatrixWorld(true);

    // Center the model around its own origin before positioning it in the scene.
    const centeredBounds = new THREE.Box3().setFromObject(copy);
    const center = new THREE.Vector3();
    centeredBounds.getCenter(center);
    copy.position.sub(center);

    return copy;
  }, [scene]);

  return (
    <group position={position}>
      <primitive object={model} dispose={null} />
    </group>
  );
}

useGLTF.preload(CRANKSHAFT_URL);
