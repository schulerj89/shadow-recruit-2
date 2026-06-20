import { mkdir, writeFile } from 'node:fs/promises';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

const outputRoot = 'src/assets/environment';

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

const palette = {
  darkMetal: new THREE.MeshStandardMaterial({
    color: '#17242d',
    roughness: 0.54,
    metalness: 0.72,
    emissive: '#050a0e',
    emissiveIntensity: 0.25,
  }),
  panel: new THREE.MeshStandardMaterial({
    color: '#2b4652',
    roughness: 0.42,
    metalness: 0.64,
    emissive: '#081923',
    emissiveIntensity: 0.4,
  }),
  cyan: new THREE.MeshStandardMaterial({
    color: '#6fffe2',
    roughness: 0.24,
    metalness: 0.32,
    emissive: '#35ffd1',
    emissiveIntensity: 1.7,
  }),
  amber: new THREE.MeshStandardMaterial({
    color: '#ffd45a',
    roughness: 0.32,
    metalness: 0.52,
    emissive: '#ffb33e',
    emissiveIntensity: 1.1,
  }),
  red: new THREE.MeshStandardMaterial({
    color: '#ff5a65',
    roughness: 0.3,
    metalness: 0.5,
    emissive: '#ff314b',
    emissiveIntensity: 1.25,
  }),
};

await mkdir(outputRoot, { recursive: true });
await writeGlb('cable-tray-kit', buildCableTray());
await writeGlb('wall-machinery-kit', buildWallMachinery());
await writeGlb('extraction-beacon-kit', buildExtractionBeacon());
await writeGlb('cover-barricade-kit', buildCoverBarricade());

function buildCableTray() {
  const scene = namedScene('cable-tray-kit');
  addBox(scene, 'ribbed-tray-base', [3.8, 0.12, 0.36], [0, 0.06, 0], palette.darkMetal);
  addBox(scene, 'left-rail', [3.9, 0.22, 0.08], [0, 0.19, -0.22], palette.panel);
  addBox(scene, 'right-rail', [3.9, 0.22, 0.08], [0, 0.19, 0.22], palette.panel);
  addBox(scene, 'cyan-service-line', [3.6, 0.06, 0.055], [0, 0.31, -0.06], palette.cyan);
  addBox(scene, 'amber-service-line', [3.1, 0.05, 0.055], [0.2, 0.3, 0.08], palette.amber);
  for (let index = 0; index < 5; index += 1) {
    addBox(scene, `tray-cross-brace-${index + 1}`, [0.08, 0.08, 0.5], [-1.6 + index * 0.8, 0.27, 0], palette.darkMetal);
  }
  prepareScene(scene);
  return scene;
}

function buildWallMachinery() {
  const scene = namedScene('wall-machinery-kit');
  addBox(scene, 'machinery-backplate', [3.4, 0.18, 0.55], [0, 0.65, 0], palette.darkMetal);
  addBox(scene, 'raised-service-panel', [2.6, 0.22, 0.2], [0, 0.9, -0.2], palette.panel);
  addBox(scene, 'vent-bank-left', [0.62, 0.18, 0.34], [-1.05, 1.12, 0.02], palette.panel);
  addBox(scene, 'vent-bank-right', [0.62, 0.18, 0.34], [1.05, 1.12, 0.02], palette.panel);
  addBox(scene, 'cyan-diagnostic-strip', [2.95, 0.06, 0.055], [0, 1.33, -0.32], palette.cyan);
  addBox(scene, 'red-lockout-strip', [0.16, 0.08, 0.42], [1.52, 0.82, 0.04], palette.red);
  for (let index = 0; index < 4; index += 1) {
    addBox(scene, `lower-conduit-${index + 1}`, [0.12, 0.16, 0.45], [-1.2 + index * 0.8, 0.38, 0.04], palette.darkMetal);
  }
  prepareScene(scene);
  return scene;
}

function buildExtractionBeacon() {
  const scene = namedScene('extraction-beacon-kit');
  addBox(scene, 'extraction-equipment-plinth', [2.6, 0.22, 1.2], [0, 0.11, 0], palette.darkMetal);
  addBox(scene, 'beacon-power-bank', [0.74, 0.72, 0.52], [-0.72, 0.58, -0.05], palette.panel);
  addBox(scene, 'exfil-control-core', [0.72, 0.48, 0.72], [0.5, 0.46, 0], palette.panel);
  addBox(scene, 'green-exfil-arrow-left', [0.72, 0.06, 0.08], [0.56, 0.78, -0.26], palette.cyan);
  addBox(scene, 'green-exfil-arrow-right', [0.72, 0.06, 0.08], [0.56, 0.78, 0.26], palette.cyan);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.035, 8, 36), palette.cyan);
  ring.name = 'vertical-extraction-halo';
  ring.position.set(0.5, 1.05, 0);
  ring.rotation.y = Math.PI / 2;
  scene.add(ring);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 1.0, 10), palette.cyan);
  mast.name = 'exfil-light-mast';
  mast.position.set(-0.72, 1.22, -0.05);
  scene.add(mast);
  prepareScene(scene);
  return scene;
}

function buildCoverBarricade() {
  const scene = namedScene('cover-barricade-kit');
  addBox(scene, 'armored-cover-base', [3.2, 0.22, 1.2], [0, 0.11, 0], palette.darkMetal);
  addBox(scene, 'left-weighted-crate', [1.05, 0.82, 1.05], [-1.0, 0.62, 0], palette.panel);
  addBox(scene, 'right-weighted-crate', [1.05, 0.82, 1.05], [1.0, 0.62, 0], palette.panel);
  addBox(scene, 'center-armor-slab', [1.4, 1.18, 0.32], [0, 0.8, -0.36], palette.darkMetal);
  addBox(scene, 'front-hazard-rail', [3.05, 0.08, 0.08], [0, 1.22, -0.6], palette.amber);
  addBox(scene, 'rear-cyan-status-rail', [2.8, 0.06, 0.08], [0, 1.04, 0.58], palette.cyan);
  addBox(scene, 'left-side-service-panel', [0.14, 0.52, 0.78], [-1.63, 0.72, 0], palette.darkMetal);
  addBox(scene, 'right-side-service-panel', [0.14, 0.52, 0.78], [1.63, 0.72, 0], palette.darkMetal);

  for (let index = 0; index < 4; index += 1) {
    addBox(scene, `front-bolt-${index + 1}`, [0.14, 0.08, 0.08], [-1.2 + index * 0.8, 0.34, -0.64], palette.amber);
    addBox(scene, `top-rib-${index + 1}`, [0.08, 0.1, 1.0], [-1.2 + index * 0.8, 1.08, 0], palette.darkMetal);
  }

  const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.2, 0.1, 18), palette.cyan);
  dish.name = 'low-profile-sensor-dish';
  dish.position.set(0, 1.45, 0.1);
  dish.rotation.x = Math.PI / 2;
  scene.add(dish);

  prepareScene(scene);
  return scene;
}

async function writeGlb(name, scene) {
  const exporter = new GLTFExporter();
  const glb = await exporter.parseAsync(scene, { binary: true });
  const outputPath = `${outputRoot}/${name}.glb`;
  await writeFile(outputPath, Buffer.from(glb));
  console.info(`[asset] wrote ${outputPath} (${Buffer.byteLength(Buffer.from(glb))} bytes)`);
}

function namedScene(name) {
  const scene = new THREE.Scene();
  scene.name = name;
  return scene;
}

function addBox(scene, name, size, position, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.name = name;
  mesh.position.set(...position);
  scene.add(mesh);
}

function prepareScene(scene) {
  scene.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });
}
