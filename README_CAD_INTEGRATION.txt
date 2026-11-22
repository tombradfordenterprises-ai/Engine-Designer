# Engine Builder — CAD engine integration update

This update replaces the procedural engine scene with a separate-mesh CAD model.

## Files to copy into the GitHub repository

- `src/App.jsx` (replace)
- `src/components/EngineCADScene.jsx` (new file)
- `src/data/enginePartManifest.json` (new file)
- `public/models/inline_four_engine.glb` (new file)

Keep the existing `src/components/Toolbar.jsx`, `src/components/InfoPanel.jsx`, `src/App.css`, `src/styles.css`, `src/main.jsx`, and `package.json`.

## What this integration does

- Loads the CC0 STEP-derived inline-four CAD model as a GLB asset.
- Keeps the engine block visible as the foundation.
- Groups the separately named CAD meshes into selectable/installable component groups.
- Animates each group from a short offset into its original assembled position.
- Keeps the existing installation prerequisite checks, progress indicator, Undo, How to, Explain Part, and camera controls.
- Excludes the manual flywheel group because the planned drivetrain is automatic.

## CAD asset scope and limitations

The provided model includes the block, crankshaft, pistons/rods, head gasket, cylinder head, valvetrain, valve cover, oil pan, end covers, crank pulley, alternator, accessory belt, intake manifold, exhaust manifold, and oil filter.

It does not include a water pump, power-steering pump, separate tensioner/idler pulleys, flexplate, torque converter, or automatic transmission. Those should be added as separate assets in later milestones. The included belt is the source model's simplified accessory belt route around the crank pulley and alternator.

## License provenance

The uploaded STEP file header explicitly dedicates the source model under CC0 1.0 Universal:
https://creativecommons.org/publicdomain/zero/1.0/

The source STEP header names Innerscene Corp as the authoring organization. The included GLB is a conversion of the user's supplied STEP file. Retain the license evidence in `src/data/enginePartManifest.json`.

## Deployment

Render should auto-deploy after the four files above are committed to `main`. The model is served from `/models/inline_four_engine.glb`.
