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
  memory?: { loadedAssets: number; characterAssets: number; staticAssets: number; loadedAssetIds: readonly string[]; failedAssetIds?: readonly string[] };
  audio?: AudioState;
  assetQuality?: readonly AssetQualityCheck[];
  geometry?: GeometryDiagnostics;
  titleComposition?: TitleComposition;
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
  heroPosition?: { x: number; y: number; z: number };
  cameraPosition: { x: number; y: number; z: number };
  cameraTarget: { x: number; y: number; z: number };
  levelPreviewBounds?: Bounds3;
  notes: readonly string[];
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
    notes: readonly string[];
  };
};

const metrics = existsSync(fpsMetricsPath)
  ? JSON.parse(await readFile(fpsMetricsPath, 'utf8')) as Metrics
  : null;
const playthroughReport = existsSync(playthroughReportPath)
  ? await readFile(playthroughReportPath, 'utf8')
  : null;
const playthrough = playthroughReport ? JSON.parse(playthroughReport) : null;
const titleComposition = existsSync(titleCompositionPath)
  ? JSON.parse(await readFile(titleCompositionPath, 'utf8')) as TitleComposition
  : metrics?.titleComposition;
const completion = playthrough?.finalState?.completion;
const frame = metrics?.framePacing;
const baseline = metrics?.browserBaseline;
const fpsGate = metrics?.fpsGate;
const renderer = metrics?.renderer;
const memory = metrics?.memory;
const assetQuality = metrics?.assetQuality ?? [];
const geometry = metrics?.geometry ?? (playthrough?.finalState?.geometry as GeometryDiagnostics | undefined);
const loading = metrics?.loading ?? (playthrough?.finalState?.loading as LoadingState | undefined);
const settings = metrics?.settings;
const metricAudio = metrics?.audio;
const completionAudio = playthrough?.finalState?.audio as AudioState | undefined;
const playthroughSettings = playthrough?.finalState?.settings as { debug: boolean; muted: boolean; performanceProfile: string } | undefined;
const frameFinding = describeFrameFinding(frame, baseline, fpsGate);
const assetFindings = describeAssetFindings(assetQuality);
const geometryFindings = describeGeometryFindings(geometry);
const titleFindings = describeTitleFindings(titleComposition);
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
- Screenshot coverage: ${screenshotCoverage.present.length}/${expectedScreenshots.length} expected captures present (${formatKb(screenshotCoverage.totalBytes)})
- Metrics available: ${metrics ? 'yes' : 'no'}
- Game frame pacing: ${frame ? `${frame.fps.toFixed(1)} FPS, ${frame.frameMs.toFixed(1)} ms median, ${(frame.latestFrameMs ?? frame.frameMs).toFixed(1)} ms latest, ${frame.p95FrameMs.toFixed(1)} ms p95, ${frame.samples} samples` : 'not captured'}
- Browser baseline: ${baseline ? `${baseline.fps.toFixed(1)} FPS, ${baseline.frameMs.toFixed(1)} ms median, ${baseline.p95FrameMs.toFixed(1)} ms p95, ${baseline.samples} samples` : 'not captured'}
- FPS gate: ${fpsGate ? `${fpsGate.status}; profile=${fpsGate.performanceProfile ?? settings?.performanceProfile ?? 'unknown'}; strictTarget=${fpsGate.strictTargetMet}; browserCanProve60=${fpsGate.browserCanProve60}; tracksBaseline=${fpsGate.tracksBaseline}` : 'not captured'}
- Renderer metrics: ${renderer ? `${renderer.drawCalls} draw calls, ${renderer.triangles} triangles, ${renderer.geometries} geometries, ${renderer.textures} textures, profile=${renderer.performanceProfile ?? settings?.performanceProfile ?? 'unknown'}, shadows=${renderer.shadowsEnabled ?? 'unknown'}, shadowMap=${renderer.shadowMapSize ?? 'unknown'}` : 'not captured'}
- Loaded assets: ${memory ? `${memory.loadedAssets} total (${memory.characterAssets} character, ${memory.staticAssets} static): ${memory.loadedAssetIds.join(', ')}${memory.failedAssetIds?.length ? `; failed optional assets: ${memory.failedAssetIds.join(', ')}` : ''}` : 'not captured'}
- Audio state: gameplay metrics=${formatAudioState(metricAudio)}; completion playthrough=${formatAudioState(completionAudio)}
- Asset grades: ${assetQuality.length > 0 ? describeAssetSummary(assetQuality) : 'not captured'}
- Loading state: ${loading ? `${loading.history.length} steps; latest="${loading.label}" ${(loading.value * 100).toFixed(0)}%; captured=${loading.history.map((step) => `${step.label}:${(step.value * 100).toFixed(0)}%`).join(' -> ')}` : 'not captured'}
- Title composition: ${titleComposition ? `heroReadable=${titleComposition.heroReadable}; levelPreview=${Boolean(titleComposition.levelPreviewVisible)}; facingDot=${titleComposition.facingDot}; cameraDistance=${titleComposition.cameraDistance}; orbitAngle=${titleComposition.orbitAngle ?? 'unknown'}; orbitRadius=${titleComposition.orbitRadius ?? 'unknown'}; heroYaw=${titleComposition.heroYaw}; yawToCamera=${titleComposition.yawToCamera}` : 'not captured'}
- Geometry diagnostics: ${geometry ? `${geometry.objectBounds.length} object bounds; ${geometry.doorContinuity.length} door checks; ${geometry.wallRunContinuity?.length ?? 0} wall-run checks; levelDensity=${geometry.levelDensity.grade} (${(geometry.levelDensity.setDressingRatio * 100).toFixed(1)}%)` : 'not captured'}
- Completion stats: ${completion ? `active=${completion.active}; objectives=${completion.objectivesCompleted}/${completion.objectivesTotal}; alerts=${completion.alerts}; cue=${completion.triumphantCue ? 'triumphant' : 'missing'}; elapsed=${completion.elapsedSeconds}s` : 'not captured'}
- Settings state: ${settings ? `debug=${settings.debug}; muted=${settings.muted}; performance=${settings.performanceProfile}` : 'not captured'}

## Coordinate QA

${formatGeometryDiagnostics(geometry)}

## Wall-Run Interval QA

${formatWallRunContinuity(geometry)}

## Asset Grading

${formatAssetGrades(assetQuality)}

## Screenshot Coverage

${formatScreenshotCoverage(screenshotCoverage)}

## Tester Feedback

- Title flow: verify the native title treatment, cinematic scene, staged hero model, hero-select preview space, Start, Change Hero, and Settings are visible.
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
${describeLoadingFindings(loading)}
${audioFindings}
${assetFindings}
${titleFindings}
${geometryFindings}
${screenshotFindings}
`);

console.info(`[tester-report] wrote ${reportPath}`);

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
  if (!composition.heroReadable) {
    return `- P1: Title hero is not readable from the camera: facingDot=${composition.facingDot}; cameraDistance=${composition.cameraDistance}; heroYaw=${composition.heroYaw}; yawToCamera=${composition.yawToCamera}. ${composition.notes.join(' ')}`;
  }
  if (!composition.levelPreviewVisible || (composition.orbitRadius ?? 0) < 5) {
    return `- P1: Title Level 1 orbit preview is not proven: levelPreview=${Boolean(composition.levelPreviewVisible)}; orbitRadius=${composition.orbitRadius ?? 'missing'}. ${composition.notes.join(' ')}`;
  }
  return '- P1: None from generated title composition diagnostics.';
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
  return [
    ...doors,
    ...dressing,
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
