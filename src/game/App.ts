import * as THREE from 'three';
import generalUrl from '../assets/generated/general-caldwell.png?url';
import doorPanelUrl from '../assets/generated/sliding-door-panel.png?url';
import floorPanelUrl from '../assets/generated/tactical-floor-panel.png?url';
import wallPanelUrl from '../assets/generated/blacksite-wall-panel.png?url';
import { AssetLibrary, type CharacterInstance, disposeObject } from './CharacterAssets';
import { AudioDirector } from './AudioDirector';
import { defaultHeroId, heroOptionById, heroOptions, isHeroId, type HeroId } from './heroes';
import { defaultLevel, getLevelById, levelCatalog } from './levels';
import { add, clamp, distance, normalize, pointInBounds, pointInRect, scale, subtract, vec } from './math';
import { isPerformanceProfile, loadSettings, saveSettings } from './settings';
import type {
  AudioState,
  AssetQualityCheck,
  AssetQualityGrade,
  Bounds3,
  CinematicFocusState,
  CompletionStats,
  DoorCoordinateGap,
  DoorToDoorOwnershipCheck,
  DoorRuntime,
  EnemyRuntime,
  FramePacingSample,
  GameSettings,
  GameplayCameraState,
  GameplayViewDensityCategory,
  GameplayViewDensityObject,
  GameplayViewDensityState,
  GeometryDiagnostics,
  LevelCatalogEntry,
  LevelDefinition,
  LevelDensityCheck,
  LevelZoneDensityCheck,
  LevelZoneDefinition,
  LoadingState,
  LoadingStep,
  MemoryMetrics,
  MissionGuidanceState,
  ObjectiveRuntime,
  OperativeCatalogEntry,
  OperativeMechanicsSnapshot,
  OperativeScalar,
  OperativeState,
  OperativeTraitDefinition,
  OperativeTraitProbe,
  OperativeTraitState,
  PerformanceProfile,
  Phase,
  RectSpec,
  RenderBudgetState,
  RendererMetrics,
  SceneObjectBounds,
  ScreenBounds,
  ScreenPoint,
  SetDressingDefinition,
  SetDressingVisibilityCheck,
  TesterState,
  TitleIdentityAnchor,
  TutorialAlignmentCheck,
  TitleComposition,
  TitleTreatmentState,
  TutorialState,
  Vec2,
  WallRunCameraProbe,
  WallRunConnectionEdge,
  WallRunInterval,
} from './types';

type DoorMesh = {
  left: THREE.Object3D;
  right: THREE.Object3D;
};

type RuntimeObject = {
  object: THREE.Object3D;
  dispose?: () => void;
  disposeResources?: boolean;
};

type RenderQuality = {
  pixelRatioCap: number;
  shadowsEnabled: boolean;
  shadowMapSize: number;
  floorSegments: number;
  detectionConeSegments: number;
  extractionRingSegments: number;
  lightIntensityScale: number;
  textureAnisotropy: number;
};

type RenderBudgetLimits = Pick<
  RenderBudgetState,
  'maxDrawCalls' | 'maxTriangles' | 'maxGeometries' | 'maxTextures' | 'maxPixelRatio' | 'shadowsAllowed'
>;

type AssetQualityOptions = {
  planarGround?: boolean;
  minWidth?: number;
  minDepth?: number;
};

type ShellTextureKind = 'floor' | 'wall' | 'blocker' | 'trim';

const minimumLoadingScreenMs = 650;
const gameplayCameraTargetHeight = 1.15;
const gameplayCameraOffset = { x: 3.15, y: 3.85, z: -4.65 };
const baseMoveSpeedByProfile: Record<PerformanceProfile, number> = {
  performance: 8.2,
  balanced: 7.6,
  cinematic: 7.6,
};
const baseTerminalUseMs = 1200;
const baseExtractionRadius = 2.7;
const operativeProbeTolerance = 0.01;
const gameplayDensityBands = [
  { id: 'near', label: 'near foreground', minDistance: 0, maxDistance: 8, minVisibleObjects: 2, minTacticalCategories: 2, minScreenOccupancy: 0.015, maxNegativeSpaceRatio: 0.38 },
  { id: 'mid', label: 'midground objective route', minDistance: 8, maxDistance: 18, minVisibleObjects: 2, minTacticalCategories: 2, minScreenOccupancy: 0.006, maxNegativeSpaceRatio: 0.5 },
  { id: 'far', label: 'far background landmark', minDistance: 18, maxDistance: 34, minVisibleObjects: 1, minTacticalCategories: 1, minScreenOccupancy: 0.002, maxNegativeSpaceRatio: 0.62 },
] as const;

const renderQualityByProfile: Record<PerformanceProfile, RenderQuality> = {
  performance: {
    pixelRatioCap: 0.75,
    shadowsEnabled: false,
    shadowMapSize: 0,
    floorSegments: 6,
    detectionConeSegments: 18,
    extractionRingSegments: 32,
    lightIntensityScale: 0.62,
    textureAnisotropy: 1,
  },
  balanced: {
    pixelRatioCap: 1,
    shadowsEnabled: true,
    shadowMapSize: 1024,
    floorSegments: 24,
    detectionConeSegments: 32,
    extractionRingSegments: 64,
    lightIntensityScale: 1,
    textureAnisotropy: 4,
  },
  cinematic: {
    pixelRatioCap: 1.3,
    shadowsEnabled: true,
    shadowMapSize: 2048,
    floorSegments: 36,
    detectionConeSegments: 48,
    extractionRingSegments: 96,
    lightIntensityScale: 1.18,
    textureAnisotropy: 8,
  },
};

const renderBudgetByProfile: Record<PerformanceProfile, RenderBudgetLimits> = {
  performance: {
    maxDrawCalls: 760,
    maxTriangles: 420_000,
    maxGeometries: 130,
    maxTextures: 34,
    maxPixelRatio: 0.75,
    shadowsAllowed: false,
  },
  balanced: {
    maxDrawCalls: 900,
    maxTriangles: 520_000,
    maxGeometries: 160,
    maxTextures: 48,
    maxPixelRatio: 1,
    shadowsAllowed: true,
  },
  cinematic: {
    maxDrawCalls: 1_050,
    maxTriangles: 680_000,
    maxGeometries: 190,
    maxTextures: 64,
    maxPixelRatio: 1.3,
    shadowsAllowed: true,
  },
};

type ShadowRecruitDebugApi = {
  ready: () => boolean;
  phase: () => Phase;
  missionId: () => string;
  missions: () => readonly LevelCatalogEntry[];
  settings: () => GameSettings;
  audioState: () => AudioState;
  loadingState: () => LoadingState;
  tutorialStep: () => TutorialState;
  tutorialAlignment: () => readonly TutorialAlignmentCheck[];
  cinematicFocus: () => CinematicFocusState;
  selectedHero: () => HeroId;
  playerPosition: () => Vec2;
  playerVisible: () => boolean;
  titleComposition: () => TitleComposition;
  setTitleOrbitAngle: (angle: number) => void;
  clearTitleOrbitAngle: () => void;
  operativeMechanics: () => OperativeState;
  operativeCatalog: () => readonly OperativeCatalogEntry[];
  enemies: () => readonly {
    id: string;
    position: Vec2;
    start: Vec2;
    detectionRadius: number;
    baseDetectionRadius: number;
    effectiveContactRadius: number;
  }[];
  assetQuality: () => readonly AssetQualityCheck[];
  objectives: () => { collectedRequired: number; totalRequired: number; exitUnlocked: boolean };
  doors: () => readonly { id: string; open: boolean; progress: number }[];
  rendererMetrics: () => RendererMetrics;
  framePacing: () => FramePacingSample;
  memoryMetrics: () => MemoryMetrics;
  selectMission: (missionId: string) => Promise<void>;
  movePlayerTo: (point: Vec2) => void;
  teleportPlayerTo: (point: Vec2) => void;
  collectObjective: (objectiveId: string) => void;
  forceAlert: () => void;
  forceFailure: () => void;
  forceSuccess: () => void;
  resetMission: () => Promise<void>;
  startGame: (heroId?: string, missionId?: string) => Promise<void>;
  setPerformanceProfile: (profile: string) => void;
  completeMission: () => void;
  resetFramePacing: () => void;
  captureTesterState: () => TesterState;
};

declare global {
  interface Window {
    __shadowRecruitDebug?: ShadowRecruitDebugApi;
  }
}

function shellTexturePalette(kind: ShellTextureKind): { base: string; panel: string; line: string; tint: string } {
  if (kind === 'floor') return { base: '#0f1820', panel: '#1a2830', line: '#5fd7d8', tint: '#c7d9df' };
  if (kind === 'blocker') return { base: '#24323a', panel: '#35444d', line: '#ffd45a', tint: '#d3dee1' };
  if (kind === 'trim') return { base: '#14262f', panel: '#223a44', line: '#6fffe2', tint: '#d9f6f2' };
  return { base: '#202c35', panel: '#32414a', line: '#7ac7da', tint: '#d5e2e8' };
}

function createShellTexture(kind: ShellTextureKind, base: string, panel: string, line: string): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Unable to create shell material canvas.');

  context.fillStyle = base;
  context.fillRect(0, 0, size, size);

  if (kind === 'floor') {
    drawFloorTexture(context, size, panel, line);
  } else if (kind === 'trim') {
    drawTrimTexture(context, size, panel, line);
  } else {
    drawWallTexture(context, size, panel, line, kind === 'blocker');
  }

  return new THREE.CanvasTexture(canvas);
}

function drawFloorTexture(context: CanvasRenderingContext2D, size: number, panel: string, line: string): void {
  context.fillStyle = panel;
  for (let y = 0; y < size; y += 64) {
    for (let x = 0; x < size; x += 64) {
      context.globalAlpha = (x + y) % 128 === 0 ? 0.42 : 0.28;
      context.fillRect(x + 4, y + 4, 56, 56);
    }
  }
  context.globalAlpha = 0.56;
  context.strokeStyle = '#05090d';
  context.lineWidth = 3;
  for (let i = 0; i <= size; i += 64) {
    context.beginPath();
    context.moveTo(i, 0);
    context.lineTo(i, size);
    context.moveTo(0, i);
    context.lineTo(size, i);
    context.stroke();
  }
  context.globalAlpha = 0.7;
  context.strokeStyle = line;
  context.lineWidth = 2;
  for (let i = 24; i < size; i += 96) {
    context.beginPath();
    context.moveTo(i, 10);
    context.lineTo(i + 34, 44);
    context.stroke();
  }
  context.globalAlpha = 1;
}

function drawWallTexture(context: CanvasRenderingContext2D, size: number, panel: string, line: string, reinforced: boolean): void {
  context.fillStyle = panel;
  for (let y = 12; y < size; y += 58) {
    context.globalAlpha = 0.38;
    context.fillRect(12, y, size - 24, 38);
    context.globalAlpha = 0.5;
    context.strokeStyle = '#0a1117';
    context.lineWidth = 2;
    context.strokeRect(12, y, size - 24, 38);
  }
  context.globalAlpha = 0.65;
  context.strokeStyle = line;
  context.lineWidth = reinforced ? 3 : 2;
  for (let x = 28; x < size; x += 54) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, size);
    context.stroke();
  }
  context.globalAlpha = 0.72;
  context.fillStyle = '#b5cbd0';
  for (let y = 28; y < size; y += 64) {
    for (let x = 22; x < size; x += 70) {
      context.fillRect(x, y, 4, 4);
      context.fillRect(x + 36, y + 18, 4, 4);
    }
  }
  context.globalAlpha = 1;
}

function drawTrimTexture(context: CanvasRenderingContext2D, size: number, panel: string, line: string): void {
  context.fillStyle = panel;
  context.globalAlpha = 0.45;
  context.fillRect(10, 10, size - 20, size - 20);
  context.globalAlpha = 0.8;
  context.strokeStyle = line;
  context.lineWidth = 4;
  context.strokeRect(18, 18, size - 36, size - 36);
  context.globalAlpha = 0.5;
  context.strokeStyle = '#061016';
  context.lineWidth = 2;
  for (let i = 34; i < size; i += 42) {
    context.beginPath();
    context.moveTo(i, 0);
    context.lineTo(i + 18, size);
    context.stroke();
  }
  context.globalAlpha = 1;
}

function roundMetric(value: number): number {
  return Number(value.toFixed(2));
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export class ShadowRecruitApp {
  private readonly shell: HTMLDivElement;
  private readonly canvas: HTMLCanvasElement;
  private readonly overlay: HTMLDivElement;
  private readonly hud: HTMLDivElement;
  private readonly prompt: HTMLDivElement;
  private readonly debugPanel: HTMLDivElement;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(55, 1, 0.1, 240);
  private readonly clock = new THREE.Clock();
  private readonly assets = new AssetLibrary();
  private readonly titleHeroStagePosition = new THREE.Vector3(2.6, 0, -18);
  private readonly titleCameraTarget = new THREE.Vector3(2.6, 1.12, -18);
  private readonly titleCameraPosition = new THREE.Vector3(7.7, 3.05, -16.35);
  private readonly keyState = new Set<string>();
  private readonly pressedKeys = new Set<string>();
  private readonly frameDeltas: number[] = [];
  private readonly runtimeObjects: RuntimeObject[] = [];
  private readonly doorMeshes = new Map<string, DoorMesh>();
  private readonly doorFrameMeshes = new Map<string, THREE.Object3D>();
  private readonly doorContinuityMeshes = new Map<string, THREE.Object3D>();
  private readonly enemyDetectionCones = new Map<string, THREE.Object3D>();
  private readonly anchorObjects = new Map<string, THREE.Object3D>();
  private readonly boundsScratch = new THREE.Box3();
  private readonly raycaster = new THREE.Raycaster();
  private readonly gameplayCameraTargetScratch = new THREE.Vector3();
  private readonly gameplayCameraDesiredScratch = new THREE.Vector3();
  private readonly doorTexture = new THREE.TextureLoader().load(doorPanelUrl);
  private readonly floorTexture = new THREE.TextureLoader().load(floorPanelUrl);
  private readonly wallTexture = new THREE.TextureLoader().load(wallPanelUrl);
  private level: LevelDefinition = defaultLevel;
  private settings: GameSettings = loadSettings();
  private readonly audio = new AudioDirector(this.settings);
  private selectedHero: HeroId = defaultHeroId;
  private phase: Phase = 'boot';
  private previousPhase: Phase = 'title';
  private ready = false;
  private loading = { label: 'booting', value: 0 };
  private loadingStartedAt = 0;
  private loadingHistory: LoadingStep[] = [];
  private objectives: ObjectiveRuntime[] = [];
  private doors: DoorRuntime[] = [];
  private enemies: EnemyRuntime[] = [];
  private player: CharacterInstance | null = null;
  private titleHero: CharacterInstance | null = null;
  private playerPosition: Vec2 = { ...defaultLevel.start };
  private runStartedAt = 0;
  private alarms = 0;
  private tutorialIndex = 0;
  private activePrompt = '';
  private focusUntil = 0;
  private focusTargetId: string | null = null;
  private focusPoint: Vec2 | null = null;

  constructor(private readonly host: HTMLDivElement) {
    this.shell = document.createElement('div');
    this.shell.className = 'game-shell';

    this.canvas = document.createElement('canvas');
    this.canvas.className = 'game-canvas';

    this.overlay = document.createElement('div');
    this.overlay.className = 'overlay';
    this.overlay.dataset.testid = 'overlay';

    this.hud = document.createElement('div');
    this.hud.className = 'hud';
    this.hud.dataset.testid = 'hud';

    this.prompt = document.createElement('div');
    this.prompt.className = 'interaction-prompt';
    this.prompt.dataset.testid = 'interaction-prompt';
    this.prompt.hidden = true;

    this.debugPanel = document.createElement('div');
    this.debugPanel.className = 'debug-panel';
    this.debugPanel.dataset.testid = 'debug-panel';
    this.debugPanel.hidden = true;

    this.shell.append(this.canvas, this.overlay, this.hud, this.prompt, this.debugPanel);
    this.host.append(this.shell);

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setClearColor(0x04070b);
    this.renderer.shadowMap.enabled = this.quality().shadowsEnabled;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setAnimationLoop((time) => this.frame(time));
    this.configureRuntimeTexture(this.doorTexture);
    this.configureRuntimeTexture(this.floorTexture);
    this.configureRuntimeTexture(this.wallTexture);

    this.installEvents();
    this.installDebugApi();
  }

  start(): void {
    this.resize();
    void this.boot();
  }

  private async boot(): Promise<void> {
    this.setPhase('loading');
    this.setLoading('loading title hero', 0.18);
    await this.assets.preloadHero(this.selectedHero);
    this.setLoading('staging title door and floor', 0.62);
    this.buildTitleScene();
    this.ready = true;
    this.setLoading('ready', 1);
    await this.holdLoadingScreen();
    this.setPhase('title');
    await this.audio.play('title');
  }

  private buildTitleScene(): void {
    this.clearRuntime();
    this.createBaseScene();
    this.addTitleStageFloor(this.titleHeroStagePosition);
    this.addTitleDoorBackdrop(this.titleHeroStagePosition);
    this.titleHero?.animator?.dispose();
    this.titleHero = this.assets.createHero(this.selectedHero, `title-hero:${this.selectedHero}`);
    this.titleHero.object.position.copy(this.titleHeroStagePosition);
    this.titleHero.object.scale.multiplyScalar(1.35);
    this.titleHero.object.rotation.y = -0.4;
    this.applyObjectQuality(this.titleHero.object);
    this.scene.add(this.titleHero.object);
    this.anchorObjects.set('hero', this.titleHero.object);
    this.applyStaticTitleCamera();
  }

  private async startRun(heroId = this.selectedHero, missionId = this.level.id): Promise<void> {
    if (isHeroId(heroId)) this.selectedHero = heroId;
    const level = getLevelById(missionId);
    if (!level) throw new Error(`Unknown mission: ${missionId}`);
    this.level = level;
    this.audio.unlock();
    this.setPhase('loading');
    await this.audio.play('loading');
    this.setLoading('preloading hero, sentry, objectives, cover', 0.18);
    await Promise.all([
      this.assets.preloadHero(this.selectedHero),
      this.assets.preloadSentry(),
      this.assets.preloadObjectives(),
      ...(this.level.blockers.length > 0 ? [this.assets.preloadCover()] : []),
    ]);
    this.setLoading('preloading tactical dressing', 0.42);
    await this.assets.preloadSetDressing(this.level.setDressing.map((item) => item.asset));
    this.setLoading(`building ${this.level.name.toLowerCase()}`, 0.68);
    this.buildPlayableLevel();
    this.setLoading('starting cinematic tutorial', 1);
    await this.holdLoadingScreen();
    this.tutorialIndex = 0;
    this.setPhase('tutorial');
    this.focusTarget(this.level.tutorial[0].target);
    await this.audio.play('gameplay');
  }

  private buildPlayableLevel(): void {
    this.clearRuntime();
    this.createBaseScene();
    this.objectives = this.level.objectives.map((objective) => ({ ...objective, collected: false }));
    this.doors = this.level.doors.map((door) => ({ ...door, open: false, progress: 0 }));
    this.enemies = this.level.enemies.map((enemy) => ({
      ...enemy,
      position: { ...enemy.start },
      segment: 0,
      forward: normalize(subtract(enemy.patrol[1] ?? enemy.start, enemy.start)),
    }));
    this.playerPosition = { ...this.level.start };
    this.alarms = 0;
    this.runStartedAt = 0;

    this.buildLevelShell(true);
    this.createObjectives();
    this.createEnemies();
    this.createPlayer();
    this.createExtractionMarker();
    this.focusTarget('hero');
    this.renderHud();
  }

  private createBaseScene(): void {
    const quality = this.quality();
    this.renderer.shadowMap.enabled = quality.shadowsEnabled;
    this.renderer.shadowMap.autoUpdate = quality.shadowsEnabled;
    this.scene.background = new THREE.Color(0x04070b);
    this.scene.fog = new THREE.Fog(0x05080d, 32, 118);

    const ambient = new THREE.AmbientLight(0x8fb8c8, quality.shadowsEnabled ? 1.1 : 1.28);
    const key = new THREE.DirectionalLight(0x9de8ff, quality.shadowsEnabled ? 2.1 : 1.55);
    key.position.set(-12, 24, -10);
    key.castShadow = quality.shadowsEnabled;
    if (quality.shadowsEnabled) key.shadow.mapSize.set(quality.shadowMapSize, quality.shadowMapSize);
    const rim = new THREE.DirectionalLight(0xff5a65, 1.15 * quality.lightIntensityScale);
    rim.position.set(18, 12, 22);
    this.scene.add(ambient, key, rim);
  }

  private buildLevelShell(includeDoors: boolean): void {
    const quality = this.quality();
    const floorSizeX = this.level.bounds.max.x - this.level.bounds.min.x;
    const floorSizeZ = this.level.bounds.max.z - this.level.bounds.min.z;
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(floorSizeX, floorSizeZ, quality.floorSegments, quality.floorSegments),
      this.createShellMaterial('floor', floorSizeX / 8, floorSizeZ / 8, 0.1),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = quality.shadowsEnabled;
    floor.name = 'level-floor';
    this.scene.add(floor);
    this.runtimeObjects.push({ object: floor });
    this.anchorObjects.set('level-floor', floor);

    for (const wall of this.level.walls) {
      this.addBox(wall, 'wall', 0.18);
    }

    for (const blocker of this.level.blockers) {
      this.addBlockerVisual(blocker);
    }

    this.level.setDressing.forEach((dressing) => {
      this.addSetDressing(dressing);
    });

    if (includeDoors) {
      for (const door of this.doors) {
        this.addDoorWallContinuity(door);
        this.addDoorFrame(door);
        this.addDoor(door);
      }
    }

    this.addLightStrip(-36, -25, '#6fffe2');
    this.addLightStrip(34, -3, '#5ad7ff');
    this.addLightStrip(-32, 14, '#ffd45a');
    this.addLightStrip(0, 33, '#8eff81');
  }

  private addBox(rect: RectSpec, textureKind: ShellTextureKind, emissive = 0): THREE.Mesh {
    const quality = this.quality();
    const height = rect.height ?? 1;
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(rect.size.x, height, rect.size.z),
      this.createShellMaterial(textureKind, Math.max(rect.size.x, rect.size.z) / 4, Math.max(height, 1) / 2, emissive),
    );
    mesh.position.set(rect.center.x, height / 2, rect.center.z);
    mesh.castShadow = quality.shadowsEnabled;
    mesh.receiveShadow = quality.shadowsEnabled;
    mesh.name = rect.id;
    this.tagQaObject(mesh, rect.id, textureKind === 'wall' ? 'wall' : textureKind);
    this.scene.add(mesh);
    this.runtimeObjects.push({ object: mesh });
    this.anchorObjects.set(rect.id, mesh);
    return mesh;
  }

  private addSetDressing(rect: SetDressingDefinition): THREE.Object3D | null {
    const object = this.assets.createSetDressing(rect.asset, rect.id);
    if (!object) return null;
    this.fitObjectToRect(object, rect);
    this.applyObjectQuality(object);
    this.scene.add(object);
    this.runtimeObjects.push({ object, disposeResources: false });
    this.anchorObjects.set(rect.id, object);
    return object;
  }

  private addBlockerVisual(rect: RectSpec): THREE.Object3D {
    const cluster = new THREE.Group();
    cluster.name = rect.id;
    const modules = this.coverModuleRects(rect);
    modules.forEach((moduleRect, index) => {
      const object = this.assets.createCoverBlocker(`${rect.id}:cover-module-${index + 1}`);
      this.fitObjectToRect(object, moduleRect);
      object.rotation.y = index % 2 === 0 ? 0 : Math.PI;
      this.applyObjectQuality(object);
      cluster.add(object);
    });
    this.scene.add(cluster);
    this.runtimeObjects.push({ object: cluster, disposeResources: false });
    this.anchorObjects.set(rect.id, cluster);
    return cluster;
  }

  private coverModuleRects(rect: RectSpec): RectSpec[] {
    const columns = clamp(Math.round(rect.size.x / 3.2), 1, 3);
    const rows = clamp(Math.round(rect.size.z / 2.6), 1, 2);
    const moduleWidth = rect.size.x / columns * 0.86;
    const moduleDepth = rect.size.z / rows * 0.68;
    const modules: RectSpec[] = [];
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const x = rect.center.x - rect.size.x / 2 + rect.size.x * ((column + 0.5) / columns);
        const z = rect.center.z - rect.size.z / 2 + rect.size.z * ((row + 0.5) / rows);
        modules.push({
          id: `${rect.id}:cover-module-${row + 1}-${column + 1}`,
          center: vec(x, z),
          size: vec(moduleWidth, moduleDepth),
          height: rect.height,
        });
      }
    }
    return modules;
  }

  private fitObjectToRect(object: THREE.Object3D, rect: RectSpec): void {
    object.position.set(0, 0, 0);
    object.rotation.set(0, 0, 0);
    object.scale.set(1, 1, 1);
    object.updateMatrixWorld(true);
    this.boundsScratch.setFromObject(object);
    const sourceSize = this.boundsScratch.getSize(new THREE.Vector3());
    const targetHeight = rect.height ?? Math.max(sourceSize.y, 1);
    object.scale.set(
      sourceSize.x > 0 ? rect.size.x / sourceSize.x : 1,
      sourceSize.y > 0 ? targetHeight / sourceSize.y : 1,
      sourceSize.z > 0 ? rect.size.z / sourceSize.z : 1,
    );
    object.updateMatrixWorld(true);
    this.boundsScratch.setFromObject(object);
    const center = this.boundsScratch.getCenter(new THREE.Vector3());
    object.position.set(
      rect.center.x - center.x,
      -this.boundsScratch.min.y,
      rect.center.z - center.z,
    );
  }

  private addDoorFrame(door: DoorRuntime): void {
    const quality = this.quality();
    const height = door.height ?? 3.2;
    const frame = new THREE.Group();
    frame.name = `${door.id}:frame`;
    const material = this.createShellMaterial('trim', door.axis === 'x' ? door.size.x / 3 : door.size.z / 3, 1.4, 0.26);
    const depth = door.axis === 'x' ? door.size.z + 0.58 : door.size.x + 0.58;
    const sideThickness = 0.32;
    const headerThickness = 0.36;
    const thresholdHeight = 0.06;

    const addPart = (name: string, size: THREE.Vector3, position: THREE.Vector3): void => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), material.clone());
      mesh.name = `${door.id}:frame:${name}`;
      mesh.position.copy(position);
      mesh.castShadow = quality.shadowsEnabled;
      mesh.receiveShadow = quality.shadowsEnabled;
      frame.add(mesh);
    };

    if (door.axis === 'x') {
      const jambSize = new THREE.Vector3(sideThickness, height + headerThickness, depth);
      addPart('left-jamb', jambSize, new THREE.Vector3(door.center.x - door.size.x / 2 - sideThickness / 2, (height + headerThickness) / 2, door.center.z));
      addPart('right-jamb', jambSize, new THREE.Vector3(door.center.x + door.size.x / 2 + sideThickness / 2, (height + headerThickness) / 2, door.center.z));
      addPart('header', new THREE.Vector3(door.size.x + sideThickness * 2, headerThickness, depth), new THREE.Vector3(door.center.x, height + headerThickness / 2, door.center.z));
      addPart('threshold', new THREE.Vector3(door.size.x + sideThickness * 2, thresholdHeight, depth), new THREE.Vector3(door.center.x, thresholdHeight / 2, door.center.z));
    } else {
      const jambSize = new THREE.Vector3(depth, height + headerThickness, sideThickness);
      addPart('near-jamb', jambSize, new THREE.Vector3(door.center.x, (height + headerThickness) / 2, door.center.z - door.size.z / 2 - sideThickness / 2));
      addPart('far-jamb', jambSize, new THREE.Vector3(door.center.x, (height + headerThickness) / 2, door.center.z + door.size.z / 2 + sideThickness / 2));
      addPart('header', new THREE.Vector3(depth, headerThickness, door.size.z + sideThickness * 2), new THREE.Vector3(door.center.x, height + headerThickness / 2, door.center.z));
      addPart('threshold', new THREE.Vector3(depth, thresholdHeight, door.size.z + sideThickness * 2), new THREE.Vector3(door.center.x, thresholdHeight / 2, door.center.z));
    }

    this.scene.add(frame);
    this.runtimeObjects.push({ object: frame });
    this.doorFrameMeshes.set(door.id, frame);
    this.tagQaObject(frame, `${door.id}:frame`, 'door-frame');
  }

  private addDoorWallContinuity(door: DoorRuntime): void {
    const quality = this.quality();
    const height = door.height ?? 3.2;
    const group = new THREE.Group();
    group.name = `${door.id}:wall-continuity`;

    const portalMaterial = this.createShellMaterial('wall', door.axis === 'x' ? door.size.x / 3 : door.size.z / 3, 1.25, 0.08);
    portalMaterial.name = `${door.id}:portal-wall-material`;
    portalMaterial.color = new THREE.Color('#a8bcc2');

    const makeRevealMaterial = (): THREE.MeshStandardMaterial => (
      this.createShellMaterial('trim', door.axis === 'x' ? door.size.x / 4 : door.size.z / 4, 1.2, 0.18)
    );

    const addPart = (name: string, size: THREE.Vector3, position: THREE.Vector3, material: THREE.Material): void => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), material);
      mesh.name = `${door.id}:wall-continuity:${name}`;
      mesh.position.copy(position);
      mesh.castShadow = quality.shadowsEnabled;
      mesh.receiveShadow = quality.shadowsEnabled;
      group.add(mesh);
    };

    if (door.axis === 'x') {
      const backZ = door.center.z - door.size.z / 2 - 0.12;
      addPart('back-wall', new THREE.Vector3(door.size.x + 0.42, height, 0.1), new THREE.Vector3(door.center.x, height / 2, backZ), portalMaterial);
      addPart('left-return', new THREE.Vector3(0.22, height, door.size.z + 0.52), new THREE.Vector3(door.center.x - door.size.x / 2 - 0.18, height / 2, door.center.z), makeRevealMaterial());
      addPart('right-return', new THREE.Vector3(0.22, height, door.size.z + 0.52), new THREE.Vector3(door.center.x + door.size.x / 2 + 0.18, height / 2, door.center.z), makeRevealMaterial());
    } else {
      const backX = door.center.x - door.size.x / 2 - 0.12;
      addPart('back-wall', new THREE.Vector3(0.1, height, door.size.z + 0.42), new THREE.Vector3(backX, height / 2, door.center.z), portalMaterial);
      addPart('near-return', new THREE.Vector3(door.size.x + 0.52, height, 0.22), new THREE.Vector3(door.center.x, height / 2, door.center.z - door.size.z / 2 - 0.18), makeRevealMaterial());
      addPart('far-return', new THREE.Vector3(door.size.x + 0.52, height, 0.22), new THREE.Vector3(door.center.x, height / 2, door.center.z + door.size.z / 2 + 0.18), makeRevealMaterial());
    }

    this.scene.add(group);
    this.runtimeObjects.push({ object: group });
    this.doorContinuityMeshes.set(door.id, group);
    this.tagQaObject(group, `${door.id}:wall-continuity`, 'door-continuity');
  }

  private addDoor(door: DoorRuntime): void {
    const quality = this.quality();
    const material = new THREE.MeshStandardMaterial({
      map: this.doorTexture,
      color: '#d5e2e8',
      roughness: 0.42,
      metalness: 0.56,
      emissive: new THREE.Color('#20343a'),
      emissiveIntensity: 0.18,
    });
    const height = door.height ?? 3.2;
    const panelSize = door.axis === 'x'
      ? new THREE.Vector3(door.size.x / 2, height, door.size.z)
      : new THREE.Vector3(door.size.x, height, door.size.z / 2);
    const left = new THREE.Mesh(new THREE.BoxGeometry(panelSize.x, panelSize.y, panelSize.z), material.clone());
    const right = new THREE.Mesh(new THREE.BoxGeometry(panelSize.x, panelSize.y, panelSize.z), material.clone());
    left.castShadow = quality.shadowsEnabled;
    right.castShadow = quality.shadowsEnabled;
    left.receiveShadow = quality.shadowsEnabled;
    right.receiveShadow = quality.shadowsEnabled;
    left.name = `${door.id}:left-panel`;
    right.name = `${door.id}:right-panel`;
    const group = new THREE.Group();
    group.name = door.id;
    group.add(left, right);
    this.tagQaObject(group, door.id, 'door');
    this.scene.add(group);
    this.runtimeObjects.push({ object: group });
    this.doorMeshes.set(door.id, { left, right });
    this.anchorObjects.set(door.id, group);
    this.positionDoorMeshes(door);
  }

  private positionDoorMeshes(door: DoorRuntime): void {
    const mesh = this.doorMeshes.get(door.id);
    if (!mesh) return;

    const height = door.height ?? 3.2;
    const closedOffset = door.axis === 'x' ? door.size.x / 4 : door.size.z / 4;
    const slide = (door.axis === 'x' ? door.size.x : door.size.z) * 0.62 * door.progress;
    if (door.axis === 'x') {
      mesh.left.position.set(door.center.x - closedOffset - slide, height / 2, door.center.z);
      mesh.right.position.set(door.center.x + closedOffset + slide, height / 2, door.center.z);
    } else {
      mesh.left.position.set(door.center.x, height / 2, door.center.z - closedOffset - slide);
      mesh.right.position.set(door.center.x, height / 2, door.center.z + closedOffset + slide);
    }
  }

  private createShellMaterial(kind: ShellTextureKind, repeatX = 1, repeatY = 1, emissive = 0): THREE.MeshStandardMaterial {
    const palette = shellTexturePalette(kind);
    const texture = kind === 'floor' || kind === 'wall'
      ? this.cloneGeneratedSurfaceTexture(kind, repeatX, repeatY)
      : createShellTexture(kind, palette.base, palette.panel, palette.line);
    this.configureRuntimeTexture(texture, repeatX, repeatY);

    const material = new THREE.MeshStandardMaterial({
      map: texture,
      color: palette.tint,
      roughness: kind === 'floor' ? 0.72 : 0.58,
      metalness: kind === 'floor' ? 0.18 : 0.34,
      emissive: new THREE.Color(palette.line).multiplyScalar(emissive),
      emissiveIntensity: emissive > 0 ? 0.5 : 0,
    });
    material.name = `sr2-${kind}-material`;
    return material;
  }

  private cloneGeneratedSurfaceTexture(kind: 'floor' | 'wall', repeatX: number, repeatY: number): THREE.Texture {
    const texture = (kind === 'floor' ? this.floorTexture : this.wallTexture).clone();
    texture.name = kind === 'floor' ? 'generated-tactical-floor-panel' : 'generated-blacksite-wall-panel';
    this.configureRuntimeTexture(texture, repeatX, repeatY);
    texture.needsUpdate = true;
    return texture;
  }

  private configureRuntimeTexture(texture: THREE.Texture, repeatX = 1, repeatY = 1): void {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(Math.max(1, repeatX), Math.max(1, repeatY));
    texture.anisotropy = this.quality().textureAnisotropy;
    texture.colorSpace = THREE.SRGBColorSpace;
  }

  private addLightStrip(x: number, z: number, color: string): void {
    const quality = this.quality();
    const light = new THREE.PointLight(color, 2.8 * quality.lightIntensityScale, 14 * quality.lightIntensityScale);
    light.position.set(x, 2.6, z);
    this.scene.add(light);
    this.runtimeObjects.push({ object: light });
  }

  private addTitleStageFloor(position: THREE.Vector3): void {
    const quality = this.quality();
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(16, 12, Math.min(quality.floorSegments, 18), Math.min(quality.floorSegments, 14)),
      this.createShellMaterial('floor', 2.6, 2.1, 0.16),
    );
    floor.name = 'title-cinematic-floor';
    floor.position.set(position.x + 1.1, 0, position.z + 0.6);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = quality.shadowsEnabled;

    const inlayMaterial = new THREE.MeshBasicMaterial({ color: '#6fffe2', transparent: true, opacity: 0.55 });
    const centerLine = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 7.2), inlayMaterial);
    centerLine.name = 'title-floor-centerline';
    centerLine.position.set(position.x + 1.1, 0.035, position.z + 0.2);

    const leftLine = centerLine.clone();
    leftLine.name = 'title-floor-left-line';
    leftLine.position.x -= 2.5;
    const rightLine = centerLine.clone();
    rightLine.name = 'title-floor-right-line';
    rightLine.position.x += 2.5;

    this.scene.add(floor, centerLine, leftLine, rightLine);
    this.runtimeObjects.push({ object: floor }, { object: centerLine }, { object: leftLine }, { object: rightLine });
    this.anchorObjects.set('title-floor', floor);
  }

  private addTitleDoorBackdrop(position: THREE.Vector3): void {
    const quality = this.quality();
    const group = new THREE.Group();
    group.name = 'title-cinematic-backdrop';
    group.position.set(position.x + 1.4, 0, position.z - 2.8);
    group.rotation.y = -0.32;

    const doorMaterial = new THREE.MeshStandardMaterial({
      map: this.doorTexture,
      color: '#d8e9ed',
      roughness: 0.36,
      metalness: 0.62,
      emissive: '#14252c',
      emissiveIntensity: 0.24,
    });
    const frameMaterial = this.createShellMaterial('trim', 1.8, 1.6, 0.34);

    const backWall = new THREE.Mesh(
      new THREE.BoxGeometry(7.2, 4.1, 0.34),
      this.createShellMaterial('wall', 2.4, 1.8, 0.12),
    );
    backWall.name = 'title-backdrop-wall';
    backWall.position.set(0, 2.05, -0.22);

    const leftDoor = new THREE.Mesh(new THREE.BoxGeometry(2.1, 3.0, 0.22), doorMaterial.clone());
    const rightDoor = new THREE.Mesh(new THREE.BoxGeometry(2.1, 3.0, 0.22), doorMaterial.clone());
    leftDoor.name = 'title-door-left';
    rightDoor.name = 'title-door-right';
    leftDoor.position.set(-1.05, 1.55, 0.05);
    rightDoor.position.set(1.05, 1.55, 0.05);

    const header = new THREE.Mesh(new THREE.BoxGeometry(5.3, 0.38, 0.5), frameMaterial.clone());
    const leftJamb = new THREE.Mesh(new THREE.BoxGeometry(0.34, 3.4, 0.5), frameMaterial.clone());
    const rightJamb = new THREE.Mesh(new THREE.BoxGeometry(0.34, 3.4, 0.5), frameMaterial.clone());
    const threshold = new THREE.Mesh(new THREE.BoxGeometry(5.3, 0.1, 0.6), frameMaterial.clone());
    header.name = 'title-door-header';
    leftJamb.name = 'title-door-left-jamb';
    rightJamb.name = 'title-door-right-jamb';
    threshold.name = 'title-door-threshold';
    header.position.set(0, 3.28, 0.12);
    leftJamb.position.set(-2.82, 1.7, 0.12);
    rightJamb.position.set(2.82, 1.7, 0.12);
    threshold.position.set(0, 0.05, 0.12);

    const lightBar = new THREE.Mesh(
      new THREE.BoxGeometry(4.7, 0.05, 0.08),
      new THREE.MeshBasicMaterial({ color: '#6fffe2' }),
    );
    lightBar.name = 'title-door-lightbar';
    lightBar.position.set(0, 3.55, 0.32);

    const heroRim = new THREE.PointLight('#6fffe2', 5.5 * quality.lightIntensityScale, 8);
    heroRim.name = 'title-door-rim-light';
    heroRim.position.set(-2.8, 2.2, 2.2);

    const alertGlow = new THREE.PointLight('#ff5a65', 3.2 * quality.lightIntensityScale, 7);
    alertGlow.name = 'title-alert-glow';
    alertGlow.position.set(2.8, 1.5, 1.8);

    for (const object of [backWall, leftDoor, rightDoor, header, leftJamb, rightJamb, threshold]) {
      object.castShadow = quality.shadowsEnabled;
      object.receiveShadow = quality.shadowsEnabled;
    }

    group.add(backWall, leftDoor, rightDoor, header, leftJamb, rightJamb, threshold, lightBar, heroRim, alertGlow);
    this.scene.add(group);
    this.runtimeObjects.push({ object: group });
    this.anchorObjects.set('title-door-backdrop', group);
  }

  private createPlayer(): void {
    this.player = this.assets.createHero(this.selectedHero, `player:${this.selectedHero}`);
    this.player.object.position.set(this.playerPosition.x, 0, this.playerPosition.z);
    this.player.object.rotation.y = Math.PI;
    this.applyObjectQuality(this.player.object);
    this.scene.add(this.player.object);
    this.anchorObjects.set('hero', this.player.object);
  }

  private createEnemies(): void {
    for (const enemy of this.enemies) {
      const instance = this.assets.createSentry(enemy.id);
      instance.object.position.set(enemy.position.x, 0, enemy.position.z);
      instance.object.rotation.y = Math.atan2(enemy.forward.x, enemy.forward.z);
      this.applyObjectQuality(instance.object);
      this.scene.add(instance.object);
      this.runtimeObjects.push({ object: instance.object, dispose: () => instance.animator?.dispose(), disposeResources: false });
      this.anchorObjects.set(enemy.id, instance.object);

      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(enemy.detectionRadius, 0.04, this.quality().detectionConeSegments),
        new THREE.MeshBasicMaterial({ color: '#ff5a65', transparent: true, opacity: 0.14, depthWrite: false }),
      );
      cone.name = `${enemy.id}:detection-cone`;
      cone.rotation.x = -Math.PI / 2;
      cone.position.set(enemy.position.x, 0.03, enemy.position.z);
      this.scene.add(cone);
      this.runtimeObjects.push({ object: cone, disposeResources: true });
      this.enemyDetectionCones.set(enemy.id, cone);
    }
  }

  private createObjectives(): void {
    for (const objective of this.objectives) {
      const object = this.assets.createObjective(objective.asset, objective.id);
      object.position.set(objective.position.x, 0, objective.position.z);
      object.rotation.y = objective.asset === 'terminal' ? -Math.PI / 2 : 0;
      this.applyObjectQuality(object);
      this.scene.add(object);
      this.runtimeObjects.push({ object, disposeResources: false });
      this.anchorObjects.set(objective.id, object);
    }
  }

  private createExtractionMarker(): void {
    const quality = this.quality();
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(2.4, 0.08, 10, quality.extractionRingSegments),
      new THREE.MeshStandardMaterial({ color: '#8eff81', emissive: '#2c6b30', emissiveIntensity: 1.2 }),
    );
    ring.position.set(this.level.extraction.x, 0.08, this.level.extraction.z);
    ring.rotation.x = -Math.PI / 2;
    ring.name = 'extraction';
    this.scene.add(ring);
    this.runtimeObjects.push({ object: ring });
    this.anchorObjects.set('extraction', ring);
  }

  private frame(_timeMs: number): void {
    const delta = Math.min(this.clock.getDelta(), 0.05);
    this.frameDeltas.push(delta * 1000);
    if (this.frameDeltas.length > 240) this.frameDeltas.shift();

    if (this.phase === 'title' || this.phase === 'hero-select' || this.phase === 'settings') {
      this.updateTitleCamera();
    } else if (this.phase === 'playing') {
      this.updatePlaying(delta);
    } else if (this.phase === 'cinematic-focus' && performance.now() > this.focusUntil) {
      this.enterGameplay();
    }

    this.updateDoors(delta);
    this.titleHero?.animator?.update(delta);
    this.player?.animator?.update(delta);
    this.renderer.render(this.scene, this.camera);
    this.updateMissionGuidanceElement();
    this.syncPrompt();
    this.updateDebugPanel();
    this.pressedKeys.clear();
  }

  private updateTitleCamera(): void {
    this.applyStaticTitleCamera();
  }

  private applyStaticTitleCamera(): void {
    this.camera.position.copy(this.titleCameraPosition);
    this.camera.lookAt(this.titleCameraTarget);
    this.orientTitleHeroTowardCamera(0.14);
  }

  private setTitleOrbitAngle(_angle: number): void {
    this.applyStaticTitleCamera();
  }

  private clearTitleOrbitAngle(): void {
    this.applyStaticTitleCamera();
  }

  private orientTitleHeroTowardCamera(threeQuarterOffset = 0): void {
    if (!this.titleHero) return;
    const heroPosition = this.titleHero.object.getWorldPosition(new THREE.Vector3());
    const toCamera = this.camera.position.clone().sub(heroPosition);
    this.titleHero.object.rotation.y = Math.atan2(toCamera.x, toCamera.z) - threeQuarterOffset;
  }

  private updatePlaying(delta: number): void {
    const movement = this.readMovement();
    const moving = movement.x !== 0 || movement.z !== 0;
    if (moving) {
      const speed = this.effectiveMoveSpeed();
      const next = add(this.playerPosition, scale(normalize(movement), speed * delta));
      if (this.canMoveTo(next)) {
        this.playerPosition = next;
      }
      if (this.player) {
        this.player.object.position.set(this.playerPosition.x, 0, this.playerPosition.z);
        this.player.object.rotation.y = Math.atan2(movement.x, movement.z);
        this.player.animator?.setMotionState('run');
      }
    } else {
      this.player?.animator?.setMotionState('idle');
    }

    this.updateEnemies(delta);
    this.updateGameplayCamera();
    this.updatePrompt();
    if (this.pressedKeys.has('KeyE')) this.tryInteract();
    this.checkExtraction();
  }

  private readMovement(): Vec2 {
    return {
      x: (this.keyState.has('KeyD') || this.keyState.has('ArrowRight') ? 1 : 0) -
        (this.keyState.has('KeyA') || this.keyState.has('ArrowLeft') ? 1 : 0),
      z: (this.keyState.has('KeyS') || this.keyState.has('ArrowDown') ? 1 : 0) -
        (this.keyState.has('KeyW') || this.keyState.has('ArrowUp') ? 1 : 0),
    };
  }

  private canMoveTo(point: Vec2): boolean {
    if (!pointInBounds(point, this.level.bounds, 0.55)) return false;
    const blockers: RectSpec[] = [
      ...this.level.walls,
      ...this.level.blockers,
      ...this.doors.filter((door) => !door.open).map((door) => door as RectSpec),
    ];
    return blockers.every((blocker) => !pointInRect(point, blocker, 0.42));
  }

  private updateEnemies(delta: number): void {
    for (const enemy of this.enemies) {
      const target = enemy.patrol[(enemy.segment + 1) % enemy.patrol.length] ?? enemy.start;
      const toTarget = subtract(target, enemy.position);
      const toTargetLength = Math.hypot(toTarget.x, toTarget.z);
      if (toTargetLength < 0.15) {
        enemy.segment = (enemy.segment + 1) % enemy.patrol.length;
      } else {
        const step = Math.min(enemy.speed * delta, toTargetLength);
        enemy.forward = normalize(toTarget);
        enemy.position = add(enemy.position, scale(enemy.forward, step));
      }

      const object = this.anchorObjects.get(enemy.id);
      if (object) {
        object.position.set(enemy.position.x, 0, enemy.position.z);
        object.rotation.y = Math.atan2(enemy.forward.x, enemy.forward.z);
      }
      const cone = this.enemyDetectionCones.get(enemy.id);
      if (cone) cone.position.set(enemy.position.x, 0.03, enemy.position.z);

      if (distance(enemy.position, this.playerPosition) <= this.effectiveEnemyDetectionRadius(enemy) && this.phase === 'playing') {
        this.alarms += 1;
        this.activePrompt = '';
        this.setPhase('caught');
        this.activePrompt = 'Sentry contact. Operation failed.';
      }
    }
  }

  private updateDoors(delta: number): void {
    for (const door of this.doors) {
      const target = door.open ? 1 : 0;
      door.progress = clamp(door.progress + Math.sign(target - door.progress) * door.speed * delta, 0, 1);
      this.positionDoorMeshes(door);
    }
  }

  private updateGameplayCamera(snap = false): void {
    const target = this.gameplayCameraTargetScratch.set(
      this.playerPosition.x,
      gameplayCameraTargetHeight,
      this.playerPosition.z,
    );
    const desired = this.gameplayCameraDesiredScratch.set(
      this.playerPosition.x + gameplayCameraOffset.x,
      gameplayCameraOffset.y,
      this.playerPosition.z + gameplayCameraOffset.z,
    );
    if (snap) {
      this.camera.position.copy(desired);
    } else {
      this.camera.position.lerp(desired, 0.11);
    }
    this.camera.lookAt(target);
  }

  private enterGameplay(): void {
    this.setPhase('playing');
    this.updateGameplayCamera(true);
  }

  private tryInteract(): void {
    const objective = this.objectives.find((item) => !item.collected && distance(item.position, this.playerPosition) <= this.effectiveObjectiveRadius(item));
    if (!objective) return;
    this.collectObjective(objective.id);
  }

  private collectObjective(objectiveId: string): void {
    const objective = this.objectives.find((item) => item.id === objectiveId);
    if (!objective || objective.collected) return;

    objective.collected = true;
    const object = this.anchorObjects.get(objective.id);
    object?.removeFromParent();
    this.activePrompt = `${objective.label} complete.`;

    for (const doorId of objective.unlocks) {
      const door = this.doors.find((candidate) => candidate.id === doorId);
      if (door && door.opensWhen.every((id) => this.objectives.find((item) => item.id === id)?.collected)) {
        door.open = true;
        this.pauseForDoorFocus(door.id);
      }
    }
    this.renderHud();
  }

  private pauseForDoorFocus(doorId: string): void {
    this.focusTarget(doorId);
    this.activePrompt = `Route updated: ${doorId.replaceAll('-', ' ')} is opening.`;
    this.focusUntil = performance.now() + 2200;
    this.setPhase('cinematic-focus');
  }

  private updatePrompt(): void {
    const objective = this.objectives.find((item) => !item.collected && distance(item.position, this.playerPosition) <= this.effectiveObjectiveRadius(item));
    if (objective) {
      this.activePrompt = `Press E: ${objective.label}`;
    } else if (this.getObjectiveProgress().exitUnlocked && distance(this.level.extraction, this.playerPosition) <= this.effectiveExtractionRadius() + 0.3) {
      this.activePrompt = 'Extraction zone ready.';
    } else if (this.phase === 'playing') {
      this.activePrompt = '';
    }
  }

  private checkExtraction(): void {
    if (!this.getObjectiveProgress().exitUnlocked) return;
    if (distance(this.playerPosition, this.level.extraction) <= this.effectiveExtractionRadius()) {
      this.completeMission();
    }
  }

  private completeMission(): void {
    if (this.phase === 'complete') return;
    this.activePrompt = '';
    this.setPhase('complete');
    void this.audio.play('complete');
  }

  private focusTarget(targetId: string): void {
    this.focusTargetId = targetId;
    const position = this.targetWorldPosition(targetId) ?? new THREE.Vector3(this.playerPosition.x, 0, this.playerPosition.z);
    this.focusPoint = { x: roundMetric(position.x), z: roundMetric(position.z) };

    const angle = targetId === 'hero' ? -0.8 : 0.78;
    this.camera.position.set(position.x + Math.cos(angle) * 8, 6.4, position.z + Math.sin(angle) * 8);
    this.camera.lookAt(position.x, 0.8, position.z);
  }

  private targetWorldPosition(targetId: string): THREE.Vector3 | null {
    const door = this.doors.find((candidate) => candidate.id === targetId);
    if (door) return new THREE.Vector3(door.center.x, 0, door.center.z);
    const object = this.anchorObjects.get(targetId);
    if (object) return object.getWorldPosition(new THREE.Vector3());
    if (targetId === 'extraction') return new THREE.Vector3(this.level.extraction.x, 0, this.level.extraction.z);
    return null;
  }

  private setPhase(phase: Phase): void {
    const enteringLoading = phase === 'loading' && this.phase !== 'loading';
    this.phase = phase;
    if (enteringLoading) {
      this.loadingStartedAt = performance.now();
      this.loadingHistory = [];
    }
    if (phase === 'playing' && this.runStartedAt === 0) {
      this.runStartedAt = performance.now();
    }
    this.renderOverlay();
    this.renderHud();
  }

  private setLoading(label: string, value: number): void {
    this.loading = { label, value };
    this.loadingHistory.push({
      label,
      value: roundMetric(value),
      elapsedMs: Math.max(0, Math.round(performance.now() - this.loadingStartedAt)),
    });
    this.renderOverlay();
  }

  private async holdLoadingScreen(): Promise<void> {
    const remainingMs = minimumLoadingScreenMs - (performance.now() - this.loadingStartedAt);
    if (remainingMs > 0) {
      await new Promise((resolve) => window.setTimeout(resolve, remainingMs));
    }
  }

  private openSettings(): void {
    this.previousPhase = this.phase === 'settings' ? this.previousPhase : this.phase;
    this.setPhase('settings');
  }

  private closeSettings(): void {
    this.setPhase(this.previousPhase);
  }

  private nextTutorial(): void {
    if (this.phase !== 'tutorial') return;
    this.tutorialIndex += 1;
    if (this.tutorialIndex >= this.level.tutorial.length) {
      this.enterGameplay();
      return;
    }
    this.focusTarget(this.level.tutorial[this.tutorialIndex].target);
    this.renderOverlay();
  }

  private getObjectiveProgress(): { collectedRequired: number; totalRequired: number; exitUnlocked: boolean } {
    const required = this.objectives.filter((objective) => objective.required);
    const collected = required.filter((objective) => objective.collected);
    return {
      collectedRequired: collected.length,
      totalRequired: required.length,
      exitUnlocked: required.length > 0 && collected.length === required.length,
    };
  }

  private renderOverlay(): void {
    if (this.phase === 'title') {
      this.overlay.innerHTML = `
        <div class="title-layout" data-testid="title-panel">
          <section class="title-mark" data-testid="title-mark">
            <div class="title-kicker" data-testid="title-kicker">Operation Blackglass</div>
            <h1 class="title-logo" data-testid="title-wordmark" aria-label="Shadow Recruit 2"><span>Shadow</span><span>Recruit</span><span>2</span></h1>
            <p class="title-copy" data-testid="title-copy">A blacksite door waits in the fog. Pick your operative, breach the patrol route, and extract before command loses the signal.</p>
          </section>
          <section class="command-panel">
            <div class="screen-kicker">Ready room</div>
            <h2 class="panel-title">Prepare the insertion.</h2>
            <p class="panel-copy">The recruit holds at the blacksite door. Tune field options, then begin the cinematic tutorial.</p>
            <div class="button-row is-stacked">
              <button type="button" data-action="start">Start</button>
              <button type="button" data-action="hero-select">Change Hero</button>
              <button type="button" data-action="settings">Settings</button>
            </div>
          </section>
        </div>`;
    } else if (this.phase === 'hero-select') {
      this.overlay.innerHTML = `
        <section class="screen-panel hero-select" data-testid="hero-select-panel">
          <div class="screen-kicker">Recruit roster</div>
          <h2>Select your operative</h2>
          <p>The selected operative model carries through the title preview, tutorial, and mission run.</p>
          <section class="mission-select-panel" data-testid="mission-select-panel">
            <label class="mission-select-row">
              <span>Mission</span>
              <select data-mission-select="true" data-testid="mission-select" aria-label="Mission">
                ${levelCatalog.map((mission) => `
                  <option value="${mission.id}" ${mission.id === this.level.id ? 'selected' : ''}>
                    ${mission.name}
                  </option>
                `).join('')}
              </select>
            </label>
            <div class="mission-brief" data-testid="mission-brief">
              <strong>${this.level.chapter}</strong>
              <span>${this.level.name}</span>
              <small>${this.level.objectives.filter((objective) => objective.required).length} required objectives, ${this.level.enemies.length} sentries, ${this.level.doors.length} sliding doors, ${this.level.zones.length} mission sectors.</small>
            </div>
          </section>
          <div class="hero-grid">
            ${heroOptions.map((hero) => `
              <button type="button" class="hero-card ${hero.id === this.selectedHero ? 'is-selected' : ''}" data-hero-id="${hero.id}" data-testid="hero-card-${hero.id}">
                <strong>${hero.name}</strong>
                <span>${hero.role}</span>
                <small>${hero.description}</small>
                <ul class="hero-trait-list" data-testid="hero-traits-${hero.id}" aria-label="${hero.name} operative traits">
                  ${hero.traitSummary.map((trait) => `<li>${trait}</li>`).join('')}
                </ul>
              </button>
            `).join('')}
          </div>
          <div class="button-row">
            <button type="button" data-action="start-level">Start ${this.level.name}</button>
            <button type="button" data-action="back-title">Back</button>
          </div>
        </section>`;
    } else if (this.phase === 'settings') {
      this.overlay.innerHTML = `
        <section class="screen-panel settings-screen" data-testid="settings-panel">
          <div class="screen-kicker">Settings</div>
          <h2>Mission configuration</h2>
          <div class="settings-grid">
            <label class="setting-row">
              <span>Debug overlays</span>
              <input type="checkbox" data-setting="debug" ${this.settings.debug ? 'checked' : ''} />
            </label>
            <label class="setting-row">
              <span>Mute audio</span>
              <input type="checkbox" data-setting="muted" ${this.settings.muted ? 'checked' : ''} />
            </label>
            <label class="setting-row">
              <span>Performance profile</span>
              <select data-setting="performanceProfile">
                <option value="performance" ${this.settings.performanceProfile === 'performance' ? 'selected' : ''}>Performance</option>
                <option value="balanced" ${this.settings.performanceProfile === 'balanced' ? 'selected' : ''}>Balanced</option>
                <option value="cinematic" ${this.settings.performanceProfile === 'cinematic' ? 'selected' : ''}>Cinematic</option>
              </select>
            </label>
          </div>
          <div class="button-row">
            <button type="button" data-action="close-settings">Back</button>
          </div>
        </section>`;
    } else if (this.phase === 'loading') {
      this.overlay.innerHTML = `
        <section class="command-panel loading-panel" data-testid="loading-panel" style="--progress: ${(this.loading.value * 100).toFixed(0)}%">
          <div class="screen-kicker">Loading</div>
          <h2>${this.loading.label}</h2>
          <div class="loading-bar"><span></span></div>
        </section>`;
    } else if (this.phase === 'tutorial') {
      const step = this.level.tutorial[this.tutorialIndex];
      this.overlay.innerHTML = `
        <section class="briefing-panel" data-testid="tutorial-panel">
          <img class="general-portrait" src="${generalUrl}" alt="General Caldwell" />
          <div class="briefing-copy">
            <div class="screen-kicker">General Caldwell</div>
            <h2>${step.title}</h2>
            <p>${step.text}</p>
            <div class="button-row">
              <button type="button" data-action="next-tutorial">${this.tutorialIndex === this.level.tutorial.length - 1 ? 'Begin Mission' : 'Next'}</button>
              <button type="button" data-action="skip-tutorial">Skip</button>
            </div>
          </div>
        </section>`;
    } else if (this.phase === 'caught') {
      this.overlay.innerHTML = `
        <section class="complete-panel" data-testid="caught-panel">
          <div class="screen-kicker">Operation failed</div>
          <h2>Sentry contact</h2>
          <p>You were too close to a sentry. Reset the mission and use cover timing.</p>
          <div class="button-row">
            <button type="button" data-action="retry">Retry</button>
            <button type="button" data-action="back-title">Title</button>
          </div>
        </section>`;
    } else if (this.phase === 'complete') {
      const stats = this.completionStats();
      this.overlay.innerHTML = `
        <section class="complete-panel" data-testid="complete-panel" data-completion-cue="${stats.triumphantCue ? 'triumphant' : 'none'}">
          <div class="screen-kicker">Extraction complete</div>
          <h2>${this.level.name} cleared</h2>
          <p>Command confirms exfil. Triumphant extraction cue is live and the level stats are locked.</p>
          <div class="stats-grid">
            <div class="stat-card" data-testid="complete-stat-time"><span>Time</span><strong>${stats.elapsedSeconds}s</strong></div>
            <div class="stat-card" data-testid="complete-stat-objectives"><span>Objectives</span><strong>${stats.objectivesCompleted}/${stats.objectivesTotal}</strong></div>
            <div class="stat-card" data-testid="complete-stat-alerts"><span>Alerts</span><strong>${stats.alerts}</strong></div>
            <div class="stat-card" data-testid="complete-stat-profile"><span>Profile</span><strong>${stats.performanceProfile}</strong></div>
          </div>
          <div class="button-row">
            <button type="button" data-action="retry">Replay Level</button>
            <button type="button" data-action="back-title">Title</button>
          </div>
        </section>`;
    } else {
      this.overlay.innerHTML = '';
    }
  }

  private renderHud(): void {
    if (this.phase !== 'playing' && this.phase !== 'cinematic-focus') {
      this.hud.innerHTML = '';
    } else {
      const progress = this.getObjectiveProgress();
      const guidance = this.missionGuidanceState();
      this.hud.innerHTML = `
        <section class="hud-panel">
          <div class="hud-kicker">${this.level.chapter}</div>
          <strong>${this.level.name}</strong>
          <div class="hud-guidance" data-testid="mission-guidance" data-target-id="${guidance.targetId ?? ''}" data-target-kind="${guidance.targetKind}" role="status" aria-live="polite">
            <span class="hud-guidance-kicker" data-testid="mission-guidance-action">${guidance.action}</span>
            <strong data-testid="mission-guidance-label">${guidance.label}</strong>
            <span data-testid="mission-guidance-detail">${guidance.distanceMeters}m ${guidance.compassDirection}</span>
          </div>
          <div class="objective-list">
            ${this.objectives.map((objective) => `
              <span class="objective-chip ${objective.collected ? 'is-complete' : ''}">${objective.label}</span>
            `).join('')}
            <span class="objective-chip ${progress.exitUnlocked ? 'is-complete' : ''}">Extraction ${progress.exitUnlocked ? 'open' : 'locked'}</span>
          </div>
        </section>
        <nav class="hud-actions" aria-label="Mission controls">
          <button type="button" data-action="settings">Settings</button>
          <button type="button" data-action="toggle-mute">${this.settings.muted ? 'Unmute' : 'Mute'}</button>
          <button type="button" data-action="back-title">Title</button>
        </nav>`;
    }

    this.syncPrompt();
    this.updateMissionGuidanceElement();
  }

  private updateMissionGuidanceElement(): void {
    if (this.phase !== 'playing' && this.phase !== 'cinematic-focus') return;
    const root = this.hud.querySelector<HTMLElement>('[data-testid="mission-guidance"]');
    if (!root) return;
    const guidance = this.missionGuidanceState();
    root.dataset.targetId = guidance.targetId ?? '';
    root.dataset.targetKind = guidance.targetKind;
    root.querySelector<HTMLElement>('[data-testid="mission-guidance-action"]')!.textContent = guidance.action;
    root.querySelector<HTMLElement>('[data-testid="mission-guidance-label"]')!.textContent = guidance.label;
    root.querySelector<HTMLElement>('[data-testid="mission-guidance-detail"]')!.textContent = `${guidance.distanceMeters}m ${guidance.compassDirection}`;
  }

  private syncPrompt(): void {
    this.prompt.hidden = !this.activePrompt;
    this.prompt.textContent = this.activePrompt;
  }

  private updateDebugPanel(): void {
    this.debugPanel.hidden = !this.settings.debug;
    if (this.debugPanel.hidden) return;
    const metrics = this.rendererMetrics();
    const pacing = this.framePacing();
    this.debugPanel.textContent = [
      `phase=${this.phase}`,
      `hero=${this.selectedHero}`,
      `operative=${this.operativeMechanics().changedScalars.join(',') || 'baseline'}`,
      `pos=${this.playerPosition.x.toFixed(1)},${this.playerPosition.z.toFixed(1)}`,
      `fps=${pacing.fps.toFixed(1)} frame=${pacing.frameMs.toFixed(1)}ms p95=${pacing.p95FrameMs.toFixed(1)}ms`,
      `draw=${metrics.drawCalls} tri=${metrics.triangles}`,
      `geo=${metrics.geometries} tex=${metrics.textures}`,
      `doors=${this.doors.map((door) => `${door.id}:${door.progress.toFixed(1)}`).join(',')}`,
    ].join('\n');
  }

  private installEvents(): void {
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('keydown', (event) => {
      this.keyState.add(event.code);
      this.pressedKeys.add(event.code);
      if (event.code === 'Escape' && this.phase === 'settings') this.closeSettings();
    });
    window.addEventListener('keyup', (event) => this.keyState.delete(event.code));
    this.shell.addEventListener('pointerdown', () => this.audio.unlock());

    this.shell.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const heroButton = target.closest<HTMLElement>('[data-hero-id]');
      if (heroButton) {
        const heroId = heroButton.dataset.heroId;
        if (isHeroId(heroId)) void this.selectHero(heroId);
        return;
      }

      const action = target.closest<HTMLElement>('[data-action]')?.dataset.action;
      if (!action) return;
      void this.handleAction(action);
    });

    this.shell.addEventListener('change', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement) && !(target instanceof HTMLSelectElement)) return;
      if (target instanceof HTMLSelectElement && target.dataset.missionSelect === 'true') {
        this.selectMissionForMenu(target.value);
        return;
      }
      const setting = target.dataset.setting;
      if (!setting) return;
      if (setting === 'debug' && target instanceof HTMLInputElement) this.settings.debug = target.checked;
      if (setting === 'muted' && target instanceof HTMLInputElement) this.settings.muted = target.checked;
      if (setting === 'performanceProfile' && target instanceof HTMLSelectElement) {
        this.setPerformanceProfile(target.value === 'performance' || target.value === 'cinematic' ? target.value : 'balanced');
        return;
      }
      saveSettings(this.settings);
      this.audio.updateSettings(this.settings);
      this.renderOverlay();
      this.renderHud();
    });
  }

  private async handleAction(action: string): Promise<void> {
    this.audio.unlock();
    if (action === 'start' || action === 'hero-select') {
      this.setPhase('hero-select');
    } else if (action === 'start-level') {
      await this.startRun();
    } else if (action === 'settings') {
      this.openSettings();
    } else if (action === 'close-settings') {
      this.closeSettings();
    } else if (action === 'back-title') {
      this.buildTitleScene();
      this.setPhase('title');
      await this.audio.play('title');
    } else if (action === 'next-tutorial') {
      this.nextTutorial();
    } else if (action === 'skip-tutorial') {
      this.enterGameplay();
    } else if (action === 'retry') {
      await this.startRun();
    } else if (action === 'toggle-mute') {
      this.settings.muted = !this.settings.muted;
      saveSettings(this.settings);
      this.audio.updateSettings(this.settings);
      this.renderHud();
    }
  }

  private async selectHero(heroId: HeroId): Promise<void> {
    this.selectedHero = heroId;
    this.setLoading(`loading ${heroOptionById(heroId).name}`, 0.45);
    await this.assets.preloadHero(heroId);
    this.buildTitleScene();
    this.setPhase('hero-select');
  }

  private selectMissionForMenu(missionId: string): void {
    const level = getLevelById(missionId);
    if (!level) throw new Error(`Unknown mission: ${missionId}`);
    this.level = level;
    this.buildTitleScene();
    this.setPhase('hero-select');
  }

  private applyPerformanceProfile(): void {
    const quality = this.quality();
    this.renderer.shadowMap.enabled = quality.shadowsEnabled;
    this.renderer.shadowMap.autoUpdate = quality.shadowsEnabled;
    this.doorTexture.anisotropy = quality.textureAnisotropy;
    this.floorTexture.anisotropy = quality.textureAnisotropy;
    this.wallTexture.anisotropy = quality.textureAnisotropy;
    this.applyObjectQuality(this.scene);
    this.resize();
  }

  private resize(): void {
    const rect = this.shell.getBoundingClientRect();
    this.camera.aspect = Math.max(1, rect.width) / Math.max(1, rect.height);
    this.camera.updateProjectionMatrix();
    const maxRatio = this.quality().pixelRatioCap;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxRatio));
    this.renderer.setSize(Math.max(1, rect.width), Math.max(1, rect.height), false);
  }

  private setPerformanceProfile(profile: string): void {
    this.settings.performanceProfile = isPerformanceProfile(profile) ? profile : 'balanced';
    saveSettings(this.settings);
    this.audio.updateSettings(this.settings);
    this.applyPerformanceProfile();
    this.renderOverlay();
    this.renderHud();
  }

  private quality(): RenderQuality {
    return renderQualityByProfile[this.settings.performanceProfile];
  }

  private operativeBaseMechanics(): OperativeMechanicsSnapshot {
    const objectiveRadiusTotal = this.level.objectives.reduce((sum, objective) => sum + objective.radius, 0);
    const enemyRadiusTotal = this.level.enemies.reduce((sum, enemy) => sum + enemy.detectionRadius, 0);
    return {
      moveSpeed: roundMetric(baseMoveSpeedByProfile[this.settings.performanceProfile]),
      interactRadius: roundMetric(objectiveRadiusTotal / Math.max(1, this.level.objectives.length)),
      enemyDetectionRadius: roundMetric(enemyRadiusTotal / Math.max(1, this.level.enemies.length)),
      terminalUseMs: baseTerminalUseMs,
      extractionRadius: baseExtractionRadius,
    };
  }

  private applyOperativeTrait(value: number, trait: OperativeTraitDefinition): number {
    return trait.operation === 'multiplier' ? value * trait.value : value + trait.value;
  }

  private effectiveOperativeScalar(scalar: OperativeScalar, baseValue: number, heroId = this.selectedHero): number {
    let value = baseValue;
    for (const trait of heroOptionById(heroId).traits) {
      if (trait.scalar === scalar) value = this.applyOperativeTrait(value, trait);
    }
    return roundMetric(value);
  }

  private operativeEffectiveMechanics(heroId = this.selectedHero, base = this.operativeBaseMechanics()): OperativeMechanicsSnapshot {
    return {
      moveSpeed: this.effectiveOperativeScalar('moveSpeed', base.moveSpeed, heroId),
      interactRadius: this.effectiveOperativeScalar('interactRadius', base.interactRadius, heroId),
      enemyDetectionRadius: this.effectiveOperativeScalar('enemyDetectionRadius', base.enemyDetectionRadius, heroId),
      terminalUseMs: this.effectiveOperativeScalar('terminalUseMs', base.terminalUseMs, heroId),
      extractionRadius: this.effectiveOperativeScalar('extractionRadius', base.extractionRadius, heroId),
    };
  }

  private operativeChangedScalars(base: OperativeMechanicsSnapshot, effective: OperativeMechanicsSnapshot): OperativeScalar[] {
    return (Object.keys(base) as OperativeScalar[]).filter((scalar) =>
      Math.abs(effective[scalar] - base[scalar]) > operativeProbeTolerance
    );
  }

  private operativeTraitStates(
    heroId = this.selectedHero,
    base = this.operativeBaseMechanics(),
    effective = this.operativeEffectiveMechanics(heroId, base),
  ): OperativeTraitState[] {
    return heroOptionById(heroId).traits.map((trait) => {
      const baseValue = base[trait.scalar];
      const expectedEffective = roundMetric(this.applyOperativeTrait(baseValue, trait));
      const effectiveValue = effective[trait.scalar];
      const expectedDelta = roundMetric(expectedEffective - baseValue);
      const actualDelta = roundMetric(effectiveValue - baseValue);
      const applied = Math.abs(actualDelta - expectedDelta) <= operativeProbeTolerance;
      return {
        id: trait.id,
        label: trait.label,
        mechanic: trait.mechanic,
        applied,
        scalar: trait.scalar,
        operation: trait.operation,
        value: trait.value,
        baseValue,
        effectiveValue,
        delta: actualDelta,
        notes: applied
          ? trait.notes
          : [`Expected ${trait.scalar} delta ${expectedDelta}, got ${actualDelta}.`, ...trait.notes],
      };
    });
  }

  private operativeTraitProbes(
    heroId = this.selectedHero,
    base = this.operativeBaseMechanics(),
    effective = this.operativeEffectiveMechanics(heroId, base),
  ): OperativeTraitProbe[] {
    return heroOptionById(heroId).traits.map((trait) => {
      const baseValue = base[trait.scalar];
      const expectedDelta = roundMetric(this.applyOperativeTrait(baseValue, trait) - baseValue);
      const actualDelta = roundMetric(effective[trait.scalar] - baseValue);
      const grade: AssetQualityGrade = Math.abs(actualDelta - expectedDelta) <= operativeProbeTolerance ? 'pass' : 'fail';
      return {
        id: `${heroId}:${trait.id}`,
        traitId: trait.id,
        mechanic: trait.mechanic,
        grade,
        expectedDelta,
        actualDelta,
        tolerance: operativeProbeTolerance,
        notes: grade === 'pass'
          ? [`${trait.label} changes ${trait.scalar} by ${actualDelta}.`]
          : [`${trait.label} expected ${trait.scalar} delta ${expectedDelta}, got ${actualDelta}.`],
      };
    });
  }

  private operativeCatalog(): OperativeCatalogEntry[] {
    const base = this.operativeBaseMechanics();
    return heroOptions.map((hero) => {
      const effective = this.operativeEffectiveMechanics(hero.id, base);
      return {
        id: hero.id,
        name: hero.name,
        role: hero.role,
        assetAuditId: `hero:${hero.id}`,
        traitIds: hero.traits.map((trait) => trait.id),
        traitSummary: hero.traitSummary,
        base,
        effective,
        changedScalars: this.operativeChangedScalars(base, effective),
      };
    });
  }

  private operativeMechanics(heroId = this.selectedHero): OperativeState {
    const hero = heroOptionById(heroId);
    const base = this.operativeBaseMechanics();
    const effective = this.operativeEffectiveMechanics(heroId, base);
    return {
      id: hero.id,
      selectedId: hero.id,
      name: hero.name,
      role: hero.role,
      assetAuditId: `hero:${hero.id}`,
      traitIds: hero.traits.map((trait) => trait.id),
      traitSummary: hero.traitSummary,
      base,
      effective,
      changedScalars: this.operativeChangedScalars(base, effective),
      traits: this.operativeTraitStates(heroId, base, effective),
      probes: this.operativeTraitProbes(heroId, base, effective),
    };
  }

  private effectiveMoveSpeed(): number {
    return this.effectiveOperativeScalar('moveSpeed', baseMoveSpeedByProfile[this.settings.performanceProfile]);
  }

  private effectiveObjectiveRadius(objective: ObjectiveRuntime): number {
    return Math.max(0.4, this.effectiveOperativeScalar('interactRadius', objective.radius));
  }

  private effectiveEnemyDetectionRadius(enemy: EnemyRuntime): number {
    return this.effectiveOperativeScalar('enemyDetectionRadius', enemy.detectionRadius);
  }

  private effectiveExtractionRadius(): number {
    return this.effectiveOperativeScalar('extractionRadius', baseExtractionRadius);
  }

  private applyObjectQuality(object: THREE.Object3D): void {
    const shadowsEnabled = this.quality().shadowsEnabled;
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = shadowsEnabled;
        child.receiveShadow = shadowsEnabled;
      }
    });
  }

  private clearRuntime(): void {
    this.runtimeObjects.forEach((entry) => {
      entry.dispose?.();
      if (entry.disposeResources !== false) disposeObject(entry.object);
      entry.object.removeFromParent();
    });
    this.runtimeObjects.length = 0;
    this.doorMeshes.clear();
    this.doorFrameMeshes.clear();
    this.doorContinuityMeshes.clear();
    this.enemyDetectionCones.clear();
    this.anchorObjects.clear();
    this.objectives = [];
    this.doors = [];
    this.enemies = [];
    this.player?.animator?.dispose();
    this.player = null;
    this.titleHero?.animator?.dispose();
    this.titleHero = null;

    while (this.scene.children.length > 0) {
      const child = this.scene.children[0];
      child.removeFromParent();
    }
  }

  private rendererMetrics(): RendererMetrics {
    const quality = this.quality();
    return {
      performanceProfile: this.settings.performanceProfile,
      shadowsEnabled: quality.shadowsEnabled && this.renderer.shadowMap.enabled,
      shadowMapSize: quality.shadowMapSize,
      drawCalls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles,
      geometries: this.renderer.info.memory.geometries,
      textures: this.renderer.info.memory.textures,
      pixelRatio: this.renderer.getPixelRatio(),
    };
  }

  private renderBudgetState(): RenderBudgetState {
    const renderer = this.rendererMetrics();
    const limits = renderBudgetByProfile[this.settings.performanceProfile];
    const drawCallHeadroom = limits.maxDrawCalls - renderer.drawCalls;
    const triangleHeadroom = limits.maxTriangles - renderer.triangles;
    const geometryHeadroom = limits.maxGeometries - renderer.geometries;
    const textureHeadroom = limits.maxTextures - renderer.textures;
    const pixelRatioHeadroom = roundMetric(limits.maxPixelRatio - renderer.pixelRatio);
    const withinBudget = drawCallHeadroom >= 0 &&
      triangleHeadroom >= 0 &&
      geometryHeadroom >= 0 &&
      textureHeadroom >= 0 &&
      pixelRatioHeadroom >= -0.01 &&
      (limits.shadowsAllowed || !renderer.shadowsEnabled);
    const notes = withinBudget
      ? [`${renderer.performanceProfile} profile render counters are inside the explicit 60 FPS path budget.`]
      : [
        drawCallHeadroom < 0 ? `Draw calls exceed budget by ${Math.abs(drawCallHeadroom)}.` : `Draw-call headroom ${drawCallHeadroom}.`,
        triangleHeadroom < 0 ? `Triangles exceed budget by ${Math.abs(triangleHeadroom)}.` : `Triangle headroom ${triangleHeadroom}.`,
        geometryHeadroom < 0 ? `Geometries exceed budget by ${Math.abs(geometryHeadroom)}.` : `Geometry headroom ${geometryHeadroom}.`,
        textureHeadroom < 0 ? `Textures exceed budget by ${Math.abs(textureHeadroom)}.` : `Texture headroom ${textureHeadroom}.`,
        pixelRatioHeadroom < -0.01 ? `Pixel ratio ${renderer.pixelRatio} exceeds profile cap ${limits.maxPixelRatio}.` : `Pixel ratio headroom ${pixelRatioHeadroom}.`,
        !limits.shadowsAllowed && renderer.shadowsEnabled ? 'Performance profile unexpectedly has shadows enabled.' : 'Shadow policy matches profile.',
      ];

    return {
      performanceProfile: renderer.performanceProfile,
      grade: withinBudget ? 'pass' : 'fail',
      ...limits,
      drawCalls: renderer.drawCalls,
      triangles: renderer.triangles,
      geometries: renderer.geometries,
      textures: renderer.textures,
      pixelRatio: renderer.pixelRatio,
      shadowsEnabled: renderer.shadowsEnabled,
      drawCallHeadroom,
      triangleHeadroom,
      geometryHeadroom,
      textureHeadroom,
      pixelRatioHeadroom,
      notes,
    };
  }

  private memoryMetrics(): MemoryMetrics {
    const visibleFallbackAssetIds = new Set(
      this.runtimeObjects
        .map(({ object }) => object)
        .filter((object) => object.visible && object.userData.missingAsset === true)
        .map((object) => String(object.userData.assetId ?? object.name)),
    );
    return {
      runtimeObjects: this.runtimeObjects.length,
      ...this.assets.metrics(),
      assetAudit: this.assets.assetAudit(
        this.selectedHero,
        this.level.setDressing.map((item) => item.asset),
        this.level.blockers.length > 0,
        visibleFallbackAssetIds,
      ),
    };
  }

  private assetQualityChecks(): readonly AssetQualityCheck[] {
    const checks: AssetQualityCheck[] = [];
    const setDressingChecks = this.setDressingVisibilityChecks();
    const setDressingFailures = setDressingChecks.filter((check) => check.grade !== 'pass');
    const blockerChecks = this.level.blockers.map((blocker) => this.checkAnchoredAsset(
      blocker.id,
      `${blocker.id} cover module`,
      'blocker',
      'Required cover-barricade GLB is visible, grounded, and fitted to the authored blocker collision proxy.',
      `${blocker.id} blocker is missing its required cover-barricade GLB visual.`,
      'pass',
      'Collision remains authored from the level blocker rectangle; runtime visual must not be a primitive fallback.',
      {
        minWidth: Math.max(0.2, blocker.size.x * 0.72),
        minDepth: Math.max(0.2, blocker.size.z * 0.72),
      },
    ));
    const blockerFailures = blockerChecks.filter((check) => check.grade !== 'pass');
    checks.push(this.checkAnchoredAsset(
      'level-floor',
      'Floor mesh',
      'level-mesh',
      'Floor mesh covers the authored level bounds with a generated tactical floor-panel image texture.',
      'Floor mesh is missing from the scene.',
      'pass',
      'Floor uses src/assets/generated/tactical-floor-panel.png as a repeated runtime texture.',
      {
        planarGround: true,
        minWidth: this.level.bounds.max.x - this.level.bounds.min.x - 0.1,
        minDepth: this.level.bounds.max.z - this.level.bounds.min.z - 0.1,
      },
    ));
    checks.push({
      id: 'level-walls',
      label: 'Wall meshes',
      category: 'level-mesh',
      grade: this.level.walls.every((wall) => this.anchorObjects.has(wall.id)) ? 'pass' : 'fail',
      visible: this.level.walls.every((wall) => this.anchorObjects.has(wall.id)),
      grounded: true,
      notes: this.level.walls.every((wall) => this.anchorObjects.has(wall.id))
        ? [`${this.level.walls.length} wall meshes are present and use src/assets/generated/blacksite-wall-panel.png as the repeated generated wall texture.`]
        : ['One or more wall meshes are missing from the scene.'],
    });
    checks.push({
      id: 'sliding-doors',
      label: 'Sliding door panels',
      category: 'door',
      grade: this.doorMeshes.size === this.doors.length ? 'pass' : 'fail',
      visible: this.doorMeshes.size === this.doors.length,
      grounded: true,
      notes: this.doorMeshes.size === this.doors.length
        ? [`${this.doorMeshes.size} sliding door assemblies are present and use the generated door-panel texture.`]
        : [`Expected ${this.doors.length} door assemblies, found ${this.doorMeshes.size}.`],
    });
    checks.push({
      id: 'door-wall-seams',
      label: 'Door-wall seams',
      category: 'door',
      grade: this.doorMeshes.size === this.doors.length && this.doorFrameMeshes.size === this.doors.length && this.doorContinuityMeshes.size === this.doors.length ? 'pass' : 'fail',
      visible: this.doorMeshes.size === this.doors.length && this.doorFrameMeshes.size === this.doors.length && this.doorContinuityMeshes.size === this.doors.length,
      grounded: true,
      notes: this.doorMeshes.size === this.doors.length && this.doorFrameMeshes.size === this.doors.length && this.doorContinuityMeshes.size === this.doors.length && this.level.walls.every((wall) => this.anchorObjects.has(wall.id))
        ? [`${this.doors.length} sliding-door openings have door frames plus wall/portal continuity meshes behind the door layer, so the door panels visually take priority without reading as missing wall gaps.`]
        : ['Door seam review cannot pass because one or more door, frame, wall-continuity, or wall meshes are missing.'],
    });
    checks.push({
      id: 'level-blocker-cover',
      label: 'Blocker cover GLB visuals',
      category: 'blocker',
      grade: blockerFailures.length === 0 ? 'pass' : 'fail',
      visible: blockerChecks.every((check) => check.visible),
      grounded: blockerChecks.every((check) => check.grounded),
      notes: blockerFailures.length === 0
        ? [`${this.level.blockers.length} authored blocker collision proxies are represented by fitted cover-barricade GLB visuals with no primitive stand-ins.`]
        : [`Blocker cover QA failed for ${blockerFailures.map((item) => `${item.id}:${item.notes.join(' ')}`).join('; ')}`],
    });
    checks.push(...blockerChecks);
    checks.push({
      id: 'level-set-dressing',
      label: 'Tactical set dressing',
      category: 'set-dressing',
      grade: setDressingFailures.length === 0 ? 'pass' : 'fail',
      visible: setDressingChecks.every((item) => item.visible),
      grounded: true,
      notes: setDressingFailures.length === 0
        ? [`${this.level.setDressing.length} coordinate-authored non-colliding dressing placements have loaded GLB assets, visible runtime bounds, floor contact, and coordinate footprint coverage without blocking the validation route.`]
        : [`Set-dressing QA failed for ${setDressingFailures.map((item) => `${item.id}:${item.notes.join(' ')}`).join('; ')}`],
    });

    for (const objective of this.objectives) {
      if (objective.collected) {
        checks.push({
          id: objective.id,
          label: objective.label,
          category: 'objective',
          grade: 'pass',
          visible: false,
          grounded: true,
          notes: [`${objective.label} was collected and intentionally removed from the scene.`],
        });
        continue;
      }
      checks.push(this.checkAnchoredAsset(
        objective.id,
        objective.label,
        'objective',
        `${objective.asset} GLB is visible, grounded, and available for interaction.`,
        `${objective.label} model is missing before collection.`,
      ));
    }

    for (const enemy of this.enemies) {
      checks.push(this.checkAnchoredAsset(
        enemy.id,
        enemy.label,
        'enemy',
        'Sentry GLB is visible above the floor and aligned to its patrol route.',
        `${enemy.label} is missing from the scene.`,
      ));
    }

    checks.push(this.checkAnchoredAsset(
      'hero',
      'Playable hero',
      'hero',
      'Hero GLB is visible and grounded at the current player position.',
      'Hero model is missing from gameplay.',
    ));
    checks.push(this.checkAnchoredAsset(
      'extraction',
      'Extraction point',
      'extraction',
      'Extraction marker is visible and readable as the level-completion target.',
      'Extraction marker is missing from the scene.',
    ));

    return checks;
  }

  private checkAnchoredAsset(
    id: string,
    label: string,
    category: AssetQualityCheck['category'],
    passNote: string,
    missingNote: string,
    artGrade: AssetQualityGrade = 'pass',
    artNote?: string,
    options: AssetQualityOptions = {},
  ): AssetQualityCheck {
    const object = this.anchorObjects.get(id);
    if (!object) {
      return {
        id,
        label,
        category,
        grade: 'fail',
        visible: false,
        grounded: false,
        notes: [missingNote],
      };
    }

    const position = object.getWorldPosition(new THREE.Vector3());
    this.boundsScratch.setFromObject(object);
    const width = this.boundsScratch.max.x - this.boundsScratch.min.x;
    const height = this.boundsScratch.max.y - this.boundsScratch.min.y;
    const depth = this.boundsScratch.max.z - this.boundsScratch.min.z;
    const horizontalCoverage = width >= (options.minWidth ?? 0.02) && depth >= (options.minDepth ?? 0.02);
    const visible = object.visible && (height > 0.02 || (options.planarGround === true && horizontalCoverage));
    const grounded = options.planarGround === true
      ? position.y >= -0.05
        && Math.abs(this.boundsScratch.min.y) <= 0.12
        && Math.abs(this.boundsScratch.max.y) <= 0.12
        && horizontalCoverage
      : position.y >= -0.05 && this.boundsScratch.max.y > 0.12 && this.boundsScratch.min.y >= -0.05;
    const notes: string[] = [];
    let grade: AssetQualityGrade = visible && grounded ? artGrade : 'fail';

    if (!visible) {
      notes.push(options.planarGround === true
        ? `${label} is hidden or does not cover the authored horizontal area.`
        : `${label} is hidden or has near-zero bounds.`);
    }
    if (!grounded) {
      notes.push(`${label} placement needs review: originY=${position.y.toFixed(2)}, minY=${this.boundsScratch.min.y.toFixed(2)}, maxY=${this.boundsScratch.max.y.toFixed(2)}.`);
    }
    if (visible && grounded) notes.push(passNote);
    if (visible && grounded && artNote) notes.push(artNote);

    return {
      id,
      label,
      category,
      grade,
      visible,
      grounded,
      position: {
        x: Number(position.x.toFixed(2)),
        y: Number(position.y.toFixed(2)),
        z: Number(position.z.toFixed(2)),
      },
      bounds: {
        minY: Number(this.boundsScratch.min.y.toFixed(2)),
        maxY: Number(this.boundsScratch.max.y.toFixed(2)),
        height: Number(height.toFixed(2)),
        width: Number(width.toFixed(2)),
        depth: Number(depth.toFixed(2)),
      },
      notes,
    };
  }

  private geometryDiagnostics(): GeometryDiagnostics {
    return {
      objectBounds: this.sceneObjectBounds(),
      setDressingVisibility: this.setDressingVisibilityChecks(),
      doorContinuity: this.doorContinuityChecks(),
      wallRunContinuity: this.wallRunContinuityChecks(),
      levelDensity: this.levelDensityCheck(),
    };
  }

  private sceneObjectBounds(): readonly SceneObjectBounds[] {
    const bounds: SceneObjectBounds[] = [];
    for (const wall of this.level.walls) this.addBoundsRecord(bounds, wall.id, 'wall', this.anchorObjects.get(wall.id));
    for (const blocker of this.level.blockers) this.addBoundsRecord(bounds, blocker.id, 'blocker', this.anchorObjects.get(blocker.id));
    for (const dressing of this.level.setDressing) this.addBoundsRecord(bounds, dressing.id, 'set-dressing', this.anchorObjects.get(dressing.id));
    for (const door of this.doors) {
      this.addBoundsRecord(bounds, door.id, 'door', this.anchorObjects.get(door.id));
      this.addBoundsRecord(bounds, `${door.id}:frame`, 'door-frame', this.doorFrameMeshes.get(door.id));
      this.addBoundsRecord(bounds, `${door.id}:wall-continuity`, 'door-continuity', this.doorContinuityMeshes.get(door.id));
    }
    for (const objective of this.objectives) this.addBoundsRecord(bounds, objective.id, 'objective', this.anchorObjects.get(objective.id));
    for (const enemy of this.enemies) this.addBoundsRecord(bounds, enemy.id, 'enemy', this.anchorObjects.get(enemy.id));
    this.addBoundsRecord(bounds, 'hero', 'hero', this.anchorObjects.get('hero'));
    this.addBoundsRecord(bounds, 'extraction', 'extraction', this.anchorObjects.get('extraction'));
    return bounds;
  }

  private addBoundsRecord(
    bounds: SceneObjectBounds[],
    id: string,
    category: SceneObjectBounds['category'],
    object: THREE.Object3D | undefined,
  ): void {
    if (!object) return;
    this.boundsScratch.setFromObject(object);
    if (this.boundsScratch.isEmpty()) return;
    bounds.push({
      id,
      category,
      visible: object.visible,
      bounds: this.boundsSnapshot(this.boundsScratch),
    });
  }

  private setDressingVisibilityChecks(): readonly SetDressingVisibilityCheck[] {
    return this.level.setDressing.map((dressing) => {
      const object = this.anchorObjects.get(dressing.id);
      const authoredBounds = this.rectBounds(dressing);
      const renderedBounds = object ? this.objectBounds(object) : undefined;
      const loaded = this.assets.isStaticLoaded(dressing.asset);
      const visible = Boolean(object?.visible && renderedBounds && renderedBounds.size.x > 0.02 && renderedBounds.size.y > 0.02 && renderedBounds.size.z > 0.02);
      const grounded = Boolean(renderedBounds && renderedBounds.min.y >= -0.05 && renderedBounds.max.y > 0.12);
      const footprintCoverage = renderedBounds ? this.footprintCoverageRatio(authoredBounds, renderedBounds) : 0;
      const notes: string[] = [];

      if (!loaded) {
        const failure = this.assets.staticFailure(dressing.asset);
        notes.push(failure ? `${dressing.asset} GLB failed to load: ${failure}` : `${dressing.asset} GLB is not loaded.`);
      }
      if (!object) notes.push('No runtime object exists for this authored placement.');
      if (!visible) notes.push('Rendered bounds are missing, hidden, or too small to inspect.');
      if (!grounded) notes.push('Rendered bounds do not sit on or above the floor plane.');
      if (footprintCoverage < 0.35) notes.push(`Rendered footprint covers only ${(footprintCoverage * 100).toFixed(1)}% of the authored rectangle.`);
      if (notes.length === 0) {
        notes.push(`${dressing.asset} GLB loaded and occupies ${(footprintCoverage * 100).toFixed(1)}% of authored footprint ${dressing.id}.`);
      }

      return {
        id: dressing.id,
        asset: dressing.asset,
        grade: loaded && visible && grounded && footprintCoverage >= 0.35 ? 'pass' : 'fail',
        loaded,
        visible,
        grounded,
        authoredBounds,
        ...(renderedBounds ? { renderedBounds } : {}),
        footprintCoverage,
        notes,
      };
    });
  }

  private doorContinuityChecks(): GeometryDiagnostics['doorContinuity'] {
    const epsilon = 0.08;
    return this.doors.map((door) => {
      const openingBounds = this.rectBounds(door);
      const frameObject = this.doorFrameMeshes.get(door.id);
      const continuityObject = this.doorContinuityMeshes.get(door.id);
      const renderedDoorObject = this.anchorObjects.get(door.id);
      const frameBounds = frameObject ? this.objectBounds(frameObject) : undefined;
      const continuityBounds = continuityObject ? this.objectBounds(continuityObject) : undefined;
      const renderedDoorBounds = renderedDoorObject ? this.objectBounds(renderedDoorObject) : undefined;
      const neighbors = this.neighboringWalls(door);
      const gaps: DoorCoordinateGap[] = [];

      if (!neighbors.before) {
        gaps.push({
          id: `${door.id}:missing-before-wall`,
          label: 'Missing adjacent wall before opening',
          axis: door.axis,
          fromId: 'none',
          toId: door.id,
          fromEdge: 0,
          toEdge: this.coverageMin(door.axis, openingBounds, frameBounds, continuityBounds),
          gap: 9999,
        });
      } else {
        const toEdge = this.coverageMin(door.axis, openingBounds, frameBounds, continuityBounds);
        const fromEdge = this.maxAlong(door.axis, this.rectBounds(neighbors.before));
        const gap = roundMetric(toEdge - fromEdge);
        if (gap > epsilon) {
          gaps.push({
            id: `${door.id}:before-gap`,
            label: 'Gap between previous wall and door/frame/continuity coverage',
            axis: door.axis,
            fromId: neighbors.before.id,
            toId: `${door.id}:frame`,
            fromEdge: roundMetric(fromEdge),
            toEdge: roundMetric(toEdge),
            gap,
          });
        }
      }

      if (!neighbors.after) {
        gaps.push({
          id: `${door.id}:missing-after-wall`,
          label: 'Missing adjacent wall after opening',
          axis: door.axis,
          fromId: door.id,
          toId: 'none',
          fromEdge: this.coverageMax(door.axis, openingBounds, frameBounds, continuityBounds),
          toEdge: 0,
          gap: 9999,
        });
      } else {
        const fromEdge = this.coverageMax(door.axis, openingBounds, frameBounds, continuityBounds);
        const toEdge = this.minAlong(door.axis, this.rectBounds(neighbors.after));
        const gap = roundMetric(toEdge - fromEdge);
        if (gap > epsilon) {
          gaps.push({
            id: `${door.id}:after-gap`,
            label: 'Gap between door/frame/continuity coverage and next wall',
            axis: door.axis,
            fromId: `${door.id}:frame`,
            toId: neighbors.after.id,
            fromEdge: roundMetric(fromEdge),
            toEdge: roundMetric(toEdge),
            gap,
          });
        }
      }

      const notes = gaps.length > 0
        ? gaps.map((gap) => `${gap.label}: ${gap.fromId} -> ${gap.toId} is ${Number.isFinite(gap.gap) ? `${gap.gap}m` : 'unbounded'} on ${gap.axis}.`)
        : [`${door.id} wall segments, frame, and continuity coverage touch within ${epsilon}m.`];

      return {
        id: door.id,
        axis: door.axis,
        grade: gaps.length > 0 ? 'fail' : 'pass',
        epsilon,
        wallIds: [neighbors.before?.id, neighbors.after?.id].filter((id): id is string => Boolean(id)),
        openingBounds,
        ...(frameBounds ? { frameBounds } : {}),
        ...(continuityBounds ? { continuityBounds } : {}),
        ...(renderedDoorBounds ? { renderedDoorBounds } : {}),
        gaps,
        notes,
      };
    });
  }

  private wallRunContinuityChecks(): GeometryDiagnostics['wallRunContinuity'] {
    const epsilon = 0.08;
    const runs = new Map<string, { axis: 'x' | 'z'; line: number; doors: DoorRuntime[] }>();

    for (const door of this.doors) {
      const line = roundMetric(door.axis === 'x' ? door.center.z : door.center.x);
      const key = `${door.axis}:${line}`;
      const existing = runs.get(key);
      if (existing) {
        existing.doors.push(door);
      } else {
        runs.set(key, { axis: door.axis, line, doors: [door] });
      }
    }

    return [...runs.values()].map((run) => {
      const intervals = this.wallRunIntervals(run.axis, run.line, run.doors).sort((a, b) => a.min - b.min || a.max - b.max);
      const gaps: DoorCoordinateGap[] = [];
      let coveredMax = intervals[0]?.max ?? 0;
      let coveredBy = intervals[0]?.id ?? 'none';
      const id = `${run.axis}:${run.line}`;

      for (let index = 1; index < intervals.length; index += 1) {
        const interval = intervals[index];
        const gap = roundMetric(interval.min - coveredMax);
        if (gap > epsilon) {
          gaps.push({
            id: `${run.axis}:${run.line}:gap-${gaps.length + 1}`,
            label: 'Unowned span between wall-run intervals',
            axis: run.axis,
            fromId: coveredBy,
            toId: interval.id,
            fromEdge: roundMetric(coveredMax),
            toEdge: roundMetric(interval.min),
            gap,
          });
        }
        if (interval.max > coveredMax) {
          coveredMax = interval.max;
          coveredBy = interval.id;
        }
      }
      const connections = this.wallRunConnections(run.axis, intervals, epsilon);
      const doorOwnership = this.doorToDoorOwnershipChecks(id, run.axis, run.line, run.doors, intervals, epsilon);
      const cameraProbes = this.wallRunCameraProbes(id, run.doors);
      const connectionFailures = connections.filter((edge) => edge.state === 'void');
      const ownershipFailures = doorOwnership.filter((row) => row.grade === 'fail');
      const probeFailures = cameraProbes.filter((probe) => probe.grade === 'fail');

      const notes = gaps.length > 0 || connectionFailures.length > 0 || ownershipFailures.length > 0 || probeFailures.length > 0
        ? gaps.map((gap) => `${gap.label}: ${gap.fromId} -> ${gap.toId} is ${gap.gap}m on ${gap.axis}.`)
          .concat(connectionFailures.map((edge) => `Connection graph void: ${edge.fromId} -> ${edge.toId} is ${edge.gap}m on ${edge.axis}.`))
          .concat(ownershipFailures.map((row) => `Door-to-door span ${row.previousDoorId} -> ${row.nextDoorId} has no owning wall/frame/continuity surface.`))
          .concat(probeFailures.map((probe) => `Camera probe ${probe.id} first hit ${probe.actualOwnerId ?? probe.actualFirstHitId ?? 'none'} instead of ${probe.expectedOwnerIds.join('/')}.`))
        : [`${run.axis}-axis wall run at line ${run.line} has ${intervals.length} sorted intervals, ${connections.length} connection edge(s), ${doorOwnership.length} door-to-door ownership row(s), and ${cameraProbes.length} camera probe row(s) with no unowned visible span above ${epsilon}m.`];

      return {
        id,
        axis: run.axis,
        line: run.line,
        grade: gaps.length > 0 || intervals.length === 0 || connectionFailures.length > 0 || ownershipFailures.length > 0 || probeFailures.length > 0 ? 'fail' : 'pass',
        epsilon,
        intervals,
        connections,
        doorOwnership,
        cameraProbes,
        gaps,
        notes,
      };
    });
  }

  private wallRunIntervals(axis: 'x' | 'z', line: number, doors: DoorRuntime[]): WallRunInterval[] {
    const perpendicular = axis === 'x' ? 'z' : 'x';
    const intervals: WallRunInterval[] = [];

    for (const wall of this.level.walls) {
      const bounds = this.rectBounds(wall);
      if (this.rectRunAxis(wall) === axis && this.boundsTouchLine(perpendicular, bounds, line)) {
        intervals.push(this.wallRunInterval(wall.id, 'wall', axis, bounds));
      }
    }

    for (const door of doors) {
      const openingBounds = this.rectBounds(door);
      intervals.push(this.wallRunInterval(door.id, 'door-opening', axis, openingBounds));
      const frameBounds = this.doorFrameMeshes.get(door.id) ? this.objectBounds(this.doorFrameMeshes.get(door.id)!) : undefined;
      if (frameBounds) intervals.push(this.wallRunInterval(`${door.id}:frame`, 'door-frame', axis, frameBounds));
      const continuityBounds = this.doorContinuityMeshes.get(door.id) ? this.objectBounds(this.doorContinuityMeshes.get(door.id)!) : undefined;
      if (continuityBounds) intervals.push(this.wallRunInterval(`${door.id}:wall-continuity`, 'door-continuity', axis, continuityBounds));
    }

    return intervals;
  }

  private wallRunInterval(id: string, kind: WallRunInterval['kind'], axis: 'x' | 'z', bounds: Bounds3): WallRunInterval {
    return {
      id,
      kind,
      min: roundMetric(this.minAlong(axis, bounds)),
      max: roundMetric(this.maxAlong(axis, bounds)),
      bounds,
    };
  }

  private wallRunConnections(axis: 'x' | 'z', intervals: readonly WallRunInterval[], epsilon: number): WallRunConnectionEdge[] {
    const edges: WallRunConnectionEdge[] = [];
    for (let index = 0; index < intervals.length - 1; index += 1) {
      const from = intervals[index];
      const to = intervals[index + 1];
      const rawGap = to.min - from.max;
      const gap = roundMetric(rawGap);
      const priorityOwner = [from, to].find((interval) => interval.kind === 'door-continuity' || interval.kind === 'door-frame');
      const state: WallRunConnectionEdge['state'] = rawGap > epsilon
        ? 'void'
        : rawGap < -epsilon
          ? priorityOwner ? 'covered-by-priority-surface' : 'overlaps'
          : 'touches';
      const notes = state === 'void'
        ? [`No named wall, frame, return, trim, or continuity interval owns the ${gap}m span between ${from.id} and ${to.id}.`]
        : state === 'covered-by-priority-surface'
          ? [`${priorityOwner?.id ?? 'priority surface'} intentionally overlaps this adjacency so the door/frame/continuity surface can take visual priority.`]
          : [`${from.id} and ${to.id} ${state === 'touches' ? 'touch within tolerance' : 'overlap'} on the wall run.`];
      edges.push({
        id: `${from.id}->${to.id}`,
        fromId: from.id,
        toId: to.id,
        axis,
        state,
        fromEdge: roundMetric(from.max),
        toEdge: roundMetric(to.min),
        gap,
        ...(priorityOwner ? { ownerId: priorityOwner.id } : {}),
        notes,
      });
    }
    return edges;
  }

  private doorToDoorOwnershipChecks(
    wallLineId: string,
    axis: 'x' | 'z',
    line: number,
    doors: readonly DoorRuntime[],
    intervals: readonly WallRunInterval[],
    epsilon: number,
  ): DoorToDoorOwnershipCheck[] {
    const sortedDoors = [...doors].sort((a, b) => this.minAlong(axis, this.rectBounds(a)) - this.minAlong(axis, this.rectBounds(b)));
    const rows: DoorToDoorOwnershipCheck[] = [];
    const perpendicular = axis === 'x' ? 'z' : 'x';
    for (let index = 0; index < sortedDoors.length - 1; index += 1) {
      const previous = sortedDoors[index];
      const next = sortedDoors[index + 1];
      const previousMax = roundMetric(this.maxAlong(axis, this.rectBounds(previous)));
      const nextMin = roundMetric(this.minAlong(axis, this.rectBounds(next)));
      const spanWidth = roundMetric(nextMin - previousMax);
      const owner = intervals.find((interval) =>
        interval.kind !== 'door-opening' &&
        interval.min <= previousMax + epsilon &&
        interval.max >= nextMin - epsilon
      );
      const depthMatch = owner ? this.boundsTouchLine(perpendicular, owner.bounds, line) : false;
      const grade: AssetQualityGrade = spanWidth <= epsilon || (Boolean(owner) && depthMatch) ? 'pass' : 'fail';
      rows.push({
        id: `${previous.id}->${next.id}`,
        wallLineId,
        previousDoorId: previous.id,
        previousDoorMax: previousMax,
        nextDoorId: next.id,
        nextDoorMin: nextMin,
        spanWidth,
        ...(owner ? {
          ownerId: owner.id,
          ownerType: owner.kind,
          ownerMin: owner.min,
          ownerMax: owner.max,
        } : {}),
        depthMatch,
        closedPriority: owner ? 'owner-surface' : 'missing',
        openPriority: owner?.kind === 'door-continuity' ? 'continuity-surface' : owner ? 'owner-surface' : 'missing',
        grade,
        notes: grade === 'pass'
          ? [`The ${spanWidth}m span between ${previous.id} and ${next.id} is owned by ${owner?.id ?? 'adjacent door contact'} with matching wall depth.`]
          : [`No named wall, return, trim, frame, or continuity surface owns the ${spanWidth}m span between adjacent door openings ${previous.id} and ${next.id}.`],
      });
    }
    return rows;
  }

  private wallRunCameraProbes(wallLineId: string, doors: readonly DoorRuntime[]): WallRunCameraProbe[] {
    return doors
      .map((door) => this.wallRunDoorProbe(wallLineId, door))
      .filter((probe): probe is WallRunCameraProbe => Boolean(probe));
  }

  private wallRunDoorProbe(wallLineId: string, door: DoorRuntime): WallRunCameraProbe | null {
    const target = new THREE.Vector3(door.center.x, (door.height ?? 3.2) * 0.55, door.center.z);
    const screenPoint = this.projectWorldPoint(target);
    if (!screenPoint) return null;
    const screenRegion = this.screenPointRegion(screenPoint, 18);
    const expectedOwnerIds = [door.id, `${door.id}:frame`, `${door.id}:wall-continuity`];
    const direction = target.clone().sub(this.camera.position).normalize();
    const surfaces = this.wallProbeSurfaceObjects();
    this.raycaster.set(this.camera.position, direction);
    this.raycaster.far = this.camera.position.distanceTo(target) + 1.2;
    const hit = this.raycaster.intersectObjects(surfaces, true)[0];
    const actualFirstHitId = hit?.object.name || (hit?.object.userData.qaId ? String(hit.object.userData.qaId) : undefined);
    const actualOwnerId = hit?.object.userData.qaOwnerId ? String(hit.object.userData.qaOwnerId) : this.resolveProbeOwnerId(actualFirstHitId);
    const visibleVoid = screenPoint.visible && !hit;
    const expectedHit = Boolean(actualOwnerId && expectedOwnerIds.includes(actualOwnerId));
    const grade: AssetQualityGrade = visibleVoid
      ? 'fail'
      : expectedHit
        ? 'pass'
        : 'review';
    return {
      id: `${door.id}:active-camera-probe`,
      wallLineId,
      screenshot: this.phase === 'cinematic-focus' ? `focus-${door.id}.png` : 'gameplay-level-one.png',
      screenRegion,
      rayOrigin: this.vectorSnapshot(this.camera.position),
      rayDirection: this.vectorSnapshot(direction),
      expectedOwnerIds,
      ...(actualFirstHitId ? { actualFirstHitId } : {}),
      ...(actualOwnerId ? { actualOwnerId } : {}),
      ...(hit ? { actualFirstHitDistance: roundMetric(hit.distance) } : {}),
      visibleVoid,
      grade,
      notes: grade === 'pass'
        ? [`Camera probe through ${door.id} hits ${actualOwnerId} first, proving the active view is blocked by a door/frame/continuity surface.`]
        : grade === 'review' && !screenPoint.visible
          ? [`${door.id} probe target is outside the active camera viewport; capture a focused door screenshot for human-visible gap review.`]
          : grade === 'review'
            ? [`Camera probe toward ${door.id} is occluded by ${actualOwnerId ?? actualFirstHitId ?? 'another named surface'} before the target; this is not a visible void but still needs focused screenshot review.`]
          : [`Camera probe expected ${expectedOwnerIds.join('/')} but first hit ${actualOwnerId ?? actualFirstHitId ?? 'nothing'}, so the active view may expose a wrong surface or void.`],
    };
  }

  private wallProbeSurfaceObjects(): THREE.Object3D[] {
    return [
      ...this.level.walls.map((wall) => this.anchorObjects.get(wall.id)).filter((object): object is THREE.Object3D => Boolean(object)),
      ...this.doors.flatMap((door) => [
        this.anchorObjects.get(door.id),
        this.doorFrameMeshes.get(door.id),
        this.doorContinuityMeshes.get(door.id),
      ]).filter((object): object is THREE.Object3D => Boolean(object)),
    ];
  }

  private resolveProbeOwnerId(id: string | undefined): string | undefined {
    if (!id) return undefined;
    if (this.anchorObjects.has(id) || this.doorFrameMeshes.has(id) || this.doorContinuityMeshes.has(id)) return id;
    const door = this.doors.find((candidate) => id === candidate.id || id.startsWith(`${candidate.id}:`));
    if (!door) return id;
    if (id.includes(':frame')) return `${door.id}:frame`;
    if (id.includes(':wall-continuity')) return `${door.id}:wall-continuity`;
    return door.id;
  }

  private rectRunAxis(rect: RectSpec): 'x' | 'z' {
    return rect.size.x >= rect.size.z ? 'x' : 'z';
  }

  private neighboringWalls(door: DoorRuntime): { before?: RectSpec; after?: RectSpec } {
    const perpendicular = door.axis === 'x' ? 'z' : 'x';
    const along = door.axis;
    const doorBounds = this.rectBounds(door);
    const candidates = this.level.walls
      .map((wall) => ({ wall, bounds: this.rectBounds(wall) }))
      .filter(({ bounds }) => this.overlapOn(perpendicular, bounds, doorBounds) > 0);
    let before: { wall: RectSpec; distance: number } | undefined;
    let after: { wall: RectSpec; distance: number } | undefined;

    for (const candidate of candidates) {
      const wallMax = this.maxAlong(along, candidate.bounds);
      const wallMin = this.minAlong(along, candidate.bounds);
      const doorMin = this.minAlong(along, doorBounds);
      const doorMax = this.maxAlong(along, doorBounds);
      if (wallMax <= doorMin) {
        const distance = doorMin - wallMax;
        if (!before || distance < before.distance) before = { wall: candidate.wall, distance };
      }
      if (wallMin >= doorMax) {
        const distance = wallMin - doorMax;
        if (!after || distance < after.distance) after = { wall: candidate.wall, distance };
      }
    }

    return { before: before?.wall, after: after?.wall };
  }

  private levelDensityCheck(): LevelDensityCheck {
    const floorArea = (this.level.bounds.max.x - this.level.bounds.min.x) * (this.level.bounds.max.z - this.level.bounds.min.z);
    const blockerArea = this.level.blockers.reduce((sum, blocker) => sum + blocker.size.x * blocker.size.z, 0);
    const authoredSetDressingArea = this.level.setDressing.reduce((sum, dressing) => sum + dressing.size.x * dressing.size.z, 0);
    const objectiveArea = this.objectives.reduce((sum, objective) => sum + Math.PI * objective.radius * objective.radius, 0);
    const enemyArea = this.enemies.reduce((sum, enemy) => sum + Math.PI * enemy.detectionRadius * enemy.detectionRadius, 0);
    const setDressingFootprintArea = blockerArea + authoredSetDressingArea + objectiveArea + enemyArea;
    const setDressingRatio = floorArea > 0 ? setDressingFootprintArea / floorArea : 0;
    const zones = this.zoneDensityChecks();
    const grade: LevelDensityCheck['grade'] = zones.some((zone) => zone.grade === 'fail')
      ? 'fail'
      : zones.some((zone) => zone.grade === 'review')
        ? 'review'
        : this.densityGrade(setDressingRatio);
    const notes = grade === 'pass'
      ? [`Set-dressing and gameplay footprints cover ${(setDressingRatio * 100).toFixed(1)}% of the level floor across ${zones.length} named zone(s).`]
      : [
        `Set-dressing and gameplay footprints cover only ${(setDressingRatio * 100).toFixed(1)}% of the ${roundMetric(floorArea)}m2 floor.`,
        `Zone grades: ${zones.map((zone) => `${zone.id}=${zone.grade}`).join(', ') || 'none'}.`,
        'Add tactical cover, security props, cables, signage, light fixtures, patrol landmarks, and extraction dressing before grading sparse zones as AAA-quality level presentation.',
      ];

    return {
      grade,
      floorArea: roundMetric(floorArea),
      setDressingFootprintArea: roundMetric(setDressingFootprintArea),
      setDressingRatio: roundMetric(setDressingRatio),
      blockerCount: this.level.blockers.length,
      setDressingCount: this.level.setDressing.length,
      objectiveCount: this.objectives.length,
      enemyCount: this.enemies.length,
      zones,
      notes,
    };
  }

  private zoneDensityChecks(): readonly LevelZoneDensityCheck[] {
    return this.level.zones.map((zone) => {
      const floorArea = this.zoneArea(zone);
      const coverFootprintArea = this.level.blockers.reduce((sum, blocker) => sum + this.rectZoneOverlapArea(blocker, zone), 0);
      const setDressingFootprintArea = this.level.setDressing.reduce((sum, dressing) => sum + this.rectZoneOverlapArea(dressing, zone), 0);
      const zoneObjectives = this.objectives.filter((objective) => pointInBounds(objective.position, zone.bounds));
      const zoneEnemies = this.enemies.filter((enemy) => pointInBounds(enemy.start, zone.bounds));
      const zoneDoors = this.doors.filter((door) => pointInBounds(door.center, zone.bounds));
      const extractionInZone = pointInBounds(this.level.extraction, zone.bounds);
      const objectiveArea = zoneObjectives.reduce((sum, objective) => sum + Math.PI * objective.radius * objective.radius, 0);
      const enemyArea = zoneEnemies.reduce((sum, enemy) => sum + Math.PI * enemy.detectionRadius * enemy.detectionRadius, 0);
      const extractionArea = extractionInZone ? Math.PI * 2.5 * 2.5 : 0;
      const gameplayFootprintArea = objectiveArea + enemyArea + extractionArea;
      const totalFootprintArea = coverFootprintArea + setDressingFootprintArea + gameplayFootprintArea;
      const totalFootprintRatio = floorArea > 0 ? totalFootprintArea / floorArea : 0;
      const landmarkCount = zone.expectedLandmarks.filter((id) => this.zoneLandmarkPresent(id, zone)).length;
      const interactableCount = zoneObjectives.length + zoneDoors.length + (extractionInZone ? 1 : 0);
      const grade = this.densityGrade(totalFootprintRatio);
      const notes = grade === 'pass'
        ? [
          `${zone.label} has ${(totalFootprintRatio * 100).toFixed(1)}% tactical footprint coverage with ${landmarkCount}/${zone.expectedLandmarks.length} expected landmark(s) present.`,
        ]
        : [
          `${zone.label} has only ${(totalFootprintRatio * 100).toFixed(1)}% tactical footprint coverage.`,
          `Expected landmarks present: ${landmarkCount}/${zone.expectedLandmarks.length}.`,
          'Add camera-readable foreground, midground, and background tactical dressing for this zone.',
        ];

      return {
        id: zone.id,
        label: zone.label,
        grade,
        bounds: {
          min: { ...zone.bounds.min },
          max: { ...zone.bounds.max },
        },
        ...(zone.screenshot ? { screenshot: zone.screenshot } : {}),
        floorArea: roundMetric(floorArea),
        coverFootprintArea: roundMetric(coverFootprintArea),
        setDressingFootprintArea: roundMetric(setDressingFootprintArea),
        gameplayFootprintArea: roundMetric(gameplayFootprintArea),
        totalFootprintArea: roundMetric(totalFootprintArea),
        totalFootprintRatio: roundMetric(totalFootprintRatio),
        blockerCount: this.level.blockers.filter((blocker) => this.rectZoneOverlapArea(blocker, zone) > 0).length,
        setDressingCount: this.level.setDressing.filter((dressing) => this.rectZoneOverlapArea(dressing, zone) > 0).length,
        objectiveCount: zoneObjectives.length,
        enemyCount: zoneEnemies.length,
        landmarkCount,
        interactableCount,
        expectedLandmarks: zone.expectedLandmarks,
        notes,
      };
    });
  }

  private densityGrade(ratio: number): AssetQualityGrade {
    return ratio < 0.06 ? 'fail' : ratio < 0.1 ? 'review' : 'pass';
  }

  private zoneArea(zone: LevelZoneDefinition): number {
    return Math.max(0, zone.bounds.max.x - zone.bounds.min.x) * Math.max(0, zone.bounds.max.z - zone.bounds.min.z);
  }

  private rectZoneOverlapArea(rect: RectSpec, zone: LevelZoneDefinition): number {
    const bounds = this.rectBounds(rect);
    const overlapX = Math.max(0, Math.min(bounds.max.x, zone.bounds.max.x) - Math.max(bounds.min.x, zone.bounds.min.x));
    const overlapZ = Math.max(0, Math.min(bounds.max.z, zone.bounds.max.z) - Math.max(bounds.min.z, zone.bounds.min.z));
    return overlapX * overlapZ;
  }

  private zoneLandmarkPresent(id: string, zone: LevelZoneDefinition): boolean {
    return this.level.blockers.some((blocker) => blocker.id === id && this.rectZoneOverlapArea(blocker, zone) > 0) ||
      this.level.setDressing.some((dressing) => dressing.id === id && this.rectZoneOverlapArea(dressing, zone) > 0) ||
      (id === 'extraction' && pointInBounds(this.level.extraction, zone.bounds)) ||
      this.objectives.some((objective) => objective.id === id && pointInBounds(objective.position, zone.bounds)) ||
      this.enemies.some((enemy) => enemy.id === id && pointInBounds(enemy.start, zone.bounds)) ||
      this.doors.some((door) => door.id === id && pointInBounds(door.center, zone.bounds));
  }

  private objectBounds(object: THREE.Object3D): Bounds3 | undefined {
    this.boundsScratch.setFromObject(object);
    return this.boundsScratch.isEmpty() ? undefined : this.boundsSnapshot(this.boundsScratch);
  }

  private footprintCoverageRatio(authored: Bounds3, rendered: Bounds3): number {
    const overlapX = Math.max(0, Math.min(authored.max.x, rendered.max.x) - Math.max(authored.min.x, rendered.min.x));
    const overlapZ = Math.max(0, Math.min(authored.max.z, rendered.max.z) - Math.max(authored.min.z, rendered.min.z));
    const authoredArea = Math.max(0.001, authored.size.x * authored.size.z);
    return roundMetric(Math.min(1, (overlapX * overlapZ) / authoredArea));
  }

  private rectBounds(rect: RectSpec): Bounds3 {
    const height = rect.height ?? 0;
    return {
      min: {
        x: roundMetric(rect.center.x - rect.size.x / 2),
        y: 0,
        z: roundMetric(rect.center.z - rect.size.z / 2),
      },
      max: {
        x: roundMetric(rect.center.x + rect.size.x / 2),
        y: roundMetric(height),
        z: roundMetric(rect.center.z + rect.size.z / 2),
      },
      size: {
        x: roundMetric(rect.size.x),
        y: roundMetric(height),
        z: roundMetric(rect.size.z),
      },
    };
  }

  private boundsSnapshot(box: THREE.Box3): Bounds3 {
    return {
      min: {
        x: roundMetric(box.min.x),
        y: roundMetric(box.min.y),
        z: roundMetric(box.min.z),
      },
      max: {
        x: roundMetric(box.max.x),
        y: roundMetric(box.max.y),
        z: roundMetric(box.max.z),
      },
      size: {
        x: roundMetric(box.max.x - box.min.x),
        y: roundMetric(box.max.y - box.min.y),
        z: roundMetric(box.max.z - box.min.z),
      },
    };
  }

  private vectorSnapshot(vector: THREE.Vector3): { x: number; y: number; z: number } {
    return {
      x: roundMetric(vector.x),
      y: roundMetric(vector.y),
      z: roundMetric(vector.z),
    };
  }

  private tagQaObject(object: THREE.Object3D, ownerId: string, category: string): void {
    object.userData.qaOwnerId = ownerId;
    object.userData.qaCategory = category;
    object.traverse((child) => {
      child.userData.qaOwnerId = ownerId;
      child.userData.qaCategory = category;
      if (!child.userData.qaId) child.userData.qaId = child.name || ownerId;
    });
  }

  private minAlong(axis: 'x' | 'z', bounds: Bounds3): number {
    return axis === 'x' ? bounds.min.x : bounds.min.z;
  }

  private maxAlong(axis: 'x' | 'z', bounds: Bounds3): number {
    return axis === 'x' ? bounds.max.x : bounds.max.z;
  }

  private overlapOn(axis: 'x' | 'z', a: Bounds3, b: Bounds3): number {
    return Math.min(this.maxAlong(axis, a), this.maxAlong(axis, b)) - Math.max(this.minAlong(axis, a), this.minAlong(axis, b));
  }

  private boundsTouchLine(axis: 'x' | 'z', bounds: Bounds3, line: number): boolean {
    return this.minAlong(axis, bounds) <= line + 0.08 && this.maxAlong(axis, bounds) >= line - 0.08;
  }

  private coverageMin(
    axis: 'x' | 'z',
    opening: Bounds3,
    frame?: Bounds3,
    continuity?: Bounds3,
  ): number {
    const bounds = [frame, continuity].filter((item): item is Bounds3 => Boolean(item));
    return Math.min(this.minAlong(axis, opening), ...bounds.map((item) => this.minAlong(axis, item)));
  }

  private coverageMax(
    axis: 'x' | 'z',
    opening: Bounds3,
    frame?: Bounds3,
    continuity?: Bounds3,
  ): number {
    const bounds = [frame, continuity].filter((item): item is Bounds3 => Boolean(item));
    return Math.max(this.maxAlong(axis, opening), ...bounds.map((item) => this.maxAlong(axis, item)));
  }

  private tutorialState(): TutorialState {
    return {
      index: this.tutorialIndex,
      total: this.level.tutorial.length,
      step: this.level.tutorial[this.tutorialIndex] ?? null,
    };
  }

  private tutorialAlignmentChecks(): readonly TutorialAlignmentCheck[] {
    return this.level.tutorial.map((step, index) => {
      const targetPosition = this.targetWorldPosition(step.target);
      const targetPoint = targetPosition ? { x: roundMetric(targetPosition.x), z: roundMetric(targetPosition.z) } : null;
      const isCurrentTutorialStep = this.phase === 'tutorial' && this.tutorialIndex === index;
      const focusPoint = isCurrentTutorialStep && this.focusPoint ? { ...this.focusPoint } : null;
      const focusDistance = targetPoint && focusPoint ? distance(targetPoint, focusPoint) : null;
      const cameraDistance = targetPosition ? roundMetric(this.camera.position.distanceTo(targetPosition)) : null;
      const normalizedText = step.text.toLowerCase();
      const missingKeywords = step.alignmentKeywords.filter((keyword) => !normalizedText.includes(keyword.toLowerCase()));
      const textEndsWithCadet = /good luck, cadet\.$/i.test(step.text.trim());
      const targetExists = Boolean(targetPoint);
      const focusAligned = !isCurrentTutorialStep || (focusDistance !== null && focusDistance <= 0.35);
      const grade: AssetQualityGrade = targetExists && textEndsWithCadet && missingKeywords.length === 0 && focusAligned ? 'pass' : 'fail';
      const notes = grade === 'pass'
        ? [`Tutorial step ${step.id} targets ${step.target}, uses required callout terms, and ends with Good luck, cadet.`]
        : [
          targetExists ? `Target ${step.target} exists at ${targetPoint?.x},${targetPoint?.z}.` : `Target ${step.target} is missing from runtime anchors.`,
          textEndsWithCadet ? 'Step ends with Good luck, cadet.' : 'Step does not end with Good luck, cadet.',
          missingKeywords.length === 0 ? 'All required callout keywords are present.' : `Missing callout keywords: ${missingKeywords.join(', ')}.`,
          focusAligned ? 'Active tutorial camera focus matches the target.' : `Active tutorial focus is off-target by ${roundMetric(focusDistance ?? 999)}m.`,
        ];

      return {
        id: step.id,
        index,
        title: step.title,
        target: step.target,
        targetKind: this.tutorialTargetKind(step.target),
        grade,
        targetExists,
        textEndsWithCadet,
        requiredKeywords: [...step.alignmentKeywords],
        missingKeywords,
        targetPoint,
        focusPoint,
        focusDistance: focusDistance === null ? null : roundMetric(focusDistance),
        cameraDistance,
        notes,
      };
    });
  }

  private tutorialTargetKind(targetId: string): TutorialAlignmentCheck['targetKind'] {
    if (targetId === 'hero') return 'hero';
    if (targetId === 'extraction') return 'extraction';
    if (this.objectives.some((objective) => objective.id === targetId)) return 'objective';
    if (this.enemies.some((enemy) => enemy.id === targetId)) return 'enemy';
    if (this.doors.some((door) => door.id === targetId)) return 'door';
    if (this.anchorObjects.has(targetId)) return 'scene';
    return 'unknown';
  }

  private loadingState(): LoadingState {
    return {
      active: this.phase === 'loading',
      label: this.loading.label,
      value: roundMetric(this.loading.value),
      history: this.loadingHistory.map((step) => ({ ...step })),
    };
  }

  private completionStats(): CompletionStats {
    const progress = this.getObjectiveProgress();
    return {
      active: this.phase === 'complete',
      elapsedSeconds: this.runStartedAt ? Math.max(0, Math.round((performance.now() - this.runStartedAt) / 1000)) : 0,
      objectivesCompleted: progress.collectedRequired,
      objectivesTotal: progress.totalRequired,
      alerts: this.alarms,
      performanceProfile: this.settings.performanceProfile,
      triumphantCue: this.phase === 'complete',
    };
  }

  private missionGuidanceState(): MissionGuidanceState {
    const progress = this.getObjectiveProgress();
    const nextObjective = this.objectives.find((objective) => objective.required && !objective.collected);
    const active = this.phase === 'playing' || this.phase === 'cinematic-focus';

    if (!nextObjective && !progress.exitUnlocked) {
      return {
        active,
        targetId: null,
        targetKind: 'complete',
        label: 'Awaiting mission data',
        action: 'Hold position',
        distanceMeters: 0,
        bearingDegrees: 0,
        compassDirection: 'N',
        targetPoint: null,
        unlocks: [],
        completedRequired: progress.collectedRequired,
        totalRequired: progress.totalRequired,
        exitUnlocked: progress.exitUnlocked,
        notes: ['No required objective or extraction target is currently available.'],
      };
    }

    const target = nextObjective?.position ?? this.level.extraction;
    const delta = subtract(target, this.playerPosition);
    const bearingDegrees = this.bearingDegrees(delta);
    const targetKind: MissionGuidanceState['targetKind'] = nextObjective ? 'objective' : 'extraction';

    return {
      active,
      targetId: nextObjective?.id ?? 'extraction',
      targetKind,
      label: nextObjective?.label ?? 'Extraction point',
      action: nextObjective ? this.objectiveAction(nextObjective.type) : 'Reach extraction',
      distanceMeters: roundMetric(distance(this.playerPosition, target)),
      bearingDegrees,
      compassDirection: this.compassDirection(bearingDegrees),
      targetPoint: { x: roundMetric(target.x), z: roundMetric(target.z) },
      unlocks: nextObjective ? [...nextObjective.unlocks] : [],
      completedRequired: progress.collectedRequired,
      totalRequired: progress.totalRequired,
      exitUnlocked: progress.exitUnlocked,
      notes: [
        nextObjective
          ? `Guidance targets the next required objective ${nextObjective.id}.`
          : 'Guidance targets extraction after all required objectives are complete.',
      ],
    };
  }

  private objectiveAction(type: ObjectiveRuntime['type']): string {
    if (type === 'terminal') return 'Hack objective';
    if (type === 'codes') return 'Copy objective';
    return 'Recover objective';
  }

  private bearingDegrees(vector: Vec2): number {
    if (vector.x === 0 && vector.z === 0) return 0;
    return roundMetric((Math.atan2(vector.x, -vector.z) * 180 / Math.PI + 360) % 360);
  }

  private compassDirection(degrees: number): string {
    const sectors = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return sectors[Math.round(degrees / 45) % sectors.length];
  }

  private cinematicFocusState(): CinematicFocusState {
    const active = this.phase === 'cinematic-focus' || this.phase === 'tutorial';
    return {
      active,
      target: this.focusTargetId,
      remainingMs: this.phase === 'cinematic-focus' ? Math.max(0, Math.round(this.focusUntil - performance.now())) : 0,
      focusPoint: this.focusPoint ? { ...this.focusPoint } : null,
      cameraPosition: this.vectorSnapshot(this.camera.position),
    };
  }

  private gameplayCameraState(): GameplayCameraState {
    const target = new THREE.Vector3(this.playerPosition.x, gameplayCameraTargetHeight, this.playerPosition.z);
    const playerObject = this.player?.object;
    const playerScreenBounds = playerObject ? this.projectObjectScreenBounds(playerObject) : undefined;
    const playerScreenOccupancy = playerScreenBounds?.areaRatio ?? 0;
    const playerScreenHeightRatio = playerScreenBounds?.heightRatio ?? 0;
    const cameraDistance = this.camera.position.distanceTo(target);
    const active = this.phase === 'playing';
    const readable = active &&
      Boolean(playerObject?.visible) &&
      cameraDistance >= 4.6 &&
      cameraDistance <= 7.1 &&
      playerScreenHeightRatio >= 0.12 &&
      playerScreenOccupancy >= 0.004;
    const notes = readable
      ? ['Gameplay camera keeps the player close enough to read the hero, nearby floor texture, cover, doors, and objectives.']
      : [
        active ? 'Gameplay phase is active.' : 'Gameplay phase is not active.',
        playerObject?.visible ? 'Player object is visible.' : 'Player object is missing or hidden.',
        `cameraDistance=${roundMetric(cameraDistance)}, screenHeight=${roundMetric(playerScreenHeightRatio)}, screenOccupancy=${roundMetric(playerScreenOccupancy)}.`,
      ];

    return {
      active,
      readable,
      cameraPosition: this.vectorSnapshot(this.camera.position),
      cameraTarget: this.vectorSnapshot(target),
      cameraDistance: roundMetric(cameraDistance),
      ...(playerScreenBounds ? { playerScreenBounds } : {}),
      playerScreenOccupancy: roundMetric(playerScreenOccupancy),
      playerScreenHeightRatio: roundMetric(playerScreenHeightRatio),
      notes,
    };
  }

  private gameplayViewDensityState(): GameplayViewDensityState {
    const active = this.phase === 'playing';
    const player = new THREE.Vector3(this.playerPosition.x, 0, this.playerPosition.z);
    const cameraForward = new THREE.Vector3();
    this.camera.getWorldDirection(cameraForward);
    const visibleObjects = this.gameplayDensityCandidates()
      .map((candidate) => this.gameplayDensityObject(candidate.id, candidate.category, player, cameraForward))
      .filter((object): object is GameplayViewDensityObject => Boolean(object));
    const bands = gameplayDensityBands.map((band) => {
      const objects = visibleObjects
        .filter((object) => object.distanceFromPlayer >= band.minDistance && object.distanceFromPlayer < band.maxDistance)
        .sort((a, b) => b.screenOccupancy - a.screenOccupancy);
      const screenOccupancy = roundMetric(Math.min(1, objects.reduce((sum, object) => sum + object.screenOccupancy, 0)));
      const tacticalCategoryCount = new Set(objects.map((object) => object.category)).size;
      const negativeSpaceRatio = roundMetric(Math.max(0, 1 - Math.min(1, screenOccupancy * 3.2 + tacticalCategoryCount * 0.06)));
      const grade: AssetQualityGrade = active &&
        objects.length >= band.minVisibleObjects &&
        tacticalCategoryCount >= band.minTacticalCategories &&
        screenOccupancy >= band.minScreenOccupancy &&
        negativeSpaceRatio <= band.maxNegativeSpaceRatio
        ? 'pass'
        : 'fail';
      const notes = grade === 'pass'
        ? [`${band.label} has ${objects.length} visible tactical object(s), ${tacticalCategoryCount} category/categories, ${formatPercent(screenOccupancy)} tactical screen occupancy, and controlled negative-space risk of ${formatPercent(negativeSpaceRatio)} from the active gameplay camera.`]
        : [
          `${band.label} is under-dressed from the active gameplay camera.`,
          `Need ${band.minVisibleObjects}+ objects, ${band.minTacticalCategories}+ tactical categories, ${formatPercent(band.minScreenOccupancy)} screen occupancy, and <=${formatPercent(band.maxNegativeSpaceRatio)} negative-space risk; got ${objects.length}, ${tacticalCategoryCount}, ${formatPercent(screenOccupancy)}, and ${formatPercent(negativeSpaceRatio)}.`,
        ];
      return {
        id: band.id,
        label: band.label,
        minDistance: band.minDistance,
        maxDistance: band.maxDistance,
        grade,
        visibleObjectCount: objects.length,
        tacticalCategoryCount,
        screenOccupancy,
        negativeSpaceRatio,
        minVisibleObjects: band.minVisibleObjects,
        minTacticalCategories: band.minTacticalCategories,
        minScreenOccupancy: band.minScreenOccupancy,
        maxNegativeSpaceRatio: band.maxNegativeSpaceRatio,
        objects,
        notes,
      };
    });
    const grade: AssetQualityGrade = active && bands.every((band) => band.grade === 'pass') ? 'pass' : 'fail';
    const notes = grade === 'pass'
      ? ['Active gameplay camera has measurable foreground, midground, and background tactical detail instead of relying on whole-level density averages.']
      : ['Active gameplay camera density is below the player-facing AAA readability threshold in at least one distance band.'];

    return {
      active,
      grade,
      screenshot: 'gameplay-level-one.png',
      cameraPosition: this.vectorSnapshot(this.camera.position),
      playerPosition: { ...this.playerPosition },
      bands,
      notes,
    };
  }

  private gameplayDensityCandidates(): readonly { id: string; category: GameplayViewDensityCategory }[] {
    return [
      ...this.level.blockers.map((blocker) => ({ id: blocker.id, category: 'cover' as const })),
      ...this.level.setDressing.map((dressing) => ({ id: dressing.id, category: 'set-dressing' as const })),
      ...this.objectives.filter((objective) => !objective.collected).map((objective) => ({ id: objective.id, category: 'objective' as const })),
      ...this.enemies.map((enemy) => ({ id: enemy.id, category: 'enemy' as const })),
      ...this.doors.map((door) => ({ id: door.id, category: 'door' as const })),
      { id: 'extraction', category: 'extraction' as const },
    ];
  }

  private gameplayDensityObject(
    id: string,
    category: GameplayViewDensityCategory,
    player: THREE.Vector3,
    cameraForward: THREE.Vector3,
  ): GameplayViewDensityObject | null {
    const object = this.anchorObjects.get(id);
    if (!object?.visible) return null;
    const bounds = this.objectBounds(object);
    if (!bounds) return null;
    const center = new THREE.Vector3(
      (bounds.min.x + bounds.max.x) / 2,
      (bounds.min.y + bounds.max.y) / 2,
      (bounds.min.z + bounds.max.z) / 2,
    );
    if (cameraForward.dot(center.clone().sub(this.camera.position)) <= 0) return null;
    const screenBounds = this.projectObjectScreenBounds(object);
    if (!screenBounds || screenBounds.areaRatio < 0.00015 || screenBounds.heightRatio < 0.004) return null;
    return {
      id,
      category,
      distanceFromPlayer: roundMetric(center.distanceTo(player)),
      screenOccupancy: screenBounds.areaRatio,
      screenBounds,
      bounds,
    };
  }

  private framePacing(): FramePacingSample {
    const samples = [...this.frameDeltas].sort((a, b) => a - b);
    const latest = this.frameDeltas[this.frameDeltas.length - 1] ?? 16.7;
    const median = samples[Math.floor(samples.length * 0.5)] ?? latest;
    const p95 = samples[Math.min(samples.length - 1, Math.floor(samples.length * 0.95))] ?? latest;
    return {
      fps: median > 0 ? 1000 / median : 0,
      frameMs: median,
      latestFrameMs: latest,
      p95FrameMs: p95,
      samples: this.frameDeltas.length,
    };
  }

  private async selectMission(missionId: string): Promise<void> {
    const level = getLevelById(missionId);
    if (!level) throw new Error(`Unknown mission: ${missionId}`);
    this.level = level;
    await this.startRun(this.selectedHero, missionId);
    this.enterGameplay();
  }

  private movePlayerTo(point: Vec2): void {
    this.teleportPlayerTo(point);
    this.tryInteract();
    this.checkExtraction();
  }

  private teleportPlayerTo(point: Vec2): void {
    this.playerPosition = { ...point };
    if (this.player) this.player.object.position.set(point.x, 0, point.z);
    if (this.phase === 'playing') this.updateGameplayCamera(true);
  }

  private forceAlert(): void {
    this.alarms += 1;
    this.setPhase('caught');
  }

  private captureTesterState(): TesterState {
    return {
      phase: this.phase,
      levelId: this.level.id,
      missionCatalog: levelCatalog,
      selectedHero: this.selectedHero,
      operative: this.operativeMechanics(),
      settings: { ...this.settings },
      audio: this.audio.snapshot(),
      loading: this.loadingState(),
      tutorial: this.tutorialState(),
      cinematicFocus: this.cinematicFocusState(),
      gameplayCamera: this.gameplayCameraState(),
      gameplayViewDensity: this.gameplayViewDensityState(),
      missionGuidance: this.missionGuidanceState(),
      completion: this.completionStats(),
      playerPosition: { ...this.playerPosition },
      objectives: this.getObjectiveProgress(),
      doors: this.doors.map((door) => ({ id: door.id, open: door.open, progress: door.progress })),
      renderer: this.rendererMetrics(),
      renderBudget: this.renderBudgetState(),
      framePacing: this.framePacing(),
      memory: this.memoryMetrics(),
      assetQuality: this.assetQualityChecks(),
      geometry: this.geometryDiagnostics(),
      titleComposition: this.titleComposition(),
      tutorialAlignment: this.tutorialAlignmentChecks(),
    };
  }

  private titleComposition(): TitleComposition {
    const hero = this.titleHero?.object ?? this.player?.object;
    const active = this.phase === 'title' || this.phase === 'hero-select' || this.phase === 'settings';
    const heroPosition = hero?.getWorldPosition(new THREE.Vector3());
    const cameraPosition = this.camera.position.clone();
    const cameraTarget = this.titleCameraTarget.clone();
    const titleBackdrop = this.anchorObjects.get('title-door-backdrop');
    const titleFloor = this.anchorObjects.get('title-floor');
    const titleBackdropBounds = titleBackdrop ? this.objectBounds(titleBackdrop) : undefined;
    const titleFloorBounds = titleFloor ? this.objectBounds(titleFloor) : undefined;
    const titleBackdropVisible = Boolean(titleBackdrop?.visible && titleBackdropBounds);
    const titleFloorVisible = Boolean(titleFloor?.visible && titleFloorBounds);
    const levelPreviewVisible = false;
    const orbitVector = new THREE.Vector3(cameraPosition.x - cameraTarget.x, 0, cameraPosition.z - cameraTarget.z);
    const orbitRadius = orbitVector.length();
    const orbitAngle = Math.atan2(orbitVector.z, orbitVector.x);
    let facingDot = 0;
    let heroYaw = 0;
    let yawToCamera = 0;
    let cameraDistance = 0;
    const heroScreenBounds = hero ? this.projectObjectScreenBounds(hero) : undefined;
    const heroScreenOccupancy = heroScreenBounds?.areaRatio ?? 0;
    const heroScreenHeightRatio = heroScreenBounds?.heightRatio ?? 0;
    const titleTreatment = this.titleTreatmentState(heroScreenBounds);
    const identityAnchors = hero ? this.titleIdentityAnchors(hero) : [];

    if (hero && heroPosition) {
      const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(hero.quaternion).normalize();
      const toCamera = cameraPosition.clone().sub(heroPosition);
      cameraDistance = toCamera.length();
      const toCameraFlat = new THREE.Vector3(toCamera.x, 0, toCamera.z).normalize();
      facingDot = forward.dot(toCameraFlat);
      heroYaw = hero.rotation.y;
      yawToCamera = Math.atan2(toCamera.x, toCamera.z);
    }

    const heroVisible = Boolean(hero?.visible);
    const identityReadable = active &&
      ['head', 'visor', 'chest'].every((id) => {
        const anchor = identityAnchors.find((item) => item.id === id);
        return Boolean(anchor?.visible && !anchor.uiOccluded);
      });
    const heroReadable = active &&
      heroVisible &&
      identityReadable &&
      facingDot >= 0.65 &&
      cameraDistance >= 3.2 &&
      cameraDistance <= 8.8 &&
      heroScreenHeightRatio >= 0.22 &&
      heroScreenOccupancy >= 0.012;
    const notes = heroReadable && titleBackdropVisible && titleFloorVisible
      ? ['Title hero idles in a readable front/three-quarter pose against a static blacksite door backdrop and generated floor, without the retired 360 level preview props.']
      : [
        active ? 'Title hero does not meet facing/readability thresholds.' : 'Title composition is not active in the current phase.',
        titleBackdropVisible ? 'Static title door backdrop is visible.' : 'Static title door backdrop is missing from the title scene.',
        titleFloorVisible ? 'Generated title floor is visible.' : 'Generated title floor is missing from the title scene.',
        titleTreatment.wordmarkReadable ? 'Native title wordmark passes visibility and overlap checks.' : `Native title wordmark needs review: ${titleTreatment.notes.join(' ')}`,
        identityReadable ? 'Head, visor, and chest anchors are visible and not hidden by UI.' : `Identity anchors need review: ${identityAnchors.map((anchor) => `${anchor.id}=visible:${anchor.visible}/ui:${anchor.uiOccluded}`).join(', ') || 'none'}.`,
        `facingDot=${roundMetric(facingDot)}, cameraDistance=${roundMetric(cameraDistance)}, screenHeight=${roundMetric(heroScreenHeightRatio)}, screenOccupancy=${roundMetric(heroScreenOccupancy)}.`,
      ];

    return {
      active,
      heroVisible,
      heroReadable,
      levelPreviewVisible,
      titleBackdropVisible,
      titleFloorVisible,
      facingDot: roundMetric(facingDot),
      heroYaw: roundMetric(heroYaw),
      yawToCamera: roundMetric(yawToCamera),
      cameraDistance: roundMetric(cameraDistance),
      orbitAngle: roundMetric(orbitAngle),
      orbitRadius: roundMetric(orbitRadius),
      heroScreenOccupancy: roundMetric(heroScreenOccupancy),
      heroScreenHeightRatio: roundMetric(heroScreenHeightRatio),
      identityReadable,
      identityAnchors,
      ...(heroPosition ? { heroPosition: this.vectorSnapshot(heroPosition) } : {}),
      ...(heroScreenBounds ? { heroScreenBounds } : {}),
      cameraPosition: this.vectorSnapshot(cameraPosition),
      cameraTarget: this.vectorSnapshot(cameraTarget),
      ...(titleBackdropBounds ? { titleBackdropBounds } : {}),
      ...(titleFloorBounds ? { titleFloorBounds } : {}),
      titleTreatment,
      notes,
    };
  }

  private titleTreatmentState(heroScreenBounds?: ScreenBounds): TitleTreatmentState {
    const active = this.phase === 'title';
    const wordmark = this.overlay.querySelector<HTMLElement>('[data-testid="title-wordmark"]');
    const kicker = this.overlay.querySelector<HTMLElement>('[data-testid="title-kicker"]');
    const copy = this.overlay.querySelector<HTMLElement>('[data-testid="title-copy"]');
    const panel = this.overlay.querySelector<HTMLElement>('.command-panel');
    const wordmarkText = this.compactElementText(wordmark);
    const kickerText = this.compactElementText(kicker);
    const copyText = this.compactElementText(copy);
    const wordmarkBounds = wordmark ? this.elementScreenBounds(wordmark) : undefined;
    const panelBounds = panel ? this.elementScreenBounds(panel) : undefined;
    const panelOverlapRatio = wordmarkBounds && panelBounds ? this.screenOverlapRatio(wordmarkBounds, panelBounds) : 0;
    const heroOverlapRatio = wordmarkBounds && heroScreenBounds ? this.screenOverlapRatio(wordmarkBounds, heroScreenBounds) : 0;
    const wordmarkVisible = Boolean(wordmarkBounds && wordmarkBounds.widthRatio >= 0.2 && wordmarkBounds.heightRatio >= 0.18);
    const hasFinalTitleCopy = wordmarkText.toLowerCase() === 'shadow recruit 2' && !/prototype/i.test(kickerText);
    const wordmarkReadable = active &&
      wordmarkVisible &&
      hasFinalTitleCopy &&
      (wordmarkBounds?.areaRatio ?? 0) >= 0.04 &&
      panelOverlapRatio <= 0.01 &&
      heroOverlapRatio <= 0.32;
    const notes = wordmarkReadable
      ? ['Native CSS wordmark is visible, final-title branded, and does not collide with the command panel or staged hero.']
      : [
        active ? 'Title phase is active.' : 'Title phase is not active.',
        wordmarkBounds ? `wordmarkBounds=${this.formatScreenMetric(wordmarkBounds)}.` : 'Wordmark bounds are missing.',
        hasFinalTitleCopy ? 'Title text and kicker avoid prototype language.' : `Title text or kicker needs final branding: "${wordmarkText}" / "${kickerText}".`,
        `panelOverlap=${roundMetric(panelOverlapRatio)}, heroOverlap=${roundMetric(heroOverlapRatio)}.`,
      ];

    return {
      active,
      wordmarkText,
      kickerText,
      copyText,
      wordmarkVisible,
      wordmarkReadable,
      ...(wordmarkBounds ? { wordmarkBounds } : {}),
      panelOverlapRatio: roundMetric(panelOverlapRatio),
      heroOverlapRatio: roundMetric(heroOverlapRatio),
      notes,
    };
  }

  private titleIdentityAnchors(hero: THREE.Object3D): TitleIdentityAnchor[] {
    const bounds = this.objectBounds(hero);
    if (!bounds) return [];
    const centerX = (bounds.min.x + bounds.max.x) / 2;
    const centerZ = (bounds.min.z + bounds.max.z) / 2;
    const height = Math.max(0.01, bounds.size.y);
    const anchorSpecs: readonly { id: TitleIdentityAnchor['id']; label: string; yRatio: number }[] = [
      { id: 'head', label: 'Head silhouette', yRatio: 0.9 },
      { id: 'visor', label: 'Face/visor read', yRatio: 0.82 },
      { id: 'chest', label: 'Chest/gear read', yRatio: 0.58 },
      { id: 'feet', label: 'Foot grounding', yRatio: 0.04 },
    ];
    const uiBounds = [
      this.overlay.querySelector<HTMLElement>('[data-testid="title-wordmark"]'),
      this.overlay.querySelector<HTMLElement>('.command-panel'),
    ].map((element) => element ? this.elementScreenBounds(element) : undefined)
      .filter((item): item is ScreenBounds => Boolean(item));

    return anchorSpecs.map((spec) => {
      const world = new THREE.Vector3(centerX, bounds.min.y + height * spec.yRatio, centerZ);
      const screenPosition = this.projectWorldPoint(world);
      const uiOccluded = Boolean(screenPosition && uiBounds.some((bounds) => this.screenPointInsideBounds(screenPosition, bounds)));
      const visible = Boolean(screenPosition?.visible);
      return {
        id: spec.id,
        label: spec.label,
        source: 'bounds-estimate',
        worldPosition: this.vectorSnapshot(world),
        ...(screenPosition ? { screenPosition } : {}),
        visible,
        uiOccluded,
        notes: visible && !uiOccluded
          ? [`${spec.label} projects into the title screenshot without UI occlusion.`]
          : [
            visible ? `${spec.label} projects into the viewport.` : `${spec.label} is outside the title camera view.`,
            uiOccluded ? `${spec.label} is covered by the title wordmark or command panel.` : `${spec.label} is not covered by title UI.`,
          ],
      };
    });
  }

  private screenPointInsideBounds(point: ScreenPoint, bounds: ScreenBounds): boolean {
    return point.x >= bounds.min.x && point.x <= bounds.max.x && point.y >= bounds.min.y && point.y <= bounds.max.y;
  }

  private compactElementText(element: HTMLElement | null): string {
    return (element?.innerText ?? element?.textContent ?? '').replace(/\s+/g, ' ').trim();
  }

  private elementScreenBounds(element: HTMLElement): ScreenBounds | undefined {
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || this.canvas.clientWidth;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || this.canvas.clientHeight;
    if (viewportWidth <= 0 || viewportHeight <= 0) return undefined;
    const rect = element.getBoundingClientRect();
    const minX = clamp(rect.left, 0, viewportWidth);
    const minY = clamp(rect.top, 0, viewportHeight);
    const maxX = clamp(rect.right, 0, viewportWidth);
    const maxY = clamp(rect.bottom, 0, viewportHeight);
    const visibleWidth = Math.max(0, maxX - minX);
    const visibleHeight = Math.max(0, maxY - minY);
    if (visibleWidth <= 0 || visibleHeight <= 0) return undefined;

    return {
      min: { x: roundMetric(minX), y: roundMetric(minY) },
      max: { x: roundMetric(maxX), y: roundMetric(maxY) },
      size: { x: roundMetric(visibleWidth), y: roundMetric(visibleHeight) },
      center: { x: roundMetric(minX + visibleWidth / 2), y: roundMetric(minY + visibleHeight / 2) },
      viewport: { width: roundMetric(viewportWidth), height: roundMetric(viewportHeight) },
      widthRatio: roundMetric(visibleWidth / viewportWidth),
      heightRatio: roundMetric(visibleHeight / viewportHeight),
      areaRatio: roundMetric((visibleWidth * visibleHeight) / (viewportWidth * viewportHeight)),
    };
  }

  private projectWorldPoint(point: THREE.Vector3): ScreenPoint | undefined {
    const viewport = this.renderer.getSize(new THREE.Vector2());
    const width = viewport.x || this.canvas.clientWidth || this.canvas.width;
    const height = viewport.y || this.canvas.clientHeight || this.canvas.height;
    if (width <= 0 || height <= 0) return undefined;
    const projected = point.clone().project(this.camera);
    if (!Number.isFinite(projected.x) || !Number.isFinite(projected.y) || !Number.isFinite(projected.z)) return undefined;
    const x = (projected.x * 0.5 + 0.5) * width;
    const y = (-projected.y * 0.5 + 0.5) * height;
    return {
      x: roundMetric(clamp(x, 0, width)),
      y: roundMetric(clamp(y, 0, height)),
      visible: projected.z >= -1 && projected.z <= 1 && x >= 0 && x <= width && y >= 0 && y <= height,
      viewport: { width: roundMetric(width), height: roundMetric(height) },
    };
  }

  private screenPointRegion(point: ScreenPoint, size = 12): ScreenBounds {
    const width = point.viewport.width;
    const height = point.viewport.height;
    const half = size / 2;
    const minX = clamp(point.x - half, 0, width);
    const minY = clamp(point.y - half, 0, height);
    const maxX = clamp(point.x + half, 0, width);
    const maxY = clamp(point.y + half, 0, height);
    const visibleWidth = Math.max(0, maxX - minX);
    const visibleHeight = Math.max(0, maxY - minY);
    return {
      min: { x: roundMetric(minX), y: roundMetric(minY) },
      max: { x: roundMetric(maxX), y: roundMetric(maxY) },
      size: { x: roundMetric(visibleWidth), y: roundMetric(visibleHeight) },
      center: { x: roundMetric(minX + visibleWidth / 2), y: roundMetric(minY + visibleHeight / 2) },
      viewport: point.viewport,
      widthRatio: roundMetric(visibleWidth / Math.max(1, width)),
      heightRatio: roundMetric(visibleHeight / Math.max(1, height)),
      areaRatio: roundMetric((visibleWidth * visibleHeight) / Math.max(1, width * height)),
    };
  }

  private screenOverlapRatio(a: ScreenBounds, b: ScreenBounds): number {
    const width = Math.max(0, Math.min(a.max.x, b.max.x) - Math.max(a.min.x, b.min.x));
    const height = Math.max(0, Math.min(a.max.y, b.max.y) - Math.max(a.min.y, b.min.y));
    const area = Math.max(0.0001, a.size.x * a.size.y);
    return Math.min(1, (width * height) / area);
  }

  private formatScreenMetric(bounds: ScreenBounds): string {
    return `x=${bounds.min.x}..${bounds.max.x}, y=${bounds.min.y}..${bounds.max.y}, area=${roundMetric(bounds.areaRatio)}`;
  }

  private projectObjectScreenBounds(object: THREE.Object3D): ScreenBounds | undefined {
    const viewport = this.renderer.getSize(new THREE.Vector2());
    const width = viewport.x || this.canvas.clientWidth || this.canvas.width;
    const height = viewport.y || this.canvas.clientHeight || this.canvas.height;
    if (width <= 0 || height <= 0) return undefined;

    this.boundsScratch.setFromObject(object);
    if (this.boundsScratch.isEmpty()) return undefined;

    const min = this.boundsScratch.min;
    const max = this.boundsScratch.max;
    const corners = [
      new THREE.Vector3(min.x, min.y, min.z),
      new THREE.Vector3(min.x, min.y, max.z),
      new THREE.Vector3(min.x, max.y, min.z),
      new THREE.Vector3(min.x, max.y, max.z),
      new THREE.Vector3(max.x, min.y, min.z),
      new THREE.Vector3(max.x, min.y, max.z),
      new THREE.Vector3(max.x, max.y, min.z),
      new THREE.Vector3(max.x, max.y, max.z),
    ];
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    for (const corner of corners) {
      const projected = corner.project(this.camera);
      if (!Number.isFinite(projected.x) || !Number.isFinite(projected.y) || !Number.isFinite(projected.z)) continue;
      const x = (projected.x * 0.5 + 0.5) * width;
      const y = (-projected.y * 0.5 + 0.5) * height;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }

    if (![minX, minY, maxX, maxY].every(Number.isFinite)) return undefined;

    const visibleMinX = clamp(minX, 0, width);
    const visibleMinY = clamp(minY, 0, height);
    const visibleMaxX = clamp(maxX, 0, width);
    const visibleMaxY = clamp(maxY, 0, height);
    const visibleWidth = Math.max(0, visibleMaxX - visibleMinX);
    const visibleHeight = Math.max(0, visibleMaxY - visibleMinY);

    return {
      min: { x: roundMetric(visibleMinX), y: roundMetric(visibleMinY) },
      max: { x: roundMetric(visibleMaxX), y: roundMetric(visibleMaxY) },
      size: { x: roundMetric(visibleWidth), y: roundMetric(visibleHeight) },
      center: { x: roundMetric(visibleMinX + visibleWidth / 2), y: roundMetric(visibleMinY + visibleHeight / 2) },
      viewport: { width: roundMetric(width), height: roundMetric(height) },
      widthRatio: roundMetric(visibleWidth / width),
      heightRatio: roundMetric(visibleHeight / height),
      areaRatio: roundMetric((visibleWidth * visibleHeight) / (width * height)),
    };
  }

  private installDebugApi(): void {
    window.__shadowRecruitDebug = {
      ready: () => this.ready,
      phase: () => this.phase,
      missionId: () => this.level.id,
      missions: () => levelCatalog,
      settings: () => ({ ...this.settings }),
      audioState: () => this.audio.snapshot(),
      loadingState: () => this.loadingState(),
      tutorialStep: () => this.tutorialState(),
      tutorialAlignment: () => this.tutorialAlignmentChecks(),
      cinematicFocus: () => this.cinematicFocusState(),
      selectedHero: () => this.selectedHero,
      playerPosition: () => ({ ...this.playerPosition }),
      playerVisible: () => Boolean(this.player?.object.visible ?? this.titleHero?.object.visible),
      titleComposition: () => this.titleComposition(),
      setTitleOrbitAngle: (angle) => this.setTitleOrbitAngle(angle),
      clearTitleOrbitAngle: () => this.clearTitleOrbitAngle(),
      operativeMechanics: () => this.operativeMechanics(),
      operativeCatalog: () => this.operativeCatalog(),
      enemies: () => this.enemies.map((enemy) => ({
        id: enemy.id,
        position: { ...enemy.position },
        start: { ...enemy.start },
        detectionRadius: enemy.detectionRadius,
        baseDetectionRadius: enemy.detectionRadius,
        effectiveContactRadius: this.effectiveEnemyDetectionRadius(enemy),
      })),
      assetQuality: () => this.assetQualityChecks(),
      objectives: () => this.getObjectiveProgress(),
      doors: () => this.doors.map((door) => ({ id: door.id, open: door.open, progress: door.progress })),
      rendererMetrics: () => this.rendererMetrics(),
      framePacing: () => this.framePacing(),
      memoryMetrics: () => this.memoryMetrics(),
      selectMission: (missionId) => this.selectMission(missionId),
      movePlayerTo: (point) => this.movePlayerTo(point),
      teleportPlayerTo: (point) => this.teleportPlayerTo(point),
      collectObjective: (objectiveId) => this.collectObjective(objectiveId),
      forceAlert: () => this.forceAlert(),
      forceFailure: () => this.setPhase('caught'),
      forceSuccess: () => this.completeMission(),
      resetMission: () => this.startRun(this.selectedHero),
      startGame: (heroId, missionId) => this.startRun(isHeroId(heroId) ? heroId : this.selectedHero, missionId),
      setPerformanceProfile: (profile) => this.setPerformanceProfile(profile),
      completeMission: () => this.completeMission(),
      resetFramePacing: () => {
        this.frameDeltas.length = 0;
      },
      captureTesterState: () => this.captureTesterState(),
    };
  }
}
