export type Vec2 = { x: number; z: number };

export type Phase =
  | 'boot'
  | 'title'
  | 'hero-select'
  | 'settings'
  | 'loading'
  | 'tutorial'
  | 'playing'
  | 'cinematic-focus'
  | 'caught'
  | 'complete';

export type PerformanceProfile = 'performance' | 'balanced' | 'cinematic';

export type GameSettings = {
  debug: boolean;
  muted: boolean;
  performanceProfile: PerformanceProfile;
};

export type RectSpec = {
  id: string;
  center: Vec2;
  size: Vec2;
  height?: number;
};

export type DoorDefinition = RectSpec & {
  axis: 'x' | 'z';
  opensWhen: readonly string[];
  speed: number;
};

export type ObjectiveType = 'keycard' | 'terminal' | 'codes';

export type ObjectiveDefinition = {
  id: string;
  type: ObjectiveType;
  label: string;
  position: Vec2;
  radius: number;
  required: boolean;
  unlocks: readonly string[];
  asset: 'keycard' | 'terminal';
};

export type EnemyDefinition = {
  id: string;
  label: string;
  start: Vec2;
  patrol: readonly Vec2[];
  speed: number;
  detectionRadius: number;
};

export type TutorialStep = {
  id: string;
  title: string;
  text: string;
  target: string;
};

export type LevelDefinition = {
  id: string;
  name: string;
  chapter: string;
  bounds: { min: Vec2; max: Vec2 };
  start: Vec2;
  extraction: Vec2;
  walls: readonly RectSpec[];
  blockers: readonly RectSpec[];
  doors: readonly DoorDefinition[];
  objectives: readonly ObjectiveDefinition[];
  enemies: readonly EnemyDefinition[];
  validationRoute: readonly Vec2[];
  tutorial: readonly TutorialStep[];
};

export type LevelCatalogEntry = {
  id: string;
  name: string;
  chapter: string;
  objectiveCount: number;
  enemyCount: number;
};

export type ObjectiveRuntime = ObjectiveDefinition & {
  collected: boolean;
};

export type DoorRuntime = DoorDefinition & {
  open: boolean;
  progress: number;
};

export type EnemyRuntime = EnemyDefinition & {
  position: Vec2;
  segment: number;
  forward: Vec2;
};

export type FramePacingSample = {
  fps: number;
  frameMs: number;
  latestFrameMs: number;
  p95FrameMs: number;
  samples: number;
};

export type RendererMetrics = {
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
  pixelRatio: number;
};

export type MemoryMetrics = {
  runtimeObjects: number;
  loadedAssets: number;
  characterAssets: number;
  staticAssets: number;
  loadedAssetIds: readonly string[];
};

export type TutorialState = {
  index: number;
  total: number;
  step: TutorialStep | null;
};

export type CinematicFocusState = {
  active: boolean;
  target: string | null;
  remainingMs: number;
};

export type TesterState = {
  phase: Phase;
  levelId: string;
  selectedHero: string;
  settings: GameSettings;
  tutorial: TutorialState;
  cinematicFocus: CinematicFocusState;
  playerPosition: Vec2;
  objectives: { collectedRequired: number; totalRequired: number; exitUnlocked: boolean };
  doors: readonly { id: string; open: boolean; progress: number }[];
  renderer: RendererMetrics;
  framePacing: FramePacingSample;
  memory: MemoryMetrics;
};
