import * as THREE from 'three';

export default class EscenaEsfera {
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
