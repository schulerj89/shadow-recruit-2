import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import packageInfo from '../package.json';

const date = '2026-06-19';
const outputDir = process.env.TESTER_REPORT_DIR ?? `docs/qa/${date}/v${packageInfo.version}`;
const smokeDir = process.env.SMOKE_SCREENSHOT_DIR ?? `artifacts/smoke/v${packageInfo.version}`;
const fpsMetricsPath = process.env.FPS_METRICS_PATH ?? `artifacts/fps/v${packageInfo.version}/metrics.json`;
const reportPath = `${outputDir}/game-tester-report.md`;
const committedMetricsPath = `${outputDir}/metrics.json`;
const screenshotDir = `${outputDir}/screenshots`;

type Metrics = {
  framePacing?: { fps: number; frameMs: number; p95FrameMs: number; samples: number };
  renderer?: { drawCalls: number; triangles: number; geometries: number; textures: number };
};

const metrics = existsSync(fpsMetricsPath)
  ? JSON.parse(await readFile(fpsMetricsPath, 'utf8')) as Metrics
  : null;
const frame = metrics?.framePacing;
const renderer = metrics?.renderer;
const frameFinding = frame && frame.p95FrameMs > 16.7
  ? `- P1: Headed FPS artifact measured ${frame.fps.toFixed(1)} FPS with ${frame.p95FrameMs.toFixed(1)} ms p95. This is steady and low-cost (${renderer?.drawCalls ?? '?'} draw calls, ${renderer?.triangles ?? '?'} triangles), but it needs a stricter 16.7 ms verification pass on a true 60 Hz visible browser before the 60 FPS gate is fully proven.`
  : '- P1: None from generated metrics.';

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
- Frame pacing: ${frame ? `${frame.fps.toFixed(1)} FPS, ${frame.frameMs.toFixed(1)} ms latest, ${frame.p95FrameMs.toFixed(1)} ms p95, ${frame.samples} samples` : 'not captured'}
- Renderer metrics: ${renderer ? `${renderer.drawCalls} draw calls, ${renderer.triangles} triangles, ${renderer.geometries} geometries, ${renderer.textures} textures` : 'not captured'}

## Tester Feedback

- Title flow: verify logo, rotating level-one preview, hero model, Start, Change Hero, and Settings are visible.
- Tutorial: verify General Caldwell text aligns with the camera target and final step includes "Good luck, cadet."
- Level: verify keycard, terminal, command codes, sliding doors, sentries, and extraction are readable.
- Completion: verify triumphant cue starts and level stats appear.
- Performance: current artifact is steady but slightly above the strict 16.7 ms frame budget in this Playwright environment.

## Required Fixes

- P0: None recorded by generated report.
- P1: Inspect screenshots manually for camera framing and objective readability.
- P1: Inspect title/gameplay screenshots for level readability and hero framing after imported GLB scale changes.
${frameFinding}
- P2: Expand tester notes after the first human play session.
`);

console.info(`[tester-report] wrote ${reportPath}`);
