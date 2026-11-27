B16 USER-SUPPLIED OBJ ASSET INTEGRATION
======================================

This patch adds 20 user-supplied OBJ assets converted to GLB for the Engine Designer.
The conversion preserves each model's original placement in the common CAD coordinate
system and maps the source axes into the app's Three.js axes:

    scene X = source OBJ X
    scene Y = source OBJ Z
    scene Z = -source OBJ Y

No individual part was automatically re-centered or independently scaled.

WHAT THIS PATCH UPDATES
-----------------------
1. public/models/b16_bare_block_dark_graphite.glb
   Replaced with the user-supplied Engine Block Bare White.obj geometry, given a
   dark graphite material. Its measured bounds match the previous block bounds:
   X length 17.498, scene Y 4.003..12.001, scene Z 125..136.

2. src/components/engine-parts/CylinderHead/Component.jsx
   Now loads the user-supplied Cylinder Head(1).obj conversion directly in the
   shared block coordinate system. No scale or installed offset is applied.
   Head bounds: X -48.5..-31.0 (length 17.5); scene Y 12..16.5.

3. src/components/engine-parts/CylinderHead/metadata.json
   Hitbox and camera focus updated to the imported head's actual bounding box.

4. src/components/engine-parts/CylinderHeadGasket/Component.jsx
   Now loads the user-supplied Head Gasket.obj at source size and source placement.
   It is not stretched to the block's outside dimensions.

5. src/components/engine-parts/CylinderHeadGasket/metadata.json
   Hitbox and camera focus updated to the gasket's actual bounding box.

ALL IMPORTED ASSETS
-------------------
All 20 converted GLBs are in public/models/source-b16/.
See asset-index.json for original filenames, dimensions, and bounds.

The Crankshaft (unused).obj is retained as a reference asset only; it does not
replace the current working crankshaft component. The small file originally named
".obj" is retained as unclassified-small-part.glb and is not connected to an
assembly step. Other assets are staged in the library for later integration
(camshafts, caps, lobes, manifolds, flywheel, pulleys, alternator, etc.).

INSTALLATION
------------
Copy the contents of this patch into the root of the existing GitHub repository,
allowing the included files to replace matching paths. Commit the changes to main.
No package.json dependency changes are required.

VALIDATION / LIMITATIONS
------------------------
- All 20 OBJ files were readable and each contained one OBJ object/mesh.
- The supplied block, cylinder head, and head gasket share a consistent source
  coordinate frame. Their transformed GLB bounds were checked after conversion.
- The cylinder head's X length is 17.5 scene units; the block's is 17.498.
- The head gasket's X length is 16.0 and width is 6.5 scene units; this is the
  supplied mesh outline and has not been stretched.
- The models have no referenced MTL or texture files; simple PBR materials were
  assigned during conversion.
- These are visual polygon meshes, not editable STEP/B-rep CAD solids. The
  coordinate agreement is based on the supplied files and does not certify OEM
  Honda dimensions, exact engine variant, or mechanical fit.
- A full Vite production build was not run in this environment.
