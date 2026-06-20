import { mkdir } from 'node:fs/promises';
import { chromium, type ConsoleMessage } from 'playwright';
import { PNG } from 'pngjs';
import packageInfo from '../package.json';

const baseUrl = process.env.SMOKE_URL ?? 'http://127.0.0.1:5173/';
const screenshotDir = process.env.SMOKE_SCREENSHOT_DIR ?? `artifacts/smoke/v${packageInfo.version}`;
const headless = process.env.SMOKE_HEADLESS !== 'false';

const browser = await chromium.launch({ headless });
const page = await browser.newPage({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1 });
const logs: string[] = [];
const pageErrors: string[] = [];

page.on('console', (message: ConsoleMessage) => {
  logs.push(`[${message.type()}] ${message.text()}`);
});
page.on('pageerror', (error) => pageErrors.push(error.message));

try {
  await mkdir(screenshotDir, { recursive: true });
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__shadowRecruitDebug?.ready(), undefined, { timeout: 30000 });
  await expectPhase('title');
  await expectNonblankCanvas();
  await page.screenshot({ path: `${screenshotDir}/01-title.png`, fullPage: true });

  await page.getByRole('button', { name: 'Start' }).click();
  await page.waitForSelector('[data-testid="hero-select-panel"]', { timeout: 12000 });
  await page.getByText('Echo Vanguard').click();
  await page.screenshot({ path: `${screenshotDir}/02-hero-select.png`, fullPage: true });
  await page.getByRole('button', { name: 'Start Level' }).click();
  await page.waitForSelector('[data-testid="tutorial-panel"]', { timeout: 45000 });
  await page.screenshot({ path: `${screenshotDir}/03-tutorial-general.png`, fullPage: true });

  for (let i = 0; i < 5; i += 1) {
    const button = page.getByRole('button', { name: /Next|Begin Mission/ });
    await button.click();
  }
  await expectPhase('playing');
  await page.evaluate(() => {
    window.__shadowRecruitDebug?.collectObjective('access-keycard');
    window.__shadowRecruitDebug?.collectObjective('security-terminal');
    window.__shadowRecruitDebug?.collectObjective('command-codes');
    window.__shadowRecruitDebug?.movePlayerTo({ x: 0, z: 33 });
  });
  await expectPhase('complete');
  await page.screenshot({ path: `${screenshotDir}/04-complete.png`, fullPage: true });

  const state = await page.evaluate(() => window.__shadowRecruitDebug?.captureTesterState());
  if (!state || state.objectives.collectedRequired !== state.objectives.totalRequired) {
    throw new Error(`Expected completed objectives, got ${JSON.stringify(state)}`);
  }
  if (state.renderer.drawCalls <= 0 || state.renderer.triangles <= 0) {
    throw new Error(`Expected live renderer metrics, got ${JSON.stringify(state.renderer)}`);
  }

  const errorLogs = logs
    .filter((line) => /^\[(error|warning)\]/i.test(line))
    .filter((line) => !/ReadPixels|GL Driver Message/i.test(line));
  if (pageErrors.length > 0 || errorLogs.some((line) => !/autoplay/i.test(line))) {
    throw new Error(`Unexpected browser errors: ${JSON.stringify({ pageErrors, errorLogs })}`);
  }

  console.info(`[browser-smoke] wrote screenshots to ${screenshotDir}`);
} finally {
  await browser.close();
}

async function expectPhase(phase: string): Promise<void> {
  await page.waitForFunction((expected) => window.__shadowRecruitDebug?.phase() === expected, phase, { timeout: 30000 });
}

async function expectNonblankCanvas(): Promise<void> {
  const canvas = page.locator('canvas');
  await canvas.waitFor({ state: 'visible', timeout: 10000 });
  const buffer = await canvas.screenshot();
  const png = PNG.sync.read(buffer);
  let visible = 0;
  for (let index = 0; index < png.data.length; index += 4) {
    const alpha = png.data[index + 3];
    const luma = png.data[index] + png.data[index + 1] + png.data[index + 2];
    if (alpha > 0 && luma > 40) visible += 1;
  }
  if (visible < png.width * png.height * 0.08) {
    throw new Error(`Canvas appears blank: ${visible}/${png.width * png.height}`);
  }
}
