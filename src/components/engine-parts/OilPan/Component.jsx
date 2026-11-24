import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

// Detailed educational B16-style stamped-steel oil-pan model.
// Geometry is illustrative, not a dimensionally verified Honda CAD part.
const INSTALLED = new THREE.Vector3(-39.75, 3.45, 130.5);
const PREVIEW = INSTALLED.clone().add(new THREE.Vector3(0, 9, 12));

const panMaterial = new THREE.MeshStandardMaterial({ color: '#59646c', metalness: 0.78, roughness: 0.34 });
const flangeMaterial = new THREE.MeshStandardMaterial({ color: '#aab3b9', metalness: 0.86, roughness: 0.25 });
const darkMaterial = new THREE.MeshStandardMaterial({ color: '#303a40', metalness: 0.72, roughness: 0.42 });
const plugMaterial = new THREE.MeshStandardMaterial({ color: '#c0c7cc', metalness: 0.92, roughness: 0.2 });
const gasketMaterial = new THREE.MeshStandardMaterial({ color: '#25292b', metalness: 0.12, roughness: 0.8 });

const longBoltXs = [-7.15, -5.35, -3.55, -1.78, 0, 1.78, 3.55, 5.35, 7.15];
const shortBoltZs = [-2.65, -0.9, 0.9, 2.65];

function FlangeBolt({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.015, 0]} material={darkMaterial} castShadow>
        <cylinderGeometry args={[0.19, 0.19, 0.055, 24]} />
      </mesh>
      <mesh position={[0, 0.085, 0]} material={plugMaterial} castShadow>
        <cylinderGeometry args={[0.125, 0.125, 0.13, 6]} />
      </mesh>
      <mesh position={[0, 0.156, 0]} material={darkMaterial}>
        <boxGeometry args={[0.12, 0.018, 0.035]} />
      </mesh>
    </group>
  );
}

export default function OilPan({ installed = false }) {
  const group = useRef(null);
  const progress = useRef(0);
  useFrame((_, delta) => {
    if (!group.current) return;
    progress.current += ((installed ? 1 : 0) - progress.current) * Math.min(1, delta * 2.35);
    const t = progress.current;
    group.current.position.lerpVectors(PREVIEW, INSTALLED, t * t * (3 - 2 * t));
  });

  return (
    <group ref={group} position={PREVIEW.toArray()} name="b16-oil-pan-sump">
      {/* Main pan floor and the deeper oil collection well. */}
      <mesh position={[0, -0.66, 0]} material={panMaterial} castShadow receiveShadow>
        <boxGeometry args={[15.65, 0.42, 7.65]} />
      </mesh>
      <mesh position={[0.25, -0.88, 0.55]} material={panMaterial} castShadow receiveShadow>
        <boxGeometry args={[10.6, 0.22, 5.25]} />
      </mesh>

      {/* Four formed side walls, with a deeper central sump profile. */}
      <mesh position={[0, -0.02, -3.72]} material={panMaterial} castShadow><boxGeometry args={[15.8, 1.18, 0.38]} /></mesh>
      <mesh position={[0, -0.02, 3.72]} material={panMaterial} castShadow><boxGeometry args={[15.8, 1.18, 0.38]} /></mesh>
      <mesh position={[-7.72, -0.02, 0]} material={panMaterial} castShadow><boxGeometry args={[0.38, 1.18, 7.25]} /></mesh>
      <mesh position={[7.72, -0.02, 0]} material={panMaterial} castShadow><boxGeometry args={[0.38, 1.18, 7.25]} /></mesh>

      {/* Upper sealing flange and a dark gasket edge to distinguish the joint. */}
      <mesh position={[0, 0.61, -3.91]} material={gasketMaterial}><boxGeometry args={[16.05, 0.12, 0.48]} /></mesh>
      <mesh position={[0, 0.61, 3.91]} material={gasketMaterial}><boxGeometry args={[16.05, 0.12, 0.48]} /></mesh>
      <mesh position={[-7.88, 0.61, 0]} material={gasketMaterial}><boxGeometry args={[0.48, 0.12, 7.75]} /></mesh>
      <mesh position={[7.88, 0.61, 0]} material={gasketMaterial}><boxGeometry args={[0.48, 0.12, 7.75]} /></mesh>
      <mesh position={[0, 0.69, -3.91]} material={flangeMaterial} castShadow><boxGeometry args={[16.15, 0.16, 0.5]} /></mesh>
      <mesh position={[0, 0.69, 3.91]} material={flangeMaterial} castShadow><boxGeometry args={[16.15, 0.16, 0.5]} /></mesh>
      <mesh position={[-7.9, 0.69, 0]} material={flangeMaterial} castShadow><boxGeometry args={[0.5, 0.16, 7.75]} /></mesh>
      <mesh position={[7.9, 0.69, 0]} material={flangeMaterial} castShadow><boxGeometry args={[0.5, 0.16, 7.75]} /></mesh>

      {/* Perimeter fasteners: washers and hex heads along all four sides. */}
      {longBoltXs.map((x) => (
        <React.Fragment key={`front-${x}`}>
          <FlangeBolt position={[x, 0.77, -3.94]} />
          <FlangeBolt position={[x, 0.77, 3.94]} />
        </React.Fragment>
      ))}
      {shortBoltZs.map((z) => (
        <React.Fragment key={`side-${z}`}>
          <FlangeBolt position={[-7.94, 0.77, z]} />
          <FlangeBolt position={[7.94, 0.77, z]} />
        </React.Fragment>
      ))}

      {/* Stamped reinforcing ribs and shallow pressed channels on the pan floor. */}
      {[-5.2, -2.7, 2.7, 5.2].map((x) => (
        <mesh key={`rib-${x}`} position={[x, -1.015, 0.15]} material={flangeMaterial} castShadow>
          <boxGeometry args={[0.22, 0.12, 4.75]} />
        </mesh>
      ))}
      {[-1.65, 1.65].map((z) => (
        <mesh key={`channel-${z}`} position={[0.2, -1.005, z]} material={darkMaterial}>
          <boxGeometry args={[8.6, 0.045, 0.12]} />
        </mesh>
      ))}
      {/* Formed side beads and corner reinforcement pads. */}
      {[-1, 1].map((side) => (
        <React.Fragment key={`beads-${side}`}>
          {[-2.5, 0, 2.5].map((z) => (
            <mesh key={`${side}-${z}`} position={[side * 7.925, -0.05, z]} material={flangeMaterial}>
              <boxGeometry args={[0.055, 0.72, 0.12]} />
            </mesh>
          ))}
        </React.Fragment>
      ))}
      {[-1, 1].flatMap((xSide) => [-1, 1].map((zSide) => (
        <mesh key={`corner-${xSide}-${zSide}`} position={[xSide * 7.35, 0.34, zSide * 3.35]} material={flangeMaterial}>
          <boxGeometry args={[0.72, 0.12, 0.62]} />
        </mesh>
      )))}

      {/* Reinforced drain-plug boss, washer, hex plug and recessed center. */}
      <mesh position={[5.15, -1.02, 2.15]} material={flangeMaterial} castShadow>
        <cylinderGeometry args={[0.72, 0.66, 0.22, 32]} />
      </mesh>
      <mesh position={[5.15, -1.17, 2.15]} material={darkMaterial}>
        <cylinderGeometry args={[0.43, 0.43, 0.08, 32]} />
      </mesh>
      <mesh position={[5.15, -1.29, 2.15]} material={plugMaterial} castShadow>
        <cylinderGeometry args={[0.34, 0.34, 0.24, 6]} />
      </mesh>
      <mesh position={[5.15, -1.42, 2.15]} material={darkMaterial}>
        <cylinderGeometry args={[0.12, 0.12, 0.018, 16]} />
      </mesh>

      {/* Small pressed step at the shallow end of the sump. */}
      <mesh position={[-5.6, -0.83, -1.85]} material={flangeMaterial}>
        <boxGeometry args={[2.4, 0.1, 0.28]} />
      </mesh>
    </group>
  );
}
