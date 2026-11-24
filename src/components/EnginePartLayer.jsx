import React from 'react';
import * as THREE from 'three';
import { enginePartList } from '../data/enginePartRegistry.js';

/**
 * Generic renderer for all registered engine parts.
 * Each part folder is discovered automatically through enginePartRegistry.js.
 * Uninstalled previews remain clickable to install; installed components remain
 * clickable to reopen their information panel.
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
          <group key={part.id} name={`${part.id}-component`}>
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
