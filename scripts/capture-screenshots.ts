import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import packageInfo from '../package.json';

const qaDate = process.env.QA_DATE ?? '2026-06-20';
const baseUrl = process.env.SCREENSHOT_URL ?? 'http://127.0.0.1:5173/';
const outputDir = process.env.SCREENSHOT_OUTPUT_DIR ?? `docs/qa/${qaDate}/v${packageInfo.version}/screenshots`;
const headless = process.env.SCREENSHOT_HEADLESS !== 'false';

const browser = await chromium.launch({ headless });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });

try {
  await mkdir(outputDir, { recursive: true });
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__shadowRecruitDebug?.ready(), undefined, { timeout: 30000 });
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
  await page.screenshot({ path: `${outputDir}/tutorial-general.png`, fullPage: true });
  await page.getByRole('button', { name: 'Skip' }).click();
  await page.waitForFunction(() => window.__shadowRecruitDebug?.phase() === 'playing', undefined, { timeout: 30000 });
  await page.evaluate(() => window.__shadowRecruitDebug?.movePlayerTo({ x: -31, z: -25 }));
  await page.screenshot({ path: `${outputDir}/gameplay-level-one.png`, fullPage: true });
  await page.evaluate(() => {
    window.__shadowRecruitDebug?.collectObjective('access-keycard');
    window.__shadowRecruitDebug?.collectObjective('security-terminal');
    window.__shadowRecruitDebug?.collectObjective('command-codes');
    window.__shadowRecruitDebug?.movePlayerTo({ x: 0, z: 33 });
  });
  await page.screenshot({ path: `${outputDir}/complete.png`, fullPage: true });
  console.info(`[screenshots] wrote screenshots to ${outputDir}`);
} finally {
  await browser.close();
}
