import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

// Educational prototype placement relative to the current B16 block scene.
// These are visual coordinates, not factory Honda CAD measurements.
const INSTALLED = new THREE.Vector3(-42.8, 3.5, 130.1);
const PREVIEW = INSTALLED.clone().add(new THREE.Vector3(0, 8, 10));

const tubeMaterial = new THREE.MeshStandardMaterial({ color: '#aeb8bf', metalness: 0.86, roughness: 0.24 });
const screenMaterial = new THREE.MeshStandardMaterial({ color: '#7f8a91', metalness: 0.72, roughness: 0.34 });
const darkMaterial = new THREE.MeshStandardMaterial({ color: '#39434a', metalness: 0.55, roughness: 0.42 });

function TubeSegment({ start, end, radius = 0.16 }) {
  const a = new THREE.Vector3(...start);
  const b = new THREE.Vector3(...end);
  const direction = new THREE.Vector3().subVectors(b, a);
  const midpoint = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
  return (
    <mesh position={midpoint} quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize())} material={tubeMaterial} castShadow>
      <cylinderGeometry args={[radius, radius, direction.length(), 20]} />
    </mesh>
  );
}

export default function OilPickup({ installed = false }) {
  const group = useRef(null);
  const progress = useRef(0);
  const curveGeometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-4.8, 3.0, 0.8),
      new THREE.Vector3(-3.7, 1.9, 0.7),
      new THREE.Vector3(-2.0, 0.55, 0.3),
      new THREE.Vector3(0.4, -0.4, -0.15),
    ]);
    return new THREE.TubeGeometry(curve, 32, 0.16, 12, false);
  }, []);

  useFrame((_, delta) => {
    if (!group.current) return;
    const target = installed ? 1 : 0;
    progress.current += (target - progress.current) * Math.min(1, delta * 2.6);
    const t = progress.current;
    group.current.position.lerpVectors(PREVIEW, INSTALLED, t * t * (3 - 2 * t));
  });

  return (
    <group ref={group} position={PREVIEW.toArray()} name="b16-oil-pickup-tube-and-screen">
      {/* Flanged connection at the oil-pump outlet. */}
      <mesh position={[-4.7, 3.0, 0.8]} rotation={[0, 0, Math.PI / 2]} material={screenMaterial} castShadow>
        <cylinderGeometry args={[0.42, 0.42, 0.22, 28]} />
      </mesh>
      <mesh geometry={curveGeometry} material={tubeMaterial} castShadow receiveShadow />
      <TubeSegment start={[-4.8, 3.0, 0.8]} end={[-4.8, 2.65, 0.8]} radius={0.19} />
      {/* Flat screened inlet, shown as a shallow perforated strainer. */}
      <group position={[0.4, -0.4, -0.15]}>
        <mesh material={screenMaterial} castShadow>
          <cylinderGeometry args={[1.05, 1.05, 0.22, 40]} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={darkMaterial}>
          <torusGeometry args={[0.82, 0.055, 8, 40]} />
        </mesh>
        {Array.from({ length: 8 }, (_, i) => (
          <mesh key={i} rotation={[0, (Math.PI * 2 * i) / 8, 0]} material={darkMaterial}>
            <boxGeometry args={[1.72, 0.035, 0.035]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
