// scenes/index.js
export const scenes = [
  () => import('./esfera.js'),
  () => import('./cubo.js'),
  // Aquí añades nuevas escenas sin tocar main.js
  // () => import('./otraEscena.js'),
];
