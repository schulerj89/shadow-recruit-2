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
  const titleHeroVisible = await page.evaluate(() => window.__shadowRecruitDebug?.playerVisible());
  if (!titleHeroVisible) {
    throw new Error('Expected title hero model to be visible.');
  }
  await page.screenshot({ path: `${screenshotDir}/01-title.png`, fullPage: true });

  await page.getByRole('button', { name: 'Settings' }).click();
  await page.waitForSelector('[data-testid="settings-panel"]', { timeout: 12000 });
  await page.getByLabel('Debug overlays').check();
  await page.getByLabel('Mute audio').check();
  await page.getByLabel('Performance profile').selectOption('performance');
  await page.screenshot({ path: `${screenshotDir}/02-settings.png`, fullPage: true });
  const settings = await page.evaluate(() => window.__shadowRecruitDebug?.settings());
  if (!settings?.debug || !settings.muted || settings.performanceProfile !== 'performance') {
    throw new Error(`Expected settings to update, got ${JSON.stringify(settings)}`);
  }
  await page.getByRole('button', { name: 'Back' }).click();
  await expectPhase('title');

  await page.getByRole('button', { name: 'Start' }).click();
  await page.waitForSelector('[data-testid="hero-select-panel"]', { timeout: 12000 });
  await page.getByText('Echo Vanguard').click();
  const selectedHero = await page.evaluate(() => window.__shadowRecruitDebug?.selectedHero());
  if (selectedHero !== 'echo-vanguard') {
    throw new Error(`Expected Echo Vanguard selection, got ${selectedHero}`);
  }
  const selectedHeroVisible = await page.evaluate(() => window.__shadowRecruitDebug?.playerVisible());
  if (!selectedHeroVisible) {
    throw new Error('Expected selected hero preview to remain visible.');
  }
  await page.screenshot({ path: `${screenshotDir}/03-hero-select.png`, fullPage: true });
  await page.getByRole('button', { name: 'Start Level' }).click();
  await page.waitForSelector('[data-testid="tutorial-panel"]', { timeout: 45000 });

  const tutorialSteps = [
    { id: 'hero', title: 'Insertion', target: 'hero' },
    { id: 'keycard', title: 'First Lock', target: 'access-keycard' },
    { id: 'terminal', title: 'Security Stack', target: 'security-terminal' },
    { id: 'sentry', title: 'Avoid Contact', target: 'sentry-lobby' },
    { id: 'extraction', title: 'Extraction', target: 'extraction' },
  ];
  for (let i = 0; i < tutorialSteps.length; i += 1) {
    const expected = tutorialSteps[i];
    const tutorial = await page.evaluate(() => window.__shadowRecruitDebug?.tutorialStep());
    if (!tutorial?.step || tutorial.index !== i || tutorial.total !== tutorialSteps.length) {
      throw new Error(`Expected tutorial index ${i}, got ${JSON.stringify(tutorial)}`);
    }
    if (tutorial.step.id !== expected.id || tutorial.step.title !== expected.title || tutorial.step.target !== expected.target) {
      throw new Error(`Unexpected tutorial step: ${JSON.stringify({ expected, tutorial })}`);
    }
    if (expected.id === 'extraction' && !/good luck, cadet/i.test(tutorial.step.text)) {
      throw new Error(`Final tutorial step must end with Good luck, cadet: ${tutorial.step.text}`);
    }
    await page.screenshot({ path: `${screenshotDir}/${String(i + 4).padStart(2, '0')}-tutorial-${expected.id}.png`, fullPage: true });
    const button = page.getByRole('button', { name: /Next|Begin Mission/ });
    await button.click();
  }
  await expectPhase('playing');
  await page.locator('[data-testid="debug-panel"]').waitFor({ state: 'visible', timeout: 10000 });
  await collectObjectiveAndExpectFocus('access-keycard', 'lobby-door', '09-focus-lobby-door.png');
  await collectObjectiveAndExpectFocus('security-terminal', 'server-door', '10-focus-server-door.png');
  await collectObjectiveAndExpectFocus('command-codes', 'extraction-door', '11-focus-extraction-door.png');
  await page.evaluate(() => {
    window.__shadowRecruitDebug?.movePlayerTo({ x: 0, z: 33 });
  });
  await expectPhase('complete');
  await page.screenshot({ path: `${screenshotDir}/12-complete.png`, fullPage: true });

  const state = await page.evaluate(() => window.__shadowRecruitDebug?.captureTesterState());
  if (!state || state.objectives.collectedRequired !== state.objectives.totalRequired) {
    throw new Error(`Expected completed objectives, got ${JSON.stringify(state)}`);
  }
  if (state.renderer.drawCalls <= 0 || state.renderer.triangles <= 0) {
    throw new Error(`Expected live renderer metrics, got ${JSON.stringify(state.renderer)}`);
  }
  if (state.memory.loadedAssets < 6 || !state.memory.loadedAssetIds.includes('sentry') || !state.memory.loadedAssetIds.includes('codes')) {
    throw new Error(`Expected loaded GLB asset metrics, got ${JSON.stringify(state.memory)}`);
  }
  if (!state.settings.debug || !state.settings.muted || state.settings.performanceProfile !== 'performance') {
    throw new Error(`Expected persisted settings in tester state, got ${JSON.stringify(state.settings)}`);
  }
  if (state.renderer.pixelRatio > 0.75) {
    throw new Error(`Expected performance profile pixel ratio cap, got ${state.renderer.pixelRatio}`);
  }
  if (state.renderer.performanceProfile !== 'performance' || state.renderer.shadowsEnabled) {
    throw new Error(`Expected performance render quality without shadows, got ${JSON.stringify(state.renderer)}`);
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

async function collectObjectiveAndExpectFocus(objectiveId: string, doorId: string, screenshotName: string): Promise<void> {
  await page.evaluate((id) => window.__shadowRecruitDebug?.collectObjective(id), objectiveId);
  await expectPhase('cinematic-focus');
  const focus = await page.evaluate(() => window.__shadowRecruitDebug?.cinematicFocus());
  if (!focus?.active || focus.target !== doorId || focus.remainingMs <= 0) {
    throw new Error(`Expected ${doorId} cinematic focus after ${objectiveId}, got ${JSON.stringify(focus)}`);
  }
  const doors = await page.evaluate(() => window.__shadowRecruitDebug?.doors());
  if (!doors?.find((door) => door.id === doorId && door.open)) {
    throw new Error(`Expected ${doorId} to be open, got ${JSON.stringify(doors)}`);
  }
  await page.screenshot({ path: `${screenshotDir}/${screenshotName}`, fullPage: true });
  await expectPhase('playing');
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
