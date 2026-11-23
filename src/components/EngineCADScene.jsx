import React, { Suspense, useMemo, useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useThree } from '@react-three/fiber';
import { Bounds, Environment, OrbitControls, useGLTF } from '@react-three/drei';
import EnginePartLayer from './EnginePartLayer.jsx';

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



const HOTSPOTS = [
  {
    id: 'crankshaft',
    label: 'Crankshaft',
    // Centered on the crankshaft tunnel; the wider target represents the shaft axis.
    targets: [{ position: [-40.0, 7.9, 130.5], radius: 1.05 }],
    requires: [],
  },
  {
    id: 'mainBearingCaps',
    label: 'Main bearings & caps',
    // Five individual targets follow the five prototype main-cap positions.
    targets: [-46.0, -43.0, -40.0, -37.0, -34.0].map((x) => ({
      position: [x, 6.7, 131.0], radius: 0.62,
    })),
    requires: ['crankshaft'],
  },
  {
    id: 'oilPump',
    label: 'Oil pump assembly',
    // Timing-belt end of the block, concentric with the crankshaft axis.
    targets: [{ position: [-47.8, 8.0, 131.0], radius: 0.82 }],
    requires: ['crankshaft', 'mainBearingCaps', 'pistonsRods'],
  },
  {
    id: 'pistonsRods',
    label: 'Pistons & rods',
    // Four targets follow the four prototype piston centerlines, above the deck.
    targets: [-45.25, -41.75, -38.25, -34.75].map((x) => ({
      position: [x, 12.18, 130.0], radius: 0.78,
    })),
    requires: ['crankshaft', 'mainBearingCaps'],
  },
];

function InstallationHotspots({ installed, selected, onSelect, setHovered }) {
  return (
    <group name="installation-hotspots">
      {HOTSPOTS.map((spot) => {
        if (installed.includes(spot.id)) return null;
        const unlocked = spot.requires.every((required) => installed.includes(required));
        const active = selected === spot.id;
        const color = unlocked ? (active ? '#087fc4' : '#35b8ff') : '#aeb8c2';
        return (
          <group key={spot.id} name={`${spot.id}-targets`}>
            {spot.targets.map((target, index) => (
              <group key={`${spot.id}-${index}`} position={target.position}>
                {/* Soft center glow, with a small click target instead of a large opaque sphere. */}
                <mesh
                  onPointerOver={(event) => { event.stopPropagation(); setHovered(true); }}
                  onPointerOut={(event) => { event.stopPropagation(); setHovered(false); }}
                  onClick={(event) => { event.stopPropagation(); if (unlocked) onSelect(spot.id); }}
                >
                  <sphereGeometry args={[target.radius, 24, 16]} />
                  <meshBasicMaterial
                    color={color}
                    transparent
                    opacity={unlocked ? (active ? 0.12 : 0.055) : 0.025}
                    depthWrite={false}
                  />
                </mesh>
                <mesh
                  rotation={[Math.PI / 2, 0, 0]}
                  onPointerOver={(event) => { event.stopPropagation(); setHovered(true); }}
                  onPointerOut={(event) => { event.stopPropagation(); setHovered(false); }}
                  onClick={(event) => { event.stopPropagation(); if (unlocked) onSelect(spot.id); }}
                >
                  <torusGeometry args={[target.radius * 0.72, 0.045, 8, 40]} />
                  <meshBasicMaterial
                    color={color}
                    transparent
                    opacity={unlocked ? (active ? 1 : 0.9) : 0.28}
                    depthWrite={false}
                  />
                </mesh>
                <mesh position={[0, 0.025, 0]}>
                  <sphereGeometry args={[0.095, 12, 8]} />
                  <meshBasicMaterial color={color} transparent opacity={unlocked ? 0.95 : 0.3} />
                </mesh>
              </group>
            ))}
          </group>
        );
      })}
    </group>
  );
}

function SceneContents({ selected, onSelect, setHovered, showCrankshaft, showMainBearingCaps, showPistonsRods, showOilPump, installed, view }) {
  const controlsRef = useRef(null);
  const { camera } = useThree();

  // Apply the selected camera preset while preserving the current zoom distance
  // and the target established by Drei's Bounds fit.
  useEffect(() => {
    if (!controlsRef.current) return;

    const target = controlsRef.current.target.clone();
    const currentDistance = camera.position.distanceTo(target);
    const distance = Math.max(currentDistance, 8);

    const directions = {
      isometric: new THREE.Vector3(1, 0.8, 1),
      front: new THREE.Vector3(0, 0, 1),
      top: new THREE.Vector3(0, 1, 0.001),
      side: new THREE.Vector3(1, 0, 0),
      bottom: new THREE.Vector3(0, -1, 0.001),
    };

    const direction = (directions[view] || directions.isometric).clone().normalize();
    camera.position.copy(target).add(direction.multiplyScalar(distance));
    camera.up.set(0, 1, 0);
    camera.lookAt(target);
    controlsRef.current.target.copy(target);
    controlsRef.current.update();
  }, [view, camera]);

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
            showCrankshaft={showCrankshaft}
            showMainBearingCaps={showMainBearingCaps}
            showPistonsRods={showPistonsRods}
            showOilPump={showOilPump}
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
  showCrankshaft = false,
  showMainBearingCaps = false,
  showPistonsRods = false,
  showOilPump = false,
  view = 'isometric',
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
        showCrankshaft={showCrankshaft}
        showMainBearingCaps={showMainBearingCaps}
        showPistonsRods={showPistonsRods}
        showOilPump={showOilPump}
        view={view}
      />
    </Canvas>
  );
}

useGLTF.preload(MODEL_URL);
