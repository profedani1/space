import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';

export default function({ scene }) {
  // Caja pecera
  const boxSize = 20;
  const boxGeometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
  const boxMaterial = new THREE.MeshBasicMaterial({color:0xffffff, wireframe:true});
  const box = new THREE.Mesh(boxGeometry, boxMaterial);
  scene.add(box);

  // Esfera principal
  const radius = 3;
  const geometry = new THREE.SphereGeometry(radius, 100, 100);

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
        float mixValue = (vPosition.x + ${radius.toFixed(1)}) / ${(radius*2).toFixed(1)};
        vec3 color = mix(magenta, cyan, mixValue);
        gl_FragColor = vec4(color,1.0);
      }
    `
  });

  const sphere = new THREE.Mesh(geometry, material);
  sphere.name = 'mainSphere';  // importante para controls.js
  scene.add(sphere);
}
