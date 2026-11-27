import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';

const CRANKSHAFT_URL = '/models/crankshaft.glb';

// The imported mesh is approximately 589 mm long along its local X axis.
// At this scene scale it spans the B16 block length and follows the same
// centerline used by the five main-bearing positions. These are visual
// assembly coordinates, not verified Honda service dimensions.
const PREVIEW_POSITION = new THREE.Vector3(-22.25, 8.0, 131.0);
// The block's rear main-seal/tunnel opening is offset from the block's
// overall bounding-box center. These Y/Z coordinates put the crankshaft
// axis on the center of that circular opening in the imported block mesh.
const INSTALLED_POSITION = new THREE.Vector3(-39.75, 5.5, 130.0);
const MODEL_SCALE = new THREE.Vector3(30.5, 28, 28);

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

    copy.scale.copy(MODEL_SCALE);
    copy.updateMatrixWorld(true);

    // Center the scaled imported geometry around the component origin.
    const bounds = new THREE.Box3().setFromObject(copy);
    const center = new THREE.Vector3();
    bounds.getCenter(center);
    copy.position.sub(center);

    // Keep the source mesh orientation: its broad drilled flange is on local -X,
    // facing the transmission side for flywheel/flexplate attachment. The timing-
    // belt/oil-pump end is +X in this scene.
    copy.updateMatrixWorld(true);

    return copy;
  }, [scene]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const target = installed ? 1 : 0;
    progressRef.current += (target - progressRef.current) * Math.min(1, delta * 2.8);
    const t = progressRef.current;
    const eased = t * t * (3 - 2 * t);
    groupRef.current.position.lerpVectors(PREVIEW_POSITION, INSTALLED_POSITION, eased);
  });

  return (
    <group ref={groupRef} position={PREVIEW_POSITION.toArray()} name="b16-crankshaft-assembly">
      <primitive object={model} dispose={null} />
    </group>
  );
}

useGLTF.preload(CRANKSHAFT_URL);
