export default function (scene) {
  const geometry = new THREE.SphereGeometry(1, 32, 32);
  const material = new THREE.MeshStandardMaterial({ color: 0x0077ff, wireframe: false });
  const sphere = new THREE.Mesh(geometry, material);
  scene.add(sphere);
}
