import { copyFile, mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { basename } from 'node:path';
import packageInfo from '../package.json';
import { levels } from '../src/game/levels';
import type { DoorDefinition as GameDoorDefinition, LevelDefinition as GameLevelDefinition, LevelZoneDefinition as GameLevelZoneDefinition, MissionGuidanceState, RectSpec as GameRectSpec, Vec2 as GameVec2 } from '../src/game/types';

const date = process.env.QA_DATE ?? '2026-06-20';
const outputDir = process.env.TESTER_REPORT_DIR ?? `docs/qa/${date}/v${packageInfo.version}`;
const smokeDir = process.env.SMOKE_SCREENSHOT_DIR ?? `artifacts/smoke/v${packageInfo.version}`;
const playthroughReportPath = process.env.PLAYTHROUGH_REPORT_PATH ?? `artifacts/playthrough/v${packageInfo.version}/playthrough-report.json`;
const playthroughMatrixPath = process.env.PLAYTHROUGH_MATRIX_PATH ?? `artifacts/playthrough/v${packageInfo.version}/matrix.json`;
const failureRetryReportPath = process.env.FAILURE_RETRY_REPORT_PATH ?? `artifacts/failure-retry/v${packageInfo.version}/failure-retry-report.json`;
const fpsMetricsPath = process.env.FPS_METRICS_PATH ?? `artifacts/fps/v${packageInfo.version}/metrics.json`;
const reportPath = `${outputDir}/game-tester-report.md`;
const committedMetricsPath = `${outputDir}/metrics.json`;
const committedPlaythroughPath = `${outputDir}/playthrough-report.json`;
const committedPlaythroughMatrixPath = `${outputDir}/playthrough-matrix.json`;
const playthroughEvidenceDir = `${outputDir}/playthroughs`;
const committedFailureRetryPath = `${outputDir}/failure-retry-report.json`;
const titleCompositionPath = `${outputDir}/title-composition.json`;
const gameplayCameraPath = `${outputDir}/gameplay-camera.json`;
const gameplayViewDensityPath = `${outputDir}/gameplay-view-density.json`;
const missionGuidancePath = `${outputDir}/mission-guidance.json`;
const tutorialAlignmentPath = `${outputDir}/tutorial-alignment.json`;
const missionCatalogPath = `${outputDir}/mission-catalog.json`;
const missionReadinessPath = `${outputDir}/mission-readiness.json`;
const operativeTraitsPath = `${outputDir}/operative-traits.json`;
const screenshotDir = `${outputDir}/screenshots`;
const fpsSceneDir = `${outputDir}/fps`;
const aaaReadyZoneFootprintRatio = 0.2;
const aaaReadyLevelFootprintRatio = 0.18;
const wallRunEpsilon = 0.08;
const expectedScreenshots = [
  'title.png',
  'title-orbit-preview.png',
  'settings.png',
  'hero-select.png',
  'loading-level-one.png',
  'tutorial-01-insertion.png',
  'tutorial-02-keycard.png',
  'tutorial-03-terminal.png',
  'tutorial-04-sentry.png',
  'tutorial-05-extraction.png',
  'gameplay-level-one.png',
  'focus-lobby-door.png',
  'focus-server-door.png',
  'gameplay-command-codes.png',
  'focus-extraction-door.png',
  'complete.png',
  'caught-sentry.png',
  'retry-loading.png',
  'retry-tutorial-reset.png',
] as const;

type FpsGateMetric = {
  targetFrameMs: number;
  toleranceMs: number;
  maxP95FrameMs: number;
  baselineOverheadBudgetMs?: number;
  baselineP95OverheadBudgetMs?: number;
  frameOverheadMs?: number;
  p95OverheadMs?: number;
  browserBaselineHeadroomMs?: number;
  gameHeadroomMs?: number;
  strictTargetMet: boolean;
  browserCanProve60: boolean;
  tracksBaseline: boolean;
  status: 'pass' | 'environment-limited' | 'fail';
  performanceProfile?: string;
  sceneCount?: number;
  failingScenes?: readonly string[];
  environmentLimitedScenes?: readonly string[];
};

type RenderBudgetMetric = {
  performanceProfile?: string;
  grade: string;
  maxDrawCalls: number;
  maxTriangles: number;
  maxGeometries: number;
  maxTextures: number;
  maxPixelRatio: number;
  shadowsAllowed: boolean;
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
  pixelRatio: number;
  shadowsEnabled: boolean;
  drawCallHeadroom: number;
  triangleHeadroom: number;
  geometryHeadroom: number;
  textureHeadroom: number;
  pixelRatioHeadroom: number;
  notes: readonly string[];
};

type Metrics = {
  levelId?: string;
  missionCatalog?: readonly LevelCatalogEntry[];
  framePacing?: { fps: number; frameMs: number; latestFrameMs?: number; p95FrameMs: number; samples: number };
  browserBaseline?: { fps: number; frameMs: number; latestFrameMs?: number; p95FrameMs: number; samples: number };
  fpsGate?: FpsGateMetric;
  fpsScenes?: readonly FpsSceneMetric[];
  renderer?: {
    performanceProfile?: string;
    shadowsEnabled?: boolean;
    shadowMapSize?: number;
    drawCalls: number;
    triangles: number;
    geometries: number;
    textures: number;
    pixelRatio?: number;
  };
  renderBudget?: RenderBudgetMetric;
  memory?: {
    loadedAssets: number;
    characterAssets: number;
    staticAssets: number;
    loadedAssetIds: readonly string[];
    failedAssetIds?: readonly string[];
    assetAudit?: readonly RuntimeAssetAudit[];
  };
  audio?: AudioState;
  assetQuality?: readonly AssetQualityCheck[];
  geometry?: GeometryDiagnostics;
  titleComposition?: TitleComposition;
  gameplayCamera?: GameplayCameraState;
  gameplayViewDensity?: GameplayViewDensityState;
  missionGuidance?: MissionGuidanceState;
  operative?: OperativeReportState;
  tutorialAlignment?: readonly TutorialAlignmentCheck[];
  loading?: LoadingState;
  settings?: { debug: boolean; muted: boolean; performanceProfile: string };
};

type FpsSceneMetric = {
  id: string;
  label: string;
  phase: string;
  screenshot: string;
  framePacing: { fps: number; frameMs: number; latestFrameMs?: number; p95FrameMs: number; samples: number };
  renderer: {
    performanceProfile?: string;
    shadowsEnabled?: boolean;
    shadowMapSize?: number;
    drawCalls: number;
    triangles: number;
    geometries: number;
    textures: number;
    pixelRatio?: number;
  };
  renderBudget?: RenderBudgetMetric;
  audioTrack?: AudioState['activeTrack'];
  titleComposition?: TitleComposition;
  fpsGate: FpsGateMetric;
};

type LoadingStep = {
  label: string;
  value: number;
  elapsedMs: number;
};

type GameplayCameraState = {
  active: boolean;
  readable: boolean;
  cameraPosition: { x: number; y: number; z: number };
  cameraTarget: { x: number; y: number; z: number };
  cameraDistance: number;
  playerScreenBounds?: ScreenBounds;
  playerScreenOccupancy: number;
  playerScreenHeightRatio: number;
  notes: readonly string[];
};

type GameplayViewDensityObject = {
  id: string;
  category: string;
  distanceFromPlayer: number;
  screenOccupancy: number;
  screenBounds: ScreenBounds;
  bounds: Bounds3;
};

type GameplayViewDensityBand = {
  id: 'near' | 'mid' | 'far';
  label: string;
  minDistance: number;
  maxDistance: number;
  grade: 'pass' | 'review' | 'fail';
  visibleObjectCount: number;
  tacticalCategoryCount: number;
  screenOccupancy: number;
  negativeSpaceRatio?: number;
  minVisibleObjects: number;
  minTacticalCategories: number;
  minScreenOccupancy: number;
  maxNegativeSpaceRatio?: number;
  objects: readonly GameplayViewDensityObject[];
  notes: readonly string[];
};

type GameplayViewDensityState = {
  active: boolean;
  grade: 'pass' | 'review' | 'fail';
  screenshot: string;
  cameraPosition: { x: number; y: number; z: number };
  playerPosition: { x: number; z: number };
  bands: readonly GameplayViewDensityBand[];
  notes: readonly string[];
};

type LoadingState = {
  active: boolean;
  label: string;
  value: number;
  history: readonly LoadingStep[];
};

type FailureRetryStateSummary = {
  phase: string;
  alerts: number;
  playerPosition: { x: number; z: number };
  playerStartDistance: number;
  objectives: { collectedRequired: number; totalRequired: number; exitUnlocked: boolean };
  doors: readonly { id: string; open: boolean; progress: number }[];
  audio: AudioState;
  sentryAssetLoaded: boolean;
  enemyQualityCount: number;
  panelText: string;
  loadingHistoryCount: number;
};

type FailureRetryReport = {
  build: string;
  levelId: string;
  contactEnemy?: { id: string; position: { x: number; z: number }; detectionRadius?: number };
  caught: FailureRetryStateSummary;
  retry: FailureRetryStateSummary;
  screenshots: readonly string[];
  pageErrors: readonly string[];
  consoleIssues: readonly string[];
};

type PlaythroughMatrixEntry = {
  levelId: string;
  reportPath: string;
  status: 'pass' | 'fail';
  reportCopied?: boolean;
  committedReportPath?: string;
  committedScreenshotDir?: string;
  screenshotCount?: number;
  missingScreenshots?: readonly string[];
};

type PlaythroughMatrix = {
  build: string;
  generatedAt?: string;
  levels: readonly PlaythroughMatrixEntry[];
};

type MissionReadinessArtifact = {
  build: string;
  generatedAt: string;
  thresholds: {
    levelFootprintRatio: number;
    zoneFootprintRatio: number;
    wallRunEpsilon: number;
  };
  summary: {
    missions: number;
    pass: number;
    review: number;
    fail: number;
  };
  missions: readonly MissionReadinessEntry[];
};

type MissionReadinessEntry = {
  levelId: string;
  name: string;
  chapter: string;
  grade: 'pass' | 'review' | 'fail';
  catalogKnown: boolean;
  dimensions: {
    width: number;
    depth: number;
    floorArea: number;
  };
  counts: {
    walls: number;
    doors: number;
    blockers: number;
    setDressing: number;
    zones: number;
    requiredObjectives: number;
    enemies: number;
    validationRoutePoints: number;
    tutorialSteps: number;
  };
  density: {
    grade: 'pass' | 'review' | 'fail';
    footprintArea: number;
    footprintRatio: number;
    zones: readonly MissionZoneReadiness[];
  };
  wallRuns: readonly MissionWallRunReadiness[];
  playthrough: {
    grade: 'pass' | 'review' | 'fail';
    status: 'pass' | 'fail' | 'missing';
    committedReportPath?: string;
    screenshotCount: number;
    missingScreenshots: readonly string[];
  };
  route: {
    grade: 'pass' | 'review' | 'fail';
    outOfBoundsPoints: readonly GameVec2[];
  };
  unlocks: {
    grade: 'pass' | 'review' | 'fail';
    missingDoors: readonly string[];
    missingObjectives: readonly string[];
  };
  findings: readonly string[];
};

type MissionZoneReadiness = {
  id: string;
  label: string;
  grade: 'pass' | 'review' | 'fail';
  floorArea: number;
  footprintArea: number;
  footprintRatio: number;
  landmarkCount: number;
  expectedLandmarkCount: number;
  interactableCount: number;
  screenshot?: string;
  findings: readonly string[];
};

type MissionWallRunReadiness = {
  id: string;
  axis: 'x' | 'z';
  line: number;
  grade: 'pass' | 'review' | 'fail';
  doors: readonly string[];
  wallIntervals: readonly MissionInterval[];
  doorIntervals: readonly MissionInterval[];
  doorToWallGaps: readonly MissionDoorWallGap[];
  doorToDoorSpans: readonly MissionDoorSpanOwnership[];
  findings: readonly string[];
};

type MissionInterval = {
  id: string;
  min: number;
  max: number;
};

type MissionDoorWallGap = {
  doorId: string;
  side: 'before' | 'after';
  fromId?: string;
  toId?: string;
  gap: number;
};

type MissionDoorSpanOwnership = {
  previousDoorId: string;
  nextDoorId: string;
  spanMin: number;
  spanMax: number;
  spanWidth: number;
  ownerIds: readonly string[];
  largestGap: number;
  grade: 'pass' | 'review' | 'fail';
};

type BrowserPlaythroughReport = {
  build: string;
  levelId: string;
  heroId?: string;
  routePoints?: readonly unknown[];
  interactions?: readonly unknown[];
  finalState?: unknown;
  screenshots?: readonly string[];
};

type AudioState = {
  activeTrack: 'title' | 'loading' | 'gameplay' | 'complete' | null;
  muted: boolean;
  unlocked: boolean;
};

type LevelCatalogEntry = {
  id: string;
  name: string;
  chapter: string;
  objectiveCount: number;
  enemyCount: number;
};

type MissionCatalogArtifact = {
  selectedMissionId?: string;
  missions?: readonly LevelCatalogEntry[];
  missionBrief?: string;
};

type OperativeReportState = {
  selectedId: string;
  name: string;
  role: string;
  assetAuditId: string;
  traitIds: readonly string[];
  traitSummary?: readonly string[];
  base: Record<string, number>;
  effective: Record<string, number>;
  changedScalars: readonly string[];
  traits: readonly {
    id: string;
    label: string;
    mechanic: string;
    applied: boolean;
    scalar: string;
    baseValue: number;
    effectiveValue: number;
    delta: number;
  }[];
  probes: readonly {
    id: string;
    traitId: string;
    mechanic: string;
    grade: 'pass' | 'review' | 'fail';
    expectedDelta: number;
    actualDelta: number;
    tolerance: number;
  }[];
};

type OperativeCatalogReportEntry = {
  id: string;
  name: string;
  role: string;
  assetAuditId: string;
  traitIds: readonly string[];
  traitSummary?: readonly string[];
  base: Record<string, number>;
  effective: Record<string, number>;
  changedScalars: readonly string[];
};

type OperativeTraitsArtifact = {
  selected?: OperativeReportState;
  catalog?: readonly OperativeCatalogReportEntry[];
};

type TutorialAlignmentCheck = {
  screenshot?: string;
  id: string;
  index: number;
  title: string;
  target: string;
  targetKind: string;
  grade: 'pass' | 'review' | 'fail';
  targetExists: boolean;
  textEndsWithCadet: boolean;
  requiredKeywords: readonly string[];
  missingKeywords: readonly string[];
  targetPoint: { x: number; z: number } | null;
  focusPoint: { x: number; z: number } | null;
  focusDistance: number | null;
  cameraDistance: number | null;
  notes: readonly string[];
};

type TitleComposition = {
  active: boolean;
  heroVisible: boolean;
  heroReadable: boolean;
  levelPreviewVisible?: boolean;
  facingDot: number;
  heroYaw: number;
  yawToCamera: number;
  cameraDistance: number;
  orbitAngle?: number;
  orbitRadius?: number;
  heroScreenOccupancy?: number;
  heroScreenHeightRatio?: number;
  identityReadable?: boolean;
  identityAnchors?: readonly TitleIdentityAnchor[];
  heroPosition?: { x: number; y: number; z: number };
  heroScreenBounds?: ScreenBounds;
  cameraPosition: { x: number; y: number; z: number };
  cameraTarget: { x: number; y: number; z: number };
  levelPreviewBounds?: Bounds3;
  titleTreatment?: TitleTreatmentState;
  notes: readonly string[];
};

type TitleTreatmentState = {
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

type TitleIdentityAnchor = {
  id: string;
  label: string;
  source: string;
  worldPosition: { x: number; y: number; z: number };
  screenPosition?: ScreenPoint;
  visible: boolean;
  uiOccluded: boolean;
  notes: readonly string[];
};

type ScreenBounds = {
  min: { x: number; y: number };
  max: { x: number; y: number };
  size: { x: number; y: number };
  center: { x: number; y: number };
  viewport: { width: number; height: number };
  widthRatio: number;
  heightRatio: number;
  areaRatio: number;
};

type ScreenPoint = {
  x: number;
  y: number;
  visible: boolean;
  viewport: { width: number; height: number };
};

type AssetQualityCheck = {
  id: string;
  label: string;
  category: string;
  grade: 'pass' | 'review' | 'fail';
  visible: boolean;
  grounded: boolean;
  position?: { x: number; y: number; z: number };
  bounds?: { minY: number; maxY: number; height: number; width?: number; depth?: number };
  notes: readonly string[];
};

type RuntimeAssetAudit = {
  id: string;
  label: string;
  kind: string;
  requirement: 'required' | 'optional';
  source: string;
  path: string;
  expectedFormat: string;
  fallbackPolicy: string;
  loaded: boolean;
  failed: boolean;
  failure?: string;
  fallbackVisible: boolean;
  grade: 'pass' | 'review' | 'fail';
  notes: readonly string[];
};

type Bounds3 = {
  min: { x: number; y: number; z: number };
  max: { x: number; y: number; z: number };
  size: { x: number; y: number; z: number };
};

type DoorCoordinateGap = {
  id: string;
  label: string;
  axis: 'x' | 'z';
  fromId: string;
  toId: string;
  fromEdge: number;
  toEdge: number;
  gap: number;
};

type DoorCoordinateCheck = {
  id: string;
  axis: 'x' | 'z';
  grade: 'pass' | 'review' | 'fail';
  epsilon: number;
  wallIds: readonly string[];
  openingBounds: Bounds3;
  frameBounds?: Bounds3;
  continuityBounds?: Bounds3;
  renderedDoorBounds?: Bounds3;
  gaps: readonly DoorCoordinateGap[];
  notes: readonly string[];
};

type WallRunInterval = {
  id: string;
  kind: 'wall' | 'door-opening' | 'door-frame' | 'door-continuity';
  min: number;
  max: number;
  bounds: Bounds3;
};

type WallRunConnectionEdge = {
  id: string;
  fromId: string;
  toId: string;
  axis: 'x' | 'z';
  state: 'touches' | 'overlaps' | 'covered-by-priority-surface' | 'void';
  fromEdge: number;
  toEdge: number;
  gap: number;
  ownerId?: string;
  notes: readonly string[];
};

type DoorToDoorOwnershipCheck = {
  id: string;
  wallLineId: string;
  previousDoorId: string;
  previousDoorMax: number;
  nextDoorId: string;
  nextDoorMin: number;
  spanWidth: number;
  ownerId?: string;
  ownerType?: WallRunInterval['kind'];
  ownerMin?: number;
  ownerMax?: number;
  depthMatch: boolean;
  closedPriority: string;
  openPriority: string;
  grade: 'pass' | 'review' | 'fail';
  notes: readonly string[];
};

type WallRunCameraProbe = {
  id: string;
  wallLineId: string;
  screenshot: string;
  screenRegion: ScreenBounds;
  rayOrigin: { x: number; y: number; z: number };
  rayDirection: { x: number; y: number; z: number };
  expectedOwnerIds: readonly string[];
  actualFirstHitId?: string;
  actualOwnerId?: string;
  actualFirstHitDistance?: number;
  visibleVoid: boolean;
  grade: 'pass' | 'review' | 'fail';
  notes: readonly string[];
};

type WallRunContinuityCheck = {
  id: string;
  axis: 'x' | 'z';
  line: number;
  grade: 'pass' | 'review' | 'fail';
  epsilon: number;
  intervals: readonly WallRunInterval[];
  connections?: readonly WallRunConnectionEdge[];
  doorOwnership?: readonly DoorToDoorOwnershipCheck[];
  cameraProbes?: readonly WallRunCameraProbe[];
  gaps: readonly DoorCoordinateGap[];
  notes: readonly string[];
};

type SetDressingVisibilityCheck = {
  id: string;
  asset: string;
  grade: 'pass' | 'review' | 'fail';
  loaded: boolean;
  visible: boolean;
  grounded: boolean;
  authoredBounds: Bounds3;
  renderedBounds?: Bounds3;
  footprintCoverage: number;
  notes: readonly string[];
};

type GeometryDiagnostics = {
  objectBounds: readonly { id: string; category: string; visible: boolean; bounds: Bounds3 }[];
  setDressingVisibility?: readonly SetDressingVisibilityCheck[];
  doorContinuity: readonly DoorCoordinateCheck[];
  wallRunContinuity?: readonly WallRunContinuityCheck[];
  levelDensity: {
    grade: 'pass' | 'review' | 'fail';
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
};

type LevelZoneDensityCheck = {
  id: string;
  label: string;
  grade: 'pass' | 'review' | 'fail';
  bounds: { min: { x: number; z: number }; max: { x: number; z: number } };
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

const metrics = existsSync(fpsMetricsPath)
  ? JSON.parse(await readFile(fpsMetricsPath, 'utf8')) as Metrics
  : null;
const playthroughReport = existsSync(playthroughReportPath)
  ? await readFile(playthroughReportPath, 'utf8')
  : null;
const playthrough = playthroughReport ? JSON.parse(playthroughReport) : null;
const playthroughMatrixReport = existsSync(playthroughMatrixPath)
  ? await readFile(playthroughMatrixPath, 'utf8')
  : null;
const playthroughMatrix = playthroughMatrixReport ? JSON.parse(playthroughMatrixReport) as PlaythroughMatrix : null;
const committedPlaythroughMatrix = playthroughMatrix
  ? await commitPlaythroughMatrixEvidence(playthroughMatrix, playthroughEvidenceDir)
  : null;
const failureRetryReport = existsSync(failureRetryReportPath)
  ? await readFile(failureRetryReportPath, 'utf8')
  : null;
const failureRetry = failureRetryReport ? JSON.parse(failureRetryReport) as FailureRetryReport : null;
const missionCatalogArtifact = existsSync(missionCatalogPath)
  ? JSON.parse(await readFile(missionCatalogPath, 'utf8')) as MissionCatalogArtifact
  : null;
const operativeTraitsArtifact = existsSync(operativeTraitsPath)
  ? JSON.parse(await readFile(operativeTraitsPath, 'utf8')) as OperativeTraitsArtifact
  : null;
const titleComposition = existsSync(titleCompositionPath)
  ? JSON.parse(await readFile(titleCompositionPath, 'utf8')) as TitleComposition
  : metrics?.titleComposition;
const gameplayCamera = existsSync(gameplayCameraPath)
  ? JSON.parse(await readFile(gameplayCameraPath, 'utf8')) as GameplayCameraState
  : metrics?.gameplayCamera ?? (playthrough?.finalState?.gameplayCamera as GameplayCameraState | undefined);
const gameplayViewDensity = existsSync(gameplayViewDensityPath)
  ? JSON.parse(await readFile(gameplayViewDensityPath, 'utf8')) as GameplayViewDensityState
  : metrics?.gameplayViewDensity ?? (playthrough?.finalState?.gameplayViewDensity as GameplayViewDensityState | undefined);
const missionGuidance = existsSync(missionGuidancePath)
  ? JSON.parse(await readFile(missionGuidancePath, 'utf8')) as MissionGuidanceState
  : metrics?.missionGuidance ?? (playthrough?.finalState?.missionGuidance as MissionGuidanceState | undefined);
const tutorialAlignment = existsSync(tutorialAlignmentPath)
  ? JSON.parse(await readFile(tutorialAlignmentPath, 'utf8')) as readonly TutorialAlignmentCheck[]
  : metrics?.tutorialAlignment ?? [];
const completion = playthrough?.finalState?.completion;
const frame = metrics?.framePacing;
const baseline = metrics?.browserBaseline;
const fpsGate = metrics?.fpsGate;
const fpsScenes = metrics?.fpsScenes ?? [];
const renderer = metrics?.renderer;
const renderBudget = metrics?.renderBudget;
const memory = metrics?.memory;
const assetAudit = memory?.assetAudit ?? [];
const assetQuality = metrics?.assetQuality ?? [];
const geometry = metrics?.geometry ?? (playthrough?.finalState?.geometry as GeometryDiagnostics | undefined);
const loading = metrics?.loading ?? (playthrough?.finalState?.loading as LoadingState | undefined);
const settings = metrics?.settings;
const metricAudio = metrics?.audio;
const completionAudio = playthrough?.finalState?.audio as AudioState | undefined;
const playthroughSettings = playthrough?.finalState?.settings as { debug: boolean; muted: boolean; performanceProfile: string } | undefined;
const missionCatalog = missionCatalogArtifact?.missions ?? metrics?.missionCatalog ?? playthrough?.finalState?.missionCatalog ?? [];
const selectedMissionId = missionCatalogArtifact?.selectedMissionId ?? metrics?.levelId ?? playthrough?.finalState?.levelId;
const selectedMission = levels.find((level) => level.id === selectedMissionId);
const missionBrief = missionCatalogArtifact?.missionBrief;
const operative = (operativeTraitsArtifact?.selected ?? metrics?.operative ?? playthrough?.finalState?.operative) as OperativeReportState | undefined;
const operativeCatalog = operativeTraitsArtifact?.catalog ?? [];
const missionReadiness = buildMissionReadiness(levels, missionCatalog, committedPlaythroughMatrix);
const frameFinding = describeFrameFinding(frame, baseline, fpsGate, fpsScenes);
const renderBudgetFindings = describeRenderBudgetFindings(renderBudget, fpsScenes);
const missionCatalogFindings = describeMissionCatalogFindings(missionCatalog, selectedMissionId, missionBrief);
const missionReadinessFindings = describeMissionReadinessFindings(missionReadiness);
const playthroughMatrixFindings = describePlaythroughMatrixFindings(committedPlaythroughMatrix, missionCatalog);
const operativeFindings = describeOperativeFindings(operative, operativeCatalog);
const assetAuditFindings = describeAssetAuditFindings(assetAudit);
const assetFindings = describeAssetFindings(assetQuality);
const geometryFindings = describeGeometryFindings(geometry);
const titleFindings = describeTitleFindings(titleComposition);
const gameplayCameraFindings = describeGameplayCameraFindings(gameplayCamera);
const gameplayViewDensityFindings = describeGameplayViewDensityFindings(gameplayViewDensity);
const missionGuidanceFindings = describeMissionGuidanceFindings(missionGuidance, selectedMission);
const tutorialFindings = describeTutorialFindings(tutorialAlignment);
const audioFindings = describeAudioFindings(metricAudio, completionAudio, settings, playthroughSettings);
const failureRetryFindings = describeFailureRetryFindings(failureRetry);
const screenshotCoverage = await inspectScreenshotCoverage(screenshotDir);
const screenshotFindings = describeScreenshotFindings(screenshotCoverage);

await mkdir(outputDir, { recursive: true });
await copyFpsSceneScreenshots(fpsScenes, fpsSceneDir);
if (metrics) {
  await writeFile(committedMetricsPath, JSON.stringify(metrics, null, 2));
}
if (playthroughReport) {
  await writeFile(committedPlaythroughPath, playthroughReport);
}
if (committedPlaythroughMatrix) {
  await writeFile(committedPlaythroughMatrixPath, JSON.stringify(committedPlaythroughMatrix, null, 2));
}
if (failureRetryReport) {
  await writeFile(committedFailureRetryPath, failureRetryReport);
}
await writeFile(missionReadinessPath, JSON.stringify(missionReadiness, null, 2));
await writeFile(reportPath, `# Shadow Recruit 2 Game Tester Report

Build: v${packageInfo.version}
Date: ${date}

## Evidence

- Smoke screenshots: \`${smokeDir}\`
- Browser playthrough: \`${committedPlaythroughPath}\` (${playthroughReport ? 'captured' : 'not captured'})
- Browser playthrough matrix: \`${committedPlaythroughMatrixPath}\` (${committedPlaythroughMatrix ? formatPlaythroughMatrixSummary(committedPlaythroughMatrix) : 'not captured'})
- Failure/retry route: \`${committedFailureRetryPath}\` (${failureRetryReport ? 'captured' : 'not captured'})
- Committed screenshots: \`${screenshotDir}\`
- FPS metrics: \`${committedMetricsPath}\`
- Mission catalog evidence: \`${missionCatalogPath}\` (${missionCatalogArtifact ? 'captured' : 'not captured'})
- Mission readiness matrix: \`${missionReadinessPath}\` (${formatMissionReadinessSummary(missionReadiness)})
- Operative trait evidence: \`${operativeTraitsPath}\` (${operativeTraitsArtifact ? 'captured' : 'not captured'})
- Gameplay view density evidence: \`${gameplayViewDensityPath}\` (${gameplayViewDensity ? 'captured' : 'not captured'})
- Mission guidance evidence: \`${missionGuidancePath}\` (${missionGuidance ? 'captured' : 'not captured'})
- Screenshot coverage: ${screenshotCoverage.present.length}/${expectedScreenshots.length} expected captures present (${formatKb(screenshotCoverage.totalBytes)})
- Metrics available: ${metrics ? 'yes' : 'no'}
- Mission catalog: ${formatMissionCatalogSummary(missionCatalog, selectedMissionId, missionBrief)}
- Operative traits: ${formatOperativeSummary(operative, operativeCatalog)}
- Game frame pacing: ${frame ? `${frame.fps.toFixed(1)} FPS, ${frame.frameMs.toFixed(1)} ms median, ${(frame.latestFrameMs ?? frame.frameMs).toFixed(1)} ms latest, ${frame.p95FrameMs.toFixed(1)} ms p95, ${frame.samples} samples` : 'not captured'}
- Browser baseline: ${baseline ? `${baseline.fps.toFixed(1)} FPS, ${baseline.frameMs.toFixed(1)} ms median, ${baseline.p95FrameMs.toFixed(1)} ms p95, ${baseline.samples} samples` : 'not captured'}
- FPS gate: ${fpsGate ? `${fpsGate.status}; profile=${fpsGate.performanceProfile ?? settings?.performanceProfile ?? 'unknown'}; strictTarget=${fpsGate.strictTargetMet}; browserCanProve60=${fpsGate.browserCanProve60}; tracksBaseline=${fpsGate.tracksBaseline}; overhead=${formatMs(fpsGate.frameOverheadMs)} median/${formatMs(fpsGate.p95OverheadMs)} p95; headroom=${formatMs(fpsGate.gameHeadroomMs)} game/${formatMs(fpsGate.browserBaselineHeadroomMs)} browser` : 'not captured'}
- FPS scene matrix: ${formatFpsSceneSummary(fpsScenes)}
- Renderer metrics: ${renderer ? `${renderer.drawCalls} draw calls, ${renderer.triangles} triangles, ${renderer.geometries} geometries, ${renderer.textures} textures, pixelRatio=${renderer.pixelRatio ?? 'unknown'}, profile=${renderer.performanceProfile ?? settings?.performanceProfile ?? 'unknown'}, shadows=${renderer.shadowsEnabled ?? 'unknown'}, shadowMap=${renderer.shadowMapSize ?? 'unknown'}` : 'not captured'}
- Render budget: ${formatRenderBudgetSummary(renderBudget)}
- Loaded assets: ${memory ? `${memory.loadedAssets} total (${memory.characterAssets} character, ${memory.staticAssets} static): ${memory.loadedAssetIds.join(', ')}${memory.failedAssetIds?.length ? `; failed optional assets: ${memory.failedAssetIds.join(', ')}` : ''}` : 'not captured'}
- Runtime asset audit: ${assetAudit.length > 0 ? describeAssetAuditSummary(assetAudit) : 'not captured'}
- Audio state: gameplay metrics=${formatAudioState(metricAudio)}; completion playthrough=${formatAudioState(completionAudio)}
- Asset grades: ${assetQuality.length > 0 ? describeAssetSummary(assetQuality) : 'not captured'}
- Loading state: ${loading ? `${loading.history.length} steps; latest="${loading.label}" ${(loading.value * 100).toFixed(0)}%; captured=${loading.history.map((step) => `${step.label}:${(step.value * 100).toFixed(0)}%`).join(' -> ')}` : 'not captured'}
- Tutorial alignment: ${describeTutorialSummary(tutorialAlignment)}
- Title composition: ${titleComposition ? `heroReadable=${titleComposition.heroReadable}; identityReadable=${titleComposition.identityReadable ?? false}; levelPreview=${Boolean(titleComposition.levelPreviewVisible)}; facingDot=${titleComposition.facingDot}; cameraDistance=${titleComposition.cameraDistance}; screenHeight=${formatRatio(titleComposition.heroScreenHeightRatio)}; screenOccupancy=${formatRatio(titleComposition.heroScreenOccupancy)}; screenBounds=${formatScreenBounds(titleComposition.heroScreenBounds)}; anchors=${formatTitleAnchorSummary(titleComposition)}; orbitAngle=${titleComposition.orbitAngle ?? 'unknown'}; orbitRadius=${titleComposition.orbitRadius ?? 'unknown'}; heroYaw=${titleComposition.heroYaw}; yawToCamera=${titleComposition.yawToCamera}` : 'not captured'}
- Title treatment: ${titleComposition?.titleTreatment ? `wordmarkReadable=${titleComposition.titleTreatment.wordmarkReadable}; text="${titleComposition.titleTreatment.wordmarkText}"; kicker="${titleComposition.titleTreatment.kickerText}"; bounds=${formatScreenBounds(titleComposition.titleTreatment.wordmarkBounds)}; panelOverlap=${formatRatio(titleComposition.titleTreatment.panelOverlapRatio)}; heroOverlap=${formatRatio(titleComposition.titleTreatment.heroOverlapRatio)}` : 'not captured'}
- Gameplay camera: ${formatGameplayCameraSummary(gameplayCamera)}
- Gameplay view density: ${formatGameplayViewDensitySummary(gameplayViewDensity)}
- Mission guidance: ${formatMissionGuidanceSummary(missionGuidance)}
- Geometry diagnostics: ${geometry ? `${geometry.objectBounds.length} object bounds; ${geometry.doorContinuity.length} door checks; ${geometry.wallRunContinuity?.length ?? 0} wall-run checks; levelDensity=${geometry.levelDensity.grade} (${(geometry.levelDensity.setDressingRatio * 100).toFixed(1)}%); aaaReady=${describeAaaDensitySummary(geometry)}; zones=${geometry.levelDensity.zones?.map((zone) => `${zone.id}:${zone.grade}:${(zone.totalFootprintRatio * 100).toFixed(1)}%`).join(', ') ?? 'not captured'}` : 'not captured'}
- Completion stats: ${completion ? `active=${completion.active}; objectives=${completion.objectivesCompleted}/${completion.objectivesTotal}; alerts=${completion.alerts}; cue=${completion.triumphantCue ? 'triumphant' : 'missing'}; elapsed=${completion.elapsedSeconds}s` : 'not captured'}
- Failure/retry evidence: ${formatFailureRetrySummary(failureRetry)}
- Settings state: ${settings ? `debug=${settings.debug}; muted=${settings.muted}; performance=${settings.performanceProfile}` : 'not captured'}

## Coordinate QA

${formatGeometryDiagnostics(geometry)}

## FPS Scene Matrix

${formatFpsSceneMatrix(fpsScenes, baseline)}

## Render Budget QA

${formatRenderBudget(renderBudget, fpsScenes)}

## Tutorial Alignment QA

${formatTutorialAlignment(tutorialAlignment)}

## Title Identity QA

${formatTitleIdentity(titleComposition)}

## Gameplay Camera QA

${formatGameplayCamera(gameplayCamera)}

## Active Gameplay View Density QA

${formatGameplayViewDensity(gameplayViewDensity)}

## Mission Guidance QA

${formatMissionGuidance(missionGuidance)}

## Operative Trait QA

${formatOperativeTraits(operative, operativeCatalog)}

## Mission Catalog QA

${formatMissionCatalog(missionCatalog, selectedMissionId, missionBrief)}

## Mission Readiness Matrix

${formatMissionReadiness(missionReadiness)}

## Browser Playthrough Matrix

${formatPlaythroughMatrix(committedPlaythroughMatrix, missionCatalog)}

## Wall-Run Interval QA

${formatWallRunContinuity(geometry)}

## Asset Grading

${formatAssetGrades(assetQuality)}

## Runtime Asset Provenance

${formatAssetAudit(assetAudit)}

## Failure And Retry QA

${formatFailureRetry(failureRetry)}

## Screenshot Coverage

${formatScreenshotCoverage(screenshotCoverage)}

## Tester Feedback

- Title flow: verify the native title treatment, cinematic scene, staged hero model, hero-select preview space, Start, Change Hero, and Settings are visible.
- Mission catalog: verify the player-facing mission selector is visible before mission start, reflects the active level, and exposes objective/enemy counts for future big levels.
- Tutorial: verify all five General Caldwell screenshots align with hero, keycard, terminal, sentry, and extraction targets, and every step ends with "Good luck, cadet."
- Level: verify keycard, terminal, command codes, sentries, extraction, wall/floor meshes, wall/floor texture quality, and all three door-focus screenshots are readable and properly grounded.
- Playthrough: verify the browser route uses the authored validation route, keyboard interaction, door-focus pauses, and extraction completion without sentry contact.
- Failure/retry: verify intentional sentry contact shows the operation-failed overlay, increments alerts, keeps the sentry GLB proven, and Retry returns to a clean mission start without carrying objectives, open doors, or alert count forward.
- Coordinate QA: verify door/wall continuity by edge coordinates, not screenshot impression alone. Wall gaps must name door ID, wall IDs, frame/continuity bounds, and measured gap widths.
- Screenshot-to-coordinate QA: verify any wallop, visible door-to-door hole, or odd wall patch is resolved to nearest adjacent door IDs, shared wall-line ID, between-door span, owner surface, projected coverage, and first-hit probe before approval.
- Camera QA: verify the normal gameplay screenshot is captured before objective interaction, with debug teleports snapping the closer gameplay camera to the current player position, proving player screen occupancy, and proving active-camera near/mid/far tactical density.
- Title and AAA design QA: verify the title hero faces or reads toward the player with projected face/visor/chest evidence, and verify large rooms contain player-camera AAA detail rather than broad empty floor and repeated walls.
- Guidance QA: verify the active HUD names the next required objective or extraction, exposes a distance and compass direction, and updates after each objective handoff.
- Asset QA: verify objective GLBs, sentry GLBs, cover/blocker GLBs, floor/wall meshes, floor/wall/object texture quality, door-panel clarity, wall-door gaps/seams, and extraction marker pass or have explicit review notes.
- Completion: verify triumphant cue starts and level stats appear.
- Performance: ${describePerformance(frame, baseline, fpsGate, fpsScenes)}
- Render budget: ${describeRenderBudgetSummary(renderBudget, fpsScenes)}

## Required Fixes

- P0: None recorded by generated report.
${frameFinding}
${renderBudgetFindings}
${operativeFindings}
${missionCatalogFindings}
${missionReadinessFindings}
${playthroughMatrixFindings}
${describeLoadingFindings(loading)}
${audioFindings}
${failureRetryFindings}
${assetAuditFindings}
${tutorialFindings}
${assetFindings}
${titleFindings}
${gameplayCameraFindings}
${gameplayViewDensityFindings}
${missionGuidanceFindings}
${geometryFindings}
${screenshotFindings}
`);

console.info(`[tester-report] wrote ${reportPath}`);

function formatOperativeSummary(
  operative: OperativeReportState | undefined,
  catalog: readonly OperativeCatalogReportEntry[],
): string {
  if (!operative) return 'not captured';
  const passCount = operative.probes.filter((probe) => probe.grade === 'pass').length;
  const contrastCount = catalog.filter((hero) => hero.changedScalars.length > 0).length;
  return `selected=${operative.selectedId}; asset=${operative.assetAuditId}; traits=${operative.traitIds.join(', ') || 'none'}; changed=${operative.changedScalars.join(', ') || 'none'}; probes=${passCount}/${operative.probes.length} pass; catalogChanged=${contrastCount}/${catalog.length}`;
}

function formatOperativeTraits(
  operative: OperativeReportState | undefined,
  catalog: readonly OperativeCatalogReportEntry[],
): string {
  if (!operative) return '- Operative trait diagnostics not captured.';
  const lines = [
    `- ${operative.traitIds.length > 0 ? 'PASS' : 'FAIL'} operative-selected: selected=${operative.selectedId}; asset=${operative.assetAuditId}; traits=${operative.traitIds.join(', ') || 'none'}`,
    `- ${operative.changedScalars.length > 0 ? 'PASS' : 'FAIL'} operative-scalars/${operative.selectedId}: base=${formatOperativeScalars(operative.base)}; effective=${formatOperativeScalars(operative.effective)}; changed=${operative.changedScalars.join(', ') || 'none'}`,
    ...operative.traits.map((trait) =>
      `- ${trait.applied ? 'PASS' : 'FAIL'} trait/${trait.id}: mechanic=${trait.mechanic}; scalar=${trait.scalar}; ${trait.baseValue}->${trait.effectiveValue}; delta=${trait.delta}`
    ),
    ...operative.probes.map((probe) =>
      `- ${probe.grade.toUpperCase()} trait-probe/${probe.id}: trait=${probe.traitId}; mechanic=${probe.mechanic}; expectedDelta=${probe.expectedDelta}; actualDelta=${probe.actualDelta}; tolerance=${probe.tolerance}`
    ),
  ];
  if (catalog.length > 0) {
    lines.push(...catalog.map((hero) =>
      `- ${hero.changedScalars.length > 0 || hero.id === 'shadow-operative' ? 'PASS' : 'REVIEW'} operative-catalog/${hero.id}: asset=${hero.assetAuditId}; traits=${hero.traitIds.join(', ') || 'none'}; changed=${hero.changedScalars.join(', ') || 'baseline'}`
    ));
  }
  return lines.join('\n');
}

function formatOperativeScalars(scalars: Record<string, number>): string {
  return Object.entries(scalars).map(([key, value]) => `${key}:${value}`).join(', ');
}

function describeOperativeFindings(
  operative: OperativeReportState | undefined,
  catalog: readonly OperativeCatalogReportEntry[],
): string {
  if (!operative) {
    return '- P1: Operative trait diagnostics missing; tester cannot prove hero selection changes gameplay mechanics.';
  }
  const findings: string[] = [];
  if (!operative.assetAuditId || operative.assetAuditId !== `hero:${operative.selectedId}`) {
    findings.push(`- P1: Selected operative ${operative.selectedId} does not link to its hero asset audit id: ${operative.assetAuditId}.`);
  }
  if (operative.traitIds.length === 0 || operative.traits.length === 0) {
    findings.push(`- P1: Selected operative ${operative.selectedId} has no trait diagnostics.`);
  }
  if (operative.changedScalars.length === 0) {
    findings.push(`- P1: Selected operative ${operative.selectedId} has no gameplay scalar delta from base mechanics.`);
  }
  for (const trait of operative.traits) {
    if (!trait.applied) {
      findings.push(`- P1: Operative trait ${trait.id} is advertised but not applied to ${trait.scalar}.`);
    }
  }
  if (operative.probes.length < operative.traitIds.length) {
    findings.push(`- P1: Selected operative ${operative.selectedId} has fewer deterministic mechanics probes than trait IDs.`);
  }
  for (const probe of operative.probes) {
    if (probe.grade !== 'pass') {
      findings.push(`- P1: Operative trait ${probe.traitId} is advertised but has no passing deterministic mechanics probe.`);
    }
  }
  if (catalog.length < 2) {
    findings.push('- P1: Operative catalog diagnostics need at least two operatives to prove hero selection is mechanically meaningful.');
  } else if (catalog.filter((hero) => hero.changedScalars.length > 0).length < 2) {
    findings.push('- P1: Operative catalog does not expose at least two non-default operatives with changed gameplay scalars.');
  }
  return findings.length > 0 ? findings.join('\n') : '- P1: None from generated operative trait diagnostics.';
}

function formatMissionCatalogSummary(
  catalog: readonly LevelCatalogEntry[],
  selectedMissionId: string | undefined,
  missionBrief: string | undefined,
): string {
  if (catalog.length === 0) return 'not captured';
  const selected = catalog.find((mission) => mission.id === selectedMissionId);
  const names = catalog.map((mission) => `${mission.id}(${mission.objectiveCount} objectives, ${mission.enemyCount} enemies)`).join(', ');
  return `selected=${selected?.name ?? selectedMissionId ?? 'missing'}; missions=${catalog.length}; ${names}${missionBrief ? '; hero-select brief captured' : ''}`;
}

function formatMissionCatalog(
  catalog: readonly LevelCatalogEntry[],
  selectedMissionId: string | undefined,
  missionBrief: string | undefined,
): string {
  if (catalog.length === 0) return '- Mission catalog diagnostics not captured.';
  const selected = catalog.find((mission) => mission.id === selectedMissionId);
  return [
    `- ${selected ? 'PASS' : 'FAIL'} mission-selected: selected=${selectedMissionId ?? 'missing'}; label=${selected?.name ?? 'missing'}; brief=${missionBrief ? JSON.stringify(missionBrief) : 'not captured'}`,
    ...catalog.map((mission) => `- PASS mission/${mission.id}: ${mission.chapter} / ${mission.name}; objectives=${mission.objectiveCount}; enemies=${mission.enemyCount}`),
  ].join('\n');
}

function formatPlaythroughMatrixSummary(matrix: PlaythroughMatrix): string {
  const passed = matrix.levels.filter((entry) => entry.status === 'pass').length;
  return `${passed}/${matrix.levels.length} mission browser playthroughs passed`;
}

function formatPlaythroughMatrix(
  matrix: PlaythroughMatrix | null,
  catalog: readonly LevelCatalogEntry[],
): string {
  if (!matrix) return '- Browser playthrough matrix not captured.';
  const catalogIds = new Set(catalog.map((mission) => mission.id));
  const rows = matrix.levels.map((entry) => {
    const known = catalogIds.size === 0 || catalogIds.has(entry.levelId);
    const copied = Boolean(entry.reportCopied && entry.committedReportPath);
    const screenshots = entry.screenshotCount ?? 0;
    const missing = entry.missingScreenshots?.length ?? 0;
    const status = entry.status === 'pass' && known && copied && screenshots > 0 && missing === 0 ? 'PASS' : 'FAIL';
    return `- ${status} playthrough/${entry.levelId}: status=${entry.status}; source=${entry.reportPath}; committed=${entry.committedReportPath ?? 'missing'}; screenshots=${screenshots}; missingScreenshots=${missing}; catalogKnown=${known}`;
  });
  return [
    `- Matrix build=${matrix.build}; generatedAt=${matrix.generatedAt ?? 'not captured'}; ${formatPlaythroughMatrixSummary(matrix)}`,
    ...rows,
  ].join('\n');
}

function describePlaythroughMatrixFindings(
  matrix: PlaythroughMatrix | null,
  catalog: readonly LevelCatalogEntry[],
): string {
  if (!matrix) {
    return catalog.length > 1
      ? '- P1: Browser playthrough matrix missing; tester cannot prove every registered mission completes in the browser.'
      : '- P1: None from generated browser playthrough matrix.';
  }

  const findings: string[] = [];
  const matrixIds = new Set(matrix.levels.map((entry) => entry.levelId));
  for (const mission of catalog) {
    if (!matrixIds.has(mission.id)) {
      findings.push(`- P1: Registered mission ${mission.id} is missing from the browser playthrough matrix.`);
    }
  }
  for (const entry of matrix.levels) {
    if (entry.status !== 'pass') {
      findings.push(`- P1: Browser playthrough matrix failed for ${entry.levelId}: status=${entry.status}; report=${entry.reportPath}.`);
    }
    if (!entry.reportCopied || !entry.committedReportPath) {
      findings.push(`- P1: Browser playthrough report for ${entry.levelId} was not copied into committed QA evidence from ${entry.reportPath}.`);
    }
    if ((entry.screenshotCount ?? 0) <= 0) {
      findings.push(`- P1: Browser playthrough screenshots for ${entry.levelId} were not copied into committed QA evidence.`);
    }
    if (entry.missingScreenshots?.length) {
      findings.push(`- P1: Browser playthrough ${entry.levelId} is missing screenshot files: ${entry.missingScreenshots.join(', ')}.`);
    }
    if (catalog.length > 0 && !catalog.some((mission) => mission.id === entry.levelId)) {
      findings.push(`- P1: Browser playthrough matrix includes ${entry.levelId}, but it is not exposed in the mission catalog.`);
    }
  }
  return findings.length > 0 ? findings.join('\n') : '- P1: None from generated browser playthrough matrix.';
}

async function commitPlaythroughMatrixEvidence(
  matrix: PlaythroughMatrix,
  targetRoot: string,
): Promise<PlaythroughMatrix> {
  const committedLevels: PlaythroughMatrixEntry[] = [];

  for (const entry of matrix.levels) {
    const levelDir = `${targetRoot}/${entry.levelId}`;
    const screenshotDir = `${levelDir}/screenshots`;
    const committedReportPath = `${levelDir}/playthrough-report.json`;
    const missingScreenshots: string[] = [];
    const committedScreenshots: string[] = [];

    if (!existsSync(entry.reportPath)) {
      committedLevels.push({
        ...entry,
        reportCopied: false,
        committedReportPath,
        committedScreenshotDir: screenshotDir,
        screenshotCount: 0,
        missingScreenshots: [`missing report: ${entry.reportPath}`],
      });
      continue;
    }

    await mkdir(screenshotDir, { recursive: true });
    const report = JSON.parse(await readFile(entry.reportPath, 'utf8')) as BrowserPlaythroughReport;

    for (const screenshot of report.screenshots ?? []) {
      if (!existsSync(screenshot)) {
        missingScreenshots.push(screenshot);
        continue;
      }
      const target = `${screenshotDir}/${basename(screenshot)}`;
      await copyFile(screenshot, target);
      committedScreenshots.push(target);
    }

    const committedReport: BrowserPlaythroughReport = {
      ...report,
      screenshots: committedScreenshots,
    };
    await writeFile(committedReportPath, JSON.stringify(committedReport, null, 2));
    committedLevels.push({
      ...entry,
      reportCopied: true,
      committedReportPath,
      committedScreenshotDir: screenshotDir,
      screenshotCount: committedScreenshots.length,
      missingScreenshots,
    });
  }

  return {
    ...matrix,
    levels: committedLevels,
  };
}

function describeMissionCatalogFindings(
  catalog: readonly LevelCatalogEntry[],
  selectedMissionId: string | undefined,
  missionBrief: string | undefined,
): string {
  if (catalog.length === 0) {
    return '- P1: Mission catalog diagnostics missing; tester cannot prove the player-facing mission selector is backed by level data.';
  }
  const selected = catalog.find((mission) => mission.id === selectedMissionId);
  const findings: string[] = [];
  if (!selected) {
    findings.push(`- P1: Selected mission ${selectedMissionId ?? 'missing'} is not present in the exposed mission catalog.`);
  }
  if (!missionBrief) {
    findings.push('- P1: Mission selector brief was not captured in the hero-select screenshot evidence.');
  } else if (!/required objectives/i.test(missionBrief) || !/sentries/i.test(missionBrief)) {
    findings.push(`- P1: Mission selector brief does not expose objective and enemy counts: ${JSON.stringify(missionBrief)}.`);
  } else {
    const leakedTerm = firstPlayerFacingInternalTerm(missionBrief);
    if (leakedTerm) {
      findings.push(`- P1: Mission selector brief leaks implementation vocabulary (${leakedTerm}) instead of player-facing mission language: ${JSON.stringify(missionBrief)}.`);
    }
  }
  for (const mission of catalog) {
    if (mission.objectiveCount <= 0) findings.push(`- P1: Mission ${mission.id} exposes no required objectives in the catalog.`);
    if (mission.enemyCount <= 0) findings.push(`- P1: Mission ${mission.id} exposes no sentry/enemy count in the catalog.`);
  }
  return findings.length > 0 ? findings.join('\n') : '- P1: None from generated mission catalog diagnostics.';
}

function firstPlayerFacingInternalTerm(copy: string): string | null {
  const terms = [
    { label: 'GLB', pattern: /\bGLB\b/i },
    { label: 'density zones', pattern: /\bdensity zones?\b/i },
    { label: 'asset audit', pattern: /\basset audit\b/i },
    { label: 'runtime', pattern: /\bruntime\b/i },
  ];
  return terms.find((term) => term.pattern.test(copy))?.label ?? null;
}

function buildMissionReadiness(
  registeredLevels: readonly GameLevelDefinition[],
  catalog: readonly LevelCatalogEntry[],
  matrix: PlaythroughMatrix | null,
): MissionReadinessArtifact {
  const catalogIds = new Set(catalog.map((mission) => mission.id));
  const matrixById = new Map((matrix?.levels ?? []).map((entry) => [entry.levelId, entry]));
  const missions = registeredLevels.map((level) => buildMissionReadinessEntry(level, catalogIds, matrixById));
  const summary = {
    missions: missions.length,
    pass: missions.filter((mission) => mission.grade === 'pass').length,
    review: missions.filter((mission) => mission.grade === 'review').length,
    fail: missions.filter((mission) => mission.grade === 'fail').length,
  };

  return {
    build: `v${packageInfo.version}`,
    generatedAt: new Date().toISOString(),
    thresholds: {
      levelFootprintRatio: aaaReadyLevelFootprintRatio,
      zoneFootprintRatio: aaaReadyZoneFootprintRatio,
      wallRunEpsilon,
    },
    summary,
    missions,
  };
}

function buildMissionReadinessEntry(
  level: GameLevelDefinition,
  catalogIds: ReadonlySet<string>,
  matrixById: ReadonlyMap<string, PlaythroughMatrixEntry>,
): MissionReadinessEntry {
  const catalogKnown = catalogIds.has(level.id);
  const density = summarizeMissionDensity(level);
  const wallRuns = summarizeMissionWallRuns(level);
  const route = summarizeMissionRoute(level);
  const unlocks = summarizeMissionUnlocks(level);
  const playthrough = summarizeMissionPlaythrough(matrixById.get(level.id));
  const dimensions = {
    width: roundMetric(level.bounds.max.x - level.bounds.min.x),
    depth: roundMetric(level.bounds.max.z - level.bounds.min.z),
    floorArea: roundMetric(areaFromMissionBounds(level.bounds)),
  };
  const counts = {
    walls: level.walls.length,
    doors: level.doors.length,
    blockers: level.blockers.length,
    setDressing: level.setDressing.length,
    zones: level.zones.length,
    requiredObjectives: level.objectives.filter((objective) => objective.required).length,
    enemies: level.enemies.length,
    validationRoutePoints: level.validationRoute.length,
    tutorialSteps: level.tutorial.length,
  };
  const findings: string[] = [];

  if (!catalogKnown) findings.push('mission is registered in code but missing from the player-facing catalog');
  if (counts.doors === 0) findings.push('mission has no authored sliding-door gates');
  if (counts.requiredObjectives === 0) findings.push('mission has no required objectives');
  if (counts.enemies === 0) findings.push('mission has no sentry/enemy pressure');
  if (counts.tutorialSteps < 4) findings.push(`mission tutorial has only ${counts.tutorialSteps} step(s)`);
  if (counts.zones === 0) findings.push('mission has no density zones');
  if (!pointInMissionBounds(level.start, level.bounds)) findings.push('player start is outside level bounds');
  if (!pointInMissionBounds(level.extraction, level.bounds)) findings.push('extraction point is outside level bounds');
  findings.push(...density.zones.flatMap((zone) => zone.findings.map((finding) => `${zone.id}: ${finding}`)));
  if (density.grade === 'fail') findings.push(`mission tactical footprint ${(density.footprintRatio * 100).toFixed(1)}% is below target ${(aaaReadyLevelFootprintRatio * 100).toFixed(0)}%`);
  for (const wallRun of wallRuns) {
    findings.push(...wallRun.findings.map((finding) => `${wallRun.id}: ${finding}`));
  }
  if (playthrough.grade !== 'pass') {
    findings.push(`browser playthrough evidence is ${playthrough.status}`);
  }
  findings.push(...route.outOfBoundsPoints.map((point) => `validation route point ${point.x},${point.z} is outside level bounds`));
  findings.push(...unlocks.missingDoors.map((doorId) => `objective unlock references missing door ${doorId}`));
  findings.push(...unlocks.missingObjectives.map((objectiveId) => `door opensWhen references missing objective ${objectiveId}`));

  const grades = [
    density.grade,
    playthrough.grade,
    route.grade,
    unlocks.grade,
    ...wallRuns.map((wallRun) => wallRun.grade),
    catalogKnown ? 'pass' : 'fail',
    counts.doors > 0 && counts.requiredObjectives > 0 && counts.enemies > 0 && counts.tutorialSteps >= 4 ? 'pass' : 'fail',
  ] as const;
  const grade = grades.includes('fail') ? 'fail' : grades.includes('review') ? 'review' : 'pass';

  return {
    levelId: level.id,
    name: level.name,
    chapter: level.chapter,
    grade,
    catalogKnown,
    dimensions,
    counts,
    density,
    wallRuns,
    playthrough,
    route,
    unlocks,
    findings,
  };
}

function summarizeMissionDensity(level: GameLevelDefinition): MissionReadinessEntry['density'] {
  const floorArea = areaFromMissionBounds(level.bounds);
  const footprintArea = totalMissionFootprint(level, {
    id: '__level',
    label: 'Whole Level',
    bounds: level.bounds,
    expectedLandmarks: [],
  });
  const footprintRatio = ratioOf(footprintArea, floorArea);
  const zones = level.zones.map((zone) => summarizeMissionZone(level, zone));
  const grade = footprintRatio < aaaReadyLevelFootprintRatio || zones.some((zone) => zone.grade === 'fail')
    ? 'fail'
    : zones.some((zone) => zone.grade === 'review')
      ? 'review'
      : 'pass';

  return {
    grade,
    footprintArea: roundMetric(footprintArea),
    footprintRatio: roundMetric(footprintRatio),
    zones,
  };
}

function summarizeMissionZone(
  level: GameLevelDefinition,
  zone: GameLevelZoneDefinition,
): MissionZoneReadiness {
  const floorArea = areaFromMissionBounds(zone.bounds);
  const footprintArea = totalMissionFootprint(level, zone);
  const footprintRatio = ratioOf(footprintArea, floorArea);
  const landmarkCount = zone.expectedLandmarks.filter((id) => missionLandmarkPresent(level, id, zone)).length;
  const interactableCount = level.objectives.filter((objective) => pointInMissionBounds(objective.position, zone.bounds)).length
    + level.doors.filter((door) => pointInMissionBounds(door.center, zone.bounds)).length
    + (pointInMissionBounds(level.extraction, zone.bounds) ? 1 : 0);
  const findings: string[] = [];

  if (footprintRatio < aaaReadyZoneFootprintRatio) {
    findings.push(`zone footprint ${(footprintRatio * 100).toFixed(1)}% is below target ${(aaaReadyZoneFootprintRatio * 100).toFixed(0)}%`);
  }
  if (landmarkCount < zone.expectedLandmarks.length) {
    findings.push(`landmarks present ${landmarkCount}/${zone.expectedLandmarks.length}`);
  }
  if (interactableCount < 1) {
    findings.push('zone has no objective, door, or extraction milestone');
  }

  return {
    id: zone.id,
    label: zone.label,
    grade: findings.length > 0 ? 'fail' : 'pass',
    floorArea: roundMetric(floorArea),
    footprintArea: roundMetric(footprintArea),
    footprintRatio: roundMetric(footprintRatio),
    landmarkCount,
    expectedLandmarkCount: zone.expectedLandmarks.length,
    interactableCount,
    ...(zone.screenshot ? { screenshot: zone.screenshot } : {}),
    findings,
  };
}

function summarizeMissionWallRuns(level: GameLevelDefinition): MissionWallRunReadiness[] {
  const seen = new Set<string>();
  const wallRuns: MissionWallRunReadiness[] = [];

  for (const door of level.doors) {
    const key = `${door.axis}:${roundMetric(fixedLine(door, door.axis))}`;
    if (seen.has(key)) continue;
    seen.add(key);
    wallRuns.push(summarizeMissionDoorWallRun(level, door));
  }

  return wallRuns;
}

function summarizeMissionDoorWallRun(
  level: GameLevelDefinition,
  seedDoor: GameDoorDefinition,
): MissionWallRunReadiness {
  const axis = seedDoor.axis;
  const line = fixedLine(seedDoor, axis);
  const doors = level.doors.filter((door) => door.axis === axis && Math.abs(fixedLine(door, axis) - line) <= wallRunEpsilon);
  const doorIntervals = doors.map((door) => ({ id: door.id, ...rectMissionInterval(door, axis) })).sort(sortInterval);
  const wallIntervals = level.walls
    .filter((wall) => wallMatchesDoorLine(wall, seedDoor))
    .map((wall) => ({ id: wall.id, ...rectMissionInterval(wall, axis) }))
    .sort(sortInterval);
  const doorToWallGaps = doorIntervals.flatMap((door) => measureDoorWallGaps(door, wallIntervals));
  const doorToDoorSpans = measureDoorToDoorSpans(doorIntervals, wallIntervals);
  const findings: string[] = [];

  if (wallIntervals.length === 0) {
    findings.push('no wall intervals share this physical door line');
  }
  for (const gap of doorToWallGaps) {
    if (gap.gap > wallRunEpsilon) {
      findings.push(`${gap.doorId} ${gap.side} wall gap is ${formatMeters(roundMetric(gap.gap))}`);
    }
  }
  for (const span of doorToDoorSpans) {
    if (span.grade === 'fail') {
      findings.push(`${span.previousDoorId}->${span.nextDoorId} span ${formatMeters(span.spanWidth)} has unowned gap ${formatMeters(span.largestGap)}`);
    }
  }

  return {
    id: `${axis}:${roundMetric(line)}`,
    axis,
    line: roundMetric(line),
    grade: findings.length > 0 ? 'fail' : 'pass',
    doors: doorIntervals.map((door) => door.id),
    wallIntervals,
    doorIntervals,
    doorToWallGaps,
    doorToDoorSpans,
    findings,
  };
}

function summarizeMissionRoute(level: GameLevelDefinition): MissionReadinessEntry['route'] {
  const outOfBoundsPoints = level.validationRoute.filter((point) => !pointInMissionBounds(point, level.bounds));
  return {
    grade: outOfBoundsPoints.length > 0 || level.validationRoute.length < 2 ? 'fail' : 'pass',
    outOfBoundsPoints,
  };
}

function summarizeMissionUnlocks(level: GameLevelDefinition): MissionReadinessEntry['unlocks'] {
  const doorIds = new Set(level.doors.map((door) => door.id));
  const objectiveIds = new Set(level.objectives.map((objective) => objective.id));
  const missingDoors = [...new Set(level.objectives.flatMap((objective) => objective.unlocks).filter((doorId) => !doorIds.has(doorId)))];
  const missingObjectives = [...new Set(level.doors.flatMap((door) => door.opensWhen).filter((objectiveId) => !objectiveIds.has(objectiveId)))];
  return {
    grade: missingDoors.length > 0 || missingObjectives.length > 0 ? 'fail' : 'pass',
    missingDoors,
    missingObjectives,
  };
}

function summarizeMissionPlaythrough(entry: PlaythroughMatrixEntry | undefined): MissionReadinessEntry['playthrough'] {
  const missingScreenshots = entry?.missingScreenshots ?? [];
  const screenshotCount = entry?.screenshotCount ?? 0;
  const grade = entry?.status === 'pass' && entry.reportCopied && entry.committedReportPath && screenshotCount > 0 && missingScreenshots.length === 0
    ? 'pass'
    : 'fail';
  return {
    grade,
    status: entry?.status ?? 'missing',
    ...(entry?.committedReportPath ? { committedReportPath: entry.committedReportPath } : {}),
    screenshotCount,
    missingScreenshots,
  };
}

function formatMissionReadinessSummary(artifact: MissionReadinessArtifact): string {
  return `${artifact.summary.pass}/${artifact.summary.missions} pass; ${artifact.summary.review} review; ${artifact.summary.fail} fail`;
}

function formatMissionReadiness(artifact: MissionReadinessArtifact): string {
  if (artifact.missions.length === 0) return '- Mission readiness diagnostics not captured.';
  const rows: string[] = [
    `- Mission readiness build=${artifact.build}; ${formatMissionReadinessSummary(artifact)}; densityTargets=level ${formatRatio(artifact.thresholds.levelFootprintRatio)}, zone ${formatRatio(artifact.thresholds.zoneFootprintRatio)}; wallRunEpsilon=${formatMeters(artifact.thresholds.wallRunEpsilon)}`,
  ];

  for (const mission of artifact.missions) {
    rows.push(`- ${mission.grade.toUpperCase()} mission-ready/${mission.levelId}: catalogKnown=${mission.catalogKnown}; size=${mission.dimensions.width}x${mission.dimensions.depth}m; objectives=${mission.counts.requiredObjectives}; doors=${mission.counts.doors}; enemies=${mission.counts.enemies}; zones=${mission.counts.zones}; setDressing=${mission.counts.setDressing}; density=${mission.density.grade}:${formatRatio(mission.density.footprintRatio)}; wallRuns=${mission.wallRuns.filter((wallRun) => wallRun.grade === 'pass').length}/${mission.wallRuns.length}; playthrough=${mission.playthrough.grade}:${mission.playthrough.status}; screenshots=${mission.playthrough.screenshotCount}; route=${mission.route.grade}; unlocks=${mission.unlocks.grade}; findings=${mission.findings.length}`);
    for (const zone of mission.density.zones) {
      rows.push(`- ${zone.grade.toUpperCase()} mission-zone/${mission.levelId}/${zone.id}: ${zone.label}; footprint=${formatRatio(zone.footprintRatio)}; landmarks=${zone.landmarkCount}/${zone.expectedLandmarkCount}; interactables=${zone.interactableCount}; screenshot=${zone.screenshot ?? 'not mapped'}; findings=${zone.findings.join('; ') || 'none'}`);
    }
    for (const wallRun of mission.wallRuns) {
      const gaps = wallRun.doorToWallGaps.filter((gap) => gap.gap > wallRunEpsilon).map((gap) => `${gap.doorId}:${gap.side}:${formatMeters(roundMetric(gap.gap))}`).join('; ') || 'none';
      const spans = wallRun.doorToDoorSpans.map((span) => `${span.previousDoorId}->${span.nextDoorId}:${span.grade}:span=${formatMeters(span.spanWidth)}:gap=${formatMeters(span.largestGap)}:owners=${span.ownerIds.join(',') || 'missing'}`).join('; ') || 'no adjacent door pairs';
      rows.push(`- ${wallRun.grade.toUpperCase()} mission-wall-run/${mission.levelId}/${wallRun.id}: doors=${wallRun.doors.join(', ')}; walls=${wallRun.wallIntervals.map((interval) => interval.id).join(', ') || 'missing'}; gaps=${gaps}; spans=${spans}`);
    }
  }

  return rows.join('\n');
}

function describeMissionReadinessFindings(artifact: MissionReadinessArtifact): string {
  if (artifact.missions.length === 0) {
    return '- P1: Mission readiness matrix missing; tester cannot prove registered missions are scalable large-level candidates.';
  }
  const findings: string[] = [];
  for (const mission of artifact.missions) {
    if (mission.grade === 'fail') {
      findings.push(`- P1: Mission readiness failed for ${mission.levelId}: ${mission.findings.join('; ') || 'see mission-readiness matrix'}.`);
    } else if (mission.grade === 'review') {
      findings.push(`- P2: Mission readiness needs review for ${mission.levelId}: ${mission.findings.join('; ') || 'see mission-readiness matrix'}.`);
    }
  }
  return findings.length > 0 ? findings.join('\n') : '- P1: None from generated mission readiness matrix.';
}

function totalMissionFootprint(level: GameLevelDefinition, zone: GameLevelZoneDefinition): number {
  const blockerArea = level.blockers.reduce((sum, blocker) => sum + rectMissionZoneOverlapArea(blocker, zone), 0);
  const setDressingArea = level.setDressing.reduce((sum, dressing) => sum + rectMissionZoneOverlapArea(dressing, zone), 0);
  const objectiveArea = level.objectives
    .filter((objective) => pointInMissionBounds(objective.position, zone.bounds))
    .reduce((sum, objective) => sum + Math.PI * objective.radius * objective.radius, 0);
  const enemyArea = level.enemies
    .filter((enemy) => pointInMissionBounds(enemy.start, zone.bounds))
    .reduce((sum, enemy) => sum + Math.PI * enemy.detectionRadius * enemy.detectionRadius, 0);
  const extractionArea = pointInMissionBounds(level.extraction, zone.bounds) ? Math.PI * 2.5 * 2.5 : 0;
  return blockerArea + setDressingArea + objectiveArea + enemyArea + extractionArea;
}

function rectMissionZoneOverlapArea(rect: GameRectSpec, zone: GameLevelZoneDefinition): number {
  const minX = rect.center.x - rect.size.x / 2;
  const maxX = rect.center.x + rect.size.x / 2;
  const minZ = rect.center.z - rect.size.z / 2;
  const maxZ = rect.center.z + rect.size.z / 2;
  const overlapX = Math.max(0, Math.min(maxX, zone.bounds.max.x) - Math.max(minX, zone.bounds.min.x));
  const overlapZ = Math.max(0, Math.min(maxZ, zone.bounds.max.z) - Math.max(minZ, zone.bounds.min.z));
  return overlapX * overlapZ;
}

function missionLandmarkPresent(
  level: GameLevelDefinition,
  id: string,
  zone: GameLevelZoneDefinition,
): boolean {
  return level.blockers.some((blocker) => blocker.id === id && rectMissionZoneOverlapArea(blocker, zone) > 0)
    || level.setDressing.some((dressing) => dressing.id === id && rectMissionZoneOverlapArea(dressing, zone) > 0)
    || level.objectives.some((objective) => objective.id === id && pointInMissionBounds(objective.position, zone.bounds))
    || level.doors.some((door) => door.id === id && pointInMissionBounds(door.center, zone.bounds))
    || level.enemies.some((enemy) => enemy.id === id && pointInMissionBounds(enemy.start, zone.bounds))
    || (id === 'extraction' && pointInMissionBounds(level.extraction, zone.bounds));
}

function measureDoorWallGaps(
  door: MissionInterval,
  walls: readonly MissionInterval[],
): MissionDoorWallGap[] {
  const before = [...walls].filter((wall) => wall.max <= door.min + wallRunEpsilon).sort((a, b) => b.max - a.max)[0];
  const after = [...walls].filter((wall) => wall.min >= door.max - wallRunEpsilon).sort((a, b) => a.min - b.min)[0];
  return [
    {
      doorId: door.id,
      side: 'before',
      fromId: before?.id,
      toId: door.id,
      gap: before ? roundMetric(Math.max(0, door.min - before.max)) : 99999,
    },
    {
      doorId: door.id,
      side: 'after',
      fromId: door.id,
      toId: after?.id,
      gap: after ? roundMetric(Math.max(0, after.min - door.max)) : 99999,
    },
  ];
}

function measureDoorToDoorSpans(
  doors: readonly MissionInterval[],
  walls: readonly MissionInterval[],
): MissionDoorSpanOwnership[] {
  const spans: MissionDoorSpanOwnership[] = [];
  for (let index = 0; index < doors.length - 1; index += 1) {
    const previousDoor = doors[index];
    const nextDoor = doors[index + 1];
    const spanMin = previousDoor.max;
    const spanMax = nextDoor.min;
    const spanWidth = Math.max(0, spanMax - spanMin);
    const coverage = measureIntervalCoverage(spanMin, spanMax, walls);
    spans.push({
      previousDoorId: previousDoor.id,
      nextDoorId: nextDoor.id,
      spanMin: roundMetric(spanMin),
      spanMax: roundMetric(spanMax),
      spanWidth: roundMetric(spanWidth),
      ownerIds: coverage.ownerIds,
      largestGap: roundMetric(coverage.largestGap),
      grade: coverage.ownerIds.length > 0 && coverage.largestGap <= wallRunEpsilon ? 'pass' : 'fail',
    });
  }
  return spans;
}

function measureIntervalCoverage(
  spanMin: number,
  spanMax: number,
  owners: readonly MissionInterval[],
): { ownerIds: readonly string[]; largestGap: number } {
  if (spanMax <= spanMin + wallRunEpsilon) return { ownerIds: [], largestGap: 0 };

  const overlapping = owners
    .filter((owner) => owner.max > spanMin + wallRunEpsilon && owner.min < spanMax - wallRunEpsilon)
    .sort(sortInterval);
  const ownerIds = overlapping.map((owner) => owner.id);
  let cursor = spanMin;
  let largestGap = 0;

  for (const owner of overlapping) {
    if (owner.min > cursor + wallRunEpsilon) {
      largestGap = Math.max(largestGap, owner.min - cursor);
    }
    cursor = Math.max(cursor, owner.max);
    if (cursor >= spanMax - wallRunEpsilon) break;
  }
  if (cursor < spanMax - wallRunEpsilon) {
    largestGap = Math.max(largestGap, spanMax - cursor);
  }

  return { ownerIds, largestGap };
}

function wallMatchesDoorLine(wall: GameRectSpec, door: GameDoorDefinition): boolean {
  if (door.axis === 'x') {
    return wall.size.x >= wall.size.z && rangesOverlap(rectAxisRange(wall, 'z'), rectAxisRange(door, 'z'), wallRunEpsilon);
  }
  return wall.size.z >= wall.size.x && rangesOverlap(rectAxisRange(wall, 'x'), rectAxisRange(door, 'x'), wallRunEpsilon);
}

function fixedLine(rect: GameRectSpec, axis: 'x' | 'z'): number {
  return axis === 'x' ? rect.center.z : rect.center.x;
}

function rectMissionInterval(rect: GameRectSpec, axis: 'x' | 'z'): { min: number; max: number } {
  const range = rectAxisRange(rect, axis);
  return {
    min: roundMetric(range.min),
    max: roundMetric(range.max),
  };
}

function rectAxisRange(rect: GameRectSpec, axis: 'x' | 'z'): { min: number; max: number } {
  const center = axis === 'x' ? rect.center.x : rect.center.z;
  const size = axis === 'x' ? rect.size.x : rect.size.z;
  return {
    min: center - size / 2,
    max: center + size / 2,
  };
}

function rangesOverlap(
  a: { min: number; max: number },
  b: { min: number; max: number },
  epsilon: number,
): boolean {
  return Math.min(a.max, b.max) - Math.max(a.min, b.min) > epsilon;
}

function sortInterval(a: MissionInterval, b: MissionInterval): number {
  return a.min - b.min || a.max - b.max || a.id.localeCompare(b.id);
}

function areaFromMissionBounds(bounds: { min: GameVec2; max: GameVec2 }): number {
  return Math.max(0, bounds.max.x - bounds.min.x) * Math.max(0, bounds.max.z - bounds.min.z);
}

function pointInMissionBounds(point: GameVec2, bounds: { min: GameVec2; max: GameVec2 }): boolean {
  return point.x >= bounds.min.x && point.x <= bounds.max.x && point.z >= bounds.min.z && point.z <= bounds.max.z;
}

function ratioOf(value: number, total: number): number {
  return total > 0 ? value / total : 0;
}

function roundMetric(value: number): number {
  if (!Number.isFinite(value)) return value;
  return Number(value.toFixed(4));
}

function describeFrameFinding(
  frame: Metrics['framePacing'] | undefined,
  baseline: Metrics['browserBaseline'] | undefined,
  fpsGate: Metrics['fpsGate'] | undefined,
  fpsScenes: readonly FpsSceneMetric[],
): string {
  if (!frame) return '- P1: FPS metrics missing.';
  const sceneFailures = fpsScenes.filter((scene) => scene.fpsGate.status === 'fail');
  if (fpsGate?.status === 'pass') return '- P1: None from generated FPS metrics.';
  if (fpsGate?.status === 'environment-limited' && baseline) {
    const profile = fpsGate.performanceProfile ? ` on the ${fpsGate.performanceProfile} profile` : '';
    const sceneSummary = fpsScenes.length > 0
      ? ` across ${fpsScenes.length} scene sample(s): ${fpsScenes.map((scene) => `${scene.id}=${scene.fpsGate.status}`).join(', ')}`
      : '';
    return `- P1: Current headed browser baseline measured ${baseline.fps.toFixed(1)} FPS / ${baseline.frameMs.toFixed(1)} ms median and cannot prove strict 16.7 ms${profile}. The game tracks that baseline within the calibrated overhead budget${sceneSummary} (${formatMs(fpsGate.frameOverheadMs)} median / ${formatMs(fpsGate.p95OverheadMs)} p95), so rerun on a true 60 Hz visible browser before marking the 60 FPS gate fully proven.`;
  }
  if (sceneFailures.length > 0) {
    return `- P1: FPS gate failed in scene(s): ${sceneFailures.map((scene) => `${scene.id} ${scene.framePacing.fps.toFixed(1)} FPS / ${scene.framePacing.frameMs.toFixed(1)} ms median / ${scene.framePacing.p95FrameMs.toFixed(1)} ms p95`).join('; ')}.`;
  }
  return `- P1: Game FPS gate failed at ${frame.fps.toFixed(1)} FPS / ${frame.frameMs.toFixed(1)} ms median / ${frame.p95FrameMs.toFixed(1)} ms p95 against the configured frame budget.`;
}

function describePerformance(
  frame: Metrics['framePacing'] | undefined,
  baseline: Metrics['browserBaseline'] | undefined,
  fpsGate: Metrics['fpsGate'] | undefined,
  fpsScenes: readonly FpsSceneMetric[],
): string {
  if (!frame) return 'FPS metrics were not captured.';
  const sceneCount = fpsScenes.length > 0 ? `${fpsScenes.length} scene samples` : 'the gameplay sample';
  if (fpsGate?.status === 'pass') return `${sceneCount} passed the configured 60 FPS gate.`;
  if (fpsGate?.status === 'environment-limited' && baseline) {
    return `${sceneCount} match the ${baseline.fps.toFixed(1)} FPS browser baseline with ${formatMs(fpsGate.frameOverheadMs)} median / ${formatMs(fpsGate.p95OverheadMs)} p95 overhead, but this environment cannot prove strict 16.7 ms frame cadence.`;
  }
  return `${sceneCount} failed the configured FPS gate and needs optimization or a lower-quality fallback.`;
}

function formatFpsSceneSummary(scenes: readonly FpsSceneMetric[]): string {
  if (scenes.length === 0) return 'not captured';
  return scenes
    .map((scene) => `${scene.id}=${scene.fpsGate.status} (${scene.framePacing.fps.toFixed(1)} FPS, ${scene.framePacing.frameMs.toFixed(1)} ms median, ${scene.framePacing.p95FrameMs.toFixed(1)} ms p95, overhead=${formatMs(scene.fpsGate.frameOverheadMs)}/${formatMs(scene.fpsGate.p95OverheadMs)})`)
    .join('; ');
}

function formatFpsSceneMatrix(
  scenes: readonly FpsSceneMetric[],
  baseline: Metrics['browserBaseline'] | undefined,
): string {
  if (scenes.length === 0) return '- FPS scene matrix not captured.';
  const baselineLine = baseline
    ? `- BASELINE browser: ${baseline.fps.toFixed(1)} FPS; median=${baseline.frameMs.toFixed(1)} ms; p95=${baseline.p95FrameMs.toFixed(1)} ms; samples=${baseline.samples}`
    : '- BASELINE browser: not captured';
  const rows = scenes.map((scene) => {
    const renderer = scene.renderer
      ? `renderer=${scene.renderer.drawCalls} calls/${scene.renderer.triangles} tris/${scene.renderer.textures} textures/pixelRatio=${scene.renderer.pixelRatio ?? 'unknown'}`
      : 'renderer=not captured';
    const budget = scene.renderBudget
      ? ` budget=${scene.renderBudget.grade}; headroom=${scene.renderBudget.drawCallHeadroom} calls/${scene.renderBudget.triangleHeadroom} tris/${scene.renderBudget.textureHeadroom} tex`
      : ' budget=not captured';
    const title = scene.titleComposition
      ? ` titleHero=facingDot=${scene.titleComposition.facingDot}; screenHeight=${formatRatio(scene.titleComposition.heroScreenHeightRatio)}; occupancy=${formatRatio(scene.titleComposition.heroScreenOccupancy)}`
      : '';
    return `- ${scene.fpsGate.status.toUpperCase()} fps/${scene.id}: label="${scene.label}"; phase=${scene.phase}; screenshot=${scene.screenshot}; frame=${scene.framePacing.fps.toFixed(1)} FPS / ${scene.framePacing.frameMs.toFixed(1)} ms median / ${scene.framePacing.p95FrameMs.toFixed(1)} ms p95; strict=${scene.fpsGate.strictTargetMet}; tracksBaseline=${scene.fpsGate.tracksBaseline}; overhead=${formatMs(scene.fpsGate.frameOverheadMs)} median/${formatMs(scene.fpsGate.p95OverheadMs)} p95; audio=${scene.audioTrack ?? 'none'}; ${renderer};${budget}.${title}`;
  });
  return [baselineLine, ...rows].join('\n');
}

function formatRenderBudgetSummary(budget: RenderBudgetMetric | undefined): string {
  if (!budget) return 'not captured';
  return `${budget.grade}; profile=${budget.performanceProfile ?? 'unknown'}; calls=${budget.drawCalls}/${budget.maxDrawCalls}; triangles=${budget.triangles}/${budget.maxTriangles}; geometries=${budget.geometries}/${budget.maxGeometries}; textures=${budget.textures}/${budget.maxTextures}; pixelRatio=${budget.pixelRatio}/${budget.maxPixelRatio}; shadows=${budget.shadowsEnabled}/${budget.shadowsAllowed}`;
}

function describeRenderBudgetSummary(
  budget: RenderBudgetMetric | undefined,
  scenes: readonly FpsSceneMetric[],
): string {
  if (!budget) return 'Render-budget metrics were not captured.';
  const failedScenes = scenes.filter((scene) => scene.renderBudget?.grade === 'fail');
  if (budget.grade === 'pass' && failedScenes.length === 0) {
    return `${budget.performanceProfile ?? 'active'} profile render counters are inside explicit draw-call, triangle, geometry, texture, pixel-ratio, and shadow budgets.`;
  }
  return `Render-budget overage needs optimization before approving more assets: ${[budget, ...failedScenes.map((scene) => scene.renderBudget).filter((item): item is RenderBudgetMetric => Boolean(item))].map(formatRenderBudgetSummary).join('; ')}.`;
}

function describeRenderBudgetFindings(
  budget: RenderBudgetMetric | undefined,
  scenes: readonly FpsSceneMetric[],
): string {
  if (!budget) return '- P1: Render-budget diagnostics missing; tester cannot prove the lower-cost 60 FPS profile is protected from renderer counter regressions.';
  const failedScenes = scenes.filter((scene) => scene.renderBudget?.grade === 'fail');
  if (budget.grade !== 'pass' || failedScenes.length > 0) {
    const failures = [
      budget.grade !== 'pass' ? `active=${formatRenderBudgetSummary(budget)}` : '',
      ...failedScenes.map((scene) => `${scene.id}=${formatRenderBudgetSummary(scene.renderBudget)}`),
    ].filter(Boolean);
    return `- P1: Render-budget gate failed: ${failures.join('; ')}.`;
  }
  return '- P1: None from generated render-budget diagnostics.';
}

function formatRenderBudget(
  budget: RenderBudgetMetric | undefined,
  scenes: readonly FpsSceneMetric[],
): string {
  const rows: string[] = [];
  if (budget) {
    rows.push(`- ${budget.grade.toUpperCase()} render-budget/active: ${formatRenderBudgetSummary(budget)}; headroom=${budget.drawCallHeadroom} calls, ${budget.triangleHeadroom} triangles, ${budget.geometryHeadroom} geometries, ${budget.textureHeadroom} textures, ${budget.pixelRatioHeadroom} pixel ratio. ${budget.notes.join(' ')}`);
  } else {
    rows.push('- FAIL render-budget/active: not captured.');
  }
  for (const scene of scenes) {
    if (!scene.renderBudget) {
      rows.push(`- FAIL render-budget/${scene.id}: not captured.`);
      continue;
    }
    rows.push(`- ${scene.renderBudget.grade.toUpperCase()} render-budget/${scene.id}: ${formatRenderBudgetSummary(scene.renderBudget)}; screenshot=${scene.screenshot}; headroom=${scene.renderBudget.drawCallHeadroom} calls, ${scene.renderBudget.triangleHeadroom} triangles, ${scene.renderBudget.geometryHeadroom} geometries, ${scene.renderBudget.textureHeadroom} textures, ${scene.renderBudget.pixelRatioHeadroom} pixel ratio.`);
  }
  return rows.join('\n');
}

async function copyFpsSceneScreenshots(
  scenes: readonly FpsSceneMetric[],
  targetDir: string,
): Promise<void> {
  if (scenes.length === 0) return;
  await mkdir(targetDir, { recursive: true });
  for (const scene of scenes) {
    if (!scene.screenshot || !existsSync(scene.screenshot)) continue;
    const target = `${targetDir}/${basename(scene.screenshot)}`;
    await copyFile(scene.screenshot, target);
    scene.screenshot = target;
  }
}

function describeAssetSummary(checks: readonly AssetQualityCheck[]): string {
  const pass = checks.filter((check) => check.grade === 'pass').length;
  const review = checks.filter((check) => check.grade === 'review').length;
  const fail = checks.filter((check) => check.grade === 'fail').length;
  return `${pass} pass, ${review} review, ${fail} fail`;
}

function describeAaaDensitySummary(geometry: GeometryDiagnostics): string {
  const zones = geometry.levelDensity.zones ?? [];
  const weakZones = zones.filter((zone) => zone.totalFootprintRatio < aaaReadyZoneFootprintRatio);
  const levelReady = geometry.levelDensity.setDressingRatio >= aaaReadyLevelFootprintRatio && weakZones.length === 0;
  return levelReady
    ? `yes; level=${formatRatio(geometry.levelDensity.setDressingRatio)}; minZone>=${formatRatio(aaaReadyZoneFootprintRatio)}`
    : `no; level=${formatRatio(geometry.levelDensity.setDressingRatio)} target=${formatRatio(aaaReadyLevelFootprintRatio)}; weakZones=${weakZones.map((zone) => `${zone.id}:${formatRatio(zone.totalFootprintRatio)}`).join(', ') || 'none'}`;
}

function formatAssetGrades(checks: readonly AssetQualityCheck[]): string {
  if (checks.length === 0) return '- Asset grading not captured.';
  return checks.map((check) => {
    const placement = check.position && check.bounds
      ? ` pos=(${check.position.x},${check.position.y},${check.position.z}); y=${check.bounds.minY}..${check.bounds.maxY}; h=${check.bounds.height}${check.bounds.width !== undefined && check.bounds.depth !== undefined ? `; xz=${check.bounds.width}x${check.bounds.depth}` : ''}`
      : '';
    return `- ${check.grade.toUpperCase()} ${check.category}/${check.id}: ${check.label}; visible=${check.visible}; grounded=${check.grounded}.${placement} ${check.notes.join(' ')}`;
  }).join('\n');
}

function describeAssetAuditSummary(checks: readonly RuntimeAssetAudit[]): string {
  const pass = checks.filter((check) => check.grade === 'pass').length;
  const review = checks.filter((check) => check.grade === 'review').length;
  const fail = checks.filter((check) => check.grade === 'fail').length;
  const visibleFallbacks = checks.filter((check) => check.fallbackVisible).length;
  const sources = [...new Set(checks.map((check) => check.source))].sort().join(', ');
  return `${pass} pass, ${review} review, ${fail} fail; visibleFallbacks=${visibleFallbacks}; sources=${sources}`;
}

function formatAssetAudit(checks: readonly RuntimeAssetAudit[]): string {
  if (checks.length === 0) return '- Runtime asset provenance audit not captured.';
  return checks.map((check) => {
    const failure = check.failure ? ` failure="${check.failure}"` : '';
    return `- ${check.grade.toUpperCase()} ${check.kind}/${check.id}: ${check.label}; requirement=${check.requirement}; source=${check.source}; format=${check.expectedFormat}; loaded=${check.loaded}; failed=${check.failed}; fallbackVisible=${check.fallbackVisible}; policy=${check.fallbackPolicy}; path=${check.path}.${failure} ${check.notes.join(' ')}`;
  }).join('\n');
}

function describeAssetAuditFindings(checks: readonly RuntimeAssetAudit[]): string {
  if (checks.length === 0) {
    return '- P1: Runtime asset provenance audit missing; tester cannot prove GLB source, load state, or no-visible-fallback policy.';
  }
  const findings: string[] = [];
  for (const check of checks) {
    if (check.expectedFormat !== 'glb' || !check.path.includes('.glb')) {
      findings.push(`- P1: Runtime asset ${check.id} does not prove a GLB path: format=${check.expectedFormat}; path=${check.path}.`);
    }
    if (check.source !== 'sneak-game-seed' && check.source !== 'repo-generated-glb') {
      findings.push(`- P1: Runtime asset ${check.id} lacks accepted provenance: source=${check.source}.`);
    }
    if (!check.loaded || check.failed || check.grade !== 'pass') {
      findings.push(`- P1: Runtime asset ${check.id} failed provenance/load QA: loaded=${check.loaded}; failed=${check.failed}; grade=${check.grade}; ${check.notes.join(' ')}`);
    }
    if (check.fallbackVisible) {
      findings.push(`- P1: Runtime asset ${check.id} has a visible fallback or placeholder. Replace it with the intended GLB or fail the build.`);
    }
  }
  return findings.length > 0 ? findings.join('\n') : '- P1: None from generated runtime asset provenance audit.';
}

function describeTutorialSummary(checks: readonly TutorialAlignmentCheck[]): string {
  if (checks.length === 0) return 'not captured';
  const pass = checks.filter((check) => check.grade === 'pass').length;
  const cadet = checks.every((check) => check.textEndsWithCadet);
  const targets = checks.map((check) => `${check.id}->${check.target}`).join(', ');
  return `${pass}/${checks.length} pass; allCadet=${cadet}; targets=${targets}`;
}

function formatTutorialAlignment(checks: readonly TutorialAlignmentCheck[]): string {
  if (checks.length === 0) return '- Tutorial alignment diagnostics not captured.';
  return checks.map((check) => {
    const target = check.targetPoint ? `${check.targetPoint.x},${check.targetPoint.z}` : 'missing';
    const focus = check.focusPoint ? `${check.focusPoint.x},${check.focusPoint.z}` : 'missing';
    const keywords = check.missingKeywords.length > 0
      ? `missingKeywords=${check.missingKeywords.join(', ')}`
      : `keywords=${check.requiredKeywords.join(', ')}`;
    return `- ${check.grade.toUpperCase()} tutorial/${check.id}: screenshot=${check.screenshot ?? 'not captured'}; title="${check.title}"; target=${check.target} (${check.targetKind}); targetPoint=${target}; focusPoint=${focus}; focusDistance=${check.focusDistance ?? 'n/a'}; cameraDistance=${check.cameraDistance ?? 'n/a'}; cadet=${check.textEndsWithCadet}; ${keywords}. ${check.notes.join(' ')}`;
  }).join('\n');
}

function describeTutorialFindings(checks: readonly TutorialAlignmentCheck[]): string {
  if (checks.length === 0) return '- P1: Tutorial alignment diagnostics missing; tester cannot prove General Caldwell copy, screenshots, and camera targets match.';
  const findings = checks
    .filter((check) => check.grade !== 'pass')
    .map((check) => `- P1: Tutorial step ${check.id} failed alignment QA: targetExists=${check.targetExists}; cadet=${check.textEndsWithCadet}; missingKeywords=${check.missingKeywords.join(', ') || 'none'}; focusDistance=${check.focusDistance ?? 'n/a'}.`);
  return findings.length > 0 ? findings.join('\n') : '- P1: None from generated tutorial alignment diagnostics.';
}

function describeAssetFindings(checks: readonly AssetQualityCheck[]): string {
  if (checks.length === 0) return '- P1: Asset grading metrics missing.';
  const failed = checks.filter((check) => check.grade === 'fail');
  const review = checks.filter((check) => check.grade === 'review');
  const findings = failed.map((check) => `- P1: Asset ${check.id} failed grading: ${check.notes.join(' ')}`);
  findings.push(...review.map((check) => `- P2: Asset ${check.id} needs art/readability review: ${check.notes.join(' ')}`));
  return findings.length > 0 ? findings.join('\n') : '- P1: None from generated asset grading.';
}

function describeLoadingFindings(loading: LoadingState | undefined): string {
  if (!loading) return '- P1: Loading diagnostics missing.';
  if (loading.history.length < 3) {
    return `- P1: Loading diagnostics are too thin: only ${loading.history.length} step(s) captured.`;
  }
  if (!loading.history.some((step) => step.label.includes('tactical dressing'))) {
    return `- P1: Loading history did not capture tactical dressing preload: ${loading.history.map((step) => step.label).join(' -> ')}.`;
  }
  if (loading.value < 1) {
    return `- P2: Latest loading state did not reach ready/start value: ${loading.label} ${(loading.value * 100).toFixed(0)}%.`;
  }
  return '- P1: None from generated loading diagnostics.';
}

function describeAudioFindings(
  metricAudio: AudioState | undefined,
  completionAudio: AudioState | undefined,
  metricSettings: Metrics['settings'] | undefined,
  completionSettings: Metrics['settings'] | undefined,
): string {
  const findings: string[] = [];
  if (!metricAudio) {
    findings.push('- P1: Gameplay audio diagnostics missing from FPS metrics.');
  } else {
    if (metricAudio.activeTrack !== 'gameplay') {
      findings.push(`- P1: Gameplay audio should be on the gameplay track during FPS metrics, got ${formatAudioState(metricAudio)}.`);
    }
    if (!metricAudio.unlocked) {
      findings.push(`- P1: Gameplay audio should be unlocked after mission start, got ${formatAudioState(metricAudio)}.`);
    }
    if (metricSettings && metricAudio.muted !== metricSettings.muted) {
      findings.push(`- P1: Gameplay audio mute state (${metricAudio.muted}) does not match settings mute state (${metricSettings.muted}).`);
    }
  }

  if (!completionAudio) {
    findings.push('- P1: Completion audio diagnostics missing from browser playthrough final state.');
  } else {
    if (completionAudio.activeTrack !== 'complete') {
      findings.push(`- P1: Completion audio should switch to the triumphant completion track, got ${formatAudioState(completionAudio)}.`);
    }
    if (!completionAudio.unlocked) {
      findings.push(`- P1: Completion audio should remain unlocked after player input, got ${formatAudioState(completionAudio)}.`);
    }
    if (completionSettings && completionAudio.muted !== completionSettings.muted) {
      findings.push(`- P1: Completion audio mute state (${completionAudio.muted}) does not match playthrough settings mute state (${completionSettings.muted}).`);
    }
  }

  return findings.length > 0 ? findings.join('\n') : '- P1: None from generated audio diagnostics.';
}

function formatAudioState(audio: AudioState | undefined): string {
  return audio
    ? `active=${audio.activeTrack ?? 'none'}; muted=${audio.muted}; unlocked=${audio.unlocked}`
    : 'not captured';
}

function formatTitleAnchorSummary(composition: TitleComposition | undefined): string {
  const anchors = composition?.identityAnchors ?? [];
  if (anchors.length === 0) return 'not captured';
  return anchors.map((anchor) => `${anchor.id}:${anchor.visible && !anchor.uiOccluded ? 'readable' : anchor.visible ? 'occluded' : 'hidden'}`).join(', ');
}

function formatTitleIdentity(composition: TitleComposition | undefined): string {
  if (!composition) return '- Title identity diagnostics not captured.';
  const anchors = composition.identityAnchors ?? [];
  if (anchors.length === 0) return '- FAIL title-identity: no head/visor/chest anchors were captured.';
  const rows = anchors.map((anchor) => {
    const screen = anchor.screenPosition
      ? `screen=(${anchor.screenPosition.x},${anchor.screenPosition.y}) visible=${anchor.screenPosition.visible}`
      : 'screen=missing';
    return `- ${anchor.visible && !anchor.uiOccluded ? 'PASS' : 'FAIL'} title-anchor/${anchor.id}: ${anchor.label}; source=${anchor.source}; world=(${anchor.worldPosition.x},${anchor.worldPosition.y},${anchor.worldPosition.z}); ${screen}; uiOccluded=${anchor.uiOccluded}. ${anchor.notes.join(' ')}`;
  });
  return [
    `- ${composition.identityReadable ? 'PASS' : 'FAIL'} title-identity: identityReadable=${composition.identityReadable ?? false}; anchors=${formatTitleAnchorSummary(composition)}.`,
    ...rows,
  ].join('\n');
}

function describeTitleFindings(composition: TitleComposition | undefined): string {
  if (!composition) return '- P1: Title composition metrics missing.';
  const titleTreatment = composition.titleTreatment;
  if (!titleTreatment) {
    return '- P1: Title treatment metrics missing, so the tester cannot prove the native wordmark replaces the removed placeholder logo.';
  }
  if (!titleTreatment.wordmarkBounds) {
    return `- P1: Title wordmark screen-space bounds are missing, so the tester cannot prove the title treatment is visible. ${titleTreatment.notes.join(' ')}`;
  }
  if (!titleTreatment.wordmarkReadable) {
    return `- P1: Title wordmark is not production-readable: text="${titleTreatment.wordmarkText}"; kicker="${titleTreatment.kickerText}"; bounds=${formatScreenBounds(titleTreatment.wordmarkBounds)}; panelOverlap=${formatRatio(titleTreatment.panelOverlapRatio)}; heroOverlap=${formatRatio(titleTreatment.heroOverlapRatio)}. ${titleTreatment.notes.join(' ')}`;
  }
  if (!composition.heroScreenBounds) {
    return `- P1: Title hero screen-space bounds are missing, so the tester cannot prove the recruit is large enough to read. ${composition.notes.join(' ')}`;
  }
  const identityAnchors = composition.identityAnchors ?? [];
  if (!composition.identityReadable || identityAnchors.filter((anchor) => ['head', 'visor', 'chest'].includes(anchor.id) && anchor.visible && !anchor.uiOccluded).length < 3) {
    return `- P1: Title hero identity anchors are not readable: ${formatTitleAnchorSummary(composition)}. ${composition.notes.join(' ')}`;
  }
  if (!composition.heroReadable) {
    return `- P1: Title hero is not readable from the camera: facingDot=${composition.facingDot}; cameraDistance=${composition.cameraDistance}; screenHeight=${formatRatio(composition.heroScreenHeightRatio)}; screenOccupancy=${formatRatio(composition.heroScreenOccupancy)}; heroYaw=${composition.heroYaw}; yawToCamera=${composition.yawToCamera}. ${composition.notes.join(' ')}`;
  }
  if ((composition.heroScreenHeightRatio ?? 0) < 0.22 || (composition.heroScreenOccupancy ?? 0) < 0.012) {
    return `- P1: Title hero is technically visible but too small to prove recruit readability: screenHeight=${formatRatio(composition.heroScreenHeightRatio)}; screenOccupancy=${formatRatio(composition.heroScreenOccupancy)}; bounds=${formatScreenBounds(composition.heroScreenBounds)}.`;
  }
  if (!composition.levelPreviewVisible || (composition.orbitRadius ?? 0) < 5) {
    return `- P1: Title Level 1 orbit preview is not proven: levelPreview=${Boolean(composition.levelPreviewVisible)}; orbitRadius=${composition.orbitRadius ?? 'missing'}. ${composition.notes.join(' ')}`;
  }
  return '- P1: None from generated title composition diagnostics.';
}

function formatGameplayCameraSummary(camera: GameplayCameraState | undefined): string {
  if (!camera) return 'not captured';
  return `readable=${camera.readable}; active=${camera.active}; cameraDistance=${camera.cameraDistance}; screenHeight=${formatRatio(camera.playerScreenHeightRatio)}; screenOccupancy=${formatRatio(camera.playerScreenOccupancy)}; screenBounds=${formatScreenBounds(camera.playerScreenBounds)}`;
}

function formatGameplayCamera(camera: GameplayCameraState | undefined): string {
  if (!camera) return '- Gameplay camera diagnostics not captured.';
  return `- ${camera.readable ? 'PASS' : 'FAIL'} gameplay-camera: active=${camera.active}; readable=${camera.readable}; cameraDistance=${camera.cameraDistance}; target=(${camera.cameraTarget.x},${camera.cameraTarget.y},${camera.cameraTarget.z}); camera=(${camera.cameraPosition.x},${camera.cameraPosition.y},${camera.cameraPosition.z}); screenHeight=${formatRatio(camera.playerScreenHeightRatio)}; screenOccupancy=${formatRatio(camera.playerScreenOccupancy)}; screenBounds=${formatScreenBounds(camera.playerScreenBounds)}. ${camera.notes.join(' ')}`;
}

function describeGameplayCameraFindings(camera: GameplayCameraState | undefined): string {
  if (!camera) return '- P1: Gameplay camera diagnostics missing; tester cannot prove the closer player-readable camera framing.';
  if (!camera.readable || !camera.playerScreenBounds) {
    return `- P1: Gameplay camera is not close/readable enough from the active player screenshot: active=${camera.active}; readable=${camera.readable}; cameraDistance=${camera.cameraDistance}; screenHeight=${formatRatio(camera.playerScreenHeightRatio)}; screenOccupancy=${formatRatio(camera.playerScreenOccupancy)}. ${camera.notes.join(' ')}`;
  }
  if (camera.cameraDistance > 7.1 || camera.playerScreenHeightRatio < 0.12 || camera.playerScreenOccupancy < 0.004) {
    return `- P1: Gameplay camera metrics are below readability thresholds: cameraDistance=${camera.cameraDistance}; screenHeight=${formatRatio(camera.playerScreenHeightRatio)}; screenOccupancy=${formatRatio(camera.playerScreenOccupancy)}.`;
  }
  return '- P1: None from generated gameplay camera diagnostics.';
}

function formatGameplayViewDensitySummary(density: GameplayViewDensityState | undefined): string {
  if (!density) return 'not captured';
  return `grade=${density.grade}; screenshot=${density.screenshot}; bands=${density.bands.map((band) => `${band.id}:${band.grade}:${band.visibleObjectCount} objects/${band.tacticalCategoryCount} categories/${formatRatio(band.screenOccupancy)} occupancy/${formatRatio(band.negativeSpaceRatio)} negative`).join(', ')}`;
}

function formatGameplayViewDensity(density: GameplayViewDensityState | undefined): string {
  if (!density) return '- Gameplay view density diagnostics not captured.';
  const bands = density.bands.map((band) => {
    const objectSummary = band.objects
      .slice(0, 8)
      .map((object) => `${object.id}[${object.category}] d=${object.distanceFromPlayer}m area=${formatRatio(object.screenOccupancy)} bounds=${formatScreenBounds(object.screenBounds)}`)
      .join('; ');
    return `- ${band.grade.toUpperCase()} gameplay-view/${band.id}: ${band.label}; distance=${band.minDistance}..${band.maxDistance}m; visible=${band.visibleObjectCount}/${band.minVisibleObjects}; categories=${band.tacticalCategoryCount}/${band.minTacticalCategories}; occupancy=${formatRatio(band.screenOccupancy)} target=${formatRatio(band.minScreenOccupancy)}; negativeSpace=${formatRatio(band.negativeSpaceRatio)} max=${formatRatio(band.maxNegativeSpaceRatio)}; objects=${objectSummary || 'none'}. ${band.notes.join(' ')}`;
  });
  return [
    `- ${density.grade.toUpperCase()} gameplay-view-density: active=${density.active}; screenshot=${density.screenshot}; camera=(${density.cameraPosition.x},${density.cameraPosition.y},${density.cameraPosition.z}); player=(${density.playerPosition.x},${density.playerPosition.z}). ${density.notes.join(' ')}`,
    ...bands,
  ].join('\n');
}

function describeGameplayViewDensityFindings(density: GameplayViewDensityState | undefined): string {
  if (!density) return '- P1: Active gameplay-view density diagnostics missing; tester cannot prove foreground/midground/background detail from the player camera.';
  if (density.grade !== 'pass') {
    const failures = density.bands
      .filter((band) => band.grade !== 'pass')
      .map((band) => `${band.id}: ${band.visibleObjectCount}/${band.minVisibleObjects} objects, ${band.tacticalCategoryCount}/${band.minTacticalCategories} categories, ${formatRatio(band.screenOccupancy)}/${formatRatio(band.minScreenOccupancy)} occupancy, ${formatRatio(band.negativeSpaceRatio)}/${formatRatio(band.maxNegativeSpaceRatio)} negative-space risk`)
      .join('; ');
    return `- P1: Active gameplay camera lacks AAA-readable tactical density in ${density.screenshot}: ${failures}.`;
  }
  const negativeFailures = density.bands
    .filter((band) => typeof band.negativeSpaceRatio !== 'number' || typeof band.maxNegativeSpaceRatio !== 'number' || band.negativeSpaceRatio > band.maxNegativeSpaceRatio)
    .map((band) => `${band.id}: ${formatRatio(band.negativeSpaceRatio)}/${formatRatio(band.maxNegativeSpaceRatio)}`)
    .join('; ');
  if (negativeFailures) {
    return `- P1: Active gameplay camera has too much floor/wall negative space in ${density.screenshot}: ${negativeFailures}.`;
  }
  return '- P1: None from generated active gameplay-view density diagnostics.';
}

function formatMissionGuidanceSummary(guidance: MissionGuidanceState | undefined): string {
  if (!guidance) return 'not captured';
  return `active=${guidance.active}; target=${guidance.targetId ?? 'missing'}; kind=${guidance.targetKind}; action="${guidance.action}"; distance=${guidance.distanceMeters}m; direction=${guidance.compassDirection}; progress=${guidance.completedRequired}/${guidance.totalRequired}; exitUnlocked=${guidance.exitUnlocked}`;
}

function formatMissionGuidance(guidance: MissionGuidanceState | undefined): string {
  if (!guidance) return '- Mission guidance diagnostics not captured.';
  const status = guidance.active &&
    Boolean(guidance.targetId) &&
    (guidance.targetKind === 'objective' || guidance.targetKind === 'extraction') &&
    Number.isFinite(guidance.distanceMeters) &&
    /^(N|NE|E|SE|S|SW|W|NW)$/.test(guidance.compassDirection)
    ? 'PASS'
    : 'FAIL';
  return `- ${status} mission-guidance: target=${guidance.targetId ?? 'missing'}; kind=${guidance.targetKind}; label="${guidance.label}"; action="${guidance.action}"; distance=${guidance.distanceMeters}m; bearing=${guidance.bearingDegrees}; direction=${guidance.compassDirection}; targetPoint=${guidance.targetPoint ? `${guidance.targetPoint.x},${guidance.targetPoint.z}` : 'missing'}; unlocks=${guidance.unlocks.join(', ') || 'none'}; progress=${guidance.completedRequired}/${guidance.totalRequired}; exitUnlocked=${guidance.exitUnlocked}. ${guidance.notes.join(' ')}`;
}

function describeMissionGuidanceFindings(
  guidance: MissionGuidanceState | undefined,
  selectedMission: GameLevelDefinition | undefined,
): string {
  if (!guidance) return '- P1: Mission guidance diagnostics missing; tester cannot prove the HUD points players through the big mission space.';
  const expectedFirstObjective = selectedMission?.objectives.find((objective) => objective.required);
  if (!guidance.active) {
    return '- P1: Mission guidance is not active during the primary gameplay screenshot.';
  }
  if (!guidance.targetId || guidance.targetKind === 'complete') {
    return `- P1: Mission guidance does not identify the next objective or extraction target: ${JSON.stringify(guidance)}.`;
  }
  if (expectedFirstObjective && guidance.completedRequired === 0 && guidance.targetId !== expectedFirstObjective.id) {
    return `- P1: Mission guidance should start on ${expectedFirstObjective.id}, but points to ${guidance.targetId}.`;
  }
  if (!Number.isFinite(guidance.distanceMeters) || guidance.distanceMeters < 0) {
    return `- P1: Mission guidance has invalid distance evidence: ${guidance.distanceMeters}.`;
  }
  if (!/^(N|NE|E|SE|S|SW|W|NW)$/.test(guidance.compassDirection)) {
    return `- P1: Mission guidance has invalid compass direction: ${guidance.compassDirection}.`;
  }
  if (!guidance.targetPoint) {
    return '- P1: Mission guidance target coordinates are missing, so QA cannot prove the HUD is tied to authored world positions.';
  }
  return '- P1: None from generated mission guidance diagnostics.';
}

function formatScreenBounds(bounds: ScreenBounds | undefined): string {
  if (!bounds) return 'not captured';
  return `x=${bounds.min.x}..${bounds.max.x}, y=${bounds.min.y}..${bounds.max.y}, viewport=${bounds.viewport.width}x${bounds.viewport.height}, width=${formatRatio(bounds.widthRatio)}, height=${formatRatio(bounds.heightRatio)}, area=${formatRatio(bounds.areaRatio)}`;
}

function formatRatio(value: number | undefined): string {
  return typeof value === 'number' ? `${(value * 100).toFixed(1)}%` : 'missing';
}

function formatMs(value: number | undefined): string {
  return typeof value === 'number' ? `${value.toFixed(1)} ms` : 'missing';
}

function formatGeometryDiagnostics(geometry: GeometryDiagnostics | undefined): string {
  if (!geometry) return '- Geometry diagnostics not captured.';
  const doors = geometry.doorContinuity.map((check) => {
    const gapSummary = check.gaps.length > 0
      ? check.gaps.map((gap) => `${gap.label} ${gap.fromId}->${gap.toId}: ${formatMeters(gap.gap)} (${gap.axis} ${gap.fromEdge}->${gap.toEdge})`).join('; ')
      : `no gaps above ${formatMeters(check.epsilon)}`;
    return `- ${check.grade.toUpperCase()} door/${check.id}: axis=${check.axis}; walls=${check.wallIds.join(', ') || 'none'}; opening=${formatBounds(check.openingBounds)}; frame=${check.frameBounds ? formatBounds(check.frameBounds) : 'missing'}; continuity=${check.continuityBounds ? formatBounds(check.continuityBounds) : 'missing'}; ${gapSummary}`;
  });
  const dressing = (geometry.setDressingVisibility ?? []).map((check) => {
    return `- ${check.grade.toUpperCase()} set-dressing/${check.id}: asset=${check.asset}; loaded=${check.loaded}; visible=${check.visible}; grounded=${check.grounded}; coverage=${(check.footprintCoverage * 100).toFixed(1)}%; authored=${formatBounds(check.authoredBounds)}; rendered=${check.renderedBounds ? formatBounds(check.renderedBounds) : 'missing'}; ${check.notes.join(' ')}`;
  });
  const density = geometry.levelDensity;
  const zones = (density.zones ?? []).map((zone) => {
    return `- ${zone.grade.toUpperCase()} zone/${zone.id}: ${zone.label}; bounds=x=${zone.bounds.min.x}..${zone.bounds.max.x}, z=${zone.bounds.min.z}..${zone.bounds.max.z}; screenshot=${zone.screenshot ?? 'not mapped'}; floor=${zone.floorArea}m2; cover=${zone.coverFootprintArea}m2; dressing=${zone.setDressingFootprintArea}m2; gameplay=${zone.gameplayFootprintArea}m2; total=${zone.totalFootprintArea}m2 (${(zone.totalFootprintRatio * 100).toFixed(1)}%); blockers=${zone.blockerCount}; setDressing=${zone.setDressingCount}; objectives=${zone.objectiveCount}; enemies=${zone.enemyCount}; interactables=${zone.interactableCount}; landmarks=${zone.landmarkCount}/${zone.expectedLandmarks.length} (${zone.expectedLandmarks.join(', ')}). ${zone.notes.join(' ')}`;
  });
  return [
    ...doors,
    ...dressing,
    ...zones,
    `- ${density.grade.toUpperCase()} level-density: floor=${density.floorArea}m2; dressing=${density.setDressingFootprintArea}m2; ratio=${(density.setDressingRatio * 100).toFixed(1)}%; blockers=${density.blockerCount}; setDressing=${density.setDressingCount}; objectives=${density.objectiveCount}; enemies=${density.enemyCount}. ${density.notes.join(' ')}`,
  ].join('\n');
}

function formatWallRunContinuity(geometry: GeometryDiagnostics | undefined): string {
  if (!geometry) return '- Wall-run continuity diagnostics not captured.';
  if (!geometry.wallRunContinuity?.length) return '- FAIL wall-run/instrumentation: no sorted wall-run interval ledger was captured.';
  return geometry.wallRunContinuity.map((check) => {
    const intervals = check.intervals.map((interval) => `${interval.id}[${interval.kind}] ${formatMeters(interval.min)}..${formatMeters(interval.max)}`).join('; ');
    const connections = check.connections?.length
      ? check.connections.map((edge) => `${edge.fromId}->${edge.toId}:${edge.state}${edge.gap > 0 ? ` ${formatMeters(edge.gap)}` : ''}${edge.ownerId ? ` owner=${edge.ownerId}` : ''}`).join('; ')
      : 'missing connection graph';
    const ownership = check.doorOwnership?.length
      ? check.doorOwnership.map((row) => `${row.previousDoorId}->${row.nextDoorId}:${row.grade} span=${formatMeters(row.spanWidth)} owner=${row.ownerId ?? 'missing'} depth=${row.depthMatch}`).join('; ')
      : 'no adjacent door pairs on this wall line';
    const probes = check.cameraProbes?.length
      ? check.cameraProbes.map((probe) => `${probe.id}:${probe.grade} expected=${probe.expectedOwnerIds.join('/')} hit=${probe.actualOwnerId ?? probe.actualFirstHitId ?? 'none'} void=${probe.visibleVoid} screen=${formatScreenBounds(probe.screenRegion)}`).join('; ')
      : 'missing camera probes';
    const gaps = check.gaps.length > 0
      ? check.gaps.map((gap) => `${gap.fromId}->${gap.toId} ${formatMeters(gap.gap)} (${gap.axis} ${gap.fromEdge}->${gap.toEdge})`).join('; ')
      : `no unowned spans above ${formatMeters(check.epsilon)}`;
    return `- ${check.grade.toUpperCase()} wall-run/${check.id}: axis=${check.axis}; line=${check.line}; intervals=${intervals}; connections=${connections}; ownership=${ownership}; probes=${probes}; gaps=${gaps}`;
  }).join('\n');
}

function describeGeometryFindings(geometry: GeometryDiagnostics | undefined): string {
  if (!geometry) return '- P1: Coordinate geometry diagnostics missing.';
  const findings: string[] = [];
  for (const check of geometry.doorContinuity) {
    if (check.grade === 'fail') {
      findings.push(`- P1: Door-wall coordinate gaps for ${check.id}: ${check.gaps.map((gap) => `${gap.fromId}->${gap.toId} ${formatMeters(gap.gap)} on ${gap.axis}`).join('; ')}.`);
    } else if (check.grade === 'review') {
      findings.push(`- P2: Door-wall coordinate review for ${check.id}: ${check.notes.join(' ')}`);
    }
  }
  if (!geometry.wallRunContinuity?.length) {
    findings.push('- P1: Wall-run interval diagnostics missing; tester cannot prove spaces between doors and wall segments are connected.');
  } else {
    for (const check of geometry.wallRunContinuity) {
      if (!check.connections?.length) {
        findings.push(`- P1: Wall-run connection graph missing for ${check.id}; tester cannot prove adjacent walls, frames, returns, and continuity pieces connect.`);
      } else if (check.connections.some((edge) => edge.state === 'void')) {
        findings.push(`- P1: Wall-run connection graph has voids for ${check.id}: ${check.connections.filter((edge) => edge.state === 'void').map((edge) => `${edge.fromId}->${edge.toId} ${formatMeters(edge.gap)}`).join('; ')}.`);
      }
      if (!Array.isArray(check.doorOwnership)) {
        findings.push(`- P1: Door-to-door ownership rows missing for ${check.id}; future adjacent-door gaps cannot be proven.`);
      } else if (check.doorOwnership.some((row) => row.grade === 'fail')) {
        findings.push(`- P1: Door-to-door ownership failed for ${check.id}: ${check.doorOwnership.filter((row) => row.grade === 'fail').map((row) => `${row.previousDoorId}->${row.nextDoorId} span=${formatMeters(row.spanWidth)} owner=${row.ownerId ?? 'missing'}`).join('; ')}.`);
      }
      if (!check.cameraProbes?.length) {
        findings.push(`- P1: Camera probe rows missing for ${check.id}; tester cannot prove what the active camera sees through suspect wall/door pixels.`);
      } else if (check.cameraProbes.some((probe) => probe.grade === 'fail' || probe.visibleVoid)) {
        findings.push(`- P1: Wall-run camera probes failed for ${check.id}: ${check.cameraProbes.filter((probe) => probe.grade === 'fail' || probe.visibleVoid).map((probe) => `${probe.id} hit=${probe.actualOwnerId ?? probe.actualFirstHitId ?? 'none'} expected=${probe.expectedOwnerIds.join('/')}`).join('; ')}.`);
      }
      if (check.grade === 'fail' && check.gaps.length) {
        findings.push(`- P1: Wall-run coordinate gaps for ${check.id}: ${check.gaps.map((gap) => `${gap.fromId}->${gap.toId} ${formatMeters(gap.gap)} on ${gap.axis}`).join('; ')}.`);
      } else if (check.grade === 'review') {
        findings.push(`- P2: Wall-run coordinate review for ${check.id}: ${check.notes.join(' ')}`);
      }
    }
  }
  for (const check of geometry.setDressingVisibility ?? []) {
    if (check.grade !== 'pass') {
      findings.push(`- P1: Set-dressing placement ${check.id} failed coordinate/asset QA: ${check.notes.join(' ')}`);
    }
  }
  if (!geometry.levelDensity.zones?.length) {
    findings.push('- P1: Per-zone level density diagnostics missing; tester cannot prove large-level room density from the active camera.');
  } else {
    for (const zone of geometry.levelDensity.zones) {
      if (zone.totalFootprintRatio < aaaReadyZoneFootprintRatio) {
        findings.push(`- P1: Zone ${zone.id} is not AAA presentation-ready from its mapped gameplay screenshot (${zone.screenshot ?? 'no screenshot'}): ${(zone.totalFootprintRatio * 100).toFixed(1)}% tactical footprint is below the ${(aaaReadyZoneFootprintRatio * 100).toFixed(0)}% camera-readiness target. Add foreground, midground, and background props, cover silhouettes, decals, lighting fixtures, cables, security equipment, and objective context.`);
      }
      if (zone.grade === 'fail') {
        findings.push(`- P1: Zone ${zone.id} is below AAA density target: ${(zone.totalFootprintRatio * 100).toFixed(1)}% total footprint, landmarks ${zone.landmarkCount}/${zone.expectedLandmarks.length}. ${zone.notes.join(' ')}`);
      } else if (zone.grade === 'review') {
        findings.push(`- P2: Zone ${zone.id} needs density review: ${(zone.totalFootprintRatio * 100).toFixed(1)}% total footprint, landmarks ${zone.landmarkCount}/${zone.expectedLandmarks.length}. ${zone.notes.join(' ')}`);
      }
      if (zone.landmarkCount < zone.expectedLandmarks.length) {
        findings.push(`- P1: Zone ${zone.id} is missing expected landmarks: ${zone.expectedLandmarks.join(', ')}.`);
      }
      if (zone.interactableCount < 1) {
        findings.push(`- P1: Zone ${zone.id} has no interactable or door milestone in its authored bounds.`);
      }
    }
  }
  if (geometry.levelDensity.grade === 'fail') {
    findings.push(`- P1: Level density is below AAA presentation target: ${(geometry.levelDensity.setDressingRatio * 100).toFixed(1)}% floor coverage. ${geometry.levelDensity.notes.join(' ')}`);
  } else if (geometry.levelDensity.grade === 'review') {
    findings.push(`- P2: Level density needs review: ${(geometry.levelDensity.setDressingRatio * 100).toFixed(1)}% floor coverage. ${geometry.levelDensity.notes.join(' ')}`);
  }
  if (geometry.levelDensity.setDressingRatio < aaaReadyLevelFootprintRatio) {
    findings.push(`- P1: Whole-level AAA presentation readiness is not proven: ${(geometry.levelDensity.setDressingRatio * 100).toFixed(1)}% tactical footprint is below the ${(aaaReadyLevelFootprintRatio * 100).toFixed(0)}% readiness target, so the tester should still call out empty floor/wall reads despite functional density passing.`);
  }
  return findings.length > 0 ? findings.join('\n') : '- P1: None from generated coordinate geometry diagnostics.';
}

function formatBounds(bounds: Bounds3): string {
  return `x=${bounds.min.x}..${bounds.max.x}, y=${bounds.min.y}..${bounds.max.y}, z=${bounds.min.z}..${bounds.max.z}`;
}

function formatMeters(value: number): string {
  return value >= 9999 ? 'unbounded' : `${value}m`;
}

type ScreenshotCoverage = {
  present: readonly { file: string; bytes: number }[];
  missing: readonly string[];
  unexpected: readonly string[];
  totalBytes: number;
};

async function inspectScreenshotCoverage(dir: string): Promise<ScreenshotCoverage> {
  if (!existsSync(dir)) {
    return {
      present: [],
      missing: [...expectedScreenshots],
      unexpected: [],
      totalBytes: 0,
    };
  }

  const files = (await readdir(dir)).filter((file) => file.endsWith('.png')).sort();
  const expected = new Set<string>(expectedScreenshots);
  const present = await Promise.all(
    expectedScreenshots
      .filter((file) => files.includes(file))
      .map(async (file) => ({ file, bytes: (await stat(`${dir}/${file}`)).size })),
  );
  const missing = expectedScreenshots.filter((file) => !files.includes(file));
  const unexpected = files.filter((file) => !expected.has(file));
  return {
    present,
    missing,
    unexpected,
    totalBytes: present.reduce((sum, screenshot) => sum + screenshot.bytes, 0),
  };
}

function formatScreenshotCoverage(coverage: ScreenshotCoverage): string {
  const present = coverage.present.map((screenshot) => `- PASS screenshot/${screenshot.file}: captured (${formatKb(screenshot.bytes)})`);
  const missing = coverage.missing.map((file) => `- FAIL screenshot/${file}: expected capture missing.`);
  const unexpected = coverage.unexpected.map((file) => `- REVIEW screenshot/${file}: extra screenshot exists outside the expected QA set.`);
  return [...present, ...missing, ...unexpected].join('\n') || '- Screenshot coverage not captured.';
}

function describeScreenshotFindings(coverage: ScreenshotCoverage): string {
  const findings = coverage.missing.map((file) => `- P1: Expected QA screenshot missing: ${file}.`);
  findings.push(...coverage.unexpected.map((file) => `- P2: Unexpected QA screenshot was generated and should be reviewed or added to the expected set: ${file}.`));
  return findings.length > 0 ? findings.join('\n') : '- P1: None from generated screenshot coverage.';
}

function formatFailureRetrySummary(report: FailureRetryReport | null): string {
  if (!report) return 'not captured';
  return `level=${report.levelId}; contactEnemy=${report.contactEnemy?.id ?? 'missing'}; caughtPhase=${report.caught.phase}; caughtAlerts=${report.caught.alerts}; retryPhase=${report.retry.phase}; retryAlerts=${report.retry.alerts}; retryObjectives=${report.retry.objectives.collectedRequired}/${report.retry.objectives.totalRequired}; screenshots=${report.screenshots.length}`;
}

function formatFailureRetry(report: FailureRetryReport | null): string {
  if (!report) return '- Failure/retry diagnostics not captured.';
  const contact = report.contactEnemy
    ? `enemy=${report.contactEnemy.id}; pos=${formatPoint(report.contactEnemy.position)}${report.contactEnemy.detectionRadius === undefined ? '' : `; radius=${report.contactEnemy.detectionRadius}`}`
    : 'enemy=missing';
  const caughtDoors = report.caught.doors.map((door) => `${door.id}:${door.open ? 'open' : 'closed'}:${door.progress}`).join(', ');
  const retryDoors = report.retry.doors.map((door) => `${door.id}:${door.open ? 'open' : 'closed'}:${door.progress}`).join(', ');
  return [
    `- ${report.caught.phase === 'caught' && report.caught.alerts > 0 ? 'PASS' : 'FAIL'} caught-state: ${contact}; phase=${report.caught.phase}; alerts=${report.caught.alerts}; player=${formatPoint(report.caught.playerPosition)}; sentryAssetLoaded=${report.caught.sentryAssetLoaded}; enemyQualityPasses=${report.caught.enemyQualityCount}; panel=${JSON.stringify(report.caught.panelText)}; doors=${caughtDoors}`,
    `- ${report.retry.phase === 'tutorial' && report.retry.alerts === 0 && report.retry.objectives.collectedRequired === 0 && !report.retry.objectives.exitUnlocked ? 'PASS' : 'FAIL'} retry-reset: phase=${report.retry.phase}; alerts=${report.retry.alerts}; startDistance=${report.retry.playerStartDistance}; objectives=${report.retry.objectives.collectedRequired}/${report.retry.objectives.totalRequired}; exitUnlocked=${report.retry.objectives.exitUnlocked}; audio=${formatAudioState(report.retry.audio)}; loadingHistory=${report.retry.loadingHistoryCount}; doors=${retryDoors}`,
    `- ${report.pageErrors.length === 0 && report.consoleIssues.length === 0 ? 'PASS' : 'FAIL'} failure-route-console: pageErrors=${report.pageErrors.length}; consoleIssues=${report.consoleIssues.length}`,
    `- PASS failure-route-screenshots: ${report.screenshots.join(', ')}`,
  ].join('\n');
}

function describeFailureRetryFindings(report: FailureRetryReport | null): string {
  if (!report) {
    return '- P1: Failure/retry route diagnostics missing; tester cannot prove sentry contact, operation-failed overlay, or retry reset.';
  }
  const findings: string[] = [];
  if (report.caught.phase !== 'caught' || report.caught.alerts < 1) {
    findings.push(`- P1: Sentry contact did not prove caught phase plus alert count: phase=${report.caught.phase}; alerts=${report.caught.alerts}.`);
  }
  if (!/operation failed/i.test(report.caught.panelText) || !/sentry contact/i.test(report.caught.panelText) || !/retry/i.test(report.caught.panelText)) {
    findings.push(`- P1: Caught panel copy does not clearly communicate failure and retry: ${JSON.stringify(report.caught.panelText)}.`);
  }
  if (!report.caught.sentryAssetLoaded || report.caught.enemyQualityCount < 1) {
    findings.push(`- P1: Failure route does not prove sentry GLB/asset grading at contact: sentryAssetLoaded=${report.caught.sentryAssetLoaded}; enemyQualityCount=${report.caught.enemyQualityCount}.`);
  }
  if (
    report.retry.phase !== 'tutorial' ||
    report.retry.alerts !== 0 ||
    report.retry.objectives.collectedRequired !== 0 ||
    report.retry.objectives.exitUnlocked ||
    report.retry.playerStartDistance > 0.1 ||
    report.retry.doors.some((door) => door.open || door.progress > 0.01)
  ) {
    findings.push(`- P1: Retry did not reset to a clean mission tutorial state: ${JSON.stringify(report.retry)}.`);
  }
  if (report.pageErrors.length > 0 || report.consoleIssues.length > 0) {
    findings.push(`- P1: Failure/retry route logged browser issues: ${JSON.stringify({ pageErrors: report.pageErrors, consoleIssues: report.consoleIssues })}.`);
  }
  return findings.length > 0 ? findings.join('\n') : '- P1: None from generated failure/retry diagnostics.';
}

function formatPoint(point: { x: number; z: number }): string {
  return `(${point.x},${point.z})`;
}

function formatKb(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KB`;
}
