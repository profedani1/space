import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';

export default function({ scene }) {
  const boxSize = 6; // tamaño del cubo base

  // Caja pecera (más grande)
  const peceraSize = 20;
  const peceraGeometry = new THREE.BoxGeometry(peceraSize, peceraSize, peceraSize);
  const peceraMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true });
  const pecera = new THREE.Mesh(peceraGeometry, peceraMaterial);
  scene.add(pecera);

  // Cubo (nuestra "esfera" cuadrada)
  const geometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize, 50, 50, 50); // más subdivisiones para distorsión suave

  const material = new THREE.ShaderMaterial({
    wireframe: true,
    vertexShader: `
      varying vec3 vPosition;
      void main() {
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vPosition;
      vec3 magenta = vec3(1.0, 0.0, 1.0);
      vec3 cyan = vec3(0.0, 1.0, 1.0);
      void main() {
        // Color horizontal basado en posición X normalizada del cubo
        float mixValue = (vPosition.x + ${boxSize/2}) / ${boxSize};
        vec3 color = mix(magenta, cyan, mixValue);
        gl_FragColor = vec4(color, 1.0);
      }
    `
  });

  const cube = new THREE.Mesh(geometry, material);
  cube.name = 'mainCube';
  scene.add(cube);

  // Preparar para distorsión (igual que la esfera)
  const positionAttribute = geometry.attributes.position;
  const vertexCount = positionAttribute.count;
  const basePositions = new Float32Array(positionAttribute.array);

  return {
    cube,
    geometry,
    basePositions,
    vertexCount,
    boxSize: peceraSize,
  };
}
