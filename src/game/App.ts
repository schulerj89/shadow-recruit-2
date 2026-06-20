import * as THREE from 'three';
import generalUrl from '../assets/generated/general-caldwell.png?url';
import doorPanelUrl from '../assets/generated/sliding-door-panel.png?url';
import floorPanelUrl from '../assets/generated/tactical-floor-panel.png?url';
import wallPanelUrl from '../assets/generated/blacksite-wall-panel.png?url';
import { AssetLibrary, type CharacterInstance, disposeObject } from './CharacterAssets';
import { AudioDirector } from './AudioDirector';
import { defaultHeroId, heroOptionById, heroOptions, isHeroId, type HeroId } from './heroes';
import { defaultLevel, getLevelById, levelCatalog } from './levels';
import { add, clamp, distance, normalize, pointInBounds, pointInRect, scale, subtract } from './math';
import { isPerformanceProfile, loadSettings, saveSettings } from './settings';
import type {
  AssetQualityCheck,
  AssetQualityGrade,
  Bounds3,
  CinematicFocusState,
  CompletionStats,
  DoorCoordinateGap,
  DoorRuntime,
  EnemyRuntime,
  FramePacingSample,
  GameSettings,
  GeometryDiagnostics,
  LevelCatalogEntry,
  LevelDefinition,
  LevelDensityCheck,
  MemoryMetrics,
  ObjectiveRuntime,
  PerformanceProfile,
  Phase,
  RectSpec,
  RendererMetrics,
  SceneObjectBounds,
  TesterState,
  TitleComposition,
  TutorialState,
  Vec2,
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
  titleStageSegments: number;
  titleRingSegments: number;
  extractionRingSegments: number;
  lightIntensityScale: number;
  textureAnisotropy: number;
};

type AssetQualityOptions = {
  planarGround?: boolean;
  minWidth?: number;
  minDepth?: number;
};

type ShellTextureKind = 'floor' | 'wall' | 'blocker' | 'trim';

const renderQualityByProfile: Record<PerformanceProfile, RenderQuality> = {
  performance: {
    pixelRatioCap: 0.75,
    shadowsEnabled: false,
    shadowMapSize: 0,
    floorSegments: 6,
    detectionConeSegments: 18,
    titleStageSegments: 20,
    titleRingSegments: 36,
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
    titleStageSegments: 36,
    titleRingSegments: 72,
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
    titleStageSegments: 48,
    titleRingSegments: 96,
    extractionRingSegments: 96,
    lightIntensityScale: 1.18,
    textureAnisotropy: 8,
  },
};

type ShadowRecruitDebugApi = {
  ready: () => boolean;
  phase: () => Phase;
  missionId: () => string;
  missions: () => readonly LevelCatalogEntry[];
  settings: () => GameSettings;
  tutorialStep: () => TutorialState;
  cinematicFocus: () => CinematicFocusState;
  selectedHero: () => HeroId;
  playerPosition: () => Vec2;
  playerVisible: () => boolean;
  titleComposition: () => TitleComposition;
  enemies: () => readonly { id: string; position: Vec2 }[];
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
    this.setLoading('building rotating level preview', 0.62);
    this.buildTitleScene();
    this.ready = true;
    this.setLoading('ready', 1);
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
    this.addTitleHeroStage(this.titleHeroStagePosition);
    this.titleHero.object.position.copy(this.titleHeroStagePosition);
    this.titleHero.object.scale.multiplyScalar(1.35);
    this.titleHero.object.rotation.y = -0.4;
    this.applyObjectQuality(this.titleHero.object);
    this.scene.add(this.titleHero.object);
    this.anchorObjects.set('hero', this.titleHero.object);
    this.camera.position.set(22, 15, -24);
    this.camera.lookAt(this.titleCameraTarget);
    this.orientTitleHeroTowardCamera();
  }

  private async startRun(heroId = this.selectedHero, missionId = this.level.id): Promise<void> {
    if (isHeroId(heroId)) this.selectedHero = heroId;
    const level = getLevelById(missionId);
    if (!level) throw new Error(`Unknown mission: ${missionId}`);
    this.level = level;
    this.audio.unlock();
    this.setPhase('loading');
    await this.audio.play('loading');
    this.setLoading('preloading hero, sentry, objectives', 0.18);
    await Promise.all([
      this.assets.preloadHero(this.selectedHero),
      this.assets.preloadSentry(),
      this.assets.preloadObjectives(),
    ]);
    this.setLoading(`building ${this.level.name.toLowerCase()}`, 0.68);
    this.buildPlayableLevel();
    this.setLoading('starting cinematic tutorial', 1);
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
      this.addBox(blocker, 'blocker', 0.1);
    }

    this.level.setDressing.forEach((dressing, index) => {
      this.addSetDressing(dressing, index);
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
    this.scene.add(mesh);
    this.runtimeObjects.push({ object: mesh });
    this.anchorObjects.set(rect.id, mesh);
    return mesh;
  }

  private addSetDressing(rect: RectSpec, index: number): THREE.Mesh {
    const lowProfile = rect.height !== undefined && rect.height < 0.35;
    const utility = /cable|pipe|spine|trench/i.test(rect.id);
    const materialKind: ShellTextureKind = utility || index % 3 === 0 ? 'trim' : 'blocker';
    const mesh = this.addBox(rect, materialKind, utility ? 0.3 : 0.14);
    if (lowProfile) mesh.position.y = (rect.height ?? 0.2) / 2 + 0.02;
    return mesh;
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
  }

  private addTitleHeroStage(position: THREE.Vector3): void {
    const quality = this.quality();
    const stage = new THREE.Mesh(
      new THREE.CylinderGeometry(1.55, 1.75, 0.18, quality.titleStageSegments),
      new THREE.MeshStandardMaterial({
        color: '#10222c',
        roughness: 0.42,
        metalness: 0.55,
        emissive: '#123d42',
        emissiveIntensity: 0.55,
      }),
    );
    stage.name = 'title-hero-stage';
    stage.position.set(position.x, 0.09, position.z);
    stage.receiveShadow = quality.shadowsEnabled;

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.72, 0.035, 8, quality.titleRingSegments),
      new THREE.MeshBasicMaterial({ color: '#6fffe2' }),
    );
    ring.name = 'title-hero-stage-ring';
    ring.position.set(position.x, 0.22, position.z);
    ring.rotation.x = -Math.PI / 2;

    const light = new THREE.PointLight('#6fffe2', 5.2, 9);
    light.name = 'title-hero-stage-light';
    light.position.set(position.x, 2.8, position.z + 1.2);

    this.scene.add(stage, ring, light);
    this.runtimeObjects.push({ object: stage }, { object: ring }, { object: light });
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

  private frame(timeMs: number): void {
    const delta = Math.min(this.clock.getDelta(), 0.05);
    this.frameDeltas.push(delta * 1000);
    if (this.frameDeltas.length > 240) this.frameDeltas.shift();

    if (this.phase === 'title' || this.phase === 'hero-select' || this.phase === 'settings') {
      this.updateTitleCamera(timeMs / 1000);
    } else if (this.phase === 'playing') {
      this.updatePlaying(delta);
    } else if (this.phase === 'cinematic-focus' && performance.now() > this.focusUntil) {
      this.setPhase('playing');
    }

    this.updateDoors(delta);
    this.titleHero?.animator?.update(delta);
    this.player?.animator?.update(delta);
    this.renderer.render(this.scene, this.camera);
    this.syncPrompt();
    this.updateDebugPanel();
    this.pressedKeys.clear();
  }

  private updateTitleCamera(time: number): void {
    const angle = time * 0.18;
    this.camera.position.set(
      this.titleCameraTarget.x + Math.cos(angle) * 4.5,
      2.95 + Math.sin(angle * 0.5) * 0.18,
      this.titleCameraTarget.z + 5.2 + Math.sin(angle) * 1.65,
    );
    this.camera.lookAt(this.titleCameraTarget);
    this.orientTitleHeroTowardCamera(0.14);
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
      const speed = this.settings.performanceProfile === 'performance' ? 8.2 : 7.6;
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

      if (distance(enemy.position, this.playerPosition) <= enemy.detectionRadius && this.phase === 'playing') {
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
    const target = new THREE.Vector3(this.playerPosition.x, 1.05, this.playerPosition.z);
    const desired = new THREE.Vector3(this.playerPosition.x + 4.1, 5.2, this.playerPosition.z + 6.2);
    if (snap) {
      this.camera.position.copy(desired);
    } else {
      this.camera.position.lerp(desired, 0.08);
    }
    this.camera.lookAt(target);
  }

  private tryInteract(): void {
    const objective = this.objectives.find((item) => !item.collected && distance(item.position, this.playerPosition) <= item.radius);
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
    const objective = this.objectives.find((item) => !item.collected && distance(item.position, this.playerPosition) <= item.radius);
    if (objective) {
      this.activePrompt = `Press E: ${objective.label}`;
    } else if (this.getObjectiveProgress().exitUnlocked && distance(this.level.extraction, this.playerPosition) <= 3) {
      this.activePrompt = 'Extraction zone ready.';
    } else if (this.phase === 'playing') {
      this.activePrompt = '';
    }
  }

  private checkExtraction(): void {
    if (!this.getObjectiveProgress().exitUnlocked) return;
    if (distance(this.playerPosition, this.level.extraction) <= 2.7) {
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
    const object = this.anchorObjects.get(targetId);
    const position = new THREE.Vector3();
    if (object) {
      object.getWorldPosition(position);
    } else if (targetId === 'extraction') {
      position.set(this.level.extraction.x, 0, this.level.extraction.z);
    } else {
      position.set(this.playerPosition.x, 0, this.playerPosition.z);
    }

    const angle = targetId === 'hero' ? -0.8 : 0.78;
    this.camera.position.set(position.x + Math.cos(angle) * 8, 6.4, position.z + Math.sin(angle) * 8);
    this.camera.lookAt(position.x, 0.8, position.z);
  }

  private setPhase(phase: Phase): void {
    this.phase = phase;
    if (phase === 'playing' && this.runStartedAt === 0) {
      this.runStartedAt = performance.now();
    }
    this.renderOverlay();
    this.renderHud();
  }

  private setLoading(label: string, value: number): void {
    this.loading = { label, value };
    this.renderOverlay();
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
      this.setPhase('playing');
      this.runStartedAt = performance.now();
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
          <section class="title-mark">
            <div class="title-kicker">Tactical infiltration prototype</div>
            <h1 class="title-logo">Shadow Recruit 2</h1>
            <p class="title-copy">A blacksite door waits in the fog. Pick your operative, breach the patrol route, and extract before command loses the signal.</p>
          </section>
          <section class="command-panel">
            <div class="screen-kicker">Ready room</div>
            <h2 class="panel-title">Prepare the insertion.</h2>
            <p class="panel-copy">The staged recruit and door set preview the mission tone. Configure debug and performance, then begin the cinematic tutorial.</p>
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
          <p>The selected GLB is used in the title preview, tutorial, and mission runtime.</p>
          <div class="hero-grid">
            ${heroOptions.map((hero) => `
              <button type="button" class="hero-card ${hero.id === this.selectedHero ? 'is-selected' : ''}" data-hero-id="${hero.id}">
                <strong>${hero.name}</strong>
                <span>${hero.role}</span>
                <small>${hero.description}</small>
              </button>
            `).join('')}
          </div>
          <div class="button-row">
            <button type="button" data-action="start-level">Start Level</button>
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
          <h2>Blacksite Threshold cleared</h2>
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
      this.hud.innerHTML = `
        <section class="hud-panel">
          <div class="hud-kicker">${this.level.chapter}</div>
          <strong>${this.level.name}</strong>
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
      this.setPhase('playing');
      this.runStartedAt = performance.now();
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

  private memoryMetrics(): MemoryMetrics {
    return {
      runtimeObjects: this.runtimeObjects.length,
      ...this.assets.metrics(),
    };
  }

  private assetQualityChecks(): readonly AssetQualityCheck[] {
    const checks: AssetQualityCheck[] = [];
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
      id: 'level-set-dressing',
      label: 'Tactical set dressing',
      category: 'level-mesh',
      grade: this.level.setDressing.every((item) => this.anchorObjects.has(item.id)) ? 'pass' : 'fail',
      visible: this.level.setDressing.every((item) => this.anchorObjects.has(item.id)),
      grounded: true,
      notes: this.level.setDressing.every((item) => this.anchorObjects.has(item.id))
        ? [`${this.level.setDressing.length} coordinate-authored non-colliding dressing meshes add cables, wall machinery, racks, consoles, and extraction equipment without blocking the validation route.`]
        : ['One or more authored set-dressing meshes are missing from the scene.'],
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
      doorContinuity: this.doorContinuityChecks(),
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
    const grade: LevelDensityCheck['grade'] = setDressingRatio < 0.06 ? 'fail' : setDressingRatio < 0.1 ? 'review' : 'pass';
    const notes = grade === 'pass'
      ? [`Set-dressing and gameplay footprints cover ${(setDressingRatio * 100).toFixed(1)}% of the level floor.`]
      : [
        `Set-dressing and gameplay footprints cover only ${(setDressingRatio * 100).toFixed(1)}% of the ${roundMetric(floorArea)}m2 floor.`,
        'Add tactical cover, security props, cables, signage, light fixtures, patrol landmarks, and extraction dressing before grading this as AAA-quality level presentation.',
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
      notes,
    };
  }

  private objectBounds(object: THREE.Object3D): Bounds3 | undefined {
    this.boundsScratch.setFromObject(object);
    return this.boundsScratch.isEmpty() ? undefined : this.boundsSnapshot(this.boundsScratch);
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

  private minAlong(axis: 'x' | 'z', bounds: Bounds3): number {
    return axis === 'x' ? bounds.min.x : bounds.min.z;
  }

  private maxAlong(axis: 'x' | 'z', bounds: Bounds3): number {
    return axis === 'x' ? bounds.max.x : bounds.max.z;
  }

  private overlapOn(axis: 'x' | 'z', a: Bounds3, b: Bounds3): number {
    return Math.min(this.maxAlong(axis, a), this.maxAlong(axis, b)) - Math.max(this.minAlong(axis, a), this.minAlong(axis, b));
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

  private cinematicFocusState(): CinematicFocusState {
    return {
      active: this.phase === 'cinematic-focus',
      target: this.focusTargetId,
      remainingMs: this.phase === 'cinematic-focus' ? Math.max(0, Math.round(this.focusUntil - performance.now())) : 0,
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
    await this.startRun(this.selectedHero);
    this.setPhase('playing');
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
      selectedHero: this.selectedHero,
      settings: { ...this.settings },
      tutorial: this.tutorialState(),
      cinematicFocus: this.cinematicFocusState(),
      completion: this.completionStats(),
      playerPosition: { ...this.playerPosition },
      objectives: this.getObjectiveProgress(),
      doors: this.doors.map((door) => ({ id: door.id, open: door.open, progress: door.progress })),
      renderer: this.rendererMetrics(),
      framePacing: this.framePacing(),
      memory: this.memoryMetrics(),
      assetQuality: this.assetQualityChecks(),
      geometry: this.geometryDiagnostics(),
      titleComposition: this.titleComposition(),
    };
  }

  private titleComposition(): TitleComposition {
    const hero = this.titleHero?.object ?? this.player?.object;
    const active = this.phase === 'title' || this.phase === 'hero-select' || this.phase === 'settings';
    const heroPosition = hero?.getWorldPosition(new THREE.Vector3());
    const cameraPosition = this.camera.position.clone();
    const cameraTarget = this.titleCameraTarget.clone();
    let facingDot = 0;
    let heroYaw = 0;
    let yawToCamera = 0;
    let cameraDistance = 0;

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
    const heroReadable = active && heroVisible && facingDot >= 0.65 && cameraDistance >= 3.2 && cameraDistance <= 8.5;
    const notes = heroReadable
      ? ['Title hero faces the camera in a readable front/three-quarter pose.']
      : [
        active ? 'Title hero does not meet facing/readability thresholds.' : 'Title composition is not active in the current phase.',
        `facingDot=${roundMetric(facingDot)}, cameraDistance=${roundMetric(cameraDistance)}.`,
      ];

    return {
      active,
      heroVisible,
      heroReadable,
      facingDot: roundMetric(facingDot),
      heroYaw: roundMetric(heroYaw),
      yawToCamera: roundMetric(yawToCamera),
      cameraDistance: roundMetric(cameraDistance),
      ...(heroPosition ? { heroPosition: this.vectorSnapshot(heroPosition) } : {}),
      cameraPosition: this.vectorSnapshot(cameraPosition),
      cameraTarget: this.vectorSnapshot(cameraTarget),
      notes,
    };
  }

  private installDebugApi(): void {
    window.__shadowRecruitDebug = {
      ready: () => this.ready,
      phase: () => this.phase,
      missionId: () => this.level.id,
      missions: () => levelCatalog,
      settings: () => ({ ...this.settings }),
      tutorialStep: () => this.tutorialState(),
      cinematicFocus: () => this.cinematicFocusState(),
      selectedHero: () => this.selectedHero,
      playerPosition: () => ({ ...this.playerPosition }),
      playerVisible: () => Boolean(this.player?.object.visible ?? this.titleHero?.object.visible),
      titleComposition: () => this.titleComposition(),
      enemies: () => this.enemies.map((enemy) => ({ id: enemy.id, position: { ...enemy.position } })),
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
