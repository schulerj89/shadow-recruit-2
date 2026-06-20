import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import packageInfo from '../package.json';

const qaDate = process.env.QA_DATE ?? '2026-06-20';
const baseUrl = process.env.SCREENSHOT_URL ?? 'http://127.0.0.1:5173/';
const qaDir = process.env.SCREENSHOT_QA_DIR ?? `docs/qa/${qaDate}/v${packageInfo.version}`;
const outputDir = process.env.SCREENSHOT_OUTPUT_DIR ?? `${qaDir}/screenshots`;
const headless = process.env.SCREENSHOT_HEADLESS !== 'false';

const browser = await chromium.launch({ headless });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });

try {
  await mkdir(outputDir, { recursive: true });
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__shadowRecruitDebug?.ready(), undefined, { timeout: 30000 });
  await page.evaluate(() => window.__shadowRecruitDebug?.setPerformanceProfile('performance'));
  const titleComposition = await page.evaluate(() => window.__shadowRecruitDebug?.titleComposition());
  await writeFile(`${qaDir}/title-composition.json`, JSON.stringify(titleComposition, null, 2));
  if (!titleComposition?.heroReadable || titleComposition.facingDot < 0.65) {
    throw new Error(`Title hero is not readable from camera: ${JSON.stringify(titleComposition)}`);
  }
  await page.screenshot({ path: `${outputDir}/title.png`, fullPage: true });
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.waitForSelector('[data-testid="settings-panel"]', { timeout: 12000 });
  await page.screenshot({ path: `${outputDir}/settings.png`, fullPage: true });
  await page.getByRole('button', { name: 'Back' }).click();
  await page.waitForFunction(() => window.__shadowRecruitDebug?.phase() === 'title', undefined, { timeout: 30000 });
  await page.getByRole('button', { name: 'Start' }).click();
  await page.waitForSelector('[data-testid="hero-select-panel"]', { timeout: 12000 });
  await page.screenshot({ path: `${outputDir}/hero-select.png`, fullPage: true });
  await page.getByRole('button', { name: 'Start Level' }).click();
  await page.waitForSelector('[data-testid="tutorial-panel"]', { timeout: 45000 });
  for (const name of ['insertion', 'keycard', 'terminal', 'sentry', 'extraction']) {
    const tutorial = await page.evaluate(() => window.__shadowRecruitDebug?.tutorialStep());
    await page.screenshot({ path: `${outputDir}/tutorial-${String((tutorial?.index ?? 0) + 1).padStart(2, '0')}-${name}.png`, fullPage: true });
    await page.getByRole('button', { name: /Next|Begin Mission/ }).click();
  }
  await page.waitForFunction(() => window.__shadowRecruitDebug?.phase() === 'playing', undefined, { timeout: 30000 });
  await page.evaluate(() => window.__shadowRecruitDebug?.teleportPlayerTo({ x: -24, z: -25 }));
  await page.waitForFunction(() => window.__shadowRecruitDebug?.phase() === 'playing', undefined, { timeout: 30000 });
  await page.screenshot({ path: `${outputDir}/gameplay-level-one.png`, fullPage: true });
  await captureDoorFocus('access-keycard', 'lobby-door');
  await captureDoorFocus('security-terminal', 'server-door');
  await page.evaluate(() => window.__shadowRecruitDebug?.teleportPlayerTo({ x: -33, z: 13 }));
  await page.screenshot({ path: `${outputDir}/gameplay-command-codes.png`, fullPage: true });
  await captureDoorFocus('command-codes', 'extraction-door');
  await page.evaluate(() => window.__shadowRecruitDebug?.movePlayerTo({ x: 0, z: 33 }));
  await page.screenshot({ path: `${outputDir}/complete.png`, fullPage: true });
  console.info(`[screenshots] wrote screenshots to ${outputDir}`);
} finally {
  await browser.close();
}

async function captureDoorFocus(objectiveId: string, doorId: string): Promise<void> {
  await page.evaluate((id) => window.__shadowRecruitDebug?.collectObjective(id), objectiveId);
  await page.waitForFunction(
    (expected) => window.__shadowRecruitDebug?.cinematicFocus().active &&
      window.__shadowRecruitDebug?.cinematicFocus().target === expected,
    doorId,
    { timeout: 30000 },
  );
  await page.screenshot({ path: `${outputDir}/focus-${doorId}.png`, fullPage: true });
  await page.waitForFunction(() => window.__shadowRecruitDebug?.phase() === 'playing', undefined, { timeout: 30000 });
}
