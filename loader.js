export async function loadScene(name, scene) {
  try {
    const module = await import(`./scenes/${name}.js`);
    if (typeof module.default === 'function') {
      module.default(scene);
    } else {
      console.error("El módulo no tiene función `default`.");
    }
  } catch (err) {
    console.error(`Error al cargar escena "${name}":`, err);
  }
}
