import * as THREE from 'three';
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js';
import sentryUrl from '../assets/characters/sentry/enemy_sentry.glb?url';
import cableTrayUrl from '../assets/environment/cable-tray-kit.glb?url';
import extractionBeaconUrl from '../assets/environment/extraction-beacon-kit.glb?url';
import wallMachineryUrl from '../assets/environment/wall-machinery-kit.glb?url';
import commandCodesUrl from '../assets/objectives/command-codes-cinematic.glb?url';
import keycardUrl from '../assets/objectives/keycard-cinematic.glb?url';
import terminalUrl from '../assets/objectives/terminal-cinematic.glb?url';
import { heroOptionById, type HeroId } from './heroes';
import type {
  MemoryMetrics,
  ObjectiveAssetId,
  RuntimeAssetAudit,
  RuntimeAssetManifestEntry,
  SetDressingAssetId,
} from './types';

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

type StaticAssetId = ObjectiveAssetId | SetDressingAssetId;

const sentryAssetManifest: RuntimeAssetManifestEntry = {
  id: 'sentry',
  label: 'Enemy sentry',
  kind: 'enemy',
  requirement: 'required',
  source: 'sneak-game-seed',
  path: 'src/assets/characters/sentry/enemy_sentry.glb',
  expectedFormat: 'glb',
  fallbackPolicy: 'required-error',
  notes: [
    'Hash-matched against the local Shadow Circuit sentry seed asset during the v0.13.4 provenance audit.',
    'Required enemy model; QA must fail load or grounding issues instead of accepting primitive stand-ins.',
  ],
};

const objectiveAssetManifests: Record<ObjectiveAssetId, RuntimeAssetManifestEntry> = {
  keycard: {
    id: 'keycard',
    label: 'Access keycard objective',
    kind: 'objective',
    requirement: 'required',
    source: 'sneak-game-seed',
    path: 'src/assets/objectives/keycard-cinematic.glb',
    expectedFormat: 'glb',
    fallbackPolicy: 'required-error',
    notes: [
      'Hash-matched against the local Shadow Circuit keycard seed asset during the v0.13.4 provenance audit.',
      'Required objective model; QA must fail missing or unreadable runtime geometry.',
    ],
  },
  terminal: {
    id: 'terminal',
    label: 'Security terminal objective',
    kind: 'objective',
    requirement: 'required',
    source: 'sneak-game-seed',
    path: 'src/assets/objectives/terminal-cinematic.glb',
    expectedFormat: 'glb',
    fallbackPolicy: 'required-error',
    notes: [
      'Hash-matched against the local Shadow Circuit terminal seed asset during the v0.13.4 provenance audit.',
      'Required objective model; QA must fail missing or unreadable runtime geometry.',
    ],
  },
  codes: {
    id: 'codes',
    label: 'Command codes objective',
    kind: 'objective',
    requirement: 'required',
    source: 'repo-generated-glb',
    path: 'src/assets/objectives/command-codes-cinematic.glb',
    expectedFormat: 'glb',
    fallbackPolicy: 'required-error',
    notes: [
      'Repo-generated cinematic command-codes GLB.',
      'Required objective model; QA must fail missing or unreadable runtime geometry.',
    ],
  },
};

const setDressingAssetManifests: Record<SetDressingAssetId, RuntimeAssetManifestEntry> = {
  'cable-tray': {
    id: 'cable-tray',
    label: 'Cable tray dressing kit',
    kind: 'set-dressing',
    requirement: 'optional',
    source: 'repo-generated-glb',
    path: 'src/assets/environment/cable-tray-kit.glb',
    expectedFormat: 'glb',
    fallbackPolicy: 'optional-omit',
    notes: ['Repo-generated modular GLB kit for tactical cable and floor dressing.'],
  },
  'wall-machinery': {
    id: 'wall-machinery',
    label: 'Wall machinery dressing kit',
    kind: 'set-dressing',
    requirement: 'optional',
    source: 'repo-generated-glb',
    path: 'src/assets/environment/wall-machinery-kit.glb',
    expectedFormat: 'glb',
    fallbackPolicy: 'optional-omit',
    notes: ['Repo-generated modular GLB kit for machinery, vents, and wall silhouette breaks.'],
  },
  'extraction-beacon': {
    id: 'extraction-beacon',
    label: 'Extraction beacon dressing kit',
    kind: 'set-dressing',
    requirement: 'optional',
    source: 'repo-generated-glb',
    path: 'src/assets/environment/extraction-beacon-kit.glb',
    expectedFormat: 'glb',
    fallbackPolicy: 'optional-omit',
    notes: ['Repo-generated modular GLB kit for extraction staging and green beacon readability.'],
  },
};

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
  private readonly staticAssetFailures = new Map<StaticAssetId, string>();
  private loaderPromise: Promise<RuntimeGltfLoader> | null = null;

  async preloadHero(heroId: HeroId): Promise<void> {
    const key = heroKey(heroId);
    if (this.characterAssets.has(key)) return;

    const loader = await this.loader();
    const hero = heroOptionById(heroId);
    const [idleGltf, runGltf] = await Promise.all([loader.loadAsync(hero.idleUrl), loader.loadAsync(hero.runUrl)]);
    normalizeCharacterScene(idleGltf.scene, 1.45, 0.02);
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
    normalizeCharacterScene(gltf.scene, 1.55, 0.02);
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

  async preloadSetDressing(assetIds: readonly SetDressingAssetId[]): Promise<void> {
    const uniqueIds = [...new Set(assetIds)];
    await Promise.all(uniqueIds.map(async (id) => {
      try {
        await this.loadStatic(id, setDressingAssetUrl(id), 1.0);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.staticAssetFailures.set(id, message);
        console.warn(`[shadow-recruit] Optional set-dressing asset ${id} failed to load; omitting player-facing prop. ${message}`);
      }
    }));
  }

  createHero(heroId: HeroId, name: string): CharacterInstance {
    const asset = this.requireCharacter(heroKey(heroId));
    return this.cloneCharacter(asset, name);
  }

  createSentry(name: string): CharacterInstance {
    const asset = this.requireCharacter('sentry');
    return this.cloneCharacter(asset, name);
  }

  createObjective(assetId: ObjectiveAssetId, name: string): THREE.Object3D {
    return this.createStatic(assetId, name);
  }

  createSetDressing(assetId: SetDressingAssetId, name: string): THREE.Object3D | null {
    const source = this.staticAssets.get(assetId);
    if (!source) return null;
    return this.createStatic(assetId, name);
  }

  private createStatic(assetId: StaticAssetId, name: string): THREE.Object3D {
    const source = this.staticAssets.get(assetId);
    if (!source) throw new Error(`Static asset not loaded: ${assetId}`);

    const visual = source.clone(true);
    visual.name = `${name}:visual`;
    const object = new THREE.Group();
    object.name = name;
    object.add(visual);
    visual.traverse((child) => {
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

  metrics(): Omit<MemoryMetrics, 'runtimeObjects' | 'assetAudit'> {
    const characterAssetIds = [...this.characterAssets.keys()].sort();
    const staticAssetIds = [...this.staticAssets.keys()].sort();
    const failedAssetIds = [...this.staticAssetFailures.keys()].sort();
    return {
      loadedAssets: characterAssetIds.length + staticAssetIds.length,
      characterAssets: characterAssetIds.length,
      staticAssets: staticAssetIds.length,
      loadedAssetIds: [...characterAssetIds, ...staticAssetIds],
      failedAssetIds,
    };
  }

  assetAudit(
    heroId: HeroId,
    activeSetDressingAssetIds: readonly SetDressingAssetId[],
    visibleFallbackAssetIds: ReadonlySet<string> = new Set(),
  ): readonly RuntimeAssetAudit[] {
    const setDressingEntries = [...new Set(activeSetDressingAssetIds)]
      .sort()
      .map((assetId) => setDressingAssetManifests[assetId]);
    const entries = [
      heroAssetManifest(heroId),
      sentryAssetManifest,
      ...Object.values(objectiveAssetManifests),
      ...setDressingEntries,
    ];
    return entries.map((entry) => this.auditManifestEntry(entry, visibleFallbackAssetIds));
  }

  isStaticLoaded(assetId: StaticAssetId): boolean {
    return this.staticAssets.has(assetId);
  }

  staticFailure(assetId: StaticAssetId): string | undefined {
    return this.staticAssetFailures.get(assetId);
  }

  private async loadStatic(id: StaticAssetId, url: string, targetHeight: number): Promise<void> {
    if (this.staticAssets.has(id)) return;
    const loader = await this.loader();
    const gltf = await loader.loadAsync(url);
    normalizeStaticScene(gltf.scene, targetHeight);
    prepareMaterials(gltf.scene, staticAccent(id));
    this.staticAssets.set(id, gltf.scene);
    this.staticAssetFailures.delete(id);
  }

  private cloneCharacter(asset: CharacterAsset, name: string): CharacterInstance {
    const visual = cloneSkeleton(asset.scene);
    visual.name = `${name}:visual`;
    const object = new THREE.Group();
    object.name = name;
    object.add(visual);
    visual.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    return {
      object,
      animator: asset.clips.idle || asset.clips.run ? new CharacterAnimator(visual, asset.clips) : null,
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

  private auditManifestEntry(
    entry: RuntimeAssetManifestEntry,
    visibleFallbackAssetIds: ReadonlySet<string>,
  ): RuntimeAssetAudit {
    const loaded = entry.kind === 'hero' || entry.kind === 'enemy'
      ? this.characterAssets.has(entry.id)
      : this.staticAssets.has(entry.id as StaticAssetId);
    const failure = entry.kind === 'objective' || entry.kind === 'set-dressing'
      ? this.staticAssetFailures.get(entry.id as StaticAssetId)
      : undefined;
    const fallbackVisible = visibleFallbackAssetIds.has(entry.id);
    const failed = !loaded || Boolean(failure) || fallbackVisible;
    const notes = [
      ...entry.notes,
      loaded
        ? 'Loaded through the runtime GLTFLoader asset path.'
        : 'Runtime GLB is not loaded; tester must fail this asset instead of accepting a primitive stand-in.',
      fallbackVisible
        ? 'Visible primitive or placeholder fallback detected in the scene.'
        : 'No visible primitive or placeholder fallback is reported for this asset ID.',
    ];
    return {
      ...entry,
      loaded,
      failed,
      ...(failure ? { failure } : {}),
      fallbackVisible,
      grade: failed ? 'fail' : 'pass',
      notes,
    };
  }
}

function heroKey(heroId: HeroId): string {
  return `hero:${heroId}`;
}

function heroAssetManifest(heroId: HeroId): RuntimeAssetManifestEntry {
  const hero = heroOptionById(heroId);
  return {
    id: heroKey(hero.id),
    label: hero.name,
    kind: 'hero',
    requirement: 'required',
    source: hero.provenance,
    path: `${hero.idlePath}; ${hero.runPath}`,
    expectedFormat: 'glb',
    fallbackPolicy: 'required-error',
    notes: [
      ...hero.provenanceNotes,
      `${hero.name} uses separate idle and run GLBs with runtime clip mapping through AnimationMixer.`,
      'Required playable character model; QA must fail missing or unreadable runtime geometry.',
    ],
  };
}

function staticAccent(id: StaticAssetId): string {
  if (id === 'keycard') return '#ffd45a';
  if (id === 'terminal') return '#67d7ff';
  if (id === 'cable-tray') return '#6fffe2';
  if (id === 'wall-machinery') return '#67d7ff';
  if (id === 'extraction-beacon') return '#8eff81';
  return '#72ffd8';
}

function setDressingAssetUrl(id: SetDressingAssetId): string {
  if (id === 'cable-tray') return cableTrayUrl;
  if (id === 'wall-machinery') return wallMachineryUrl;
  return extractionBeaconUrl;
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
