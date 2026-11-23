import React, { Suspense, useMemo, useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
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
  const handleClick = (event) => {
    event.stopPropagation();
    onSelect('engineBlock');
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
        onClick={handleClick}
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




// Installation zones are placed using the same scene coordinates as the
// working crankshaft, bearing-cap, and piston assemblies.
const HOTSPOT_GROUPS = [
  {
    id: 'crankshaft',
    label: 'Crankshaft',
    positions: [[-40.0, 8.0, 126.0]],
    requires: [],
    radius: 1.05,
  },
  {
    id: 'mainBearingCaps',
    label: 'Main bearings & caps',
    positions: [-46.0, -43.0, -40.0, -37.0, -34.0].map((x) => [x, 6.7, 131.0]),
    requires: ['crankshaft'],
    radius: 0.78,
  },
  {
    id: 'pistonsRods',
    label: 'Pistons & rods',
    positions: [-45.25, -41.75, -38.25, -34.75].map((x) => [x, 12.85, 130.0]),
    requires: ['crankshaft', 'mainBearingCaps'],
    radius: 1.0,
  },
];

function InstallationHotspot({ id, position, radius, selected, onSelect, setHovered }) {
  const [hovered, setLocalHovered] = useState(false);
  const ringRef = useRef(null);
  const active = selected === id;
  const color = hovered || active ? '#00b7ff' : '#078fe8';

  useFrame((_, delta) => {
    if (!ringRef.current) return;
    const target = hovered || active ? 1.18 : 1;
    ringRef.current.scale.lerp(new THREE.Vector3(target, target, target), 1 - Math.exp(-delta * 13));
  });

  const enter = (event) => {
    event.stopPropagation();
    setLocalHovered(true);
    setHovered(true);
  };
  const leave = (event) => {
    event.stopPropagation();
    setLocalHovered(false);
    setHovered(false);
  };
  const click = (event) => {
    event.stopPropagation();
    onSelect(id);
  };

  return (
    <group position={position} name={`${id}-installation-hotspot`}>
      {/* Soft target disc provides a forgiving click area and a subtle glow. */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerOver={enter}
        onPointerOut={leave}
        onClick={click}
      >
        <circleGeometry args={[radius * 0.9, 40]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={hovered || active ? 0.22 : 0.13}
          depthWrite={false}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
      {/* Bright blue ring sits directly on the relevant engine feature. */}
      <group ref={ringRef}>
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          onPointerOver={enter}
          onPointerOut={leave}
          onClick={click}
        >
          <torusGeometry args={[radius * 0.72, 0.075, 10, 48]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={hovered || active ? 1 : 0.9}
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  );
}

function InstallationHotspots({ installed, selected, onSelect, setHovered }) {
  return (
    <group name="installation-hotspots">
      {HOTSPOT_GROUPS.map((group) => {
        if (installed.includes(group.id)) return null;
        const unlocked = group.requires.every((required) => installed.includes(required));
        if (!unlocked) return null;
        return group.positions.map((position, index) => (
          <InstallationHotspot
            key={`${group.id}-${index}`}
            id={group.id}
            position={position}
            radius={group.radius}
            selected={selected}
            onSelect={onSelect}
            setHovered={setHovered}
          />
        ));
      })}
    </group>
  );
}

function SceneContents({ selected, onSelect, setHovered, showCrankshaft, showMainBearingCaps, showPistonsRods, installed, view }) {
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
        view={view}
      />
    </Canvas>
  );
}

useGLTF.preload(MODEL_URL);
