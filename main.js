import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js";

// Importar escenas
import * as esferaModule from "./scenes/esfera.js";
import * as cuadradoModule from "./scenes/cuadrado.js";
// para agregar nueva escena solo importarla aquí
// import * as nuevaEscenaModule from "./scenes/nuevaEscena.js";

const scenesModules = [
  esferaModule,
  cuadradoModule,
  // nuevaEscenaModule,
];

// Crear menú dinámico
const menu = document.getElementById("scene-select");
scenesModules.forEach((mod, i) => {
  const option = document.createElement("option");
  option.value = i; // índice para seleccionar
  option.textContent = mod.name || `Escena ${i + 1}`;
  menu.appendChild(option);
});

let renderer, camera;
let currentScene = null;
let currentAnimate = null;
let animationId = null;

const keys = {};
let mousePos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

window.addEventListener("keydown", (e) => (keys[e.key.toLowerCase()] = true));
window.addEventListener("keyup", (e) => (keys[e.key.toLowerCase()] = false));
window.addEventListener("mousemove", (e) => {
  mousePos.x = e.clientX;
  mousePos.y = e.clientY;
});

function initRendererAndCamera() {
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, 10);

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

function cleanupCurrentScene() {
  if (animationId !== null) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  if (currentScene) {
    currentScene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
    currentScene.clear();
    currentScene = null;
  }
}

function switchScene(index) {
  cleanupCurrentScene();

  if (!renderer || !camera) {
    initRendererAndCamera();
  }

  const mod = scenesModules[index];
  if (!mod) {
    currentScene = new THREE.Scene();
    currentAnimate = () => {
      animationId = requestAnimationFrame(currentAnimate);
      renderer.render(currentScene, camera);
    };
    currentAnimate();
    return;
  }

  const { scene, animate } = mod.createScene(renderer, camera, keys, mousePos);
  currentScene = scene;
  currentAnimate = animate;

  currentAnimate();
}

menu.addEventListener("change", (e) => {
  switchScene(parseInt(e.target.value));
});

// Cargar escena por defecto (la primera)
switchScene(0);
