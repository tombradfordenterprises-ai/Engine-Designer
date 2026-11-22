// [080] Real CAD-based inline-four scene. Component meshes are loaded from the CC0 STEP-derived GLB.
import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, OrbitControls, useGLTF } from '@react-three/drei';
import manifest from '../data/enginePartManifest.json';

const MODEL_URL = '/models/inline_four_engine.glb';
const CAMERA_POSITIONS = {
  isometric: [-3.4, 2.7, 4.2],
  front: [-4.5, 1.0, 0.15],
  top: [0, 5.2, 0.01],
  side: [0.1, 1.5, 4.6],
  bottom: [0, -5.0, 0.01]
};

// [081] Parts in this CAD model that are relevant to the gasoline engine assembly.
// The manual flywheel group is intentionally excluded because this project uses an automatic transmission.
const ACTIVE_PART_IDS = [
  'engineBlock', 'crankshaft', 'pistonsRods', 'headGasket', 'cylinderHead',
  'valvetrain', 'valveCover', 'oilPan', 'timingCovers', 'crankPulley',
  'alternator', 'accessoryBelt', 'intakeManifold', 'exhaustManifold', 'oilFilter'
];

// [082] Offsets make each CAD component appear to move into its actual assembled position.
const INSTALL_OFFSETS = {
  crankshaft: [0, 0, -0.18],
  pistonsRods: [0, 0, 0.16],
  headGasket: [0, 0, 0.12],
  cylinderHead: [0, 0, 0.22],
  valvetrain: [0, 0, 0.16],
  valveCover: [0, 0, 0.20],
  oilPan: [0, 0, -0.18],
  timingCovers: [-0.16, 0, 0],
  crankPulley: [-0.18, 0, 0],
  alternator: [0, -0.18, 0],
  accessoryBelt: [0, -0.18, 0],
  intakeManifold: [0, -0.16, 0],
  exhaustManifold: [0, 0.16, 0],
  oilFilter: [0, 0.15, 0]
};

// [083] Click targets are positioned just outside the relevant CAD surfaces.
// They are intentionally separate from the model meshes so uninstalled parts can still be selected.
const PICK_ZONES = [
  { id: 'crankshaft', position: [0, 0, 0.075], size: [0.40, 0.22, 0.035] },
  { id: 'pistonsRods', position: [0, 0, 0.505], size: [0.42, 0.19, 0.035] },
  { id: 'headGasket', position: [0, 0, 0.515], size: [0.42, 0.19, 0.025] },
  { id: 'cylinderHead', position: [0, 0, 0.605], size: [0.45, 0.24, 0.075] },
  { id: 'valvetrain', position: [0, 0, 0.615], size: [0.42, 0.19, 0.025] },
  { id: 'valveCover', position: [0, 0, 0.690], size: [0.45, 0.24, 0.035] },
  { id: 'oilPan', position: [0, 0, -0.012], size: [0.46, 0.25, 0.035] },
  { id: 'timingCovers', position: [-0.247, 0, 0.36], size: [0.035, 0.23, 0.49] },
  { id: 'timingCovers', position: [0.247, 0, 0.36], size: [0.035, 0.23, 0.49] },
  { id: 'crankPulley', position: [-0.318, 0, 0.225], size: [0.035, 0.17, 0.17] },
  { id: 'alternator', position: [-0.205, -0.245, 0.34], size: [0.15, 0.035, 0.13] },
  { id: 'accessoryBelt', position: [-0.278, -0.225, 0.26], size: [0.035, 0.035, 0.23] },
  { id: 'intakeManifold', position: [0.02, -0.285, 0.55], size: [0.43, 0.035, 0.12] },
  { id: 'exhaustManifold', position: [0.02, 0.278, 0.48], size: [0.43, 0.035, 0.14] },
  { id: 'oilFilter', position: [0.155, 0.25, 0.32], size: [0.09, 0.035, 0.09] }
];

// [084] Clones each named mesh into a component group, preserving its original CAD coordinates.
function buildPartGroups(gltfScene) {
  const meshByName = new Map();
  gltfScene.traverse((node) => {
    if (node.isMesh) meshByName.set(node.name, node);
  });

  const groups = {};
  const bounds = {};

  for (const id of ACTIVE_PART_IDS) {
    const definition = manifest.parts[id];
    const group = new THREE.Group();
    group.name = `component-${id}`;

    for (const meshName of definition?.meshes || []) {
      const sourceMesh = meshByName.get(meshName);
      if (!sourceMesh) continue;
      const clone = sourceMesh.clone();
      clone.name = sourceMesh.name;
      clone.castShadow = true;
      clone.receiveShadow = true;
      group.add(clone);
    }

    group.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(group);
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    box.getCenter(center);
    box.getSize(size);

    groups[id] = group;
    bounds[id] = { center: center.toArray(), size: size.toArray() };
  }

  return { groups, bounds };
}

// [085] Animates a component from a short offset into the exact CAD assembly location.
function AnimatedCADPart({ id, object, installed, selected, bounds, onSelect, onHover }) {
  const wrapper = useRef();
  const progress = useRef(installed ? 1 : 0);
  const wasInstalled = useRef(installed);
  const offset = INSTALL_OFFSETS[id] || [0, 0.12, 0];

  useEffect(() => {
    if (!wrapper.current) return;
    if (installed && !wasInstalled.current) {
      progress.current = 0;
      wrapper.current.visible = true;
      wrapper.current.position.set(...offset);
    } else if (!installed) {
      progress.current = 0;
      wrapper.current.visible = false;
      wrapper.current.position.set(0, 0, 0);
    }
    wasInstalled.current = installed;
  }, [installed, offset]);

  useEffect(() => {
    if (wrapper.current) {
      wrapper.current.visible = installed;
      if (!installed) wrapper.current.position.set(0, 0, 0);
    }
  }, [object]);

  useFrame((_, delta) => {
    if (!wrapper.current || !installed || progress.current >= 1) return;
    progress.current = Math.min(1, progress.current + delta * 1.65);
    const eased = 1 - Math.pow(1 - progress.current, 3);
    wrapper.current.position.set(
      offset[0] * (1 - eased),
      offset[1] * (1 - eased),
      offset[2] * (1 - eased)
    );
  });

  const active = selected === id;

  return (
    <group
      ref={wrapper}
      visible={installed}
      onClick={(event) => { event.stopPropagation(); onSelect(id); }}
      onPointerOver={(event) => { event.stopPropagation(); onHover(id); }}
      onPointerOut={() => onHover(null)}
    >
      <primitive object={object} dispose={null} />
      {active && bounds && (
        <mesh position={bounds.center}>
          <boxGeometry args={bounds.size.map((v) => Math.max(v * 1.04, 0.012))} />
          <meshBasicMaterial color="#299de0" wireframe transparent opacity={0.42} />
        </mesh>
      )}
    </group>
  );
}

// [086] Shows the fixed block and the hotspots for all component groups not yet installed.
function CADModel({ selected, installed, onSelect, view }) {
  const { scene } = useGLTF(MODEL_URL);
  const { groups, bounds } = useMemo(() => buildPartGroups(scene), [scene]);
  const [hovered, setHovered] = useState(null);

  const installedSet = new Set(installed);
  // Only one top-deck target is active at a time; this prevents overlapping hotspots
  // from selecting the head gasket, head, or valvetrain out of sequence.
  const topPickSequence = ['pistonsRods', 'headGasket', 'cylinderHead', 'valvetrain', 'valveCover'];
  const activeTopPick = topPickSequence.find((id) => !installedSet.has(id));

  return (
    <>
      {/* [087] The source CAD uses Z-up and metre-scale dimensions; rotate to Three.js Y-up and enlarge for presentation. */}
      <group rotation={[-Math.PI / 2, 0, 0]} scale={3} position={[0, -1, 0]}>
        <primitive object={groups.engineBlock} dispose={null} />

        {ACTIVE_PART_IDS.filter((id) => id !== 'engineBlock').map((id) => (
          <AnimatedCADPart
            key={id}
            id={id}
            object={groups[id]}
            installed={installedSet.has(id)}
            selected={selected === id || hovered === id ? id : null}
            bounds={bounds[id]}
            onSelect={onSelect}
            onHover={setHovered}
          />
        ))}

        {PICK_ZONES.filter((zone) => {
          if (installedSet.has(zone.id)) return false;
          if (topPickSequence.includes(zone.id) && zone.id !== activeTopPick) return false;
          return true;
        }).map((zone, index) => {
          const isActive = hovered === zone.id || selected === zone.id;
          return (
            <mesh
              key={`${zone.id}-${index}`}
              position={zone.position}
              onClick={(event) => { event.stopPropagation(); onSelect(zone.id); }}
              onPointerOver={(event) => { event.stopPropagation(); setHovered(zone.id); }}
              onPointerOut={() => setHovered(null)}
            >
              <boxGeometry args={zone.size} />
              <meshBasicMaterial
                color={isActive ? '#299de0' : '#ffffff'}
                transparent
                opacity={isActive ? 0.28 : 0.001}
                depthWrite={false}
                side={THREE.DoubleSide}
              />
            </mesh>
          );
        })}

        {/* The engine block itself is directly selectable. */}
        <mesh
          position={[0, 0, 0.285]}
          onClick={(event) => { event.stopPropagation(); onSelect('engineBlock'); }}
          onPointerOver={(event) => { event.stopPropagation(); setHovered('engineBlock'); }}
          onPointerOut={() => setHovered(null)}
        >
          <boxGeometry args={[0.45, 0.45, 0.38]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
        {selected === 'engineBlock' && (
          <mesh position={[0, 0, 0.285]}>
            <boxGeometry args={[0.47, 0.47, 0.40]} />
            <meshBasicMaterial color="#299de0" wireframe transparent opacity={0.14} />
          </mesh>
        )}
      </group>

      <ContactShadows position={[0, -1.12, 0]} opacity={0.24} scale={5.5} blur={2.5} far={3.5} />
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={2.2}
        maxDistance={8.5}
        target={[0, 0, 0]}
      />
      <Environment preset="studio" />
      <CameraPreset position={CAMERA_POSITIONS[view] || CAMERA_POSITIONS.isometric} />
    </>
  );
}

// [088] Smoothly updates the camera position when the user changes view presets.
function CameraPreset({ position }) {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(...position);
    camera.lookAt(0, 0, 0);
  }, [camera, position]);
  return null;
}


// [090] Canvas wrapper keeps the CAD scene in the same white studio workspace as the previous prototype.
export default function EngineCADScene({ selected, installed, onSelect, view }) {
  return (
    <Canvas
      shadows
      camera={{ position: [-3.4, 2.7, 4.2], fov: 39, near: 0.01, far: 100 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: false }}
    >
      <color attach="background" args={['#ffffff']} />
      <ambientLight intensity={0.95} />
      <directionalLight position={[-3, 6, 5]} intensity={2.0} castShadow shadow-mapSize={[2048, 2048]} />
      <directionalLight position={[4, 3, -4]} intensity={0.85} />
      <spotLight position={[0, 5, 2]} intensity={0.55} angle={0.7} penumbra={0.8} />
      <Suspense fallback={null}>
        <CADModel selected={selected} installed={installed} onSelect={onSelect} view={view} />
      </Suspense>
    </Canvas>
  );
}

useGLTF.preload(MODEL_URL);
