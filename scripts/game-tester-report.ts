import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import packageInfo from '../package.json';

const date = process.env.QA_DATE ?? '2026-06-20';
const outputDir = process.env.TESTER_REPORT_DIR ?? `docs/qa/${date}/v${packageInfo.version}`;
const smokeDir = process.env.SMOKE_SCREENSHOT_DIR ?? `artifacts/smoke/v${packageInfo.version}`;
const fpsMetricsPath = process.env.FPS_METRICS_PATH ?? `artifacts/fps/v${packageInfo.version}/metrics.json`;
const reportPath = `${outputDir}/game-tester-report.md`;
const committedMetricsPath = `${outputDir}/metrics.json`;
const screenshotDir = `${outputDir}/screenshots`;

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
  };
  renderer?: { drawCalls: number; triangles: number; geometries: number; textures: number };
  memory?: { loadedAssets: number; characterAssets: number; staticAssets: number; loadedAssetIds: readonly string[] };
  settings?: { debug: boolean; muted: boolean; performanceProfile: string };
};

const metrics = existsSync(fpsMetricsPath)
  ? JSON.parse(await readFile(fpsMetricsPath, 'utf8')) as Metrics
  : null;
const frame = metrics?.framePacing;
const baseline = metrics?.browserBaseline;
const fpsGate = metrics?.fpsGate;
const renderer = metrics?.renderer;
const memory = metrics?.memory;
const settings = metrics?.settings;
const frameFinding = describeFrameFinding(frame, baseline, fpsGate);

await mkdir(outputDir, { recursive: true });
if (metrics) {
  await writeFile(committedMetricsPath, JSON.stringify(metrics, null, 2));
}
await writeFile(reportPath, `# Shadow Recruit 2 Game Tester Report

Build: v${packageInfo.version}
Date: ${date}

## Evidence

- Smoke screenshots: \`${smokeDir}\`
- Committed screenshots: \`${screenshotDir}\`
- FPS metrics: \`${committedMetricsPath}\`
- Metrics available: ${metrics ? 'yes' : 'no'}
- Game frame pacing: ${frame ? `${frame.fps.toFixed(1)} FPS, ${frame.frameMs.toFixed(1)} ms median, ${(frame.latestFrameMs ?? frame.frameMs).toFixed(1)} ms latest, ${frame.p95FrameMs.toFixed(1)} ms p95, ${frame.samples} samples` : 'not captured'}
- Browser baseline: ${baseline ? `${baseline.fps.toFixed(1)} FPS, ${baseline.frameMs.toFixed(1)} ms median, ${baseline.p95FrameMs.toFixed(1)} ms p95, ${baseline.samples} samples` : 'not captured'}
- FPS gate: ${fpsGate ? `${fpsGate.status}; strictTarget=${fpsGate.strictTargetMet}; browserCanProve60=${fpsGate.browserCanProve60}; tracksBaseline=${fpsGate.tracksBaseline}` : 'not captured'}
- Renderer metrics: ${renderer ? `${renderer.drawCalls} draw calls, ${renderer.triangles} triangles, ${renderer.geometries} geometries, ${renderer.textures} textures` : 'not captured'}
- Loaded assets: ${memory ? `${memory.loadedAssets} total (${memory.characterAssets} character, ${memory.staticAssets} static): ${memory.loadedAssetIds.join(', ')}` : 'not captured'}
- Settings state: ${settings ? `debug=${settings.debug}; muted=${settings.muted}; performance=${settings.performanceProfile}` : 'not captured'}

## Tester Feedback

- Title flow: verify logo, rotating level-one preview, hero model, Start, Change Hero, and Settings are visible.
- Tutorial: verify all five General Caldwell screenshots align with hero, keycard, terminal, sentry, and extraction targets, and the final step includes "Good luck, cadet."
- Level: verify keycard, terminal, command codes, sentries, extraction, and all three door-focus screenshots are readable.
- Completion: verify triumphant cue starts and level stats appear.
- Performance: ${describePerformance(frame, baseline, fpsGate)}

## Required Fixes

- P0: None recorded by generated report.
- P1: Inspect screenshots manually for camera framing and objective readability.
- P1: Inspect title/gameplay screenshots for level readability and hero framing after imported GLB scale changes.
${frameFinding}
- P2: Expand tester notes after the first human play session.
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
    return `- P1: Current headed browser baseline measured ${baseline.fps.toFixed(1)} FPS / ${baseline.frameMs.toFixed(1)} ms median and cannot prove strict 16.7 ms. The game tracks that baseline within tolerance, so rerun on a true 60 Hz visible browser before marking the 60 FPS gate fully proven.`;
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
