import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

// Detailed educational B16-style DOHC head topography. This remains illustrative
// geometry, not a scan or dimensionally verified Honda CAD model.
const INSTALLED = new THREE.Vector3(-40.0, 13.75, 130.5);
const PREVIEW = INSTALLED.clone().add(new THREE.Vector3(0, 9, 12));

const headMaterial = new THREE.MeshStandardMaterial({ color: '#929da4', metalness: 0.78, roughness: 0.34 });
const machinedMaterial = new THREE.MeshStandardMaterial({ color: '#c0c7ca', metalness: 0.88, roughness: 0.24 });
const castingMaterial = new THREE.MeshStandardMaterial({ color: '#77838a', metalness: 0.72, roughness: 0.4 });
const portMaterial = new THREE.MeshStandardMaterial({ color: '#343d42', metalness: 0.42, roughness: 0.58 });
const wellMaterial = new THREE.MeshStandardMaterial({ color: '#20282d', metalness: 0.48, roughness: 0.48 });
const bronzeMaterial = new THREE.MeshStandardMaterial({ color: '#8a7655', metalness: 0.72, roughness: 0.3 });

const cylinders = [-5.25, -1.75, 1.75, 5.25];
const camStations = [-6.55, -3.95, -1.35, 1.35, 3.95, 6.55];
const camRows = [-2.35, 2.35];

function VerticalHole({ x, z, radius = 0.12, y = 1.58, depth = 0.045, material = wellMaterial }) {
  return (
    <group position={[x, y, z]}>
      <mesh material={material} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[radius, radius, depth, 20]} />
      </mesh>
      <mesh position={[0, depth * 0.52, 0]} rotation={[Math.PI / 2, 0, 0]} material={machinedMaterial}>
        <torusGeometry args={[radius * 1.12, 0.025, 6, 20]} />
      </mesh>
    </group>
  );
}

function BearingSaddle({ x, z }) {
  return (
    <group position={[x, 0, z]}>
      {/* Raised cam bearing pedestal and machined circular journal seat. */}
      <mesh position={[0, 1.48, 0]} material={castingMaterial} castShadow receiveShadow>
        <boxGeometry args={[1.12, 0.34, 1.16]} />
      </mesh>
      <mesh position={[0, 1.69, 0]} material={machinedMaterial} castShadow>
        <cylinderGeometry args={[0.49, 0.54, 0.12, 32]} />
      </mesh>
      <mesh position={[0, 1.758, 0]} material={wellMaterial}>
        <cylinderGeometry args={[0.335, 0.335, 0.018, 32]} />
      </mesh>
      <mesh position={[0, 1.77, 0]} rotation={[Math.PI / 2, 0, 0]} material={machinedMaterial}>
        <torusGeometry args={[0.42, 0.055, 8, 32]} />
      </mesh>
      {/* Two cap-bolt holes on the outer shoulders of each bearing station. */}
      <VerticalHole x={-0.42} z={0.39} radius={0.105} y={1.69} />
      <VerticalHole x={0.42} z={0.39} radius={0.105} y={1.69} />
    </group>
  );
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
    <group ref={group} position={PREVIEW.toArray()} name="b16-cylinder-head">
      {/* Main aluminum casting and lower combustion-chamber deck bosses. */}
      <mesh material={headMaterial} castShadow receiveShadow>
        <boxGeometry args={[17.2, 2.65, 10.35]} />
      </mesh>
      {cylinders.map((x) => (
        <mesh key={`chamber-${x}`} position={[x, -1.25, -0.5]} scale={[1.55, 0.32, 1.55]} material={headMaterial} castShadow receiveShadow>
          <sphereGeometry args={[1, 24, 16]} />
        </mesh>
      ))}

      {/* Deep-looking twin camshaft galleries with raised machined side rails. */}
      {camRows.map((z) => (
        <group key={`cam-gallery-${z}`}>
          <mesh position={[0, 1.345, z]} material={portMaterial}>
            <boxGeometry args={[16.45, 0.045, 1.62]} />
          </mesh>
          {[-0.92, 0.92].map((offset) => (
            <mesh key={offset} position={[0, 1.49, z + offset]} material={machinedMaterial} castShadow>
              <boxGeometry args={[16.65, 0.34, 0.22]} />
            </mesh>
          ))}
          {camStations.map((x) => <BearingSaddle key={`${x}-${z}`} x={x} z={z} />)}
        </group>
      ))}

      {/* Four central spark-plug tunnels with machined collars and deep bores. */}
      {cylinders.map((x) => (
        <group key={`plug-well-${x}`} position={[x, 1.47, -0.5]}>
          <mesh material={castingMaterial} castShadow>
            <cylinderGeometry args={[0.62, 0.68, 0.28, 32]} />
          </mesh>
          <mesh position={[0, 0.15, 0]} material={machinedMaterial}>
            <torusGeometry args={[0.48, 0.09, 10, 36]} />
          </mesh>
          <mesh position={[0, 0.145, 0]} material={wellMaterial}>
            <cylinderGeometry args={[0.365, 0.365, 0.06, 32]} />
          </mesh>
          <mesh position={[0, 0.18, 0]} material={portMaterial}>
            <cylinderGeometry args={[0.26, 0.26, 0.025, 32]} />
          </mesh>
        </group>
      ))}

      {/* Cross-webs and small oil-feed / locating passages between galleries. */}
      {[-4.7, 0, 4.7].map((x) => (
        <group key={`center-web-${x}`}>
          <mesh position={[x, 1.43, 0]} material={castingMaterial} castShadow>
            <boxGeometry args={[0.62, 0.28, 8.65]} />
          </mesh>
          <mesh position={[x, 1.59, 0]} material={machinedMaterial}>
            <cylinderGeometry args={[0.36, 0.36, 0.06, 28]} />
          </mesh>
          <VerticalHole x={x - 0.22} z={0} radius={0.11} y={1.64} />
          <VerticalHole x={x + 0.22} z={0} radius={0.11} y={1.64} />
        </group>
      ))}

      {/* Perimeter machined rails, valve-cover fastener holes and locating dowels. */}
      {[-4.78, 4.78].map((z) => (
        <mesh key={`perimeter-${z}`} position={[0, 1.43, z]} material={machinedMaterial} castShadow>
          <boxGeometry args={[16.9, 0.28, 0.28]} />
        </mesh>
      ))}
      {[-7.65, -5.1, -2.55, 0, 2.55, 5.1, 7.65].flatMap((x) => [-4.72, 4.72].map((z) => (
        <VerticalHole key={`cover-bolt-${x}-${z}`} x={x} z={z} radius={0.105} y={1.59} />
      )))}

      {/* Cast ribs and recessed side pockets visible from oblique camera angles. */}
      {[-1, 1].map((side) => (
        <group key={`side-ribs-${side}`}>
          {[-3.9, -1.3, 1.3, 3.9].map((x) => (
            <mesh key={x} position={[x, 0.35, side * 5.08]} rotation={[0, 0, side * -0.12]} material={castingMaterial} castShadow>
              <boxGeometry args={[0.32, 1.25, 0.18]} />
            </mesh>
          ))}
          <mesh position={[0, 0.25, side * 5.12]} material={portMaterial}>
            <boxGeometry args={[15.8, 0.72, 0.035]} />
          </mesh>
        </group>
      ))}

      {/* Intake and exhaust port mouths on the two long sides. */}
      {cylinders.map((x) => (
        <group key={`ports-${x}`}>
          {[5.05, -5.05].map((z) => (
            <group key={z} position={[x, -0.25, z]} rotation={[Math.PI / 2, 0, 0]}>
              <mesh material={portMaterial} castShadow>
                <cylinderGeometry args={[0.58, 0.68, 0.8, 28]} />
              </mesh>
              <mesh position={[0, 0.42, 0]} material={machinedMaterial}>
                <torusGeometry args={[0.62, 0.075, 8, 28]} />
              </mesh>
            </group>
          ))}
        </group>
      ))}

      {/* End oil-feed bosses and cam-seal housing details. */}
      {[-1, 1].map((end) => (
        <group key={`cam-end-${end}`} position={[end * 8.15, 1.42, 0]}>
          {camRows.map((z) => (
            <group key={z} position={[0, 0, z]}>
              <mesh material={machinedMaterial}>
                <cylinderGeometry args={[0.66, 0.72, 0.24, 32]} />
              </mesh>
              <mesh position={[0, 0.14, 0]} material={wellMaterial}>
                <cylinderGeometry args={[0.39, 0.39, 0.035, 32]} />
              </mesh>
              <mesh position={[0, 0.16, 0]} material={machinedMaterial}>
                <torusGeometry args={[0.49, 0.055, 8, 32]} />
              </mesh>
            </group>
          ))}
          <mesh position={[0, 0.12, 0]} material={bronzeMaterial}>
            <cylinderGeometry args={[0.18, 0.18, 0.045, 20]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
