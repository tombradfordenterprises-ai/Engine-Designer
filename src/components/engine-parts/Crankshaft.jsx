import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';

const CRANKSHAFT_URL = '/models/crankshaft.glb';

/**
 * Independent crankshaft preview component.
 *
 * The supplied crankshaft GLB and isolated B16 block use different
 * coordinate scales/origins. These provisional values put the crankshaft
 * visibly beside the supplied block asset so we can verify the modular
 * rendering pipeline. They are NOT a mechanically accurate B16 fitment.
 */
export default function Crankshaft({
  position = [-22.25, 8.0, 130.5],
}) {
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

    // The supplied crankshaft is about 0.589 units long, while the
    // isolated B16 block asset is about 17.5 units wide.
    // This provisional scale makes the preview visually comparable.
    copy.scale.setScalar(28);
    copy.updateMatrixWorld(true);

    // Center the model at the component origin before positioning it.
    const bounds = new THREE.Box3().setFromObject(copy);
    const center = new THREE.Vector3();
    bounds.getCenter(center);
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
