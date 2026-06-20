import { mkdir, writeFile } from 'node:fs/promises';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

const outputPath = 'src/assets/objectives/command-codes-cinematic.glb';

class NodeFileReader {
  onloadend = null;
  result = null;

  async readAsArrayBuffer(blob) {
    this.result = await blob.arrayBuffer();
    this.onloadend?.();
  }

  async readAsDataURL(blob) {
    const buffer = Buffer.from(await blob.arrayBuffer());
    this.result = `data:${blob.type || 'application/octet-stream'};base64,${buffer.toString('base64')}`;
    this.onloadend?.();
  }
}

globalThis.FileReader ??= NodeFileReader;

const scene = new THREE.Scene();
scene.name = 'command-codes-cinematic';

const materials = {
  shell: new THREE.MeshStandardMaterial({
    color: '#17212a',
    roughness: 0.5,
    metalness: 0.82,
    emissive: '#060b10',
    emissiveIntensity: 0.35,
  }),
  plate: new THREE.MeshStandardMaterial({
    color: '#24384a',
    roughness: 0.38,
    metalness: 0.7,
    emissive: '#0b1b28',
    emissiveIntensity: 0.45,
  }),
  data: new THREE.MeshStandardMaterial({
    color: '#72ffd8',
    roughness: 0.22,
    metalness: 0.4,
    emissive: '#35ffcf',
    emissiveIntensity: 1.8,
  }),
  warning: new THREE.MeshStandardMaterial({
    color: '#ff4d68',
    roughness: 0.32,
    metalness: 0.62,
    emissive: '#ff2f55',
    emissiveIntensity: 1.25,
  }),
};

addBox('encrypted-data-core', [1.6, 0.18, 1.05], [0, 0.09, 0], materials.shell);
addBox('raised-command-plate', [1.25, 0.08, 0.78], [0, 0.22, 0], materials.plate);
addBox('center-memory-bank', [0.25, 0.12, 0.9], [0, 0.34, 0], materials.data);

for (let index = 0; index < 4; index += 1) {
  const x = -0.48 + index * 0.32;
  addBox(`encrypted-code-lane-${index + 1}`, [0.12, 0.08, 0.58 - index * 0.06], [x, 0.38, 0], materials.data);
}

for (const z of [-0.42, 0.42]) {
  addBox(`red-security-clasp-${z < 0 ? 'south' : 'north'}`, [1.72, 0.08, 0.08], [0, 0.32, z], materials.warning);
}

const ring = new THREE.Mesh(
  new THREE.TorusGeometry(0.58, 0.025, 8, 48),
  materials.data,
);
ring.name = 'holographic-code-ring';
ring.position.set(0, 0.58, 0);
ring.rotation.x = Math.PI / 2;
scene.add(ring);

const shardGeometry = new THREE.ConeGeometry(0.12, 0.45, 4);
for (let index = 0; index < 6; index += 1) {
  const angle = (Math.PI * 2 * index) / 6;
  const shard = new THREE.Mesh(shardGeometry, materials.data);
  shard.name = `floating-code-shard-${index + 1}`;
  shard.position.set(Math.cos(angle) * 0.42, 0.62 + (index % 2) * 0.06, Math.sin(angle) * 0.42);
  shard.rotation.set(Math.PI * 0.5, angle, Math.PI * 0.25);
  scene.add(shard);
}

scene.traverse((object) => {
  if (object instanceof THREE.Mesh) {
    object.castShadow = true;
    object.receiveShadow = true;
  }
});

const exporter = new GLTFExporter();
const glb = await exporter.parseAsync(scene, { binary: true });
await mkdir('src/assets/objectives', { recursive: true });
await writeFile(outputPath, Buffer.from(glb));
console.info(`[asset] wrote ${outputPath} (${Buffer.byteLength(Buffer.from(glb))} bytes)`);

function addBox(name, size, position, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.name = name;
  mesh.position.set(...position);
  scene.add(mesh);
}
