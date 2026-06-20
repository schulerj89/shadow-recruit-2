import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import packageInfo from '../package.json';

const baseUrl = process.env.FPS_URL ?? 'http://127.0.0.1:5173/';
const outputDir = process.env.FPS_OUTPUT_DIR ?? `artifacts/fps/v${packageInfo.version}`;
const headless = process.env.FPS_HEADLESS === 'true';
const targetFrameMs = Number(process.env.FPS_TARGET_FRAME_MS ?? 16.7);
const toleranceMs = Number(process.env.FPS_TOLERANCE_MS ?? 0.4);
const maxP95FrameMs = Number(process.env.FPS_MAX_P95_MS ?? 20);
const sampleCount = Number(process.env.FPS_SAMPLE_COUNT ?? 240);

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
  await page.evaluate(async () => {
    await window.__shadowRecruitDebug?.startGame('shadow-operative');
    while (window.__shadowRecruitDebug?.phase() === 'tutorial') {
      document.querySelector<HTMLButtonElement>('[data-action="skip-tutorial"]')?.click();
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  });
  await page.waitForFunction(() => window.__shadowRecruitDebug?.phase() === 'playing', undefined, { timeout: 30000 });
  await page.evaluate(() => window.__shadowRecruitDebug?.resetFramePacing?.());
  await page.waitForTimeout(Math.max(3000, sampleCount * 20));
  const state = await page.evaluate(() => window.__shadowRecruitDebug?.captureTesterState());
  if (!state) throw new Error('Missing tester state.');

  const gamePacing = state.framePacing;
  const strictTargetMet = gamePacing.frameMs <= targetFrameMs + toleranceMs && gamePacing.p95FrameMs <= maxP95FrameMs;
  const browserCanProve60 = browserBaseline.frameMs <= targetFrameMs + toleranceMs;
  const tracksBaseline = gamePacing.frameMs <= browserBaseline.frameMs + toleranceMs &&
    gamePacing.p95FrameMs <= browserBaseline.p95FrameMs + toleranceMs;
  const result = {
    ...state,
    browserBaseline,
    fpsGate: {
      targetFrameMs,
      toleranceMs,
      maxP95FrameMs,
      strictTargetMet,
      browserCanProve60,
      tracksBaseline,
      status: strictTargetMet ? 'pass' : browserCanProve60 ? 'fail' : tracksBaseline ? 'environment-limited' : 'fail',
    },
  };

  await writeFile(`${outputDir}/metrics.json`, JSON.stringify(result, null, 2));
  await page.screenshot({ path: `${outputDir}/fps-gameplay.png`, fullPage: true });

  if (result.fpsGate.status === 'fail') {
    throw new Error(`Frame pacing gate failed: ${JSON.stringify(result.fpsGate)} ${JSON.stringify(gamePacing)}`);
  }
  console.info(`[fps-gate] ${JSON.stringify(result.fpsGate)} game=${JSON.stringify(gamePacing)} baseline=${JSON.stringify(browserBaseline)} wrote ${outputDir}/metrics.json`);
} finally {
  await browser.close();
}

async function measureBrowserBaseline(): Promise<{ fps: number; frameMs: number; latestFrameMs: number; p95FrameMs: number; samples: number }> {
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
