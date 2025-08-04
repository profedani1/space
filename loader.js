export async function loadScene(name, modules) {
  try {
    // Importa módulo de escena
    const mod = await import(`./scenes/${name}.js`);
    if (typeof mod.default === 'function') {
      mod.default(modules);
    }
  } catch (e) {
    console.error(`Error cargando escena '${name}':`, e);
  }
}
