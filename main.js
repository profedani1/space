import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';
import { loadScene } from './loader.js';
import {
  setupControls,
  updateCamera,
  moveCamera,
  autoRotateViewByMousePosition,
  distortGeometry,
  resizeRenderer
} from './controls.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 0.5));
const light = new THREE.PointLight(0x00FFFF, 50);
light.position.set(10,10,10);
scene.add(light);

const modules = { scene, camera, renderer };

// Setup controles (mouse, teclado, touch, cámara)
setupControls(modules);

// Variable para escena actual
let currentSceneName = 'esfera';

// Carga escena inicial
await loadScene(currentSceneName, modules);

// Manejar cambio de escena desde menú
const sceneSelect = document.getElementById('scene-select');
sceneSelect.addEventListener('change', async (e) => {
  currentSceneName = e.target.value;
  // Limpiar escena excepto luces (para evitar duplicados)
  while(scene.children.length > 0){
    scene.remove(scene.children[0]);
  }
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  scene.add(light);

  await loadScene(currentSceneName, modules);
});

window.addEventListener('resize', () => {
  resizeRenderer(modules);
});

function animate(t=0){
  requestAnimationFrame(animate);
  const time = t * 0.001;

  distortGeometry(time);
  moveCamera();
  autoRotateViewByMousePosition();
  updateCamera();

  renderer.render(scene, camera);
}

animate();
