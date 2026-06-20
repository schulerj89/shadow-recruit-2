import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import packageInfo from '../package.json';

const baseUrl = process.env.FPS_URL ?? 'http://127.0.0.1:5173/';
const outputDir = process.env.FPS_OUTPUT_DIR ?? `artifacts/fps/v${packageInfo.version}`;
const headless = process.env.FPS_HEADLESS === 'true';
const maxMedianFrameMs = Number(process.env.FPS_MAX_MEDIAN_MS ?? 20);
const maxP95FrameMs = Number(process.env.FPS_MAX_P95_MS ?? 34);

const browser = await chromium.launch({
  headless,
  args: ['--disable-background-timer-throttling', '--disable-renderer-backgrounding'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });

try {
  await mkdir(outputDir, { recursive: true });
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
  await page.waitForTimeout(8000);
  const state = await page.evaluate(() => window.__shadowRecruitDebug?.captureTesterState());
  await writeFile(`${outputDir}/metrics.json`, JSON.stringify(state, null, 2));
  await page.screenshot({ path: `${outputDir}/fps-gameplay.png`, fullPage: true });

  if (!state) throw new Error('Missing tester state.');
  if (state.framePacing.frameMs > maxMedianFrameMs || state.framePacing.p95FrameMs > maxP95FrameMs) {
    throw new Error(`Frame pacing gate failed: ${JSON.stringify(state.framePacing)}`);
  }
  console.info(`[fps-gate] ${JSON.stringify(state.framePacing)} wrote ${outputDir}/metrics.json`);
} finally {
  await browser.close();
}
