import { mkdir, writeFile } from 'node:fs/promises';
import { chromium, type ConsoleMessage } from 'playwright';
import packageInfo from '../package.json';
import { defaultLevel } from '../src/game/levels';
import { distance } from '../src/game/math';
import type { TesterState, Vec2 } from '../src/game/types';

const baseUrl = process.env.FAILURE_RETRY_URL ?? process.env.SMOKE_URL ?? 'http://127.0.0.1:5173/';
const outputDir = process.env.FAILURE_RETRY_OUTPUT_DIR ?? `artifacts/failure-retry/v${packageInfo.version}`;
const headless = process.env.FAILURE_RETRY_HEADLESS !== 'false';

type FailureRetrySummary = {
  phase: string;
  alerts: number;
  playerPosition: Vec2;
  playerStartDistance: number;
  objectives: TesterState['objectives'];
  doors: TesterState['doors'];
  audio: TesterState['audio'];
  sentryAssetLoaded: boolean;
  enemyQualityCount: number;
  panelText: string;
  loadingHistoryCount: number;
};

const browser = await chromium.launch({ headless });
const page = await browser.newPage({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1 });
const logs: string[] = [];
const pageErrors: string[] = [];

page.on('console', (message: ConsoleMessage) => {
  logs.push(`[${message.type()}] ${message.text()}`);
});
page.on('pageerror', (error) => pageErrors.push(error.message));

try {
  await mkdir(outputDir, { recursive: true });
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__shadowRecruitDebug?.ready(), undefined, { timeout: 30000 });
  await page.evaluate(() => window.__shadowRecruitDebug?.setPerformanceProfile('performance'));
  await page.evaluate((missionId) => window.__shadowRecruitDebug?.startGame('shadow-operative', missionId), defaultLevel.id);
  await page.waitForSelector('[data-testid="tutorial-panel"]', { timeout: 45000 });
  await page.getByRole('button', { name: 'Skip' }).click();
  await expectPhase('playing');

  const contactEnemy = await page.evaluate(() => window.__shadowRecruitDebug?.enemies()[0]);
  if (!contactEnemy) throw new Error('No sentry was exposed through the debug API for failure/retry QA.');
  await page.evaluate((point) => window.__shadowRecruitDebug?.teleportPlayerTo(point), contactEnemy.position);
  await expectPhase('caught');
  const caughtPanelText = await page.locator('[data-testid="caught-panel"]').innerText({ timeout: 10000 });
  await page.screenshot({ path: `${outputDir}/01-sentry-contact.png`, fullPage: true });
  const caughtState = await captureState();
  const caught = summarizeState(caughtState, caughtPanelText);
  if (caught.phase !== 'caught' || caught.alerts !== 1) {
    throw new Error(`Expected sentry contact to enter caught with one alert, got ${JSON.stringify(caught)}`);
  }
  if (!/sentry contact/i.test(caughtPanelText) || !/retry/i.test(caughtPanelText)) {
    throw new Error(`Caught panel is not readable as a retry state: ${caughtPanelText}`);
  }
  if (!caught.sentryAssetLoaded || caught.enemyQualityCount < defaultLevel.enemies.length) {
    throw new Error(`Sentry failure QA could not prove loaded sentry assets: ${JSON.stringify(caught)}`);
  }

  await page.getByRole('button', { name: 'Retry' }).click();
  await page.waitForSelector('[data-testid="loading-panel"]', { timeout: 12000 });
  await page.screenshot({ path: `${outputDir}/02-retry-loading.png`, fullPage: true });
  await page.waitForSelector('[data-testid="tutorial-panel"]', { timeout: 45000 });
  const retryPanelText = await page.locator('[data-testid="tutorial-panel"]').innerText({ timeout: 10000 });
  const retryState = await captureState();
  const retry = summarizeState(retryState, retryPanelText);
  await page.screenshot({ path: `${outputDir}/03-retry-tutorial-reset.png`, fullPage: true });

  if (retry.phase !== 'tutorial' || retry.alerts !== 0 || retry.objectives.collectedRequired !== 0 || retry.objectives.exitUnlocked) {
    throw new Error(`Expected retry to reset into a clean tutorial run, got ${JSON.stringify(retry)}`);
  }
  if (retry.playerStartDistance > 0.1 || retry.doors.some((door) => door.open || door.progress > 0.01)) {
    throw new Error(`Expected retry to reset player and doors, got ${JSON.stringify(retry)}`);
  }

  const errorLogs = logs
    .filter((line) => /^\[(error|warning)\]/i.test(line))
    .filter((line) => !/ReadPixels|GL Driver Message|autoplay/i.test(line));
  if (pageErrors.length > 0 || errorLogs.length > 0) {
    throw new Error(`Unexpected browser errors: ${JSON.stringify({ pageErrors, errorLogs })}`);
  }

  await writeFile(`${outputDir}/failure-retry-report.json`, JSON.stringify({
    build: `v${packageInfo.version}`,
    levelId: defaultLevel.id,
    contactEnemy,
    caught,
    retry,
    screenshots: [
      `${outputDir}/01-sentry-contact.png`,
      `${outputDir}/02-retry-loading.png`,
      `${outputDir}/03-retry-tutorial-reset.png`,
    ],
    pageErrors,
    consoleIssues: errorLogs,
  }, null, 2));
  console.info(`[failure-retry] verified sentry failure and retry reset; wrote ${outputDir}/failure-retry-report.json`);
} finally {
  await browser.close();
}

async function expectPhase(phase: string): Promise<void> {
  await page.waitForFunction((expected) => window.__shadowRecruitDebug?.phase() === expected, phase, { timeout: 30000 });
}

async function captureState(): Promise<TesterState> {
  const state = await page.evaluate(() => window.__shadowRecruitDebug?.captureTesterState());
  if (!state) throw new Error('Missing tester state.');
  return state;
}

function summarizeState(state: TesterState, panelText: string): FailureRetrySummary {
  return {
    phase: state.phase,
    alerts: state.completion.alerts,
    playerPosition: state.playerPosition,
    playerStartDistance: roundMetric(distance(state.playerPosition, defaultLevel.start)),
    objectives: state.objectives,
    doors: state.doors,
    audio: state.audio,
    sentryAssetLoaded: state.memory.loadedAssetIds.includes('sentry'),
    enemyQualityCount: state.assetQuality.filter((check) => check.category === 'enemy' && check.grade === 'pass').length,
    panelText: panelText.replace(/\s+/g, ' ').trim(),
    loadingHistoryCount: state.loading.history.length,
  };
}

function roundMetric(value: number): number {
  return Math.round(value * 1000) / 1000;
}
