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
const screenshotDir = `${outputDir}/screenshots`;
const expectedScreenshots = [
  'title.png',
  'settings.png',
  'hero-select.png',
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
  memory?: { loadedAssets: number; characterAssets: number; staticAssets: number; loadedAssetIds: readonly string[] };
  assetQuality?: readonly AssetQualityCheck[];
  settings?: { debug: boolean; muted: boolean; performanceProfile: string };
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

const metrics = existsSync(fpsMetricsPath)
  ? JSON.parse(await readFile(fpsMetricsPath, 'utf8')) as Metrics
  : null;
const playthroughReport = existsSync(playthroughReportPath)
  ? await readFile(playthroughReportPath, 'utf8')
  : null;
const playthrough = playthroughReport ? JSON.parse(playthroughReport) : null;
const completion = playthrough?.finalState?.completion;
const frame = metrics?.framePacing;
const baseline = metrics?.browserBaseline;
const fpsGate = metrics?.fpsGate;
const renderer = metrics?.renderer;
const memory = metrics?.memory;
const assetQuality = metrics?.assetQuality ?? [];
const settings = metrics?.settings;
const frameFinding = describeFrameFinding(frame, baseline, fpsGate);
const assetFindings = describeAssetFindings(assetQuality);
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
- Loaded assets: ${memory ? `${memory.loadedAssets} total (${memory.characterAssets} character, ${memory.staticAssets} static): ${memory.loadedAssetIds.join(', ')}` : 'not captured'}
- Asset grades: ${assetQuality.length > 0 ? describeAssetSummary(assetQuality) : 'not captured'}
- Completion stats: ${completion ? `active=${completion.active}; objectives=${completion.objectivesCompleted}/${completion.objectivesTotal}; alerts=${completion.alerts}; cue=${completion.triumphantCue ? 'triumphant' : 'missing'}; elapsed=${completion.elapsedSeconds}s` : 'not captured'}
- Settings state: ${settings ? `debug=${settings.debug}; muted=${settings.muted}; performance=${settings.performanceProfile}` : 'not captured'}

## Asset Grading

${formatAssetGrades(assetQuality)}

## Screenshot Coverage

${formatScreenshotCoverage(screenshotCoverage)}

## Tester Feedback

- Title flow: verify logo, rotating level-one preview, staged hero model, hero-select preview space, Start, Change Hero, and Settings are visible.
- Tutorial: verify all five General Caldwell screenshots align with hero, keycard, terminal, sentry, and extraction targets, and every step ends with "Good luck, cadet."
- Level: verify keycard, terminal, command codes, sentries, extraction, wall/floor meshes, wall/floor texture quality, and all three door-focus screenshots are readable and properly grounded.
- Playthrough: verify the browser route uses the authored validation route, keyboard interaction, door-focus pauses, and extraction completion without sentry contact.
- Camera QA: verify the normal gameplay screenshot is captured before objective interaction, with debug teleports snapping the gameplay camera to the current player position.
- Asset QA: verify objective GLBs, sentry GLBs, floor/wall meshes, floor/wall/object texture quality, door-panel clarity, wall-door gaps/seams, and extraction marker pass or have explicit review notes.
- Completion: verify triumphant cue starts and level stats appear.
- Performance: ${describePerformance(frame, baseline, fpsGate)}

## Required Fixes

- P0: None recorded by generated report.
${frameFinding}
${assetFindings}
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
