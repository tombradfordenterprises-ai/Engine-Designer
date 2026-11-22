
// [030] Imports React, React Three Fiber, camera controls, studio lighting, and Three.js geometry utilities.
import React, { useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

// [031] Creates a reusable metallic material with optional selection glow for the engine casting.
function useMetalMaterial(color, active = false, roughness = 0.42, metalness = 0.72) {
  return useMemo(() => new THREE.MeshStandardMaterial({
    color: active ? '#70b9e8' : color,
    metalness,
    roughness,
    emissive: active ? '#15547c' : '#000000',
    emissiveIntensity: active ? 0.24 : 0
  }), [color, active, roughness, metalness]);
}

// [032] Creates a softly beveled cast-metal component body.
function CastingBox({ position, size, color = '#89949b', radius = 0.06, active = false, onClick, onHover }) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    const w = size[0], h = size[1], r = Math.min(radius, size[0] / 3, size[1] / 3);
    shape.moveTo(-w / 2 + r, -h / 2);
    shape.lineTo(w / 2 - r, -h / 2);
    shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
    shape.lineTo(w / 2, h / 2 - r);
    shape.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
    shape.lineTo(-w / 2 + r, h / 2);
    shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
    shape.lineTo(-w / 2, -h / 2 + r);
    shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
    const geo = new THREE.ExtrudeGeometry(shape, { depth: size[2], bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.025, bevelThickness: 0.025 });
    geo.translate(0, 0, -size[2] / 2);
    return geo;
  }, [size, radius]);
  const material = useMetalMaterial(color, active);
  return <mesh geometry={geometry} position={position} material={material} castShadow receiveShadow
    onClick={onClick} onPointerOver={(e) => { e.stopPropagation(); onHover?.(true); }}
    onPointerOut={() => onHover?.(false)} />;
}

// [033] Creates a small metallic hex fastener used around the block's flanges and bearing caps.
function HexBolt({ position, rotation = [0, 0, 0], scale = 1, color = '#c2c8cc' }) {
  return <group position={position} rotation={rotation} scale={scale}>
    <mesh castShadow><cylinderGeometry args={[0.055, 0.055, 0.035, 6]} /><meshStandardMaterial color={color} metalness={0.88} roughness={0.26} /></mesh>
    <mesh position={[0, 0.019, 0]}><cylinderGeometry args={[0.018, 0.018, 0.006, 12]} /><meshStandardMaterial color="#626b72" metalness={0.85} roughness={0.3} /></mesh>
  </group>;
}

// [034] Creates each cylinder opening with a machined metal rim, dark bore, and inner liner detail.
function DeckBore({ x, y, z, radius = 0.315 }) {
  return <group position={[x, y, z]}>
    <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[radius, 0.026, 12, 56]} /><meshStandardMaterial color="#b7c0c5" metalness={0.92} roughness={0.22} /></mesh>
    <mesh position={[0, -0.012, 0]}><cylinderGeometry args={[radius - 0.025, radius - 0.025, 0.018, 48]} /><meshStandardMaterial color="#242a2f" metalness={0.52} roughness={0.34} /></mesh>
    <mesh position={[0, -0.024, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[radius - 0.055, 0.009, 8, 48]} /><meshStandardMaterial color="#59636a" metalness={0.9} roughness={0.3} /></mesh>
  </group>;
}

// [035] Models the four-cylinder deck, bore openings, head-bolt holes, and coolant passages.
function CylinderDeck() {
  const centers = [-1.2, -0.4, 0.4, 1.2];
  const boltXs = [-1.55, -0.8, 0, 0.8, 1.55];
  const boltZs = [-0.49, 0.49];
  return <group>
    <mesh position={[0, 0.94, 0]} castShadow receiveShadow><boxGeometry args={[3.72, 0.16, 1.48]} /><meshStandardMaterial color="#aeb8be" metalness={0.78} roughness={0.32} /></mesh>
    {centers.map((x) => <DeckBore key={`bore-${x}`} x={x} y={1.035} z={0} />)}
    {boltXs.flatMap((x) => boltZs.map((z) => <group key={`headbolt-${x}-${z}`} position={[x, 1.035, z]}>
      <mesh><cylinderGeometry args={[0.047, 0.047, 0.018, 20]} /><meshStandardMaterial color="#333b41" metalness={0.65} roughness={0.35} /></mesh>
      <mesh position={[0, -0.012, 0]}><torusGeometry args={[0.035, 0.006, 8, 24]} /><meshStandardMaterial color="#c5cdd1" metalness={0.9} roughness={0.25} /></mesh>
    </group>))}
    {[-1.62, -0.98, -0.65, 0.65, 0.98, 1.62].map((x, i) => <mesh key={`coolant-${i}`} position={[x, 1.035, i % 2 ? 0.48 : -0.48]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.055, 0.055, 0.018, 24]} /><meshStandardMaterial color="#313b42" metalness={0.55} roughness={0.38} />
    </mesh>)}
  </group>;
}

// [036] Adds casting ribs, freeze plugs, and machined bosses to the visible sides of the block.
function BlockSideDetails() {
  return <group>
    {Array.from({ length: 9 }, (_, i) => <mesh key={`rib-front-${i}`} position={[-1.55 + i * 0.39, 0.08, 0.755]} castShadow>
      <boxGeometry args={[0.075, 0.92 - (i % 3) * 0.08, 0.07]} /><meshStandardMaterial color="#737f87" metalness={0.7} roughness={0.43} />
    </mesh>)}
    {Array.from({ length: 7 }, (_, i) => <mesh key={`rib-rear-${i}`} position={[-1.35 + i * 0.45, 0.02, -0.755]} castShadow>
      <boxGeometry args={[0.065, 0.82, 0.065]} /><meshStandardMaterial color="#75818a" metalness={0.7} roughness={0.44} />
    </mesh>)}
    {[-1.25, -0.42, 0.42, 1.25].map((x) => <group key={`plug-${x}`} position={[x, 0.24, 0.79]} rotation={[Math.PI / 2, 0, 0]}>
      <mesh castShadow><cylinderGeometry args={[0.17, 0.17, 0.055, 40]} /><meshStandardMaterial color="#aeb8bd" metalness={0.86} roughness={0.26} /></mesh>
      <mesh position={[0, 0.03, 0]}><cylinderGeometry args={[0.125, 0.125, 0.012, 40]} /><meshStandardMaterial color="#737e85" metalness={0.82} roughness={0.34} /></mesh>
    </group>)}
    <mesh position={[1.88, 0.12, 0.22]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.19, 0.22, 0.18, 40]} /><meshStandardMaterial color="#89969e" metalness={0.75} roughness={0.4} /></mesh>
    <mesh position={[-1.88, 0.12, -0.18]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.15, 0.18, 0.18, 40]} /><meshStandardMaterial color="#89969e" metalness={0.75} roughness={0.4} /></mesh>
    {[-1.65, -0.55, 0.55, 1.65].map((x) => <mesh key={`side-boss-${x}`} position={[x, -0.52, 0.78]} castShadow>
      <cylinderGeometry args={[0.095, 0.095, 0.08, 24]} /><meshStandardMaterial color="#9da8ae" metalness={0.8} roughness={0.3} />
    </mesh>)}
  </group>;
}

// [037] Builds the lower crankcase skirt, bearing-cap shapes, and visible main fasteners.
function LowerCrankcase() {
  return <group>
    <mesh position={[0, -0.58, 0]} castShadow receiveShadow><boxGeometry args={[3.45, 0.48, 1.34]} /><meshStandardMaterial color="#7c8991" metalness={0.74} roughness={0.42} /></mesh>
    {[-1.2, -0.4, 0.4, 1.2].map((x) => <group key={`cap-${x}`} position={[x, -0.82, 0]}>
      <mesh castShadow><boxGeometry args={[0.42, 0.28, 1.22]} /><meshStandardMaterial color="#68757e" metalness={0.78} roughness={0.36} /></mesh>
      {[-0.42, 0.42].map((z) => <HexBolt key={`mainbolt-${x}-${z}`} position={[0, -0.02, z]} scale={0.8} />)}
    </group>)}
    <mesh position={[0, -0.92, 0]} castShadow><boxGeometry args={[3.62, 0.12, 1.5]} /><meshStandardMaterial color="#59656d" metalness={0.75} roughness={0.42} /></mesh>
  </group>;
}

// [038] Combines the main casting, cylinder deck, lower crankcase, ribs, bosses, and flange bolts.
function EngineBlock({ selected, hovered, onSelect, onHover }) {
  const active = selected === 'block' || hovered;
  const bodyMaterial = useMetalMaterial('#89959d', active, 0.43, 0.72);
  return <group>
    {/* [039] Main cast body and upper shoulder establish the block's silhouette and metallic finish. */}
    <mesh position={[0, 0.05, 0]} material={bodyMaterial} castShadow receiveShadow
      onClick={(e) => { e.stopPropagation(); onSelect('block'); }}
      onPointerOver={(e) => { e.stopPropagation(); onHover(true); }}
      onPointerOut={() => onHover(false)}>
      <boxGeometry args={[3.58, 1.55, 1.38]} />
    </mesh>
    <mesh position={[0, 0.65, 0]} castShadow receiveShadow><boxGeometry args={[3.68, 0.28, 1.46]} /><meshStandardMaterial color="#929ea6" metalness={0.74} roughness={0.38} /></mesh>
    <LowerCrankcase />
    <CylinderDeck />
    <BlockSideDetails />
    {/* [040] Adds visible fasteners along the side flange for a more convincing mechanical casting. */}
    {[-1.55, -1.05, -0.52, 0, 0.52, 1.05, 1.55].flatMap((x) => [-0.36, 0.36].map((y) =>
      <HexBolt key={`flange-${x}-${y}`} position={[x, y, 0.81]} rotation={[Math.PI / 2, 0, 0]} scale={0.72} />
    ))}
    {/* [041] Adds a subtle selection wireframe around the block when it is selected. */}
    {active && <mesh position={[0, 0.05, 0]} scale={[1.012, 1.012, 1.012]}>
      <boxGeometry args={[3.58, 1.55, 1.38]} /><meshBasicMaterial color="#4da9e8" wireframe transparent opacity={0.16} />
    </mesh>}
  </group>;
}

// [042] Displays the first installed components as simple, recognizable geometry after automatic installation.
function InstalledPart({ id }) {
  const common = { metalness: 0.78, roughness: 0.3 };
  if (id === 'head') return <mesh position={[0, 1.28, 0]} castShadow receiveShadow><boxGeometry args={[3.72, 0.42, 1.5]} /><meshStandardMaterial color="#b5bdc2" {...common} /></mesh>;
  if (id === 'oilpan') return <mesh position={[0, -1.12, 0]} castShadow receiveShadow><boxGeometry args={[3.28, 0.32, 1.25]} /><meshStandardMaterial color="#454f57" {...common} /></mesh>;
  if (id === 'crankshaft') return <group position={[0, -0.35, 0]}>
    <mesh castShadow><cylinderGeometry args={[0.09, 0.09, 3.05, 32]} /><meshStandardMaterial color="#aeb8be" {...common} /></mesh>
    {[-1.2, -0.4, 0.4, 1.2].map((x) => <mesh key={x} position={[x, 0.04, 0]} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.16, 0.16, 0.2, 32]} /><meshStandardMaterial color="#707b83" {...common} />
    </mesh>)}
  </group>;
  if (id === 'pistons') return <group>{[-1.2, -0.4, 0.4, 1.2].map((x) => <mesh key={x} position={[x, 0.88, 0]} castShadow>
    <cylinderGeometry args={[0.22, 0.22, 0.12, 32]} /><meshStandardMaterial color="#c5cdd1" {...common} />
  </mesh>)}</group>;
  return null;
}

// [043] Provides camera presets while retaining user orbit, pan, and zoom controls.
export default function EngineScene({ selected, installed, onSelect, view }) {
  const [hovered, setHovered] = useState(false);
  const cameraPositions = {
    isometric: [4.8, 3.7, 5.8], front: [0, 1.2, 7],
    top: [0, 8, 0.01], side: [7, 1.2, 0], bottom: [0, -7, 0.01]
  };
  return <Canvas shadows camera={{ position: cameraPositions[view] || cameraPositions.isometric, fov: 36 }} dpr={[1, 2]}>
    <color attach="background" args={['#ffffff']} />
    {/* [044] Studio lighting and soft contact shadows emphasize the metallic casting on a white background. */}
    <ambientLight intensity={1.05} />
    <directionalLight position={[4.5, 7, 5]} intensity={2.25} castShadow shadow-mapSize={[2048, 2048]} />
    <directionalLight position={[-5, 3, -4]} intensity={0.85} />
    <spotLight position={[0, 6, 1]} intensity={0.65} angle={0.65} penumbra={0.7} />
    <group rotation={[0.04, -0.42, 0]}>
      <EngineBlock selected={selected} hovered={hovered} onSelect={onSelect} onHover={setHovered} />
      {installed.map((id) => <InstalledPart key={id} id={id} />)}
    </group>
    <ContactShadows position={[0, -1.34, 0]} opacity={0.2} scale={8} blur={2.8} far={3} />
    <Environment preset="studio" />
    <OrbitControls makeDefault enableDamping dampingFactor={0.08} minDistance={3.2} maxDistance={11} target={[0, 0, 0]} />
  </Canvas>;
}
