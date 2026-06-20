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

export type AudioTrackId = 'title' | 'loading' | 'gameplay' | 'complete';

export type AudioState = {
  activeTrack: AudioTrackId | null;
  muted: boolean;
  unlocked: boolean;
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
export type ObjectiveAssetId = 'keycard' | 'terminal' | 'codes';
export type SetDressingAssetId = 'cable-tray' | 'wall-machinery' | 'extraction-beacon';
export type CoverAssetId = 'cover-barricade';

export type ObjectiveDefinition = {
  id: string;
  type: ObjectiveType;
  label: string;
  position: Vec2;
  radius: number;
  required: boolean;
  unlocks: readonly string[];
  asset: ObjectiveAssetId;
};

export type SetDressingDefinition = RectSpec & {
  asset: SetDressingAssetId;
};

export type LevelZoneDefinition = {
  id: string;
  label: string;
  bounds: { min: Vec2; max: Vec2 };
  screenshot?: string;
  expectedLandmarks: readonly string[];
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
  alignmentKeywords: readonly string[];
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
  setDressing: readonly SetDressingDefinition[];
  zones: readonly LevelZoneDefinition[];
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
  performanceProfile: PerformanceProfile;
  shadowsEnabled: boolean;
  shadowMapSize: number;
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
  pixelRatio: number;
};

export type RuntimeAssetKind = 'hero' | 'enemy' | 'objective' | 'set-dressing' | 'cover';
export type RuntimeAssetRequirement = 'required' | 'optional';
export type RuntimeAssetSource = 'sneak-game-seed' | 'repo-generated-glb';
export type RuntimeAssetFallbackPolicy = 'required-error' | 'optional-omit';

export type RuntimeAssetManifestEntry = {
  id: string;
  label: string;
  kind: RuntimeAssetKind;
  requirement: RuntimeAssetRequirement;
  source: RuntimeAssetSource;
  path: string;
  expectedFormat: 'glb';
  fallbackPolicy: RuntimeAssetFallbackPolicy;
  notes: readonly string[];
};

export type RuntimeAssetAudit = RuntimeAssetManifestEntry & {
  loaded: boolean;
  failed: boolean;
  failure?: string;
  fallbackVisible: boolean;
  grade: AssetQualityGrade;
};

export type MemoryMetrics = {
  runtimeObjects: number;
  loadedAssets: number;
  characterAssets: number;
  staticAssets: number;
  loadedAssetIds: readonly string[];
  failedAssetIds: readonly string[];
  assetAudit: readonly RuntimeAssetAudit[];
};

export type AssetQualityGrade = 'pass' | 'review' | 'fail';

export type AssetQualityCheck = {
  id: string;
  label: string;
  category: 'level-mesh' | 'set-dressing' | 'blocker' | 'door' | 'objective' | 'enemy' | 'extraction' | 'hero';
  grade: AssetQualityGrade;
  visible: boolean;
  grounded: boolean;
  position?: { x: number; y: number; z: number };
  bounds?: { minY: number; maxY: number; height: number; width?: number; depth?: number };
  notes: readonly string[];
};

export type Bounds3 = {
  min: { x: number; y: number; z: number };
  max: { x: number; y: number; z: number };
  size: { x: number; y: number; z: number };
};

export type ScreenBounds = {
  min: { x: number; y: number };
  max: { x: number; y: number };
  size: { x: number; y: number };
  center: { x: number; y: number };
  viewport: { width: number; height: number };
  widthRatio: number;
  heightRatio: number;
  areaRatio: number;
};

export type TitleTreatmentState = {
  active: boolean;
  wordmarkText: string;
  kickerText: string;
  copyText: string;
  wordmarkVisible: boolean;
  wordmarkReadable: boolean;
  wordmarkBounds?: ScreenBounds;
  panelOverlapRatio: number;
  heroOverlapRatio: number;
  notes: readonly string[];
};

export type SceneObjectBounds = {
  id: string;
  category: 'wall' | 'blocker' | 'set-dressing' | 'door' | 'door-frame' | 'door-continuity' | 'objective' | 'enemy' | 'hero' | 'extraction';
  visible: boolean;
  bounds: Bounds3;
};

export type SetDressingVisibilityCheck = {
  id: string;
  asset: SetDressingAssetId;
  grade: AssetQualityGrade;
  loaded: boolean;
  visible: boolean;
  grounded: boolean;
  authoredBounds: Bounds3;
  renderedBounds?: Bounds3;
  footprintCoverage: number;
  notes: readonly string[];
};

export type DoorCoordinateGap = {
  id: string;
  label: string;
  axis: 'x' | 'z';
  fromId: string;
  toId: string;
  fromEdge: number;
  toEdge: number;
  gap: number;
};

export type DoorCoordinateCheck = {
  id: string;
  axis: 'x' | 'z';
  grade: AssetQualityGrade;
  epsilon: number;
  wallIds: readonly string[];
  openingBounds: Bounds3;
  frameBounds?: Bounds3;
  continuityBounds?: Bounds3;
  renderedDoorBounds?: Bounds3;
  gaps: readonly DoorCoordinateGap[];
  notes: readonly string[];
};

export type WallRunInterval = {
  id: string;
  kind: 'wall' | 'door-opening' | 'door-frame' | 'door-continuity';
  min: number;
  max: number;
  bounds: Bounds3;
};

export type WallRunContinuityCheck = {
  id: string;
  axis: 'x' | 'z';
  line: number;
  grade: AssetQualityGrade;
  epsilon: number;
  intervals: readonly WallRunInterval[];
  gaps: readonly DoorCoordinateGap[];
  notes: readonly string[];
};

export type LevelDensityCheck = {
  grade: AssetQualityGrade;
  floorArea: number;
  setDressingFootprintArea: number;
  setDressingRatio: number;
  blockerCount: number;
  setDressingCount: number;
  objectiveCount: number;
  enemyCount: number;
  zones: readonly LevelZoneDensityCheck[];
  notes: readonly string[];
};

export type LevelZoneDensityCheck = {
  id: string;
  label: string;
  grade: AssetQualityGrade;
  bounds: { min: Vec2; max: Vec2 };
  screenshot?: string;
  floorArea: number;
  coverFootprintArea: number;
  setDressingFootprintArea: number;
  gameplayFootprintArea: number;
  totalFootprintArea: number;
  totalFootprintRatio: number;
  blockerCount: number;
  setDressingCount: number;
  objectiveCount: number;
  enemyCount: number;
  landmarkCount: number;
  interactableCount: number;
  expectedLandmarks: readonly string[];
  notes: readonly string[];
};

export type GeometryDiagnostics = {
  objectBounds: readonly SceneObjectBounds[];
  setDressingVisibility: readonly SetDressingVisibilityCheck[];
  doorContinuity: readonly DoorCoordinateCheck[];
  wallRunContinuity: readonly WallRunContinuityCheck[];
  levelDensity: LevelDensityCheck;
};

export type TitleComposition = {
  active: boolean;
  heroVisible: boolean;
  heroReadable: boolean;
  levelPreviewVisible: boolean;
  facingDot: number;
  heroYaw: number;
  yawToCamera: number;
  cameraDistance: number;
  orbitAngle: number;
  orbitRadius: number;
  heroScreenOccupancy: number;
  heroScreenHeightRatio: number;
  heroPosition?: { x: number; y: number; z: number };
  heroScreenBounds?: ScreenBounds;
  cameraPosition: { x: number; y: number; z: number };
  cameraTarget: { x: number; y: number; z: number };
  levelPreviewBounds?: Bounds3;
  titleTreatment: TitleTreatmentState;
  notes: readonly string[];
};

export type LoadingStep = {
  label: string;
  value: number;
  elapsedMs: number;
};

export type LoadingState = {
  active: boolean;
  label: string;
  value: number;
  history: readonly LoadingStep[];
};

export type TutorialState = {
  index: number;
  total: number;
  step: TutorialStep | null;
};

export type TutorialAlignmentCheck = {
  id: string;
  index: number;
  title: string;
  target: string;
  targetKind: 'hero' | 'objective' | 'enemy' | 'door' | 'extraction' | 'scene' | 'unknown';
  grade: AssetQualityGrade;
  targetExists: boolean;
  textEndsWithCadet: boolean;
  requiredKeywords: readonly string[];
  missingKeywords: readonly string[];
  targetPoint: Vec2 | null;
  focusPoint: Vec2 | null;
  focusDistance: number | null;
  cameraDistance: number | null;
  notes: readonly string[];
};

export type CinematicFocusState = {
  active: boolean;
  target: string | null;
  remainingMs: number;
  focusPoint: Vec2 | null;
  cameraPosition: { x: number; y: number; z: number };
};

export type CompletionStats = {
  active: boolean;
  elapsedSeconds: number;
  objectivesCompleted: number;
  objectivesTotal: number;
  alerts: number;
  performanceProfile: PerformanceProfile;
  triumphantCue: boolean;
};

export type TesterState = {
  phase: Phase;
  levelId: string;
  missionCatalog: readonly LevelCatalogEntry[];
  selectedHero: string;
  settings: GameSettings;
  audio: AudioState;
  loading: LoadingState;
  tutorial: TutorialState;
  cinematicFocus: CinematicFocusState;
  completion: CompletionStats;
  playerPosition: Vec2;
  objectives: { collectedRequired: number; totalRequired: number; exitUnlocked: boolean };
  doors: readonly { id: string; open: boolean; progress: number }[];
  renderer: RendererMetrics;
  framePacing: FramePacingSample;
  memory: MemoryMetrics;
  assetQuality: readonly AssetQualityCheck[];
  geometry: GeometryDiagnostics;
  titleComposition: TitleComposition;
  tutorialAlignment: readonly TutorialAlignmentCheck[];
};
