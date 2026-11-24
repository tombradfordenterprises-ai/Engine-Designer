import React, { Suspense, useMemo, useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Bounds, Environment, Html, OrbitControls, useGLTF } from '@react-three/drei';
import EnginePartLayer from './EnginePartLayer.jsx';
import { enginePartList, enginePartRegistry } from '../data/enginePartRegistry.js';

const MODEL_URL = '/models/b16_bare_block_dark_graphite.glb';

function BareB16Block({ selected, onSelect, setHovered }) {
  const { scene } = useGLTF(MODEL_URL);

  // Clone the original CAD scene and calculate a real bounding box for the block.
  // The invisible box below is a dedicated pointer target. A GLTF scene root is
  // usually a Group, and Groups do not perform raycasts themselves.
  const { model, hitbox } = useMemo(() => {
    const copy = scene.clone(true);
    copy.updateMatrixWorld(true);

    copy.traverse((node) => {
      if (!node.isMesh) return;
      node.castShadow = true;
      node.receiveShadow = true;
      if (Array.isArray(node.material)) {
        node.material = node.material.map((material) => material.clone());
      } else if (node.material) {
        node.material = node.material.clone();
      }
    });

    const bounds = new THREE.Box3().setFromObject(copy);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    bounds.getSize(size);
    bounds.getCenter(center);

    // Slightly expand the proxy so the block is easy to select without
    // creating an excessively large invisible target.
    size.multiplyScalar(1.015);

    return {
      model: copy,
      hitbox: { size: [size.x, size.y, size.z], center: [center.x, center.y, center.z] }
    };
  }, [scene]);

  useEffect(() => {
    model.traverse((node) => {
      if (!node.isMesh || !node.material) return;
      const materials = Array.isArray(node.material) ? node.material : [node.material];
      materials.forEach((material) => {
        if (!material.emissive) return;
        material.emissive.set(selected ? '#173d60' : '#000000');
        material.emissiveIntensity = selected ? 0.12 : 0;
      });
    });
  }, [model, selected]);

  const handleOver = (event) => {
    event.stopPropagation();
    setHovered(true);
  };
  const handleOut = (event) => {
    event.stopPropagation();
    setHovered(false);
  };

  return (
    <group>
      <primitive object={model} dispose={null} />
      {/* A real Mesh with raycast geometry: unlike the GLTF scene Group,
          this reliably receives React Three Fiber pointer events. */}
      <mesh
        position={hitbox.center}
        onPointerOver={handleOver}
        onPointerOut={handleOut}
      >
        <boxGeometry args={hitbox.size} />
        <meshBasicMaterial
          transparent
          opacity={0}
          colorWrite={false}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}



const HOTSPOTS = enginePartList
  .filter((part) => part.hotspot?.targets?.length)
  .map((part) => ({
    id: part.id,
    label: part.hotspot.label || part.name,
    targets: part.hotspot.targets,
    requires: part.requires || [],
    recommendedOrder: part.recommendedOrder ?? 9999,
  }));

function PulsingTarget({ target, color, unlocked, active, onSelect, setHovered }) {
  const pulseRef = useRef(null);
  useFrame(({ clock }) => {
    if (!pulseRef.current) return;
    const pulse = 1 + Math.sin(clock.elapsedTime * 3.2) * 0.10;
    pulseRef.current.scale.setScalar(pulse);
  });

  return (
    <group position={target.position}>
      <mesh
        onPointerOver={(event) => { event.stopPropagation(); setHovered(true); }}
        onPointerOut={(event) => { event.stopPropagation(); setHovered(false); }}
        onClick={(event) => { event.stopPropagation(); if (unlocked) onSelect(); }}
      >
        <sphereGeometry args={[target.radius, 24, 16]} />
        <meshBasicMaterial color={color} transparent opacity={unlocked ? (active ? 0.15 : 0.07) : 0.035} depthWrite={false} depthTest={false} />
      </mesh>
      <mesh
        ref={pulseRef}
        rotation={[Math.PI / 2, 0, 0]}
        onPointerOver={(event) => { event.stopPropagation(); setHovered(true); }}
        onPointerOut={(event) => { event.stopPropagation(); setHovered(false); }}
        onClick={(event) => { event.stopPropagation(); if (unlocked) onSelect(); }}
      >
        <torusGeometry args={[target.radius * 0.72, 0.055, 8, 40]} />
        <meshBasicMaterial color={color} transparent opacity={unlocked ? (active ? 1 : 0.95) : 0.48} depthWrite={false} depthTest={false} />
      </mesh>
      <mesh position={[0, 0.025, 0]}>
        <sphereGeometry args={[0.11, 12, 8]} />
        <meshBasicMaterial color={color} transparent opacity={unlocked ? 1 : 0.55} depthWrite={false} depthTest={false} />
      </mesh>
    </group>
  );
}

function InstallationHotspots({ installed, selected, onSelect, setHovered }) {
  // Keep the scene visually clear: show one installation label at a time,
  // following the next available part in the recommended assembly order.
  const nextSpot = HOTSPOTS
    .filter((spot) => !installed.includes(spot.id) && spot.requires.every((required) => installed.includes(required)))
    .sort((a, b) => a.recommendedOrder - b.recommendedOrder)[0];

  return (
    <group name="installation-hotspots">
      {HOTSPOTS.map((spot) => {
        if (installed.includes(spot.id)) return null;
        const unlocked = spot.requires.every((required) => installed.includes(required));
        const active = selected === spot.id;
        const showLabel = nextSpot?.id === spot.id;
        const color = unlocked ? (active ? '#087fc4' : '#20aaff') : '#89939e';
        const anchor = spot.targets.reduce((sum, target) => sum.map((value, axis) => value + target.position[axis] / spot.targets.length), [0, 0, 0]);
        return (
          <group key={spot.id} name={`${spot.id}-targets`}>
            {spot.targets.map((target, index) => (
              <PulsingTarget
                key={`${spot.id}-${index}`}
                target={target}
                color={color}
                unlocked={unlocked}
                active={active}
                onSelect={() => onSelect(spot.id)}
                setHovered={setHovered}
              />
            ))}
            {showLabel && <Html
              position={[anchor[0], anchor[1] + 1.35, anchor[2]]}
              center
              distanceFactor={18}
              zIndexRange={[100, 0]}
              style={{ pointerEvents: 'auto', whiteSpace: 'nowrap', cursor: unlocked ? 'pointer' : 'not-allowed' }}
            >
              <div
                onClick={(event) => { event.stopPropagation(); if (unlocked) onSelect(spot.id); }}
                onPointerDown={(event) => event.stopPropagation()}
                title={unlocked ? `Select ${spot.label}` : 'Install the prerequisites first'}
                style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                padding: '6px 10px', borderRadius: '7px',
                color: '#fff', background: unlocked ? 'rgba(10, 35, 54, .92)' : 'rgba(55, 62, 70, .88)',
                border: `1px solid ${unlocked ? '#36baff' : '#9aa3ad'}`,
                boxShadow: unlocked ? '0 0 12px rgba(32,170,255,.32)' : 'none',
                font: '600 11px/1.2 Arial, sans-serif', letterSpacing: '.35px',
                userSelect: 'none'
              }}>

                <span style={{
                  width: '19px', height: '19px', borderRadius: '50%',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  background: unlocked ? '#159fe8' : '#78828d', fontWeight: 800
                }}>{spot.recommendedOrder}</span>
                <span>{spot.label.toUpperCase()} {spot.targets.length > 1 ? `(${spot.targets.length})` : ''}<small style={{ display: 'block', opacity: .78, fontSize: '9px', marginTop: '2px' }}>{unlocked ? (active ? 'SELECTED' : 'READY TO INSTALL') : 'LOCKED — INSTALL PREREQUISITES'}</small></span>
              </div>
            </Html>}
          </group>
        );
      })}
    </group>
  );
}

function SceneContents({ selected, onSelect, setHovered, installed, view, onInstallPart }) {
  const controlsRef = useRef(null);
  const { camera } = useThree();

  // A one-shot camera transition is triggered by a new view or installation.
  // Once the transition finishes, OrbitControls remains fully free for the user.
  const cameraTransitionRef = useRef(null);
  const previousViewRef = useRef(view);

  useEffect(() => {
    // Bounds performs the initial camera fit once the GLB has loaded. Do not
    // start a competing transition toward OrbitControls' default origin.
    if (previousViewRef.current === view) return;
    previousViewRef.current = view;
    if (!controlsRef.current) return;
    const installId = view.startsWith('install:') ? view.slice(8) : null;
    const partMetadata = installId ? enginePartRegistry[installId] : null;
    const viewDirections = {
      isometric: new THREE.Vector3(1, 0.8, 1),
      front: new THREE.Vector3(0, 0, 1),
      top: new THREE.Vector3(0, 1, 0.001),
      side: new THREE.Vector3(1, 0, 0),
      bottom: new THREE.Vector3(0, -1, 0.001),
    };
    const controls = controlsRef.current;
    const target = partMetadata?.cameraFocus ? new THREE.Vector3(...partMetadata.cameraFocus) : controls.target.clone();
    const currentDistance = camera.position.distanceTo(controls.target);
    const distance = Math.max(18, Math.min(currentDistance || 55, 65));
    const direction = (partMetadata?.cameraDirection ? new THREE.Vector3(...partMetadata.cameraDirection) : (viewDirections[view] || viewDirections.isometric)).clone().normalize();
    cameraTransitionRef.current = {
      target,
      position: target.clone().add(direction.multiplyScalar(distance)),
    };
  }, [view, camera]);

  useFrame((_, delta) => {
    const transition = cameraTransitionRef.current;
    if (!transition || !controlsRef.current) return;
    const blend = 1 - Math.exp(-delta * 2.4);
    camera.position.lerp(transition.position, blend);
    controlsRef.current.target.lerp(transition.target, blend);
    controlsRef.current.update();
    if (camera.position.distanceTo(transition.position) < 0.025 && controlsRef.current.target.distanceTo(transition.target) < 0.025) {
      camera.position.copy(transition.position);
      controlsRef.current.target.copy(transition.target);
      cameraTransitionRef.current = null;
      controlsRef.current.update();
    }
  });

  return (
    <>
      <ambientLight intensity={0.8} />
      <hemisphereLight args={['#ffffff', '#747b84', 1.1]} />
      <directionalLight position={[5, 8, 6]} intensity={2.1} castShadow />
      <directionalLight position={[-5, 3, -4]} intensity={0.85} />

      <Suspense fallback={null}>
        <Bounds fit clip observe margin={1.35}>
          <BareB16Block
            selected={selected === 'engineBlock'}
            onSelect={onSelect}
            setHovered={setHovered}
          />
          <EnginePartLayer
            installed={installed}
            selectedPart={selected}
            onInstallPart={onInstallPart}
            onSelectPart={onSelect}
          />
          <InstallationHotspots
            installed={installed}
            selected={selected}
            onSelect={onSelect}
            setHovered={setHovered}
          />
        </Bounds>
      </Suspense>

      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={0.6}
        maxDistance={80}
      />
      <Environment preset="studio" />
    </>
  );
}

export default function EngineCADScene({
  selected,
  installed = [],
  onSelect,
  view = 'isometric',
  onInstallPart = () => {},
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <Canvas
      shadows
      camera={{ position: [2.8, 2.2, 3.4], fov: 38, near: 0.01, far: 500 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: false }}
      style={{ cursor: hovered ? 'pointer' : 'grab' }}
    >
      <color attach="background" args={['#ffffff']} />
      <SceneContents
        selected={selected}
        installed={installed}
        onSelect={onSelect}
        setHovered={setHovered}
        view={view}
        onInstallPart={onInstallPart}
      />
    </Canvas>
  );
}

useGLTF.preload(MODEL_URL);
