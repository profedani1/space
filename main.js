import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js";
import { scenes } from './scenes/index.js';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 10);

const keys = {};
const mousePos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

let currentScene = null;
let currentAnimate = null;

const sceneSelect = document.getElementById('scene-select');

// Cargar todas las escenas y llenar menú
async function loadScenes() {
  const loadedScenes = [];
  for (const loadScene of scenes) {
    const module = await loadScene();
    loadedScenes.push(module);
  }

  // Llenar menú
  sceneSelect.innerHTML = '';
  loadedScenes.forEach((mod, i) => {
    const option = document.createElement('option');
    option.value = i;
    option.textContent = mod.name || `Escena ${i + 1}`;
    sceneSelect.appendChild(option);
  });

  // Cargar primera escena por defecto
  loadSceneByIndex(0);

  // Cambiar escena al seleccionar
  sceneSelect.onchange = () => {
    loadSceneByIndex(sceneSelect.selectedIndex);
  };

  async function loadSceneByIndex(index) {
    if (currentAnimate) {
      cancelAnimationFrame(currentAnimate._id);
    }
    if (currentScene && currentScene.dispose) {
      currentScene.dispose();
    }

    const mod = loadedScenes[index];

    // Limpiar renderer DOM (opcional, si hay más objetos)
    while (renderer.scene) {
      renderer.scene = null;
    }

    // Crear la escena con la función exportada
    const { scene, animate } = await mod.createScene(renderer, camera, keys, mousePos);
    currentScene = scene;
    
    // Animación con control para cancelación
    function animateLoop(t) {
      currentAnimate._id = requestAnimationFrame(animateLoop);
      animate(t);
    }
    currentAnimate = { _id: null };
    animateLoop();
  }
}

loadScenes();
