import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import packageInfo from '../package.json';

const date = process.env.QA_DATE ?? '2026-06-20';
const outputDir = process.env.TESTER_REPORT_DIR ?? `docs/qa/${date}/v${packageInfo.version}`;
const smokeDir = process.env.SMOKE_SCREENSHOT_DIR ?? `artifacts/smoke/v${packageInfo.version}`;
const playthroughReportPath = process.env.PLAYTHROUGH_REPORT_PATH ?? `artifacts/playthrough/v${packageInfo.version}/playthrough-report.json`;
const fpsMetricsPath = process.env.FPS_METRICS_PATH ?? `artifacts/fps/v${packageInfo.version}/metrics.json`;
const reportPath = `${outputDir}/game-tester-report.md`;
const committedMetricsPath = `${outputDir}/metrics.json`;
const committedPlaythroughPath = `${outputDir}/playthrough-report.json`;
const titleCompositionPath = `${outputDir}/title-composition.json`;
const tutorialAlignmentPath = `${outputDir}/tutorial-alignment.json`;
const missionCatalogPath = `${outputDir}/mission-catalog.json`;
const screenshotDir = `${outputDir}/screenshots`;
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
] as const;

type Metrics = {
  levelId?: string;
  missionCatalog?: readonly LevelCatalogEntry[];
  framePacing?: { fps: number; frameMs: number; latestFrameMs?: number; p95FrameMs: number; samples: number };
  browserBaseline?: { fps: number; frameMs: number; latestFrameMs?: number; p95FrameMs: number; samples: number };
  fpsGate?: {
    targetFrameMs: number;
    toleranceMs: number;
    maxP95FrameMs: number;
    strictTargetMet: boolean;
    browserCanProve60: boolean;
    tracksBaseline: boolean;
    status: 'pass' | 'environment-limited' | 'fail';
    performanceProfile?: string;
  };
  renderer?: {
    performanceProfile?: string;
    shadowsEnabled?: boolean;
    shadowMapSize?: number;
    drawCalls: number;
    triangles: number;
    geometries: number;
    textures: number;
  };
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
  tutorialAlignment?: readonly TutorialAlignmentCheck[];
  loading?: LoadingState;
  settings?: { debug: boolean; muted: boolean; performanceProfile: string };
};

type LoadingStep = {
  label: string;
  value: number;
  elapsedMs: number;
};

type LoadingState = {
  active: boolean;
  label: string;
  value: number;
  history: readonly LoadingStep[];
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

type WallRunContinuityCheck = {
  id: string;
  axis: 'x' | 'z';
  line: number;
  grade: 'pass' | 'review' | 'fail';
  epsilon: number;
  intervals: readonly WallRunInterval[];
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
const missionCatalogArtifact = existsSync(missionCatalogPath)
  ? JSON.parse(await readFile(missionCatalogPath, 'utf8')) as MissionCatalogArtifact
  : null;
const titleComposition = existsSync(titleCompositionPath)
  ? JSON.parse(await readFile(titleCompositionPath, 'utf8')) as TitleComposition
  : metrics?.titleComposition;
const tutorialAlignment = existsSync(tutorialAlignmentPath)
  ? JSON.parse(await readFile(tutorialAlignmentPath, 'utf8')) as readonly TutorialAlignmentCheck[]
  : metrics?.tutorialAlignment ?? [];
const completion = playthrough?.finalState?.completion;
const frame = metrics?.framePacing;
const baseline = metrics?.browserBaseline;
const fpsGate = metrics?.fpsGate;
const renderer = metrics?.renderer;
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
const missionBrief = missionCatalogArtifact?.missionBrief;
const frameFinding = describeFrameFinding(frame, baseline, fpsGate);
const missionCatalogFindings = describeMissionCatalogFindings(missionCatalog, selectedMissionId, missionBrief);
const assetAuditFindings = describeAssetAuditFindings(assetAudit);
const assetFindings = describeAssetFindings(assetQuality);
const geometryFindings = describeGeometryFindings(geometry);
const titleFindings = describeTitleFindings(titleComposition);
const tutorialFindings = describeTutorialFindings(tutorialAlignment);
const audioFindings = describeAudioFindings(metricAudio, completionAudio, settings, playthroughSettings);
const screenshotCoverage = await inspectScreenshotCoverage(screenshotDir);
const screenshotFindings = describeScreenshotFindings(screenshotCoverage);

await mkdir(outputDir, { recursive: true });
if (metrics) {
  await writeFile(committedMetricsPath, JSON.stringify(metrics, null, 2));
}
if (playthroughReport) {
  await writeFile(committedPlaythroughPath, playthroughReport);
}
await writeFile(reportPath, `# Shadow Recruit 2 Game Tester Report

Build: v${packageInfo.version}
Date: ${date}

## Evidence

- Smoke screenshots: \`${smokeDir}\`
- Browser playthrough: \`${committedPlaythroughPath}\` (${playthroughReport ? 'captured' : 'not captured'})
- Committed screenshots: \`${screenshotDir}\`
- FPS metrics: \`${committedMetricsPath}\`
- Mission catalog evidence: \`${missionCatalogPath}\` (${missionCatalogArtifact ? 'captured' : 'not captured'})
- Screenshot coverage: ${screenshotCoverage.present.length}/${expectedScreenshots.length} expected captures present (${formatKb(screenshotCoverage.totalBytes)})
- Metrics available: ${metrics ? 'yes' : 'no'}
- Mission catalog: ${formatMissionCatalogSummary(missionCatalog, selectedMissionId, missionBrief)}
- Game frame pacing: ${frame ? `${frame.fps.toFixed(1)} FPS, ${frame.frameMs.toFixed(1)} ms median, ${(frame.latestFrameMs ?? frame.frameMs).toFixed(1)} ms latest, ${frame.p95FrameMs.toFixed(1)} ms p95, ${frame.samples} samples` : 'not captured'}
- Browser baseline: ${baseline ? `${baseline.fps.toFixed(1)} FPS, ${baseline.frameMs.toFixed(1)} ms median, ${baseline.p95FrameMs.toFixed(1)} ms p95, ${baseline.samples} samples` : 'not captured'}
- FPS gate: ${fpsGate ? `${fpsGate.status}; profile=${fpsGate.performanceProfile ?? settings?.performanceProfile ?? 'unknown'}; strictTarget=${fpsGate.strictTargetMet}; browserCanProve60=${fpsGate.browserCanProve60}; tracksBaseline=${fpsGate.tracksBaseline}` : 'not captured'}
- Renderer metrics: ${renderer ? `${renderer.drawCalls} draw calls, ${renderer.triangles} triangles, ${renderer.geometries} geometries, ${renderer.textures} textures, profile=${renderer.performanceProfile ?? settings?.performanceProfile ?? 'unknown'}, shadows=${renderer.shadowsEnabled ?? 'unknown'}, shadowMap=${renderer.shadowMapSize ?? 'unknown'}` : 'not captured'}
- Loaded assets: ${memory ? `${memory.loadedAssets} total (${memory.characterAssets} character, ${memory.staticAssets} static): ${memory.loadedAssetIds.join(', ')}${memory.failedAssetIds?.length ? `; failed optional assets: ${memory.failedAssetIds.join(', ')}` : ''}` : 'not captured'}
- Runtime asset audit: ${assetAudit.length > 0 ? describeAssetAuditSummary(assetAudit) : 'not captured'}
- Audio state: gameplay metrics=${formatAudioState(metricAudio)}; completion playthrough=${formatAudioState(completionAudio)}
- Asset grades: ${assetQuality.length > 0 ? describeAssetSummary(assetQuality) : 'not captured'}
- Loading state: ${loading ? `${loading.history.length} steps; latest="${loading.label}" ${(loading.value * 100).toFixed(0)}%; captured=${loading.history.map((step) => `${step.label}:${(step.value * 100).toFixed(0)}%`).join(' -> ')}` : 'not captured'}
- Tutorial alignment: ${describeTutorialSummary(tutorialAlignment)}
- Title composition: ${titleComposition ? `heroReadable=${titleComposition.heroReadable}; levelPreview=${Boolean(titleComposition.levelPreviewVisible)}; facingDot=${titleComposition.facingDot}; cameraDistance=${titleComposition.cameraDistance}; screenHeight=${formatRatio(titleComposition.heroScreenHeightRatio)}; screenOccupancy=${formatRatio(titleComposition.heroScreenOccupancy)}; screenBounds=${formatScreenBounds(titleComposition.heroScreenBounds)}; orbitAngle=${titleComposition.orbitAngle ?? 'unknown'}; orbitRadius=${titleComposition.orbitRadius ?? 'unknown'}; heroYaw=${titleComposition.heroYaw}; yawToCamera=${titleComposition.yawToCamera}` : 'not captured'}
- Title treatment: ${titleComposition?.titleTreatment ? `wordmarkReadable=${titleComposition.titleTreatment.wordmarkReadable}; text="${titleComposition.titleTreatment.wordmarkText}"; kicker="${titleComposition.titleTreatment.kickerText}"; bounds=${formatScreenBounds(titleComposition.titleTreatment.wordmarkBounds)}; panelOverlap=${formatRatio(titleComposition.titleTreatment.panelOverlapRatio)}; heroOverlap=${formatRatio(titleComposition.titleTreatment.heroOverlapRatio)}` : 'not captured'}
- Geometry diagnostics: ${geometry ? `${geometry.objectBounds.length} object bounds; ${geometry.doorContinuity.length} door checks; ${geometry.wallRunContinuity?.length ?? 0} wall-run checks; levelDensity=${geometry.levelDensity.grade} (${(geometry.levelDensity.setDressingRatio * 100).toFixed(1)}%); zones=${geometry.levelDensity.zones?.map((zone) => `${zone.id}:${zone.grade}:${(zone.totalFootprintRatio * 100).toFixed(1)}%`).join(', ') ?? 'not captured'}` : 'not captured'}
- Completion stats: ${completion ? `active=${completion.active}; objectives=${completion.objectivesCompleted}/${completion.objectivesTotal}; alerts=${completion.alerts}; cue=${completion.triumphantCue ? 'triumphant' : 'missing'}; elapsed=${completion.elapsedSeconds}s` : 'not captured'}
- Settings state: ${settings ? `debug=${settings.debug}; muted=${settings.muted}; performance=${settings.performanceProfile}` : 'not captured'}

## Coordinate QA

${formatGeometryDiagnostics(geometry)}

## Tutorial Alignment QA

${formatTutorialAlignment(tutorialAlignment)}

## Mission Catalog QA

${formatMissionCatalog(missionCatalog, selectedMissionId, missionBrief)}

## Wall-Run Interval QA

${formatWallRunContinuity(geometry)}

## Asset Grading

${formatAssetGrades(assetQuality)}

## Runtime Asset Provenance

${formatAssetAudit(assetAudit)}

## Screenshot Coverage

${formatScreenshotCoverage(screenshotCoverage)}

## Tester Feedback

- Title flow: verify the native title treatment, cinematic scene, staged hero model, hero-select preview space, Start, Change Hero, and Settings are visible.
- Mission catalog: verify the player-facing mission selector is visible before mission start, reflects the active level, and exposes objective/enemy counts for future big levels.
- Tutorial: verify all five General Caldwell screenshots align with hero, keycard, terminal, sentry, and extraction targets, and every step ends with "Good luck, cadet."
- Level: verify keycard, terminal, command codes, sentries, extraction, wall/floor meshes, wall/floor texture quality, and all three door-focus screenshots are readable and properly grounded.
- Playthrough: verify the browser route uses the authored validation route, keyboard interaction, door-focus pauses, and extraction completion without sentry contact.
- Coordinate QA: verify door/wall continuity by edge coordinates, not screenshot impression alone. Wall gaps must name door ID, wall IDs, frame/continuity bounds, and measured gap widths.
- Camera QA: verify the normal gameplay screenshot is captured before objective interaction, with debug teleports snapping the gameplay camera to the current player position.
- Asset QA: verify objective GLBs, sentry GLBs, floor/wall meshes, floor/wall/object texture quality, door-panel clarity, wall-door gaps/seams, and extraction marker pass or have explicit review notes.
- Completion: verify triumphant cue starts and level stats appear.
- Performance: ${describePerformance(frame, baseline, fpsGate)}

## Required Fixes

- P0: None recorded by generated report.
${frameFinding}
${missionCatalogFindings}
${describeLoadingFindings(loading)}
${audioFindings}
${assetAuditFindings}
${tutorialFindings}
${assetFindings}
${titleFindings}
${geometryFindings}
${screenshotFindings}
`);

console.info(`[tester-report] wrote ${reportPath}`);

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
  }
  for (const mission of catalog) {
    if (mission.objectiveCount <= 0) findings.push(`- P1: Mission ${mission.id} exposes no required objectives in the catalog.`);
    if (mission.enemyCount <= 0) findings.push(`- P1: Mission ${mission.id} exposes no sentry/enemy count in the catalog.`);
  }
  return findings.length > 0 ? findings.join('\n') : '- P1: None from generated mission catalog diagnostics.';
}

function describeFrameFinding(
  frame: Metrics['framePacing'] | undefined,
  baseline: Metrics['browserBaseline'] | undefined,
  fpsGate: Metrics['fpsGate'] | undefined
): string {
  if (!frame) return '- P1: FPS metrics missing.';
  if (fpsGate?.status === 'pass') return '- P1: None from generated FPS metrics.';
  if (fpsGate?.status === 'environment-limited' && baseline) {
    const profile = fpsGate.performanceProfile ? ` on the ${fpsGate.performanceProfile} profile` : '';
    return `- P1: Current headed browser baseline measured ${baseline.fps.toFixed(1)} FPS / ${baseline.frameMs.toFixed(1)} ms median and cannot prove strict 16.7 ms${profile}. The game tracks that baseline within tolerance, so rerun on a true 60 Hz visible browser before marking the 60 FPS gate fully proven.`;
  }
  return `- P1: Game FPS gate failed at ${frame.fps.toFixed(1)} FPS / ${frame.frameMs.toFixed(1)} ms median / ${frame.p95FrameMs.toFixed(1)} ms p95 against the configured frame budget.`;
}

function describePerformance(
  frame: Metrics['framePacing'] | undefined,
  baseline: Metrics['browserBaseline'] | undefined,
  fpsGate: Metrics['fpsGate'] | undefined
): string {
  if (!frame) return 'FPS metrics were not captured.';
  if (fpsGate?.status === 'pass') return 'game frame pacing passed the configured 60 FPS gate.';
  if (fpsGate?.status === 'environment-limited' && baseline) {
    return `game pacing matches the ${baseline.fps.toFixed(1)} FPS browser baseline, but this environment cannot prove strict 16.7 ms frame cadence.`;
  }
  return 'game frame pacing failed the configured FPS gate and needs optimization or a lower-quality fallback.';
}

function describeAssetSummary(checks: readonly AssetQualityCheck[]): string {
  const pass = checks.filter((check) => check.grade === 'pass').length;
  const review = checks.filter((check) => check.grade === 'review').length;
  const fail = checks.filter((check) => check.grade === 'fail').length;
  return `${pass} pass, ${review} review, ${fail} fail`;
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

function formatScreenBounds(bounds: ScreenBounds | undefined): string {
  if (!bounds) return 'not captured';
  return `x=${bounds.min.x}..${bounds.max.x}, y=${bounds.min.y}..${bounds.max.y}, viewport=${bounds.viewport.width}x${bounds.viewport.height}, width=${formatRatio(bounds.widthRatio)}, height=${formatRatio(bounds.heightRatio)}, area=${formatRatio(bounds.areaRatio)}`;
}

function formatRatio(value: number | undefined): string {
  return typeof value === 'number' ? `${(value * 100).toFixed(1)}%` : 'missing';
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
    const gaps = check.gaps.length > 0
      ? check.gaps.map((gap) => `${gap.fromId}->${gap.toId} ${formatMeters(gap.gap)} (${gap.axis} ${gap.fromEdge}->${gap.toEdge})`).join('; ')
      : `no unowned spans above ${formatMeters(check.epsilon)}`;
    return `- ${check.grade.toUpperCase()} wall-run/${check.id}: axis=${check.axis}; line=${check.line}; intervals=${intervals}; gaps=${gaps}`;
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
      if (check.grade === 'fail') {
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

function formatKb(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KB`;
}
