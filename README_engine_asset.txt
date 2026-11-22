# Inline-four engine CAD asset bundle

## Files
- `inline_four_engine.glb` — converted 3D assembly with 231 individually named component meshes.
- `inline_four_engine_manifest.json` — mesh-to-component mapping, dependency suggestions, and limitations.

## License
The uploaded STEP source header explicitly states: Public domain, dedicated under CC0 1.0 Universal. The CC0 dedication allows commercial use, modification, and redistribution. Keep a copy of the original STEP header/source alongside your project records as provenance.

## Important integration notes
- Load the GLB with `useGLTF` from `@react-three/drei`.
- Use the manifest `parts` mapping to group mesh nodes into selectable/installable components.
- The STEP model is already assembled; component meshes are at their final positions. Hide uninstalled groups and reveal/animate them during installation.
- The source has an old-style flywheel and does not include an automatic flexplate, torque converter, or complete automatic transmission. The automatic-transmission parts must be modeled separately.
- The source accessory drive includes a crank pulley, alternator, alternator bracket/pulley, and one accessory belt. Water pump, power steering pump, tensioner, and idlers are absent.

## Scale
The source STEP assembly bounds are approximately 604 x 531 x 666 mm. Scale it consistently in the Three.js scene after checking orientation and camera framing.
