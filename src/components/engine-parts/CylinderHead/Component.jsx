import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';

// Imported GrabCAD VTEC-11_1 mesh. The source STEP/OBJ dimensions were
// normalized from millimeters to meters and centered by the conversion step.
// Scale 40 maps its ~436.5 mm length to the existing scene's ~17.5 units.
// Position places its lower deck near the block's y=12.0 deck plane.
// This is visual mesh geometry, not a watertight editable CAD solid.
const MODEL_URL = '/models/b16_vtec_11_cylinder_head.glb';
const SCENE_SCALE = 40.0;
const INSTALLED = new THREE.Vector3(-39.854, 13.867, 130.51);
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

  return <primitive object={model} scale={SCENE_SCALE} dispose={null} />;
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
