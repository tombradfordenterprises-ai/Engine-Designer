// Automatically discovers every engine-parts/<PartName>/metadata.json + Component.jsx pair.
// Add a folder with those two files to register a new modeled component; no central imports needed.
const metadataModules = import.meta.glob('../components/engine-parts/**/metadata.json', {
  eager: true,
  import: 'default',
});
const componentModules = import.meta.glob('../components/engine-parts/**/Component.jsx', {
  eager: true,
  import: 'default',
});

const entries = Object.entries(metadataModules).map(([metadataPath, metadata]) => {
  const componentPath = metadataPath.replace(/metadata\.json$/, 'Component.jsx');
  return [metadata.id, { ...metadata, Component: componentModules[componentPath] }];
}).filter(([id, part]) => Boolean(id && part.Component));

export const enginePartRegistry = Object.fromEntries(entries);
export const enginePartList = Object.values(enginePartRegistry).sort(
  (a, b) => (a.recommendedOrder ?? 9999) - (b.recommendedOrder ?? 9999)
);
