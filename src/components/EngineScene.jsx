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

// [032] Builds the block casting with four real openings cut through the deck instead of painted-on circles.
function createBlockGeometry() {
  const shape = new THREE.Shape();
  const w = 3.58, d = 1.38, r = 0.09;
  shape.moveTo(-w / 2 + r, -d / 2);
  shape.lineTo(w / 2 - r, -d / 2);
  shape.quadraticCurveTo(w / 2, -d / 2, w / 2, -d / 2 + r);
  shape.lineTo(w / 2, d / 2 - r);
  shape.quadraticCurveTo(w / 2, d / 2, w / 2 - r, d / 2);
  shape.lineTo(-w / 2 + r, d / 2);
  shape.quadraticCurveTo(-w / 2, d / 2, -w / 2, d / 2 - r);
  shape.lineTo(-w / 2, -d / 2 + r);
  shape.quadraticCurveTo(-w / 2, -d / 2, -w / 2 + r, -d / 2);

  // [033] Cuts four cylinder bores into the block geometry so pistons can visibly sit inside the cylinders.
  [-1.2, -0.4, 0.4, 1.2].forEach((x) => {
    const hole = new THREE.Path();
    hole.absarc(x, 0, 0.29, 0, Math.PI * 2, true);
    shape.holes.push(hole);
  });

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 1.7, bevelEnabled: true, bevelSegments: 2,
    steps: 1, bevelSize: 0.025, bevelThickness: 0.025, curveSegments: 32
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
  </group>;
}

// [036] Adds side casting ribs, freeze plugs, and machined mounting bosses.
function BlockSideDetails() {
  return <group>
    {Array.from({ length: 9 }, (_, i) => <mesh key={`rib-front-${i}`} position={[-1.55 + i * 0.39, 0.08, 0.755]} castShadow>
      <boxGeometry args={[0.075, 0.92 - (i % 3) * 0.08, 0.07]} /><meshStandardMaterial color="#737f87" metalness={0.72} roughness={0.42} />
    </mesh>)}
    {Array.from({ length: 7 }, (_, i) => <mesh key={`rib-rear-${i}`} position={[-1.35 + i * 0.45, 0.02, -0.755]} castShadow>
      <boxGeometry args={[0.065, 0.82, 0.065]} /><meshStandardMaterial color="#75818a" metalness={0.7} roughness={0.44} />
    </mesh>)}
    {[-1.25, -0.42, 0.42, 1.25].map((x) => <group key={`freeze-plug-${x}`} position={[x, 0.24, 0.79]} rotation={[Math.PI / 2, 0, 0]}>
      <mesh castShadow><cylinderGeometry args={[0.17, 0.17, 0.055, 40]} /><meshStandardMaterial color="#aeb8bd" metalness={0.86} roughness={0.26} /></mesh>
      <mesh position={[0, 0.03, 0]}><cylinderGeometry args={[0.125, 0.125, 0.012, 40]} /><meshStandardMaterial color="#737e85" metalness={0.82} roughness={0.34} /></mesh>
    </group>)}
    <mesh position={[1.88, 0.12, 0.22]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.19, 0.22, 0.18, 40]} /><meshStandardMaterial color="#89969e" metalness={0.75} roughness={0.4} /></mesh>
    <mesh position={[-1.88, 0.12, -0.18]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.15, 0.18, 0.18, 40]} /><meshStandardMaterial color="#89969e" metalness={0.75} roughness={0.4} /></mesh>
    {[-1.65, -0.55, 0.55, 1.65].map((x) => <mesh key={`boss-${x}`} position={[x, -0.52, 0.78]} castShadow>
      <cylinderGeometry args={[0.095, 0.095, 0.08, 24]} /><meshStandardMaterial color="#9da8ae" metalness={0.8} roughness={0.3} />
    </mesh>)}
  </group>;
}

// [037] Leaves the crankcase underside open while adding skirt rails and bearing-cap supports.
function LowerCrankcase() {
  return <group>
    {[-0.65, 0.65].map((z) => <mesh key={`skirt-${z}`} position={[0, -0.55, z]} castShadow receiveShadow>
      <boxGeometry args={[3.48, 0.43, 0.13]} /><meshStandardMaterial color="#75828a" metalness={0.75} roughness={0.42} />
    </mesh>)}
    {[-1.2, -0.4, 0.4, 1.2].map((x) => <group key={`bearing-support-${x}`} position={[x, -0.79, 0]}>
      <mesh castShadow><boxGeometry args={[0.34, 0.24, 1.12]} /><meshStandardMaterial color="#68757e" metalness={0.8} roughness={0.36} /></mesh>
      {[-0.43, 0.43].map((z) => <HexBolt key={`main-bolt-${x}-${z}`} position={[0, -0.02, z]} scale={0.78} />)}
    </group>)}
  </group>;
}

// [038] Highlights the complete engine block when the pointer hovers over or selects it.
function EngineBlock({ selected, hovered, onSelect, onHover }) {
  const active = selected === 'block' || hovered;
  const geometry = useMemo(() => createBlockGeometry(), []);
  const material = useMetalMaterial('#89959d', active, 0.43, 0.74);
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
    {/* [041] Adds a subtle wireframe halo when the engine block is active. */}
    {active && <mesh position={[0, 0.1, 0]} scale={[1.012, 1.012, 1.012]}>
      <boxGeometry args={[3.58, 1.7, 1.38]} /><meshBasicMaterial color="#4da9e8" wireframe transparent opacity={0.12} />
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

// [052] Displays installed crankshaft, piston-and-rod assembly, cylinder head, or oil pan components.
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
  return null;
}

// [053] Provides camera presets while retaining user orbit, pan, and zoom controls.
function SelectableInstalledPart({ id, selected, hovered, onSelect, onHover }) {
  return <group
    onClick={(e) => { e.stopPropagation(); onSelect(id); }}
    onPointerOver={(e) => { e.stopPropagation(); onHover(id); }}
    onPointerOut={() => onHover(null)}>
    <InstalledPart id={id} />
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
      {installed.map((id) => <SelectableInstalledPart key={id} id={id} selected={selected} hovered={hovered === id} onSelect={onSelect} onHover={setHovered} />)}
    </group>
    <ContactShadows position={[0, -1.34, 0]} opacity={0.2} scale={8} blur={2.8} far={3} />
    <Environment preset="studio" />
    <OrbitControls makeDefault enableDamping dampingFactor={0.08} minDistance={3.2} maxDistance={11} target={[0, 0, 0]} />
  </Canvas>;
}
