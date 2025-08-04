import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js";

class EscenaEsfera {
  constructor(scene) {
    this.scene = scene;
    this.radius = 3;

    this.geometry = new THREE.SphereGeometry(this.radius, 100, 100);
    this.material = new THREE.ShaderMaterial({
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
          float mixValue = (vPosition.x + ${this.radius.toFixed(1)}) / ${(this.radius*2).toFixed(1)};
          vec3 color = mix(magenta, cyan, mixValue);
          gl_FragColor = vec4(color,1.0);
        }
      `
    });
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.mesh);

    this.positionAttribute = this.geometry.attributes.position;
    this.vertexCount = this.positionAttribute.count;
    this.basePositions = new Float32Array(this.positionAttribute.array);

    this.angleX = 0;
    this.angleY = 0;
    this.limit = Math.PI/2 - 0.1;
  }

  distort(time) {
    const π = Math.PI;
    for(let i=0; i<this.vertexCount; i++) {
      const ix = i*3;
      let x = this.basePositions[ix];
      let y = this.basePositions[ix+1];
      let z = this.basePositions[ix+2];

      const len = Math.sqrt(x*x + y*y + z*z);
      const offset = 0.3 * Math.sin(π*x + time) * Math.cos(π*y + time);
      const scale = (this.radius + offset) / len;

      this.positionAttribute.array[ix] = x*scale;
      this.positionAttribute.array[ix+1] = y*scale;
      this.positionAttribute.array[ix+2] = z*scale;
    }
    this.positionAttribute.needsUpdate = true;
  }

  rotate(dx, dy) {
    this.angleY += dx;
    this.angleX += dy;
    this.angleX = Math.max(-this.limit, Math.min(this.angleX, this.limit));

    this.mesh.rotation.y = this.angleY;
    this.mesh.rotation.x = this.angleX;
  }

  dispose() {
    this.geometry.dispose();
    this.material.dispose();
    this.scene.remove(this.mesh);
  }
}

export const name = "Esfera";

export function createScene(renderer, camera, keys, mousePos) {
  const scene = new THREE.Scene();

  // Luz
  const light = new THREE.PointLight(0x00FFFF, 50);
  light.position.set(10,10,10);
  scene.add(light);
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));

  // Caja pecera
  const boxSize = 20;
  const boxGeometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
  const boxMaterial = new THREE.MeshBasicMaterial({color:0xffffff, wireframe:true});
  const box = new THREE.Mesh(boxGeometry, boxMaterial);
  scene.add(box);

  // Crear la esfera
  const esfera = new EscenaEsfera(scene);

  // Estado para drag
  let isDragging = false;
  let lastMouse = { x: 0, y: 0 };

  // Sensibilidades
  const sphereDragSensitivity = 0.005;

  // Eventos para rotar esfera
  renderer.domElement.addEventListener("mousedown", (e) => {
    isDragging = true;
    lastMouse.x = e.clientX;
    lastMouse.y = e.clientY;
  });

  renderer.domElement.addEventListener("mouseup", () => {
    isDragging = false;
  });

  renderer.domElement.addEventListener("mouseleave", () => {
    isDragging = false;
  });

  renderer.domElement.addEventListener("mousemove", (e) => {
    if(isDragging) {
      const dx = e.clientX - lastMouse.x;
      const dy = e.clientY - lastMouse.y;

      esfera.rotate(dx * sphereDragSensitivity, dy * sphereDragSensitivity);

      lastMouse.x = e.clientX;
      lastMouse.y = e.clientY;
    }
  });

  // Animación con distorsión
  function animate(time = 0) {
    requestAnimationFrame(animate);
    const t = time * 0.001;

    esfera.distort(t);
    renderer.render(scene, camera);
  }

  return { scene, animate };
}
