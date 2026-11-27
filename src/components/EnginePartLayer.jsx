import React from 'react';
import * as THREE from 'three';
import { enginePartList } from '../data/enginePartRegistry.js';

/**
 * Generic renderer for all registered engine parts.
 * Each part folder is discovered automatically through enginePartRegistry.js.
 * The visible preview meshes and the invisible hitbox both receive clicks:
 * previews install directly, while installed components reopen their guide.
 */
export default function EnginePartLayer({
  installed = [],
  selectedPart = 'engineBlock',
  onInstallPart = () => {},
  onSelectPart = () => {},
}) {
  return (
    <group name="engine-part-layer">
      {enginePartList.map((part) => {
        const isInstalled = installed.includes(part.id);
        const isPreview = selectedPart === part.id && !isInstalled;
        if (!isInstalled && !isPreview) return null;

        const PartComponent = part.Component;
        const hitbox = part.hitbox;
        const clickPosition = isInstalled
          ? (part.installedHitbox?.position || part.cameraFocus || hitbox?.position)
          : hitbox?.position;

        return (
          <group
            key={part.id}
            name={`${part.id}-component`}
            onClick={(event) => {
              // GLTF/procedural preview geometry is often offset from its final
              // installed hitbox. Handle clicks on the visible part itself so
              // users do not have to find the invisible target or toolbar.
              event.stopPropagation();
              if (isInstalled) onSelectPart(part.id);
              else onInstallPart(part.id);
            }}
          >
            {hitbox && clickPosition && (
              <mesh
                position={clickPosition}
                onClick={(event) => {
                  event.stopPropagation();
                  if (isInstalled) onSelectPart(part.id);
                  else onInstallPart(part.id);
                }}
                onPointerOver={(event) => event.stopPropagation()}
                onPointerOut={(event) => event.stopPropagation()}
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
            )}
            <PartComponent installed={isInstalled} />
          </group>
        );
      })}
    </group>
  );
}
