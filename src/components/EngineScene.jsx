// [030] Imports React hooks, the 3D canvas, camera controls, and Three.js geometry utilities.
import React, { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

// [031] Creates a reusable metallic material with optional selection glow for the engine casting.
function useMetalMaterial(color, active = false, roughness = 0.42, metalness = 0.72) {
  return useMemo(() => new THREE.MeshStandardMaterial({
    color: active ? '#70b9e8' : color,
    metalness, roughness,
    emissive: active ? '#15547c' : '#000000',
    emissiveIntensity: active ? 0.24 : 0
  }), [color, active, roughness, metalness]);
}

// [032] Builds a generic modern inline-four aluminum block with a rounded cast perimeter and four true cylinder bores.
function createBlockGeometry() {
  const shape = new THREE.Shape();

  // [032A] The side-to-side profile has rounded shoulders and a slightly wider lower skirt.
  shape.moveTo(-1.68, -0.69);
  shape.lineTo(1.68, -0.69);
  shape.quadraticCurveTo(1.80, -0.69, 1.80, -0.55);
  shape.lineTo(1.80, 0.43);
  shape.quadraticCurveTo(1.80, 0.64, 1.63, 0.69);
  shape.lineTo(-1.63, 0.69);
  shape.quadraticCurveTo(-1.80, 0.64, -1.80, 0.43);
  shape.lineTo(-1.80, -0.55);
  shape.quadraticCurveTo(-1.80, -0.69, -1.68, -0.69);

  // [032B] Four accurately spaced cylinder openings are cut all the way through the deck.
  [-1.2, -0.4, 0.4, 1.2].forEach((x) => {
    const bore = new THREE.Path();
    bore.absarc(x, 0, 0.29, 0, Math.PI * 2, true);
    shape.holes.push(bore);
  });

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 1.7,
    bevelEnabled: true,
    bevelSegments: 7,
    steps: 1,
    bevelSize: 0.045,
    bevelThickness: 0.045,
    curveSegments: 56
  });
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, -0.75, 0);
  geometry.computeVertexNormals();
  return geometry;
}

// [034] Creates metallic hex fasteners for the block flanges and bearing-cap supports.
function HexBolt({ position, rotation = [0, 0, 0], scale = 1 }) {
  return <group position={position} rotation={rotation} scale={scale}>
    <mesh castShadow><cylinderGeometry args={[0.052, 0.052, 0.035, 6]} /><meshStandardMaterial color="#c2c8cc" metalness={0.9} roughness={0.24} /></mesh>
    <mesh position={[0, 0.019, 0]}><cylinderGeometry args={[0.017, 0.017, 0.006, 12]} /><meshStandardMaterial color="#626b72" metalness={0.85} roughness={0.3} /></mesh>
  </group>;
}

// [035] Adds the four machined cylinder rims and dark liner walls around the open bores.
function CylinderDeck() {
  return <group>
    {[-1.2, -0.4, 0.4, 1.2].map((x) => <group key={`liner-${x}`} position={[x, 0, 0]}>
      <mesh position={[0, 0.08, 0]} castShadow>
        <cylinderGeometry args={[0.286, 0.286, 1.48, 48, 1, true]} />
        <meshStandardMaterial color="#333d44" metalness={0.58} roughness={0.38} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.965, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.292, 0.025, 12, 56]} />
        <meshStandardMaterial color="#c0c8cd" metalness={0.94} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.952, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.263, 0.008, 8, 48]} />
        <meshStandardMaterial color="#68747c" metalness={0.9} roughness={0.28} />
      </mesh>
    </group>)}
    {[-1.55, -0.8, 0, 0.8, 1.55].flatMap((x) => [-0.49, 0.49].map((z) =>
      <group key={`headbolt-hole-${x}-${z}`} position={[x, 0.965, z]}>
        <mesh><cylinderGeometry args={[0.045, 0.045, 0.018, 20]} /><meshStandardMaterial color="#303940" metalness={0.62} roughness={0.34} /></mesh>
        <mesh position={[0, 0.012, 0]}><torusGeometry args={[0.036, 0.006, 8, 24]} /><meshStandardMaterial color="#c5cdd1" metalness={0.9} roughness={0.25} /></mesh>
      </group>
    ))}
    {/* [035B] Narrow machined perimeter rails represent the head-gasket sealing surface. */}
    <mesh position={[0, 0.968, -0.665]}>
      <boxGeometry args={[3.36, 0.012, 0.025]} />
      <meshStandardMaterial color="#c7ced2" metalness={0.95} roughness={0.2} />
    </mesh>
    <mesh position={[0, 0.968, 0.665]}>
      <boxGeometry args={[3.36, 0.012, 0.025]} />
      <meshStandardMaterial color="#c7ced2" metalness={0.95} roughness={0.2} />
    </mesh>
    {/* [035A] Smaller coolant and oil passages are machined around the cylinder bores. */}
    {[-1.55, -0.82, -0.02, 0.78, 1.55].flatMap((x, i) => [-0.57, 0.57].map((z, j) =>
      <mesh key={`deck-passage-${i}-${j}`} position={[x, 0.966, z]}>
        <cylinderGeometry args={[0.055, 0.055, 0.014, 24]} />
        <meshStandardMaterial color="#38434a" metalness={0.62} roughness={0.36} />
      </mesh>
    ))}
  </group>;
}

// [036] Creates a generic modern aluminum inline-four casting with rounded water-jacket bulges and curved ribs.
function BlockSideDetails() {
  const castMat = new THREE.MeshStandardMaterial({ color: '#929da3', metalness: 0.66, roughness: 0.58 });
  const highlightMat = new THREE.MeshStandardMaterial({ color: '#aab3b8', metalness: 0.78, roughness: 0.42 });
  const shadowMat = new THREE.MeshStandardMaterial({ color: '#65727a', metalness: 0.72, roughness: 0.52 });

  // [036A] A reusable smooth cast rib follows a curved path instead of using sharp-edged box geometry.
  const curvedRib = (points, radius = 0.035) => {
    const curve = new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point)));
    return new THREE.TubeGeometry(curve, 28, radius, 10, false);
  };

  return <group>
    {/* [036B] Rounded cast water-jacket bulges follow the four cylinder positions. */}
    {[-1.2, -0.4, 0.4, 1.2].map((x, i) => <group key={`water-jacket-bulge-${x}`}>
      <mesh position={[x, 0.12, 0.755]} scale={[0.36, 0.49, 0.105]} castShadow receiveShadow>
        <sphereGeometry args={[1, 36, 24]} />
        <primitive object={castMat} attach="material" />
      </mesh>
      <mesh position={[x, 0.12, 0.842]} scale={[0.285, 0.39, 0.028]}>
        <sphereGeometry args={[1, 32, 20]} />
        <primitive object={shadowMat} attach="material" />
      </mesh>
      {/* [036C] Narrow curved casting ribs frame each cylinder bay. */}
      <mesh geometry={curvedRib([[x - 0.31, -0.34, 0.82], [x - 0.27, -0.08, 0.88], [x - 0.23, 0.23, 0.88], [x - 0.18, 0.48, 0.83]], 0.027)} material={highlightMat} castShadow />
      <mesh geometry={curvedRib([[x + 0.31, -0.34, 0.82], [x + 0.27, -0.08, 0.88], [x + 0.23, 0.23, 0.88], [x + 0.18, 0.48, 0.83]], 0.027)} material={highlightMat} castShadow />
    </group>)}

    {/* [036D] Upper and lower cast rails blend the cylinder bays into the block skirt. */}
    <mesh position={[0, 0.56, 0.78]} scale={[1.68, 0.10, 0.075]} castShadow>
      <sphereGeometry args={[1, 48, 20]} />
      <primitive object={highlightMat} attach="material" />
    </mesh>
    <mesh position={[0, -0.43, 0.79]} scale={[1.72, 0.12, 0.10]} castShadow>
      <sphereGeometry args={[1, 48, 20]} />
      <primitive object={shadowMat} attach="material" />
    </mesh>

    {/* [036E] Pressed steel core plugs are recessed into the casting, with a machined lip. */}
    {[-1.25, -0.42, 0.42, 1.25].map((x) => <group key={`core-plug-${x}`} position={[x, 0.12, 0.89]} rotation={[Math.PI / 2, 0, 0]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.137, 0.137, 0.035, 48]} />
        <meshStandardMaterial color="#aeb8bd" metalness={0.92} roughness={0.24} />
      </mesh>
      <mesh position={[0, 0.022, 0]}>
        <cylinderGeometry args={[0.105, 0.105, 0.012, 40]} />
        <meshStandardMaterial color="#727e85" metalness={0.86} roughness={0.32} />
      </mesh>
      <mesh position={[0, 0.030, 0]}>
        <torusGeometry args={[0.117, 0.008, 8, 40]} />
        <meshStandardMaterial color="#d0d6da" metalness={0.94} roughness={0.2} />
      </mesh>
    </group>)}

    {/* [036F] Oil-filter mounting boss with a recessed threaded center. */}
    <group position={[-1.48, -0.39, 0.90]} rotation={[Math.PI / 2, 0, 0]}>
      <mesh castShadow><cylinderGeometry args={[0.23, 0.26, 0.13, 48]} /><meshStandardMaterial color="#a0abb1" metalness={0.76} roughness={0.42} /></mesh>
      <mesh position={[0, 0.075, 0]}><cylinderGeometry args={[0.145, 0.145, 0.025, 40]} /><meshStandardMaterial color="#4c5961" metalness={0.8} roughness={0.34} /></mesh>
      <mesh position={[0, 0.091, 0]}><torusGeometry args={[0.126, 0.011, 8, 36]} /><meshStandardMaterial color="#c5cdd1" metalness={0.94} roughness={0.22} /></mesh>
    </group>

    {/* [036G] Rounded mounting ears with dark threaded holes along the lower skirt. */}
    {[-1.58, -0.95, -0.32, 0.32, 0.95, 1.58].map((x) => <group key={`mount-ear-${x}`} position={[x, -0.59, 0.84]}>
      <mesh scale={[1.25, 0.9, 0.72]} castShadow>
        <sphereGeometry args={[0.105, 24, 16]} />
        <meshStandardMaterial color="#89959c" metalness={0.76} roughness={0.44} />
      </mesh>
      <mesh position={[0, 0, 0.075]}><cylinderGeometry args={[0.036, 0.036, 0.012, 6]} /><meshStandardMaterial color="#364149" metalness={0.82} roughness={0.3} /></mesh>
    </group>)}

    {/* [036H] Front and rear mating flanges use rounded cast pads rather than square end plates. */}
    {[-1, 1].map((sign) => <group key={`end-flange-${sign}`} position={[sign * 1.76, 0.02, 0]}>
      <mesh rotation={[0, 0, Math.PI / 2]} scale={[1, 1, 1]} castShadow>
        <cylinderGeometry args={[0.58, 0.58, 0.12, 48]} />
        <meshStandardMaterial color="#7f8b92" metalness={0.76} roughness={0.48} />
      </mesh>
      {[-0.42, 0.42].map((y) => [-0.42, 0.42].map((z) => <HexBolt key={`end-bolt-${sign}-${y}-${z}`} position={[sign * 0.075, y, z]} rotation={[0, 0, Math.PI / 2]} scale={0.72} />))}
    </group>)}
  </group>;
}

// [037] Shapes the open lower crankcase with deeper skirt rails, cross webs, and reinforced main-bearing saddles.
function LowerCrankcase() {
  return <group>
    {[-0.65, 0.65].map((z) => <group key={`skirt-${z}`}>
      <mesh position={[0, -0.48, z]} castShadow receiveShadow>
        <boxGeometry args={[3.52, 0.55, 0.15]} />
        <meshStandardMaterial color="#707d85" metalness={0.77} roughness={0.43} />
      </mesh>
      <mesh position={[0, -0.77, z]} castShadow>
        <boxGeometry args={[3.38, 0.10, 0.19]} />
        <meshStandardMaterial color="#58656d" metalness={0.8} roughness={0.4} />
      </mesh>
    </group>)}

    {/* [037A] Cross webs and bearing bulkheads are visible through the open crankcase. */}
    {[-1.2, -0.4, 0.4, 1.2].map((x) => <group key={`bearing-support-${x}`} position={[x, -0.79, 0]}>
      <mesh castShadow><boxGeometry args={[0.30, 0.30, 1.18]} /><meshStandardMaterial color="#65727a" metalness={0.82} roughness={0.36} /></mesh>
      <mesh position={[0, -0.14, 0]} castShadow><boxGeometry args={[0.40, 0.08, 1.28]} /><meshStandardMaterial color="#89959c" metalness={0.82} roughness={0.35} /></mesh>
      {[-0.48, 0.48].map((z) => <HexBolt key={`main-bolt-${x}-${z}`} position={[0, -0.025, z]} scale={0.78} />)}
    </group>)}

    {/* [037B] Machined longitudinal rails frame the crankshaft opening. */}
    {[-0.48, 0.48].map((z) => <mesh key={`inner-rail-${z}`} position={[0, -0.91, z]} castShadow>
      <boxGeometry args={[3.25, 0.09, 0.12]} />
      <meshStandardMaterial color="#a1abb1" metalness={0.88} roughness={0.28} />
    </mesh>)}
  </group>;
}

// [038] Highlights the complete engine block when the pointer hovers over or selects it.
function EngineBlock({ selected, hovered, onSelect, onHover }) {
  const active = selected === 'block' || hovered;
  const geometry = useMemo(() => createBlockGeometry(), []);
  const material = useMetalMaterial('#a2adb3', active, 0.52, 0.68);
  return <group
    onClick={(e) => { e.stopPropagation(); onSelect('block'); }}
    onPointerOver={(e) => { e.stopPropagation(); onHover('block'); }}
    onPointerOut={() => onHover(null)}>
    {/* [039] Main hollow casting and its attached details all select as one engine-block component. */}
    <mesh geometry={geometry} material={material} castShadow receiveShadow />
    <LowerCrankcase />
    <CylinderDeck />
    <BlockSideDetails />
    {/* [040] Adds small flange fasteners along the visible front face. */}
    {[-1.55, -1.05, -0.52, 0, 0.52, 1.05, 1.55].flatMap((x) => [-0.36, 0.36].map((y) =>
      <HexBolt key={`flange-${x}-${y}`} position={[x, y, 0.81]} rotation={[Math.PI / 2, 0, 0]} scale={0.7} />
    ))}
    {/* [040A] Raised casting identification pad and small end-face fasteners. */}
    <mesh position={[1.72, -0.12, 0.83]} castShadow>
      <boxGeometry args={[0.24, 0.18, 0.045]} />
      <meshStandardMaterial color="#a1abb1" metalness={0.72} roughness={0.42} />
    </mesh>
    {[-0.28, 0.28].map((y) => <HexBolt key={`end-fastener-${y}`} position={[1.87, y, 0.22]} rotation={[0, 0, Math.PI / 2]} scale={0.78} />)}
    {/* [041] Adds a subtle wireframe halo when the engine block is active. */}
    {active && <mesh position={[0, 0.1, 0]} scale={[1.012, 1.012, 1.012]}>
      <boxGeometry args={[3.66, 1.76, 1.46]} />
      <meshBasicMaterial color="#4da9e8" wireframe transparent opacity={0.075} />
    </mesh>}
  </group>;
}

// [042] Animates a newly installed assembly down from above the engine into its mounting position.
function InstallMotion({ children, startY = 2.15, duration = 1.25 }) {
  const group = useRef();
  const elapsed = useRef(0);
  useFrame((_, delta) => {
    if (!group.current) return;
    elapsed.current = Math.min(duration, elapsed.current + delta);
    const t = elapsed.current / duration;
    const eased = 1 - Math.pow(1 - t, 3);
    group.current.position.y = startY * (1 - eased);
  });
  return <group ref={group} position={[0, startY, 0]}>{children}</group>;
}

// [043] A helper that aims a cylinder-shaped rod shank between the piston pin and crank pin.
function RodShank({ start, end }) {
  const a = new THREE.Vector3(...start);
  const b = new THREE.Vector3(...end);
  const direction = new THREE.Vector3().subVectors(b, a);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
  return <mesh position={a.clone().add(b).multiplyScalar(0.5).toArray()} quaternion={quaternion} castShadow>
    <cylinderGeometry args={[0.065, 0.085, direction.length(), 16]} />
    <meshStandardMaterial color="#aab4ba" metalness={0.88} roughness={0.27} />
  </mesh>;
}

// [044] Builds four recognizable aluminum pistons with ring grooves, wrist pins, and steel connecting rods.
function PistonRodSet() {
  const centers = [-1.2, -0.4, 0.4, 1.2];
  return <InstallMotion startY={2.0} duration={1.35}>
    {centers.map((x, index) => {
      const crankY = -0.48;
      const pinY = 0.48;
      return <group key={`piston-rod-${index}`}>
        {/* [045] Aluminum piston crown and skirt sit inside one of the four cylinder bores. */}
        <mesh position={[x, 0.66, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.235, 0.25, 0.22, 40]} />
          <meshStandardMaterial color="#c4cbd0" metalness={0.88} roughness={0.24} />
        </mesh>
        {/* [046] Three dark piston-ring grooves provide visible detail without tiny technical clutter. */}
        {[0.57, 0.61, 0.65].map((y, ringIndex) => <mesh key={`ring-${ringIndex}`} position={[x, y, 0]}>
          <torusGeometry args={[0.246, 0.009, 8, 40]} />
          <meshStandardMaterial color={ringIndex === 2 ? '#9aa4aa' : '#343c42'} metalness={0.82} roughness={0.3} />
        </mesh>)}
        {/* [047] Wrist-pin boss and pin connect each piston to its connecting rod. */}
        <mesh position={[x, pinY, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.095, 0.095, 0.42, 32]} />
          <meshStandardMaterial color="#77838b" metalness={0.9} roughness={0.25} />
        </mesh>
        {/* [048] Steel connecting rod shank and small/big ends link the piston to the crankshaft. */}
        <RodShank start={[x, pinY - 0.04, 0]} end={[x, crankY + 0.1, 0]} />
        <mesh position={[x, pinY - 0.03, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.125, 0.125, 0.17, 32]} />
          <meshStandardMaterial color="#9da8ae" metalness={0.9} roughness={0.25} />
        </mesh>
        <mesh position={[x, crankY, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.16, 0.16, 0.2, 36]} />
          <meshStandardMaterial color="#89959d" metalness={0.9} roughness={0.25} />
        </mesh>
        <mesh position={[x, crankY, 0.105]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.115, 0.012, 8, 32]} />
          <meshStandardMaterial color="#d0d6da" metalness={0.94} roughness={0.2} />
        </mesh>
      </group>;
    })}
  </InstallMotion>;
}

// [049] Models a simplified but recognizable crankshaft with main journals, crank webs, and four crank pins.
function Crankshaft() {
  const centers = [-1.2, -0.4, 0.4, 1.2];
  return <InstallMotion startY={-1.4} duration={1.1}>
    <group>
      {/* [050] Main shaft and five bearing journals run lengthwise through the lower crankcase. */}
      <mesh position={[0, -0.64, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.105, 0.105, 3.35, 32]} /><meshStandardMaterial color="#9ca8af" metalness={0.94} roughness={0.22} />
      </mesh>
      {[-1.5, -0.75, 0, 0.75, 1.5].map((x) => <mesh key={`main-journal-${x}`} position={[x, -0.64, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.145, 0.145, 0.22, 32]} /><meshStandardMaterial color="#c0c8cd" metalness={0.95} roughness={0.2} />
      </mesh>)}
      {/* [051] Four offset crank throws provide visible attachment points for the connecting rods. */}
      {centers.map((x, i) => <group key={`throw-${x}`}>
        <mesh position={[x, -0.56, 0]} castShadow>
          <boxGeometry args={[0.16, 0.38, 0.38]} /><meshStandardMaterial color="#737f87" metalness={0.9} roughness={0.28} />
        </mesh>
        <mesh position={[x, -0.48, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.105, 0.105, 0.42, 32]} /><meshStandardMaterial color="#b7c0c5" metalness={0.95} roughness={0.2} />
        </mesh>
      </group>)}
    </group>
  </InstallMotion>;
}

// [052] Models a four-runner exhaust manifold that bolts to the side of the cylinder head.
function ExhaustManifold() {
  const runners = [-0.57, -0.19, 0.19, 0.57];
  const material = new THREE.MeshStandardMaterial({ color: '#777f84', metalness: 0.88, roughness: 0.3 });
  return <InstallMotion startY={0.8} duration={1.05}>
    <group>
      {/* [052A] Long mounting flange aligns with the four exhaust ports on the side of the head. */}
      <mesh position={[0, 0.26, 0.88]} castShadow>
        <boxGeometry args={[3.18, 0.48, 0.12]} />
        <meshStandardMaterial color="#8b9499" metalness={0.9} roughness={0.28} />
      </mesh>
      {runners.map((x, index) => {
        const start = new THREE.Vector3(x * 2, 0.27, 0.96);
        const mid = new THREE.Vector3(x * 1.45, -0.02, 1.18);
        const merge = new THREE.Vector3(0.15, -0.34, 1.34);
        const curve = new THREE.CatmullRomCurve3([start, mid, merge]);
        const geometry = new THREE.TubeGeometry(curve, 24, 0.075, 12, false);
        return <mesh key={`exhaust-runner-${index}`} geometry={geometry} material={material} castShadow />;
      })}
      {/* [052B] Collector outlet joins the four runners into one exhaust pipe. */}
      <mesh position={[0.15, -0.36, 1.35]} rotation={[0.2, 0, 0.15]} castShadow>
        <cylinderGeometry args={[0.14, 0.17, 0.52, 28]} />
        <meshStandardMaterial color="#626b70" metalness={0.9} roughness={0.3} />
      </mesh>
      {runners.map((x, index) => <mesh key={`exhaust-port-${index}`} position={[x * 2, 0.26, 0.95]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.105, 0.018, 10, 28]} />
        <meshStandardMaterial color="#c0c6c9" metalness={0.94} roughness={0.22} />
      </mesh>)}
    </group>
  </InstallMotion>;
}


// [052D] Front accessory-drive hardware. The engine's front face is the positive-X end.
function AccessoryPulley({ position, radius, width = 0.10, color = '#89959c', grooves = 2 }) {
  return <group position={position}>
    <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
      <cylinderGeometry args={[radius, radius, width, 48]} />
      <meshStandardMaterial color={color} metalness={0.9} roughness={0.25} />
    </mesh>
    <mesh rotation={[0, Math.PI / 2, 0]}>
      <torusGeometry args={[radius * 0.76, 0.025, 10, 48]} />
      <meshStandardMaterial color="#c3cbd0" metalness={0.95} roughness={0.2} />
    </mesh>
    {Array.from({ length: grooves }).map((_, i) => (
      <mesh key={`pulley-groove-${i}`} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[radius * (0.82 + i * 0.075), 0.012, 8, 48]} />
        <meshStandardMaterial color="#30383d" metalness={0.72} roughness={0.34} />
      </mesh>
    ))}
    <mesh rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[radius * 0.24, radius * 0.24, width + 0.025, 32]} />
      <meshStandardMaterial color="#515d65" metalness={0.9} roughness={0.26} />
    </mesh>
  </group>;
}

function AccessoryHousing({ position, radius, depth = 0.42, color = '#8e999f' }) {
  return <group position={position}>
    <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
      <cylinderGeometry args={[radius, radius * 0.92, depth, 48]} />
      <meshStandardMaterial color={color} metalness={0.82} roughness={0.34} />
    </mesh>
    <mesh position={[0.02, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
      <torusGeometry args={[radius * 0.86, 0.025, 10, 48]} />
      <meshStandardMaterial color="#c2cbd0" metalness={0.94} roughness={0.22} />
    </mesh>
  </group>;
}

// [052E] Renders each accessory as its own selectable and installable component.
function AccessoryComponent({ id }) {
  const beltGeometry = useMemo(() => {
    const points = [
      [2.40, -1.12, 0.04], [2.40, -1.00, 0.38], [2.40, -0.68, 0.60],
      [2.40, -0.27, 0.66], [2.40, 0.14, 0.62], [2.40, 0.64, 0.53],
      [2.40, 1.02, 0.25], [2.40, 1.04, -0.18], [2.40, 0.82, -0.58],
      [2.40, 0.36, -0.77], [2.40, -0.15, -0.75], [2.40, -0.62, -0.54],
      [2.40, -0.98, -0.30]
    ].map((p) => new THREE.Vector3(...p));
    const curve = new THREE.CatmullRomCurve3(points, true, 'catmullrom', 0.25);
    return new THREE.TubeGeometry(curve, 180, 0.038, 10, true);
  }, []);

  let component = null;
  if (id === 'crankshaftPulley') component = <group>
    <mesh position={[1.98, -0.68, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
      <cylinderGeometry args={[0.24, 0.24, 0.30, 48]} />
      <meshStandardMaterial color="#5f6a72" metalness={0.9} roughness={0.3} />
    </mesh>
    <AccessoryPulley position={[2.22, -0.68, 0]} radius={0.39} width={0.16} color="#77838b" grooves={4} />
    <mesh position={[2.32, -0.68, 0]} rotation={[0, Math.PI / 2, 0]}>
      <torusGeometry args={[0.39, 0.022, 10, 64]} />
      <meshStandardMaterial color="#c5cdd1" metalness={0.95} roughness={0.2} />
    </mesh>
  </group>;

  if (id === 'waterPump') component = <group>
    <AccessoryHousing position={[2.03, 0.20, 0.02]} radius={0.28} depth={0.42} color="#a4afb5" />
    <mesh position={[1.86, 0.20, 0.02]} rotation={[0, 0, Math.PI / 2]} castShadow>
      <cylinderGeometry args={[0.20, 0.20, 0.13, 40]} />
      <meshStandardMaterial color="#65727a" metalness={0.85} roughness={0.32} />
    </mesh>
    <AccessoryPulley position={[2.30, 0.20, 0.02]} radius={0.27} width={0.12} color="#8b969c" grooves={3} />
    <mesh position={[1.78, 0.20, 0.02]} rotation={[0, Math.PI / 2, 0]}>
      <torusGeometry args={[0.24, 0.025, 10, 48]} />
      <meshStandardMaterial color="#c5cdd1" metalness={0.9} roughness={0.22} />
    </mesh>
  </group>;

  if (id === 'alternator') component = <group>
    <AccessoryHousing position={[2.03, 0.80, 0.22]} radius={0.28} depth={0.48} color="#aeb8bd" />
    {Array.from({ length: 12 }).map((_, i) => (
      <mesh key={`alt-vent-${i}`} position={[2.02, 0.80 + Math.sin(i * Math.PI / 6) * 0.20, 0.22 + Math.cos(i * Math.PI / 6) * 0.20]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.035, 0.045, 0.20]} />
        <meshStandardMaterial color="#56636b" metalness={0.82} roughness={0.36} />
      </mesh>
    ))}
    <AccessoryPulley position={[2.31, 0.80, 0.22]} radius={0.24} width={0.12} color="#7f8b92" grooves={4} />
    <mesh position={[2.29, 1.10, 0.22]} castShadow>
      <boxGeometry args={[0.34, 0.13, 0.15]} />
      <meshStandardMaterial color="#727e85" metalness={0.82} roughness={0.36} />
    </mesh>
  </group>;

  if (id === 'powerSteeringPump') component = <group>
    <AccessoryHousing position={[2.02, -0.20, 0.50]} radius={0.23} depth={0.42} color="#7c8991" />
    <mesh position={[2.00, 0.05, 0.50]} castShadow>
      <cylinderGeometry args={[0.13, 0.13, 0.34, 36]} />
      <meshStandardMaterial color="#929da3" metalness={0.8} roughness={0.35} />
    </mesh>
    <AccessoryPulley position={[2.30, -0.20, 0.50]} radius={0.22} width={0.12} color="#8b969c" grooves={3} />
    <mesh position={[1.79, -0.20, 0.50]} rotation={[0, Math.PI / 2, 0]}>
      <torusGeometry args={[0.19, 0.02, 8, 40]} />
      <meshStandardMaterial color="#c5cdd1" metalness={0.92} roughness={0.22} />
    </mesh>
  </group>;

  if (id === 'beltTensioner') component = <group>
    <mesh position={[2.02, 0.02, -0.48]} rotation={[0, 0, Math.PI / 2]} castShadow>
      <cylinderGeometry args={[0.18, 0.18, 0.22, 40]} />
      <meshStandardMaterial color="#66737b" metalness={0.85} roughness={0.32} />
    </mesh>
    <AccessoryPulley position={[2.30, 0.02, -0.48]} radius={0.18} width={0.10} color="#a3adb3" grooves={1} />
    <mesh position={[1.96, -0.18, -0.48]} rotation={[0, 0, -0.35]} castShadow>
      <boxGeometry args={[0.20, 0.42, 0.13]} />
      <meshStandardMaterial color="#707d85" metalness={0.8} roughness={0.34} />
    </mesh>
  </group>;

  if (id === 'idlerPulley') component = <group>
    <mesh position={[2.02, 0.68, -0.48]} rotation={[0, 0, Math.PI / 2]} castShadow>
      <cylinderGeometry args={[0.15, 0.15, 0.22, 40]} />
      <meshStandardMaterial color="#65727a" metalness={0.85} roughness={0.3} />
    </mesh>
    <AccessoryPulley position={[2.30, 0.68, -0.48]} radius={0.17} width={0.10} color="#aab4ba" grooves={1} />
  </group>;

  if (id === 'serpentineBelt') component = <mesh geometry={beltGeometry} castShadow receiveShadow>
    <meshStandardMaterial color="#20262b" roughness={0.78} metalness={0.08} />
  </mesh>;

  return <InstallMotion startY={0.75} duration={1.15}>{component}</InstallMotion>;
}

// [052C] Displays installed crankshaft, pistons, cylinder head, oil pan, or exhaust manifold.
function InstalledPart({ id }) {
  if (id === 'crankshaft') return <Crankshaft />;
  if (id === 'pistons') return <PistonRodSet />;
  if (id === 'head') return <InstallMotion startY={1.4} duration={1.0}>
    <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
      <boxGeometry args={[3.72, 0.42, 1.5]} />
      <meshStandardMaterial color="#b5bdc2" metalness={0.82} roughness={0.3} />
    </mesh>
  </InstallMotion>;
  if (id === 'oilpan') return <InstallMotion startY={-1.2} duration={1.0}>
    <mesh position={[0, -1.12, 0]} castShadow receiveShadow>
      <boxGeometry args={[3.28, 0.32, 1.25]} />
      <meshStandardMaterial color="#454f57" metalness={0.78} roughness={0.32} />
    </mesh>
  </InstallMotion>;
  if (id === 'exhaustManifold') return <ExhaustManifold />;
  if (['crankshaftPulley', 'waterPump', 'alternator', 'powerSteeringPump', 'beltTensioner', 'idlerPulley', 'serpentineBelt'].includes(id)) {
    return <AccessoryComponent id={id} />;
  }
  return null;
}

// [053] Invisible, clickable installation zones make the 3D engine itself the parts menu.
function InstallationPickZones({ installed, hovered, onSelect, onHover }) {
  const topPart = installed.includes('pistons') ? 'head' : 'pistons';
  const zones = [
    // The top deck selects the piston assembly first, then the cylinder head after pistons are installed.
    { id: topPart, position: [0, 1.035, 0], size: [3.22, 0.09, 1.18] },
    // The four-port side face selects the exhaust manifold.
    { id: 'exhaustManifold', position: [0, 0.25, 0.91], size: [3.35, 0.58, 0.12] },
    // The lower central crankcase is selected from underneath using the Bottom camera view.
    { id: 'crankshaft', position: [0, -0.985, 0], size: [3.02, 0.10, 0.92] },
    // The oil-pan mounting flange is a separate lower side-edge target to avoid covering the crankshaft target.
    { id: 'oilpan', position: [0, -0.99, 0.72], size: [3.12, 0.18, 0.12] },
    // Accessory-drive locations sit on the positive-X front face of the engine.
    { id: 'crankshaftPulley', position: [2.34, -0.68, 0], size: [0.14, 0.78, 0.78] },
    { id: 'waterPump', position: [2.34, 0.20, 0.02], size: [0.14, 0.56, 0.56] },
    { id: 'alternator', position: [2.34, 0.80, 0.22], size: [0.14, 0.48, 0.48] },
    { id: 'powerSteeringPump', position: [2.34, -0.20, 0.50], size: [0.14, 0.44, 0.44] },
    { id: 'beltTensioner', position: [2.34, 0.02, -0.48], size: [0.14, 0.36, 0.36] },
    { id: 'idlerPulley', position: [2.34, 0.68, -0.48], size: [0.14, 0.36, 0.36] },
    // A small lower loop section is the belt's dedicated pick target once the pulleys are in place.
    { id: 'serpentineBelt', position: [2.43, -0.18, -0.76], size: [0.12, 0.42, 0.16] }
  ];

  return <group>
    {zones.map((zone) => {
      const active = hovered === zone.id;
      return <mesh
        key={zone.id}
        position={zone.position}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(zone.id);
        }}
        onPointerOver={(event) => {
          event.stopPropagation();
          onHover(zone.id);
        }}
        onPointerOut={() => onHover(null)}
      >
        <boxGeometry args={zone.size} />
        <meshBasicMaterial
          color={active ? '#39a9ed' : '#ffffff'}
          transparent
          opacity={active ? 0.22 : 0}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>;
    })}
  </group>;
}

// [053] Provides camera presets while retaining user orbit, pan, and zoom controls.
function SelectableInstalledPart({ id, selected, hovered, onSelect, onHover }) {
  const active = selected === id || hovered === id;
  const bounds = {
    crankshaft: { position: [0, -0.62, 0], size: [3.48, 0.58, 0.72] },
    pistons: { position: [0, 0.12, 0], size: [3.42, 1.18, 0.72] },
    head: { position: [0, 1.2, 0], size: [3.82, 0.48, 1.58] },
    oilpan: { position: [0, -1.12, 0], size: [3.38, 0.42, 1.34] },
    exhaustManifold: { position: [0, 0.02, 1.12], size: [3.48, 0.78, 0.62] },
    crankshaftPulley: { position: [2.28, -0.68, 0], size: [0.30, 0.86, 0.86] },
    waterPump: { position: [2.16, 0.20, 0.02], size: [0.60, 0.62, 0.62] },
    alternator: { position: [2.16, 0.80, 0.22], size: [0.62, 0.56, 0.56] },
    powerSteeringPump: { position: [2.16, -0.20, 0.50], size: [0.62, 0.52, 0.52] },
    beltTensioner: { position: [2.16, 0.02, -0.48], size: [0.56, 0.42, 0.42] },
    idlerPulley: { position: [2.16, 0.68, -0.48], size: [0.56, 0.42, 0.42] },
    serpentineBelt: { position: [2.40, -0.02, -0.04], size: [0.16, 2.35, 1.55] }
  }[id];

  return <group
    onClick={(e) => { e.stopPropagation(); onSelect(id); }}
    onPointerOver={(e) => { e.stopPropagation(); onHover(id); }}
    onPointerOut={() => onHover(null)}>
    <InstalledPart id={id} />
    {active && bounds && <mesh position={bounds.position}>
      <boxGeometry args={bounds.size} />
      <meshBasicMaterial color="#3da9e8" wireframe transparent opacity={0.42} />
    </mesh>}
  </group>;
}

// [055] Tracks the hovered component by ID so each visible installed part can highlight and select independently.
export default function EngineScene({ selected, installed, onSelect, view }) {
  const [hovered, setHovered] = useState(null);
  const cameraPositions = {
    isometric: [4.8, 3.7, 5.8], front: [0, 1.2, 7],
    top: [0, 8, 0.01], side: [7, 1.2, 0], bottom: [0, -7, 0.01]
  };
  return <Canvas shadows camera={{ position: cameraPositions[view] || cameraPositions.isometric, fov: 36 }} dpr={[1, 2]}>
    <color attach="background" args={['#ffffff']} />
    {/* [054] Studio lighting and soft contact shadows reveal casting contours on the white workspace. */}
    <ambientLight intensity={1.05} />
    <directionalLight position={[4.5, 7, 5]} intensity={2.25} castShadow shadow-mapSize={[2048, 2048]} />
    <directionalLight position={[-5, 3, -4]} intensity={0.85} />
    <spotLight position={[0, 6, 1]} intensity={0.65} angle={0.65} penumbra={0.7} />
    <group rotation={[0.04, -0.42, 0]}>
      <EngineBlock selected={selected} hovered={hovered === 'block'} onSelect={onSelect} onHover={setHovered} />
      <InstallationPickZones installed={installed} hovered={hovered} onSelect={onSelect} onHover={setHovered} />
      {installed.map((id) => <SelectableInstalledPart key={id} id={id} selected={selected} hovered={hovered === id} onSelect={onSelect} onHover={setHovered} />)}
    </group>
    <ContactShadows position={[0, -1.34, 0]} opacity={0.2} scale={8} blur={2.8} far={3} />
    <Environment preset="studio" />
    <OrbitControls makeDefault enableDamping dampingFactor={0.08} minDistance={3.2} maxDistance={11} target={[0, 0, 0]} />
  </Canvas>;
}
