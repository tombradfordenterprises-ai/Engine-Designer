# Inline Four Engine Builder

A starter React + Three.js project for a clean, white-background inline-four engine assembly game.

## Run it locally

1. Install Node.js (LTS).
2. Open a terminal in this folder.
3. Run `npm install`.
4. Run `npm run dev`.
5. Open the local URL printed by Vite.

## File layout

- `index.html` — page shell and React mount point.
- `src/main.jsx` — application entry point.
- `src/App.jsx` — game state, part data, assembly actions, and overall layout.
- `src/components/EngineScene.jsx` — interactive Three.js scene and starter engine geometry.
- `src/components/Toolbar.jsx` — six persistent toolbar buttons.
- `src/components/InfoPanel.jsx` — upward-sliding component explanation panel.
- `src/styles.css` — global styles.
- `src/App.css` — application, toolbar, panel, and responsive styles.

## Numbered code sections

Every major code section has a unique numeric tag in a comment, such as `[034]`. Search the whole project for that number to jump directly to the section.

## Important prototype notes

- The current engine is a simplified procedural 3D placeholder, not a manufacturing-accurate engine model.
- The toolbar's Install button demonstrates the automatic-install flow by marking the selected part as installed. A production version should animate each real 3D component into a dedicated mounting transform.
- The Parts button currently opens the selected component guide as a useful first-pass behavior.
- Real assembly dependencies, collision-free part placement, save/load, sound, and accurate engine geometry are the next development steps.
