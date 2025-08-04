// main.js (ES module)

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js";

let renderer, camera;
let currentScene = null;
let currentAnimate = null;
let animationId = null;

const canvasContainer = document.body;

// Parámetros comunes
const boxSize = 20;
const sphereRadius = 3;

// Estado input común
const keys = {};
let mousePos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

// Escucha teclado global
window.addEventListener("keydown", (e) => (keys[e.key.toLowerCase()] = true));
window.addEventListener("keyup", (e) => (keys[e.key.toLowerCase()] = false));

// Escucha mouse global para mousePos (puede usarse en escenas)
window.addEventListener("mousemove", (e) => {
  mousePos.x = e.clientX;
  mousePos.y = e.clientY;
});

// Inicializar renderer y cámara común
function initRendererAndCamera() {
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  canvasContainer.appendChild(renderer.domElement);

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

// Limpia la escena y cancela animación anterior
function cleanupCurrentScene() {
  if (animationId !== null) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  if (currentScene) {
    // Limpieza: eliminar todos los hijos de la escena para liberar memoria
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
  // Deja cámara y renderer (reutilizados)
}

// --- ESCENA ESFERA ---
function createSphereScene() {
  const scene = new THREE.Scene();

  // Luz
  const light = new THREE.PointLight(0x00ffff, 50);
  light.position.set(10, 10, 10);
  scene.add(light);
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));

  // Geometría esfera
  const geometry = new THREE.SphereGeometry(sphereRadius, 100, 100);

  // Shader material
  const material = new THREE.ShaderMaterial({
    wireframe: true,
    vertexShader: `
      varying vec3 vPosition;
      void main() {
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vPosition;
      vec3 magenta = vec3(1.0,0.0,1.0);
      vec3 cyan = vec3(0.0,1.0,1.0);
      void main() {
        float mixValue = (vPosition.x + ${sphereRadius.toFixed(
          1
        )}) / ${(sphereRadius * 2).toFixed(1)};
        vec3 color = mix(magenta, cyan, mixValue);
        gl_FragColor = vec4(color,1.0);
      }
    `,
  });

  const sphere = new THREE.Mesh(geometry, material);
  scene.add(sphere);

  // Caja pecera
  const boxGeometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
  const boxMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    wireframe: true,
  });
  const box = new THREE.Mesh(boxGeometry, boxMaterial);
  scene.add(box);

  // Variables rotación esfera
  let sphereAngleY = 0;
  let sphereAngleX = 0;
  const sphereLimit = Math.PI / 2 - 0.1;

  // Estado cámara
  let camPos = new THREE.Vector3(0, 0, 10);
  let camPosTarget = camPos.clone();
  let camYaw = Math.PI;
  let camPitch = 0;
  const camPitchLimit = Math.PI / 2 - 0.1;

  // Input control flags
  let isDraggingSphere = false;
  let lastMouse = { x: 0, y: 0 };

  // Distorsión animada
  const positionAttribute = geometry.attributes.position;
  const vertexCount = positionAttribute.count;
  const basePositions = new Float32Array(positionAttribute.array);

  function distortGeometry(time) {
    const π = Math.PI;
    for (let i = 0; i < vertexCount; i++) {
      const ix = i * 3;
      let x = basePositions[ix];
      let y = basePositions[ix + 1];
      let z = basePositions[ix + 2];

      const len = Math.sqrt(x * x + y * y + z * z);
      const offset = 0.3 * Math.sin(π * x + time) * Math.cos(π * y + time);
      const scale = (sphereRadius + offset) / len;

      positionAttribute.array[ix] = x * scale;
      positionAttribute.array[ix + 1] = y * scale;
      positionAttribute.array[ix + 2] = z * scale;
    }
    positionAttribute.needsUpdate = true;
  }

  function updateCamera() {
    camera.position.copy(camPos);

    const dir = new THREE.Vector3(
      Math.cos(camPitch) * Math.sin(camYaw),
      Math.sin(camPitch),
      Math.cos(camPitch) * Math.cos(camYaw)
    );

    camera.lookAt(camPos.clone().add(dir));
  }

  function moveCamera() {
    const moveSpeed = 0.1;

    const forward = new THREE.Vector3(
      Math.cos(camPitch) * Math.sin(camYaw),
      0,
      Math.cos(camPitch) * Math.cos(camYaw)
    ).normalize();

    const right = new THREE.Vector3()
      .crossVectors(forward, new THREE.Vector3(0, 1, 0))
      .normalize();

    if (keys["w"]) camPosTarget.add(forward.clone().multiplyScalar(moveSpeed));
    if (keys["s"])
      camPosTarget.add(forward.clone().multiplyScalar(-moveSpeed));
    if (keys["a"]) camPosTarget.add(right.clone().multiplyScalar(-moveSpeed));
    if (keys["d"]) camPosTarget.add(right.clone().multiplyScalar(moveSpeed));

    if (keys[" "]) camPosTarget.y += moveSpeed;
    if (keys["shift"]) camPosTarget.y -= moveSpeed;

    const limit = boxSize / 2 - 0.5;
    camPosTarget.x = Math.min(limit, Math.max(-limit, camPosTarget.x));
    camPosTarget.y = Math.min(limit, Math.max(-limit, camPosTarget.y));
    camPosTarget.z = Math.min(limit, Math.max(-limit, camPosTarget.z));

    camPos.lerp(camPosTarget, 0.1);
  }

  function autoRotateViewByMousePosition() {
    const edgeSize = 150;
    const autoLookSpeed = 0.02;

    if (isDraggingSphere) return;

    if (mousePos.x < edgeSize) {
      let intensity = (edgeSize - mousePos.x) / edgeSize;
      camYaw += autoLookSpeed * intensity;
    } else if (mousePos.x > window.innerWidth - edgeSize) {
      let intensity =
        (mousePos.x - (window.innerWidth - edgeSize)) / edgeSize;
      camYaw -= autoLookSpeed * intensity;
    }

    if (mousePos.y < edgeSize) {
      let intensity = (edgeSize - mousePos.y) / edgeSize;
      camPitch += autoLookSpeed * intensity;
    } else if (mousePos.y > window.innerHeight - edgeSize) {
      let intensity =
        (mousePos.y - (window.innerHeight - edgeSize)) / edgeSize;
      camPitch -= autoLookSpeed * intensity;
    }

    camPitch = Math.max(-camPitchLimit, Math.min(camPitch, camPitch));
  }

  // Eventos mouse para rotar esfera o cámara
  renderer.domElement.addEventListener("mousedown", (e) => {
    isDraggingSphere = true;
    lastMouse.x = e.clientX;
    lastMouse.y = e.clientY;
  });
  renderer.domElement.addEventListener("mouseup", () => {
    isDraggingSphere = false;
  });
  renderer.domElement.addEventListener("mouseleave", () => {
    isDraggingSphere = false;
  });

  renderer.domElement.addEventListener("mousemove", (e) => {
    if (isDraggingSphere) {
      const dx = e.clientX - lastMouse.x;
      const dy = e.clientY - lastMouse.y;

      sphereAngleY += dx * 0.005;
      sphereAngleX += dy * 0.005;
      sphereAngleX = Math.max(-sphereLimit, Math.min(sphereAngleX, sphereLimit));

      sphere.rotation.y = sphereAngleY;
      sphere.rotation.x = sphereAngleX;

      lastMouse.x = e.clientX;
      lastMouse.y = e.clientY;
    } else {
      const dx = e.movementX || e.clientX - lastMouse.x;
      const dy = e.movementY || e.clientY - lastMouse.y;

      camYaw -= dx * 0.002;
      camPitch -= dy * 0.002;
      camPitch = Math.max(-camPitchLimit, Math.min(camPitch, camPitch));

      lastMouse.x = e.clientX;
      lastMouse.y = e.clientY;
    }
  });

  // Zoom con rueda
  window.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      const zoomSpeed = 0.005;
      const zoomAmount = -e.deltaY * zoomSpeed;

      const lookDir = new THREE.Vector3(
        Math.cos(camPitch) * Math.sin(camYaw),
        Math.sin(camPitch),
        Math.cos(camPitch) * Math.cos(camYaw)
      );

      camPosTarget.add(lookDir.multiplyScalar(zoomAmount));

      const limit = boxSize / 2 - 0.5;
      camPosTarget.x = Math.min(limit, Math.max(-limit, camPosTarget.x));
      camPosTarget.y = Math.min(limit, Math.max(-limit, camPosTarget.y));
      camPosTarget.z = Math.min(limit, Math.max(-limit, camPosTarget.z));
    },
    { passive: false }
  );

  // Animación principal escena esfera
  function animate(time = 0) {
    animationId = requestAnimationFrame(animate);
    const t = time * 0.001;

    distortGeometry(t);
    moveCamera();
    autoRotateViewByMousePosition();
    updateCamera();

    renderer.render(scene, camera);
  }

  return { scene, animate };
}

// --- ESCENA CUADRADO ---
function createSquareScene() {
  const scene = new THREE.Scene();

  // Luz
  const light = new THREE.PointLight(0xff00ff, 2);
  light.position.set(10, 10, 10);
  scene.add(light);
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));

  // Geometría plano grande (cuadrado)
  const size = 6;
  const geometry = new THREE.PlaneGeometry(size, size, 20, 20);

  const material = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    wireframe: true,
  });

  const plane = new THREE.Mesh(geometry, material);
  scene.add(plane);

  // Caja pecera
  const boxGeometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
  const boxMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    wireframe: true,
  });
  const box = new THREE.Mesh(boxGeometry, boxMaterial);
  scene.add(box);

  // Rotación plano
  let planeAngleY = 0;
  let planeAngleX = 0;
  const planeLimit = Math.PI / 2 - 0.1;

  // Estado cámara
  let camPos = new THREE.Vector3(0, 0, 10);
  let camPosTarget = camPos.clone();
  let camYaw = Math.PI;
  let camPitch = 0;
  const camPitchLimit = Math.PI / 2 - 0.1;

  // Input control flags
  let isDraggingPlane = false;
  let lastMouse = { x: 0, y: 0 };

  // Funciones cámara (similares a esfera)
  function updateCamera() {
    camera.position.copy(camPos);

    const dir = new THREE.Vector3(
      Math.cos(camPitch) * Math.sin(camYaw),
      Math.sin(camPitch),
      Math.cos(camPitch) * Math.cos(camYaw)
    );

    camera.lookAt(camPos.clone().add(dir));
  }

  function moveCamera() {
    const moveSpeed = 0.1;

    const forward = new THREE.Vector3(
      Math.cos(camPitch) * Math.sin(camYaw),
      0,
      Math.cos(camPitch) * Math.cos(camYaw)
    ).normalize();

    const right = new THREE.Vector3()
      .crossVectors(forward, new THREE.Vector3(0, 1, 0))
      .normalize();

    if (keys["w"]) camPosTarget.add(forward.clone().multiplyScalar(moveSpeed));
    if (keys["s"])
      camPosTarget.add(forward.clone().multiplyScalar(-moveSpeed));
    if (keys["a"]) camPosTarget.add(right.clone().multiplyScalar(-moveSpeed));
    if (keys["d"]) camPosTarget.add(right.clone().multiplyScalar(moveSpeed));

    if (keys[" "]) camPosTarget.y += moveSpeed;
    if (keys["shift"]) camPosTarget.y -= moveSpeed;

    const limit = boxSize / 2 - 0.5;
    camPosTarget.x = Math.min(limit, Math.max(-limit, camPosTarget.x));
    camPosTarget.y = Math.min(limit, Math.max(-limit, camPosTarget.y));
    camPosTarget.z = Math.min(limit, Math.max(-limit, camPosTarget.z));

    camPos.lerp(camPosTarget, 0.1);
  }

  // Auto-rotar cámara cerca bordes
  function autoRotateViewByMousePosition() {
    const edgeSize = 150;
    const autoLookSpeed = 0.02;

    if (isDraggingPlane) return;

    if (mousePos.x < edgeSize) {
      let intensity = (edgeSize - mousePos.x) / edgeSize;
      camYaw += autoLookSpeed * intensity;
    } else if (mousePos.x > window.innerWidth - edgeSize) {
      let intensity =
        (mousePos.x - (window.innerWidth - edgeSize)) / edgeSize;
      camYaw -= autoLookSpeed * intensity;
    }

    if (mousePos.y < edgeSize) {
      let intensity = (edgeSize - mousePos.y) / edgeSize;
      camPitch += autoLookSpeed * intensity;
    } else if (mousePos.y > window.innerHeight - edgeSize) {
      let intensity =
        (mousePos.y - (window.innerHeight - edgeSize)) / edgeSize;
      camPitch -= autoLookSpeed * intensity;
    }

    camPitch = Math.max(-camPitchLimit, Math.min(camPitch, camPitch));
  }

  // Eventos mouse para rotar plano o cámara
  renderer.domElement.addEventListener("mousedown", (e) => {
    isDraggingPlane = true;
    lastMouse.x = e.clientX;
    lastMouse.y = e.clientY;
  });
  renderer.domElement.addEventListener("mouseup", () => {
    isDraggingPlane = false;
  });
  renderer.domElement.addEventListener("mouseleave", () => {
    isDraggingPlane = false;
  });

  renderer.domElement.addEventListener("mousemove", (e) => {
    if (isDraggingPlane) {
      const dx = e.clientX - lastMouse.x;
      const dy = e.clientY - lastMouse.y;

      planeAngleY += dx * 0.005;
      planeAngleX += dy * 0.005;
      planeAngleX = Math.max(-planeLimit, Math.min(planeAngleX, planeLimit));

      plane.rotation.y = planeAngleY;
      plane.rotation.x = planeAngleX;

      lastMouse.x = e.clientX;
      lastMouse.y = e.clientY;
    } else {
      const dx = e.movementX || e.clientX - lastMouse.x;
      const dy = e.movementY || e.clientY - lastMouse.y;

      camYaw -= dx * 0.002;
      camPitch -= dy * 0.002;
      camPitch = Math.max(-camPitchLimit, Math.min(camPitch, camPitch));

      lastMouse.x = e.clientX;
      lastMouse.y = e.clientY;
    }
  });

  // Zoom con rueda (igual que esfera)
  window.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      const zoomSpeed = 0.005;
      const zoomAmount = -e.deltaY * zoomSpeed;

      const lookDir = new THREE.Vector3(
        Math.cos(camPitch) * Math.sin(camYaw),
        Math.sin(camPitch),
        Math.cos(camPitch) * Math.cos(camYaw)
      );

      camPosTarget.add(lookDir.multiplyScalar(zoomAmount));

      const limit = boxSize / 2 - 0.5;
      camPosTarget.x = Math.min(limit, Math.max(-limit, camPosTarget.x));
      camPosTarget.y = Math.min(limit, Math.max(-limit, camPosTarget.y));
      camPosTarget.z = Math.min(limit, Math.max(-limit, camPosTarget.z));
    },
    { passive: false }
  );

  // Animación principal escena cuadrado
  function animate(time = 0) {
    animationId = requestAnimationFrame(animate);

    moveCamera();
    autoRotateViewByMousePosition();
    updateCamera();

    renderer.render(scene, camera);
  }

  return { scene, animate };
}

// --- CONTROL ESCENAS ---

function switchScene(sceneName) {
  cleanupCurrentScene();

  if (!renderer || !camera) {
    initRendererAndCamera();
  }

  if (sceneName === "esfera") {
    const { scene, animate } = createSphereScene();
    currentScene = scene;
    currentAnimate = animate;
  } else if (sceneName === "cuadrado") {
    const { scene, animate } = createSquareScene();
    currentScene = scene;
    currentAnimate = animate;
  } else {
    // Default: empty scene
    currentScene = new THREE.Scene();
    currentAnimate = () => {
      animationId = requestAnimationFrame(currentAnimate);
      renderer.render(currentScene, camera);
    };
  }

  currentAnimate();
}

// Selector escena
const sceneSelect = document.getElementById("scene-select");
sceneSelect.addEventListener("change", (e) => {
  switchScene(e.target.value);
});

// Arrancar con la escena por defecto seleccionada
switchScene(sceneSelect.value);
