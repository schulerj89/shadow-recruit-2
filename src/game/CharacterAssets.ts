import * as THREE from 'three';
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js';
import sentryUrl from '../assets/characters/sentry/enemy_sentry.glb?url';
import commandCodesUrl from '../assets/objectives/command-codes-cinematic.glb?url';
import keycardUrl from '../assets/objectives/keycard-cinematic.glb?url';
import terminalUrl from '../assets/objectives/terminal-cinematic.glb?url';
import { heroOptionById, type HeroId } from './heroes';
import type { MemoryMetrics } from './types';

type Gltf = { scene: THREE.Group; animations: THREE.AnimationClip[] };
type RuntimeGltfLoader = { loadAsync: (url: string) => Promise<Gltf> };

export type CharacterMotionState = 'idle' | 'run';

type CharacterAnimationClips = {
  idle?: THREE.AnimationClip;
  run?: THREE.AnimationClip;
};

type CharacterAsset = {
  scene: THREE.Group;
  clips: CharacterAnimationClips;
};

type StaticAssetId = 'keycard' | 'terminal' | 'codes';

export type CharacterInstance = {
  object: THREE.Object3D;
  animator: CharacterAnimator | null;
};

export class CharacterAnimator {
  private readonly mixer: THREE.AnimationMixer;
  private readonly actions = new Map<CharacterMotionState, THREE.AnimationAction>();
  private activeState: CharacterMotionState | null = null;

  constructor(private readonly object: THREE.Object3D, clips: CharacterAnimationClips) {
    this.mixer = new THREE.AnimationMixer(object);
    this.addAction('idle', clips.idle);
    this.addAction('run', clips.run);
    if (this.actions.has('idle')) this.setMotionState('idle', 0);
  }

  setMotionState(state: CharacterMotionState, fadeSeconds = 0.16): void {
    const nextAction = this.actions.get(state);
    if (!nextAction || this.activeState === state) return;

    const currentAction = this.activeState ? this.actions.get(this.activeState) : null;
    nextAction.enabled = true;
    nextAction.reset();
    nextAction.setEffectiveTimeScale(1);
    nextAction.setEffectiveWeight(1);
    nextAction.play();

    if (currentAction && fadeSeconds > 0) {
      currentAction.crossFadeTo(nextAction, fadeSeconds, false);
    } else if (currentAction) {
      currentAction.stop();
    }

    this.activeState = state;
  }

  update(delta: number): void {
    this.mixer.update(delta);
  }

  dispose(): void {
    this.mixer.stopAllAction();
    this.mixer.uncacheRoot(this.object);
    this.actions.clear();
  }

  private addAction(state: CharacterMotionState, clip: THREE.AnimationClip | undefined): void {
    if (!clip) return;

    const action = this.mixer.clipAction(clip);
    action.enabled = true;
    action.clampWhenFinished = false;
    action.loop = THREE.LoopRepeat;
    this.actions.set(state, action);
  }
}

export class AssetLibrary {
  private readonly characterAssets = new Map<string, CharacterAsset>();
  private readonly staticAssets = new Map<string, THREE.Group>();
  private loaderPromise: Promise<RuntimeGltfLoader> | null = null;

  async preloadHero(heroId: HeroId): Promise<void> {
    const key = heroKey(heroId);
    if (this.characterAssets.has(key)) return;

    const loader = await this.loader();
    const hero = heroOptionById(heroId);
    const [idleGltf, runGltf] = await Promise.all([loader.loadAsync(hero.idleUrl), loader.loadAsync(hero.runUrl)]);
    normalizeCharacterScene(idleGltf.scene, 1.45, -0.46);
    prepareMaterials(idleGltf.scene, hero.accentColor);
    this.characterAssets.set(key, {
      scene: idleGltf.scene,
      clips: {
        idle: findClip(idleGltf.animations, /idle/i),
        run: findClip(runGltf.animations, /run/i),
      },
    });
  }

  async preloadSentry(): Promise<void> {
    if (this.characterAssets.has('sentry')) return;

    const loader = await this.loader();
    const gltf = await loader.loadAsync(sentryUrl);
    normalizeCharacterScene(gltf.scene, 1.55, -0.52);
    prepareMaterials(gltf.scene, '#ff7046');
    this.characterAssets.set('sentry', { scene: gltf.scene, clips: {} });
  }

  async preloadObjectives(): Promise<void> {
    await Promise.all([
      this.loadStatic('keycard', keycardUrl, 0.9),
      this.loadStatic('terminal', terminalUrl, 1.55),
      this.loadStatic('codes', commandCodesUrl, 1.0),
    ]);
  }

  createHero(heroId: HeroId, name: string): CharacterInstance {
    const asset = this.requireCharacter(heroKey(heroId));
    return this.cloneCharacter(asset, name);
  }

  createSentry(name: string): CharacterInstance {
    const asset = this.requireCharacter('sentry');
    return this.cloneCharacter(asset, name);
  }

  createObjective(assetId: StaticAssetId, name: string): THREE.Object3D {
    const source = this.staticAssets.get(assetId);
    if (!source) throw new Error(`Objective asset not loaded: ${assetId}`);

    const object = source.clone(true);
    object.name = name;
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return object;
  }

  dispose(): void {
    this.characterAssets.forEach((asset) => disposeObject(asset.scene));
    this.staticAssets.forEach((asset) => disposeObject(asset));
    this.characterAssets.clear();
    this.staticAssets.clear();
  }

  metrics(): Omit<MemoryMetrics, 'runtimeObjects'> {
    const characterAssetIds = [...this.characterAssets.keys()].sort();
    const staticAssetIds = [...this.staticAssets.keys()].sort();
    return {
      loadedAssets: characterAssetIds.length + staticAssetIds.length,
      characterAssets: characterAssetIds.length,
      staticAssets: staticAssetIds.length,
      loadedAssetIds: [...characterAssetIds, ...staticAssetIds],
    };
  }

  private async loadStatic(id: StaticAssetId, url: string, targetHeight: number): Promise<void> {
    if (this.staticAssets.has(id)) return;
    const loader = await this.loader();
    const gltf = await loader.loadAsync(url);
    normalizeStaticScene(gltf.scene, targetHeight);
    prepareMaterials(gltf.scene, staticAccent(id));
    this.staticAssets.set(id, gltf.scene);
  }

  private cloneCharacter(asset: CharacterAsset, name: string): CharacterInstance {
    const object = cloneSkeleton(asset.scene);
    object.name = name;
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    return {
      object,
      animator: asset.clips.idle || asset.clips.run ? new CharacterAnimator(object, asset.clips) : null,
    };
  }

  private requireCharacter(key: string): CharacterAsset {
    const asset = this.characterAssets.get(key);
    if (!asset) throw new Error(`Character asset not loaded: ${key}`);
    return asset;
  }

  private loader(): Promise<RuntimeGltfLoader> {
    this.loaderPromise ??= import('three/examples/jsm/loaders/GLTFLoader.js').then(({ GLTFLoader }) => new GLTFLoader());
    return this.loaderPromise;
  }
}

function heroKey(heroId: HeroId): string {
  return `hero:${heroId}`;
}

function staticAccent(id: StaticAssetId): string {
  if (id === 'keycard') return '#ffd45a';
  if (id === 'terminal') return '#67d7ff';
  return '#72ffd8';
}

function normalizeCharacterScene(scene: THREE.Group, targetHeight: number, bottomOffset: number): void {
  scene.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(scene);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  const scale = size.y > 0 ? targetHeight / size.y : 1;
  scene.position.set(-center.x * scale, bottomOffset - bounds.min.y * scale, -center.z * scale);
  scene.scale.setScalar(scale);
}

function normalizeStaticScene(scene: THREE.Group, targetHeight: number): void {
  scene.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(scene);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  const scale = size.y > 0 ? targetHeight / size.y : 1;
  scene.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
  scene.scale.setScalar(scale);
}

function prepareMaterials(scene: THREE.Group, accent: string): void {
  const accentColor = new THREE.Color(accent);
  scene.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;

    const materials = Array.isArray(child.material) ? child.material : [child.material];
    const cloned = materials.map((material) => {
      if (!(material instanceof THREE.MeshStandardMaterial) && !(material instanceof THREE.MeshPhysicalMaterial)) {
        return material;
      }

      const boosted = material.clone();
      boosted.emissive.lerp(accentColor, 0.2);
      boosted.emissiveIntensity = Math.max(boosted.emissiveIntensity, 0.12);
      boosted.roughness = Math.min(boosted.roughness, 0.72);
      boosted.needsUpdate = true;
      return boosted;
    });
    child.material = Array.isArray(child.material) ? cloned : cloned[0];
  });
}

function findClip(animations: readonly THREE.AnimationClip[], pattern: RegExp): THREE.AnimationClip | undefined {
  return animations.find((animation) => pattern.test(animation.name)) ?? animations[0];
}

export function disposeObject(object: THREE.Object3D): void {
  const skeletons = new Set<THREE.Skeleton>();
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry?.dispose();
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      for (const material of materials) {
        for (const value of Object.values(material)) {
          if (value instanceof THREE.Texture) value.dispose();
        }
        material.dispose();
      }
    }

    const skinned = child as THREE.SkinnedMesh;
    if (skinned.isSkinnedMesh && skinned.skeleton) skeletons.add(skinned.skeleton);
  });
  skeletons.forEach((skeleton) => skeleton.dispose());
}
