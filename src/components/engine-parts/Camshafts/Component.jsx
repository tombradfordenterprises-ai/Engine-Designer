import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';

// Each complete B16 camshaft is assembled from the three supplied source meshes.
// The assembled OBJ shows the two camshaft centerlines separated by 4 units
// along the model Z axis. Keep the original source coordinates and offset only
// the second complete assembly to the other camshaft gallery.
const CAMSHAFT_1_URL = '/models/source-b16/camshaft-1.glb';
const CAMSHAFT_2_URL = '/models/source-b16/camshaft-2.glb';
const CAMSHAFT_LOBES_URL = '/models/source-b16/camshaft-lobes.glb';
const SECOND_CAMSHAFT_OFFSET = [0, 0, -4];

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
          if (cloned.color) cloned.color.set('#8b949e');
          if ('metalness' in cloned) cloned.metalness = Math.max(cloned.metalness ?? 0, 0.82);
          if ('roughness' in cloned) cloned.roughness = Math.max(cloned.roughness ?? 0.24, 0.28);
          return cloned;
        });
      } else if (node.material) {
        node.material = node.material.clone();
        if (node.material.color) node.material.color.set('#8b949e');
        if ('metalness' in node.material) node.material.metalness = Math.max(node.material.metalness ?? 0, 0.82);
        if ('roughness' in node.material) node.material.roughness = Math.max(node.material.roughness ?? 0.24, 0.28);
      }
    });
    return copy;
  }, [scene]);

  return <primitive object={model} dispose={null} />;
}

function CompleteCamshaft() {
  return (
    <group name="complete-b16-camshaft">
      <CamshaftMesh url={CAMSHAFT_1_URL} />
      <CamshaftMesh url={CAMSHAFT_2_URL} />
      <CamshaftMesh url={CAMSHAFT_LOBES_URL} />
    </group>
  );
}

export default function Camshafts({ installed = false, rotating = false }) {
  const group = useRef(null);
  const progress = useRef(0);

  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.x = rotating && installed ? -state.clock.elapsedTime * 0.36 : 0;
    progress.current = THREE.MathUtils.damp(progress.current, installed ? 1 : 0, 2.0, delta);
    const t = progress.current;
    const eased = t * t * (3 - 2 * t);
    group.current.position.lerpVectors(PREVIEW, INSTALLED, eased);
  });

  return (
    <group ref={group} position={PREVIEW.toArray()} name="b16-dual-camshaft-assembly">
      <CompleteCamshaft />
      <group position={SECOND_CAMSHAFT_OFFSET} name="second-complete-camshaft">
        <CompleteCamshaft />
      </group>
    </group>
  );
}

useGLTF.preload(CAMSHAFT_1_URL);
useGLTF.preload(CAMSHAFT_2_URL);
useGLTF.preload(CAMSHAFT_LOBES_URL);
