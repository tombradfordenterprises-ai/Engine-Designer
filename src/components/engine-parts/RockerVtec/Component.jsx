import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';

// One imported rocker arm is repeated across the four-cylinder B16 head.
// The scene layout follows the existing valve/cam galleries: four cylinder
// stations, two banks, and three rocker positions per station and bank.
// These are visual fitment coordinates, not factory service dimensions.
const ROCKER_URL = '/models/engines/B16/parts/B16%20Rocker%20arm%20IMG.glb';
const CYLINDER_X = [-45.5, -41.5, -37.5, -33.5];
const ROW_Z = [127.5, 132.0];
const FINGER_Z = [-0.30, 0, 0.30];
const INSTALLED_Y = 17.35;
const PREVIEW_OFFSET = new THREE.Vector3(0, 8, 11);

// The source mesh bounds are approximately 1.00 x 0.40 x 0.83.
// Rotate its long Z dimension onto the engine X axis and scale it to the
// existing rocker-bank envelope. Centering is performed before this transform.
function makeRockerCopies(scene) {
  const source = scene.clone(true);
  source.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(source);
  const center = new THREE.Vector3();
  bounds.getCenter(center);
  source.position.sub(center);

  const copies = [];
  for (const x of CYLINDER_X) {
    for (const z of ROW_Z) {
      for (const offset of FINGER_Z) {
        const model = source.clone(true);
        model.traverse((node) => {
          if (!node.isMesh) return;
          node.castShadow = true;
          node.receiveShadow = true;
          if (Array.isArray(node.material)) {
            node.material = node.material.map((material) => material.clone());
          } else if (node.material) {
            node.material = node.material.clone();
          }
        });
        model.rotation.y = Math.PI / 2;
        model.scale.set(1.9, 0.6, 0.27);
        copies.push({ key: `${x}-${z}-${offset}`, position: [x, INSTALLED_Y, z + offset], model });
      }
    }
  }
  return copies;
}

export default function RockerVtec({ installed = false }) {
  const group = useRef(null);
  const progress = useRef(0);
  const { scene } = useGLTF(ROCKER_URL);
  const rockers = useMemo(() => makeRockerCopies(scene), [scene]);

  useFrame((_, delta) => {
    if (!group.current) return;
    progress.current = THREE.MathUtils.damp(progress.current, installed ? 1 : 0, 2.0, delta);
    const t = progress.current;
    const eased = t * t * (3 - 2 * t);
    group.current.position.lerpVectors(PREVIEW_OFFSET, new THREE.Vector3(0, 0, 0), eased);
  });

  return (
    <group ref={group} position={PREVIEW_OFFSET.toArray()} name="b16-rocker-arms-vtec-assembly">
      {rockers.map(({ key, position, model }) => (
        <group key={key} position={position}>
          <primitive object={model} dispose={null} />
        </group>
      ))}
    </group>
  );
}

useGLTF.preload(ROCKER_URL);
