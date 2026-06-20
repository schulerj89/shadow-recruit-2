import { mkdir, writeFile } from 'node:fs/promises';
import { chromium, type ConsoleMessage } from 'playwright';
import packageInfo from '../package.json';
import { defaultLevel, getLevelById } from '../src/game/levels';
import { distance } from '../src/game/math';
import type { ObjectiveDefinition, TesterState, Vec2 } from '../src/game/types';

const baseUrl = process.env.PLAYTHROUGH_URL ?? 'http://127.0.0.1:5173/';
const requestedLevelId = process.env.PLAYTHROUGH_LEVEL_ID ?? defaultLevel.id;
const level = getLevelById(requestedLevelId);
if (!level) throw new Error(`Unknown PLAYTHROUGH_LEVEL_ID: ${requestedLevelId}`);
const outputDir = process.env.PLAYTHROUGH_OUTPUT_DIR ?? `artifacts/playthrough/v${packageInfo.version}`;
const headless = process.env.PLAYTHROUGH_HEADLESS !== 'false';

const browser = await chromium.launch({ headless });
const page = await browser.newPage({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1 });
const logs: string[] = [];
const pageErrors: string[] = [];
const visitedRoute: Array<Vec2 & { phase: string }> = [];
const interactions: Array<{ objectiveId: string; doorId: string; focusMs: number }> = [];

page.on('console', (message: ConsoleMessage) => {
  logs.push(`[${message.type()}] ${message.text()}`);
});
page.on('pageerror', (error) => pageErrors.push(error.message));

try {
  await mkdir(outputDir, { recursive: true });
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__shadowRecruitDebug?.ready(), undefined, { timeout: 30000 });
  await expectPhase('title');
  await page.screenshot({ path: `${outputDir}/01-title.png`, fullPage: true });

  await page.getByRole('button', { name: 'Start' }).click();
  await page.waitForSelector('[data-testid="hero-select-panel"]', { timeout: 12000 });
  if (level.id === defaultLevel.id) {
    await page.getByRole('button', { name: 'Start Level' }).click();
  } else {
    await page.evaluate((missionId) => window.__shadowRecruitDebug?.startGame(undefined, missionId), level.id);
  }
  await page.waitForSelector('[data-testid="tutorial-panel"]', { timeout: 45000 });

  for (const step of level.tutorial) {
    const tutorial = await page.evaluate(() => window.__shadowRecruitDebug?.tutorialStep());
    if (!tutorial?.step || tutorial.step.id !== step.id || tutorial.step.target !== step.target) {
      throw new Error(`Unexpected tutorial step while starting playthrough: ${JSON.stringify({ expected: step, tutorial })}`);
    }
    await page.getByRole('button', { name: /Next|Begin Mission/ }).click();
  }

  await expectPhase('playing');
  await page.screenshot({ path: `${outputDir}/02-mission-start.png`, fullPage: true });

  const pendingObjectives = [...level.objectives];
  for (const point of level.validationRoute) {
    await teleport(point);
    await page.waitForTimeout(80);
    const phase = await page.evaluate(() => window.__shadowRecruitDebug?.phase());
    visitedRoute.push({ ...point, phase: phase ?? 'missing' });
    if (phase === 'caught') throw new Error(`Route point caused sentry contact: ${JSON.stringify(point)}`);

    const objective = pendingObjectives.find((candidate) => distance(point, candidate.position) <= candidate.radius + 0.1);
    if (objective) {
      await interactWithObjective(objective);
      pendingObjectives.splice(pendingObjectives.indexOf(objective), 1);
    }
  }

  if (pendingObjectives.length > 0) {
    throw new Error(`Playthrough route missed objectives: ${pendingObjectives.map((objective) => objective.id).join(', ')}`);
  }

  await expectPhase('complete');
  await page.screenshot({ path: `${outputDir}/06-complete.png`, fullPage: true });
  const finalState = await captureState();
  if (finalState.objectives.collectedRequired !== finalState.objectives.totalRequired || !finalState.objectives.exitUnlocked) {
    throw new Error(`Playthrough did not complete all objectives: ${JSON.stringify(finalState.objectives)}`);
  }
  if (!finalState.completion.active || !finalState.completion.triumphantCue || finalState.completion.objectivesCompleted !== 3 || finalState.completion.objectivesTotal !== 3) {
    throw new Error(`Playthrough did not capture completion stats and triumphant cue: ${JSON.stringify(finalState.completion)}`);
  }
  if (finalState.memory.loadedAssets < 5 || !finalState.memory.loadedAssetIds.includes('sentry') || !finalState.memory.loadedAssetIds.includes('codes')) {
    throw new Error(`Expected loaded gameplay assets, got ${JSON.stringify(finalState.memory)}`);
  }

  const errorLogs = logs
    .filter((line) => /^\[(error|warning)\]/i.test(line))
    .filter((line) => !/ReadPixels|GL Driver Message|autoplay/i.test(line));
  if (pageErrors.length > 0 || errorLogs.length > 0) {
    throw new Error(`Unexpected browser errors: ${JSON.stringify({ pageErrors, errorLogs })}`);
  }

  await writeFile(`${outputDir}/playthrough-report.json`, JSON.stringify({
    build: `v${packageInfo.version}`,
    levelId: level.id,
    routePoints: visitedRoute,
    interactions,
    finalState,
    screenshots: [
      `${outputDir}/01-title.png`,
      `${outputDir}/02-mission-start.png`,
      `${outputDir}/03-focus-lobby-door.png`,
      `${outputDir}/04-focus-server-door.png`,
      `${outputDir}/05-focus-extraction-door.png`,
      `${outputDir}/06-complete.png`,
    ],
  }, null, 2));

  console.info(`[browser-playthrough] completed ${level.id} and wrote ${outputDir}/playthrough-report.json`);
} finally {
  await browser.close();
}

async function teleport(point: Vec2): Promise<void> {
  await page.evaluate((target) => window.__shadowRecruitDebug?.teleportPlayerTo(target), point);
}

async function interactWithObjective(objective: ObjectiveDefinition): Promise<void> {
  await page.keyboard.press('KeyE', { delay: 60 });
  const doorId = objective.unlocks[0];
  if (!doorId) throw new Error(`Objective ${objective.id} has no door unlock to verify.`);

  await expectPhase('cinematic-focus');
  const focus = await page.evaluate(() => window.__shadowRecruitDebug?.cinematicFocus());
  if (!focus?.active || focus.target !== doorId || focus.remainingMs <= 0) {
    throw new Error(`Expected ${doorId} focus after ${objective.id}, got ${JSON.stringify(focus)}`);
  }

  const index = interactions.length + 3;
  await page.screenshot({ path: `${outputDir}/${String(index).padStart(2, '0')}-focus-${doorId}.png`, fullPage: true });
  interactions.push({ objectiveId: objective.id, doorId, focusMs: focus.remainingMs });
  await expectPhase('playing');
}

async function expectPhase(phase: string): Promise<void> {
  await page.waitForFunction((expected) => window.__shadowRecruitDebug?.phase() === expected, phase, { timeout: 30000 });
}

async function captureState(): Promise<TesterState> {
  const state = await page.evaluate(() => window.__shadowRecruitDebug?.captureTesterState());
  if (!state) throw new Error('Missing tester state.');
  return state;
}
