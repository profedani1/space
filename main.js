import * as THREE from 'three';
import EscenaEsfera from './scenes/esfera.js';
import EscenaCubo from './scenes/cubo.js';

let currentSceneObj = null;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Luz
const light = new THREE.PointLight(0x00FFFF, 50);
light.position.set(10,10,10);
scene.add(light);
scene.add(new THREE.AmbientLight(0xffffff, 0.5));

let camPos = new THREE.Vector3(0,0,10);
let camPosTarget = camPos.clone();
let camYaw = Math.PI;
let camPitch = 0;
const camPitchLimit = Math.PI/2 - 0.1;

const keys = {};
window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

let isDragging = false;
let lastMouse = {x:0,y:0};

renderer.domElement.addEventListener('mousedown', e => { isDragging = true; lastMouse.x = e.clientX; lastMouse.y = e.clientY; });
renderer.domElement.addEventListener('mouseup', e => { isDragging = false; });
renderer.domElement.addEventListener('mouseleave', e => { isDragging = false; });

renderer.domElement.addEventListener('mousemove', e => {
  if(!currentSceneObj) return;
  if(isDragging) {
    const dx = (e.clientX - lastMouse.x) * 0.005;
    const dy = (e.clientY - lastMouse.y) * 0.005;
    currentSceneObj.rotate(dx, dy);
  }
  lastMouse.x = e.clientX;
  lastMouse.y = e.clientY;
});

function moveCamera() {
  const forward = new THREE.Vector3(
    Math.cos(camPitch)*Math.sin(camYaw),
    0,
    Math.cos(camPitch)*Math.cos(camYaw)
  ).normalize();

  const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0,1,0)).normalize();

  if(keys['w']) camPosTarget.add(forward.clone().multiplyScalar(0.1));
  if(keys['s']) camPosTarget.add(forward.clone().multiplyScalar(-0.1));
  if(keys['a']) camPosTarget.add(right.clone().multiplyScalar(-0.1));
  if(keys['d']) camPosTarget.add(right.clone().multiplyScalar(0.1));

  if(keys[' ']) camPosTarget.y += 0.1;
  if(keys['shift']) camPosTarget.y -= 0.1;

  // Limitar posición si quieres
  const limit = 10;
  camPosTarget.x = Math.min(limit, Math.max(-limit, camPosTarget.x));
  camPosTarget.y = Math.min(limit, Math.max(-limit, camPosTarget.y));
  camPosTarget.z = Math.min(limit, Math.max(-limit, camPosTarget.z));

  camPos.lerp(camPosTarget, 0.1);
}

function updateCamera() {
  camera.position.copy(camPos);
  const dir = new THREE.Vector3(
    Math.cos(camPitch)*Math.sin(camYaw),
    Math.sin(camPitch),
    Math.cos(camPitch)*Math.cos(camYaw)
  );
  camera.lookAt(camPos.clone().add(dir));
}

function clearScene() {
  if(!currentSceneObj) return;
  currentSceneObj.dispose();
  currentSceneObj = null;
}

function loadScene(name) {
  clearScene();
  if(name === 'esfera') {
    currentSceneObj = new EscenaEsfera(scene);
  } else if(name === 'cubo') {
    currentSceneObj = new EscenaCubo(scene);
  }
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Menú para cambiar escena
const select = document.createElement('select');
select.style.position = 'fixed';
select.style.top = '10px';
select.style.left = '10px';
select.style.zIndex = '100';
select.innerHTML = `
  <option value="esfera">Esfera</option>
  <option value="cubo">Cubo</option>
`;
document.body.appendChild(select);

select.addEventListener('change', e => {
  loadScene(e.target.value);
});

// Carga inicial
loadScene('esfera');

function animate(t=0) {
  requestAnimationFrame(animate);
  const time = t * 0.001;

  if(currentSceneObj) currentSceneObj.distort(time);
  moveCamera();
  updateCamera();

  renderer.render(scene, camera);
}

animate();
