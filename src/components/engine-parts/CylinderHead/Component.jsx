import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';

// Fit the actual lower deck face to the block's measured longitudinal edges.
// The imported mesh's lower deck is slightly shorter than its overall bounding
// box, so scale only along the engine length (X). The oil-pump end (X-min) is
// held fixed while the opposite deck edge is extended to the block edge.
// This is a visual fit to the supplied block mesh, not OEM-verified CAD.
const MODEL_URL = '/models/b16_vtec_11_cylinder_head.glb';
const SCENE_SCALE = [41.1271, 40.073, 40.073];
const INSTALLED = new THREE.Vector3(-39.6281, 13.867, 130.51);
const PREVIEW = INSTALLED.clone().add(new THREE.Vector3(0, 9, 12));

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
          if ('metalness' in cloned) cloned.metalness = Math.max(cloned.metalness ?? 0, 0.62);
          if ('roughness' in cloned) cloned.roughness = Math.max(cloned.roughness ?? 0.3, 0.3);
          return cloned;
        });
      } else if (node.material) {
        node.material = node.material.clone();
        if ('metalness' in node.material) node.material.metalness = Math.max(node.material.metalness ?? 0, 0.62);
        if ('roughness' in node.material) node.material.roughness = Math.max(node.material.roughness ?? 0.3, 0.3);
      }
    });
    return copy;
  }, [scene]);

  return <primitive object={model} scale={SCENE_SCALE} rotation={[0, 0, 0]} dispose={null} />;
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
    <group ref={group} position={PREVIEW.toArray()} name="b16-cylinder-head-grabcad">
      <ImportedCylinderHeadMesh />
    </group>
  );
}

useGLTF.preload(MODEL_URL);
