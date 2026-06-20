import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import packageInfo from '../package.json';
import type { FramePacingSample, Phase, RendererMetrics, TesterState } from '../src/game/types';

type BrowserBaseline = {
  fps: number;
  frameMs: number;
  latestFrameMs: number;
  p95FrameMs: number;
  samples: number;
};

type FpsGateStatus = 'pass' | 'environment-limited' | 'fail';
type FpsSceneId = 'title' | 'gameplay' | 'complete' | 'caught';

type FpsSceneGate = {
  performanceProfile: string;
  targetFrameMs: number;
  toleranceMs: number;
  maxP95FrameMs: number;
  baselineOverheadBudgetMs: number;
  baselineP95OverheadBudgetMs: number;
  frameOverheadMs: number;
  p95OverheadMs: number;
  browserBaselineHeadroomMs: number;
  gameHeadroomMs: number;
  strictTargetMet: boolean;
  browserCanProve60: boolean;
  tracksBaseline: boolean;
  status: FpsGateStatus;
};

type FpsSceneSample = {
  id: FpsSceneId;
  label: string;
  phase: Phase;
  screenshot: string;
  framePacing: FramePacingSample;
  renderer: RendererMetrics;
  audioTrack: TesterState['audio']['activeTrack'];
  titleComposition?: TesterState['titleComposition'];
  fpsGate: FpsSceneGate;
};

type CapturedFpsScene = {
  sample: FpsSceneSample;
  state: TesterState;
};

const baseUrl = process.env.FPS_URL ?? 'http://127.0.0.1:5173/';
const outputDir = process.env.FPS_OUTPUT_DIR ?? `artifacts/fps/v${packageInfo.version}`;
const headless = process.env.FPS_HEADLESS === 'true';
const targetFrameMs = Number(process.env.FPS_TARGET_FRAME_MS ?? 16.7);
const toleranceMs = Number(process.env.FPS_TOLERANCE_MS ?? 0.4);
const maxP95FrameMs = Number(process.env.FPS_MAX_P95_MS ?? 20);
const baselineOverheadBudgetMs = Number(process.env.FPS_BASELINE_OVERHEAD_MS ?? 0.4);
const baselineP95OverheadBudgetMs = Number(process.env.FPS_BASELINE_P95_OVERHEAD_MS ?? 0.6);
const sampleCount = Number(process.env.FPS_SAMPLE_COUNT ?? 240);
const performanceProfile = process.env.FPS_PROFILE ?? 'performance';

const browser = await chromium.launch({
  headless,
  args: ['--disable-background-timer-throttling', '--disable-renderer-backgrounding'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });

try {
  await mkdir(outputDir, { recursive: true });
  const browserBaseline = await measureBrowserBaseline();
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__shadowRecruitDebug?.ready(), undefined, { timeout: 30000 });
  await page.evaluate((profile) => window.__shadowRecruitDebug?.setPerformanceProfile(profile), performanceProfile);

  const title = await sampleScene('title', 'Title hero and menu', 'fps-title.png', async () => {
    await page.evaluate(() => {
      window.__shadowRecruitDebug?.setTitleOrbitAngle(0.35);
    });
    await page.waitForFunction(() => window.__shadowRecruitDebug?.phase() === 'title', undefined, { timeout: 30000 });
  }, browserBaseline);

  const gameplay = await sampleScene('gameplay', 'Active gameplay camera', 'fps-gameplay.png', async () => {
    await startPlaying();
  }, browserBaseline);

  const complete = await sampleScene('complete', 'Mission complete screen', 'fps-complete.png', async () => {
    await startPlaying();
    await page.evaluate(() => window.__shadowRecruitDebug?.forceSuccess());
    await page.waitForFunction(() => window.__shadowRecruitDebug?.phase() === 'complete', undefined, { timeout: 30000 });
  }, browserBaseline);

  const caught = await sampleScene('caught', 'Sentry caught failure screen', 'fps-caught.png', async () => {
    await startPlaying();
    const contactEnemy = await page.evaluate(() => window.__shadowRecruitDebug?.enemies()[0] ?? null) as
      | { position: { x: number; z: number } }
      | null;
    if (contactEnemy) {
      await page.evaluate((point) => window.__shadowRecruitDebug?.teleportPlayerTo(point), contactEnemy.position);
    } else {
      await page.evaluate(() => window.__shadowRecruitDebug?.forceAlert());
    }
    await page.waitForFunction(() => window.__shadowRecruitDebug?.phase() === 'caught', undefined, { timeout: 30000 });
  }, browserBaseline);

  const scenes = [title, gameplay, complete, caught];
  const fpsScenes = scenes.map((scene) => scene.sample);
  const result = {
    ...gameplay.state,
    browserBaseline,
    fpsScenes,
    fpsGate: summarizeOverallGate(fpsScenes, browserBaseline),
  };

  await writeFile(`${outputDir}/metrics.json`, JSON.stringify(result, null, 2));

  if (result.fpsGate.status === 'fail') {
    throw new Error(`Frame pacing gate failed: ${JSON.stringify(result.fpsGate)} scenes=${JSON.stringify(fpsScenes)}`);
  }
  console.info(`[fps-gate] ${JSON.stringify(result.fpsGate)} scenes=${fpsScenes.map((scene) => `${scene.id}:${scene.fpsGate.status}:${scene.framePacing.frameMs.toFixed(1)}ms/${scene.framePacing.p95FrameMs.toFixed(1)}ms`).join(', ')} baseline=${JSON.stringify(browserBaseline)} wrote ${outputDir}/metrics.json`);
} finally {
  await browser.close();
}

async function startPlaying(): Promise<void> {
  await page.evaluate(async (profile) => {
    window.__shadowRecruitDebug?.setPerformanceProfile(profile);
    await window.__shadowRecruitDebug?.startGame('shadow-operative');
    while (window.__shadowRecruitDebug?.phase() === 'tutorial') {
      document.querySelector<HTMLButtonElement>('[data-action="skip-tutorial"]')?.click();
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }, performanceProfile);
  await page.waitForFunction(() => window.__shadowRecruitDebug?.phase() === 'playing', undefined, { timeout: 30000 });
}

async function sampleScene(
  id: FpsSceneId,
  label: string,
  screenshot: string,
  setup: () => Promise<void>,
  browserBaseline: BrowserBaseline,
): Promise<CapturedFpsScene> {
  await setup();
  await page.evaluate(() => window.__shadowRecruitDebug?.resetFramePacing?.());
  await page.waitForTimeout(Math.max(3000, sampleCount * 20));
  const state = await page.evaluate(() => window.__shadowRecruitDebug?.captureTesterState());
  if (!state) throw new Error(`Missing tester state for FPS scene ${id}.`);
  await page.screenshot({ path: `${outputDir}/${screenshot}`, fullPage: true });
  const fpsGate = evaluateFramePacing(state.framePacing, browserBaseline);
  return {
    state,
    sample: {
      id,
      label,
      phase: state.phase,
      screenshot: `${outputDir}/${screenshot}`,
      framePacing: state.framePacing,
      renderer: state.renderer,
      audioTrack: state.audio.activeTrack,
      ...(id === 'title' ? { titleComposition: state.titleComposition } : {}),
      fpsGate,
    },
  };
}

function evaluateFramePacing(gamePacing: FramePacingSample, browserBaseline: BrowserBaseline): FpsSceneGate {
  const strictTargetMet = gamePacing.frameMs <= targetFrameMs + toleranceMs && gamePacing.p95FrameMs <= maxP95FrameMs;
  const browserCanProve60 = browserBaseline.frameMs <= targetFrameMs + toleranceMs;
  const frameOverheadMs = roundMetric(gamePacing.frameMs - browserBaseline.frameMs);
  const p95OverheadMs = roundMetric(gamePacing.p95FrameMs - browserBaseline.p95FrameMs);
  const browserBaselineHeadroomMs = roundMetric(targetFrameMs + toleranceMs - browserBaseline.frameMs);
  const gameHeadroomMs = roundMetric(targetFrameMs + toleranceMs - gamePacing.frameMs);
  const tracksBaseline = frameOverheadMs <= baselineOverheadBudgetMs &&
    p95OverheadMs <= baselineP95OverheadBudgetMs;
  return {
    performanceProfile,
    targetFrameMs,
    toleranceMs,
    maxP95FrameMs,
    baselineOverheadBudgetMs,
    baselineP95OverheadBudgetMs,
    frameOverheadMs,
    p95OverheadMs,
    browserBaselineHeadroomMs,
    gameHeadroomMs,
    strictTargetMet,
    browserCanProve60,
    tracksBaseline,
    status: strictTargetMet ? 'pass' : browserCanProve60 ? 'fail' : tracksBaseline ? 'environment-limited' : 'fail',
  };
}

function summarizeOverallGate(
  fpsScenes: readonly FpsSceneSample[],
  browserBaseline: BrowserBaseline,
): FpsSceneGate & {
  sceneCount: number;
  failingScenes: readonly FpsSceneId[];
  environmentLimitedScenes: readonly FpsSceneId[];
} {
  const allStrict = fpsScenes.every((scene) => scene.fpsGate.strictTargetMet);
  const tracksBaseline = fpsScenes.every((scene) => scene.fpsGate.tracksBaseline);
  const browserCanProve60 = browserBaseline.frameMs <= targetFrameMs + toleranceMs;
  const failingScenes = fpsScenes
    .filter((scene) => scene.fpsGate.status === 'fail')
    .map((scene) => scene.id);
  const environmentLimitedScenes = fpsScenes
    .filter((scene) => scene.fpsGate.status === 'environment-limited')
    .map((scene) => scene.id);
  const status: FpsGateStatus = allStrict
    ? 'pass'
    : browserCanProve60 || failingScenes.length > 0 || !tracksBaseline
      ? 'fail'
      : 'environment-limited';
  return {
    performanceProfile,
    targetFrameMs,
    toleranceMs,
    maxP95FrameMs,
    baselineOverheadBudgetMs,
    baselineP95OverheadBudgetMs,
    frameOverheadMs: Math.max(...fpsScenes.map((scene) => scene.fpsGate.frameOverheadMs)),
    p95OverheadMs: Math.max(...fpsScenes.map((scene) => scene.fpsGate.p95OverheadMs)),
    browserBaselineHeadroomMs: roundMetric(targetFrameMs + toleranceMs - browserBaseline.frameMs),
    gameHeadroomMs: Math.min(...fpsScenes.map((scene) => scene.fpsGate.gameHeadroomMs)),
    strictTargetMet: allStrict,
    browserCanProve60,
    tracksBaseline,
    status,
    sceneCount: fpsScenes.length,
    failingScenes,
    environmentLimitedScenes,
  };
}

async function measureBrowserBaseline(): Promise<BrowserBaseline> {
  await page.goto('about:blank');
  await page.setContent('<!doctype html><title>fps baseline</title><body style="margin:0;background:#05070b"></body>');
  await page.waitForTimeout(500);
  return page.evaluate(`(async () => {
    const samplesToCollect = ${JSON.stringify(sampleCount)};
    const deltas = [];
    let last = performance.now();
    await new Promise((resolve) => {
      function tick(now) {
        deltas.push(now - last);
        last = now;
        if (deltas.length >= samplesToCollect) resolve();
        else requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
    const sorted = [...deltas].sort((a, b) => a - b);
    const latest = deltas[deltas.length - 1] ?? 16.7;
    const median = sorted[Math.floor(sorted.length * 0.5)] ?? latest;
    const p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))] ?? latest;
    return {
      fps: median > 0 ? 1000 / median : 0,
      frameMs: median,
      latestFrameMs: latest,
      p95FrameMs: p95,
      samples: deltas.length,
    };
  })()`);
}

function roundMetric(value: number): number {
  return Math.round(value * 1000) / 1000;
}
