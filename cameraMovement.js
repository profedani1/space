// public/js/cameraMovement.js
let keys = {};
let camera = null;
let velocity = 0.1;

export function setupCameraMovement(cam) {
  camera = cam;

  window.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
  window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);
}

export function updateCameraMovement() {
  if (!camera) return;

  const direction = new THREE.Vector3();
  const speed = velocity;

  if (keys['w']) camera.translateZ(-speed);
  if (keys['s']) camera.translateZ(speed);
  if (keys['a']) camera.translateX(-speed);
  if (keys['d']) camera.translateX(speed);
  if (keys['q']) camera.translateY(-speed);
  if (keys['e']) camera.translateY(speed);
}
