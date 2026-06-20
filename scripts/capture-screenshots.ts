import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import packageInfo from '../package.json';

const qaDate = process.env.QA_DATE ?? '2026-06-20';
const baseUrl = process.env.SCREENSHOT_URL ?? 'http://127.0.0.1:5173/';
const qaDir = process.env.SCREENSHOT_QA_DIR ?? `docs/qa/${qaDate}/v${packageInfo.version}`;
const outputDir = process.env.SCREENSHOT_OUTPUT_DIR ?? `${qaDir}/screenshots`;
const headless = process.env.SCREENSHOT_HEADLESS !== 'false';

type OperativeEvidence = {
  selected?: {
    selectedId: string;
    assetAuditId: string;
    changedScalars: readonly string[];
    traitIds: readonly string[];
    probes: readonly { grade: string }[];
  };
  catalog?: readonly { id: string; changedScalars: readonly string[] }[];
};

const browser = await chromium.launch({ headless });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const tutorialAlignmentCaptures: unknown[] = [];

try {
  await mkdir(outputDir, { recursive: true });
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__shadowRecruitDebug?.ready(), undefined, { timeout: 30000 });
  await page.evaluate(() => window.__shadowRecruitDebug?.setPerformanceProfile('performance'));
  await page.evaluate(() => window.__shadowRecruitDebug?.setTitleOrbitAngle(0.35));
  const titleComposition = await page.evaluate(() => window.__shadowRecruitDebug?.titleComposition());
  await writeFile(`${qaDir}/title-composition.json`, JSON.stringify(titleComposition, null, 2));
  const titleTreatment = titleComposition?.titleTreatment;
  if (
    !titleComposition?.heroReadable ||
    titleComposition.facingDot < 0.65 ||
    titleComposition.heroScreenHeightRatio < 0.22 ||
    titleComposition.heroScreenOccupancy < 0.012 ||
    !titleComposition.identityReadable ||
    !Array.isArray(titleComposition.identityAnchors) ||
    titleComposition.identityAnchors.filter((anchor) => ['head', 'visor', 'chest'].includes(anchor.id) && anchor.visible && !anchor.uiOccluded).length < 3 ||
    !titleComposition.heroScreenBounds ||
    !titleComposition.levelPreviewVisible ||
    titleComposition.orbitRadius < 5 ||
    !titleTreatment?.wordmarkReadable ||
    !titleTreatment.wordmarkBounds ||
    titleTreatment.wordmarkBounds.areaRatio < 0.04 ||
    titleTreatment.panelOverlapRatio > 0.01 ||
    titleTreatment.heroOverlapRatio > 0.32
  ) {
    throw new Error(`Title hero or native wordmark is not readable from camera: ${JSON.stringify(titleComposition)}`);
  }
  await page.screenshot({ path: `${outputDir}/title.png`, fullPage: true });
  await page.evaluate(() => window.__shadowRecruitDebug?.setTitleOrbitAngle(1.85));
  await page.screenshot({ path: `${outputDir}/title-orbit-preview.png`, fullPage: true });
  await page.evaluate(() => window.__shadowRecruitDebug?.clearTitleOrbitAngle());
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.waitForSelector('[data-testid="settings-panel"]', { timeout: 12000 });
  await page.screenshot({ path: `${outputDir}/settings.png`, fullPage: true });
  await page.getByRole('button', { name: 'Back' }).click();
  await page.waitForFunction(() => window.__shadowRecruitDebug?.phase() === 'title', undefined, { timeout: 30000 });
  await page.getByRole('button', { name: 'Start' }).click();
  await page.waitForSelector('[data-testid="hero-select-panel"]', { timeout: 12000 });
  const missionCatalog = await page.evaluate(() => ({
    selectedMissionId: window.__shadowRecruitDebug?.missionId(),
    missions: window.__shadowRecruitDebug?.missions(),
  }));
  const selectedMission = await page.getByLabel('Mission').inputValue();
  const missionBrief = await page.locator('[data-testid="mission-brief"]').innerText();
  const catalogMissions = missionCatalog.missions ?? [];
  if (
    selectedMission !== missionCatalog.selectedMissionId ||
    !catalogMissions.some((mission) => mission.id === selectedMission) ||
    !missionBrief.includes('required objectives') ||
    !missionBrief.includes('sentries')
  ) {
    throw new Error(`Mission selector evidence is incomplete: ${JSON.stringify({ selectedMission, missionCatalog, missionBrief })}`);
  }
  const selectedMissionName = catalogMissions.find((mission) => mission.id === selectedMission)?.name ?? 'Blacksite Threshold';
  await writeFile(`${qaDir}/mission-catalog.json`, JSON.stringify({ ...missionCatalog, missionBrief }, null, 2));
  await page.getByText('Echo Vanguard').click();
  const operativeEvidence = await page.evaluate(() => ({
    selected: window.__shadowRecruitDebug?.operativeMechanics(),
    catalog: window.__shadowRecruitDebug?.operativeCatalog(),
  })) as OperativeEvidence;
  if (
    operativeEvidence.selected?.selectedId !== 'echo-vanguard' ||
    operativeEvidence.selected.assetAuditId !== 'hero:echo-vanguard' ||
    operativeEvidence.selected.changedScalars.length === 0 ||
    operativeEvidence.selected.probes.some((probe) => probe.grade !== 'pass') ||
    !operativeEvidence.catalog?.some((hero) => hero.id === 'shadow-operative' && hero.changedScalars.length === 0) ||
    !operativeEvidence.catalog.some((hero) => hero.id === 'echo-vanguard' && hero.changedScalars.includes('enemyDetectionRadius'))
  ) {
    throw new Error(`Operative trait evidence is incomplete: ${JSON.stringify(operativeEvidence)}`);
  }
  await writeFile(`${qaDir}/operative-traits.json`, JSON.stringify(operativeEvidence, null, 2));
  await page.screenshot({ path: `${outputDir}/hero-select.png`, fullPage: true });
  await page.getByRole('button', { name: new RegExp(`^Start ${escapeRegex(selectedMissionName)}$`) }).click();
  await page.waitForSelector('[data-testid="loading-panel"]', { timeout: 12000 });
  const loadingState = await page.evaluate(() => window.__shadowRecruitDebug?.loadingState());
  if (!loadingState?.active || loadingState.value <= 0 || loadingState.history.length === 0) {
    throw new Error(`Expected observable loading state before tutorial, got ${JSON.stringify(loadingState)}`);
  }
  await page.screenshot({ path: `${outputDir}/loading-level-one.png`, fullPage: true });
  await page.waitForSelector('[data-testid="tutorial-panel"]', { timeout: 45000 });
  for (const name of ['insertion', 'keycard', 'terminal', 'sentry', 'extraction']) {
    const tutorial = await page.evaluate(() => window.__shadowRecruitDebug?.tutorialStep());
    const focus = await page.evaluate(() => window.__shadowRecruitDebug?.cinematicFocus());
    const alignment = await page.evaluate(() => window.__shadowRecruitDebug?.tutorialAlignment());
    const alignmentCheck = alignment?.find((check) => check.id === tutorial?.step?.id);
    const screenshot = `tutorial-${String((tutorial?.index ?? 0) + 1).padStart(2, '0')}-${name}.png`;
    if (!tutorial?.step || !focus?.active || focus.target !== tutorial.step.target || !alignmentCheck || alignmentCheck.grade !== 'pass') {
      throw new Error(`Tutorial screenshot alignment failed: ${JSON.stringify({ tutorial, focus, alignmentCheck })}`);
    }
    tutorialAlignmentCaptures.push({ screenshot, focus, ...alignmentCheck });
    await page.screenshot({ path: `${outputDir}/${screenshot}`, fullPage: true });
    await page.getByRole('button', { name: /Next|Begin Mission/ }).click();
  }
  await writeFile(`${qaDir}/tutorial-alignment.json`, JSON.stringify(tutorialAlignmentCaptures, null, 2));
  await page.waitForFunction(() => window.__shadowRecruitDebug?.phase() === 'playing', undefined, { timeout: 30000 });
  await page.evaluate(() => window.__shadowRecruitDebug?.teleportPlayerTo({ x: -24, z: -25 }));
  await page.waitForFunction(() => window.__shadowRecruitDebug?.phase() === 'playing', undefined, { timeout: 30000 });
  const gameplayState = await page.evaluate(() => window.__shadowRecruitDebug?.captureTesterState());
  const gameplayCamera = gameplayState?.gameplayCamera;
  if (
    !gameplayCamera?.readable ||
    gameplayCamera.cameraDistance > 7.1 ||
    gameplayCamera.playerScreenHeightRatio < 0.12 ||
    gameplayCamera.playerScreenOccupancy < 0.004
  ) {
    throw new Error(`Normal gameplay camera is not close enough for player readability: ${JSON.stringify(gameplayCamera)}`);
  }
  const gameplayViewDensity = gameplayState?.gameplayViewDensity;
  if (
    !gameplayViewDensity ||
    gameplayViewDensity.grade !== 'pass' ||
    gameplayViewDensity.bands.some((band) =>
      typeof band.negativeSpaceRatio !== 'number' ||
      typeof band.maxNegativeSpaceRatio !== 'number' ||
      band.negativeSpaceRatio > band.maxNegativeSpaceRatio
    )
  ) {
    throw new Error(`Active gameplay camera lacks foreground/midground/background tactical detail: ${JSON.stringify(gameplayViewDensity)}`);
  }
  await writeFile(`${qaDir}/gameplay-camera.json`, JSON.stringify(gameplayCamera, null, 2));
  await writeFile(`${qaDir}/gameplay-view-density.json`, JSON.stringify(gameplayViewDensity, null, 2));
  await page.screenshot({ path: `${outputDir}/gameplay-level-one.png`, fullPage: true });
  await captureDoorFocus('access-keycard', 'lobby-door');
  await captureDoorFocus('security-terminal', 'server-door');
  await page.evaluate(() => window.__shadowRecruitDebug?.teleportPlayerTo({ x: -33, z: 13 }));
  await page.screenshot({ path: `${outputDir}/gameplay-command-codes.png`, fullPage: true });
  await captureDoorFocus('command-codes', 'extraction-door');
  await page.evaluate(() => window.__shadowRecruitDebug?.movePlayerTo({ x: 0, z: 33 }));
  await page.screenshot({ path: `${outputDir}/complete.png`, fullPage: true });
  await captureFailureRetry(selectedMission);
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

async function captureFailureRetry(missionId: string): Promise<void> {
  await page.evaluate((id) => window.__shadowRecruitDebug?.startGame(undefined, id), missionId);
  await page.waitForSelector('[data-testid="tutorial-panel"]', { timeout: 45000 });
  await page.getByRole('button', { name: 'Skip' }).click();
  await page.waitForFunction(() => window.__shadowRecruitDebug?.phase() === 'playing', undefined, { timeout: 30000 });
  const contactEnemy = await page.evaluate(() => window.__shadowRecruitDebug?.enemies()[0]);
  if (!contactEnemy) throw new Error('No sentry exposed through debug API for failure/retry screenshots.');
  await page.evaluate((point) => window.__shadowRecruitDebug?.teleportPlayerTo(point), contactEnemy.position);
  await page.waitForFunction(() => window.__shadowRecruitDebug?.phase() === 'caught', undefined, { timeout: 30000 });
  await page.screenshot({ path: `${outputDir}/caught-sentry.png`, fullPage: true });
  await page.getByRole('button', { name: 'Retry' }).click();
  await page.waitForSelector('[data-testid="loading-panel"]', { timeout: 12000 });
  await page.screenshot({ path: `${outputDir}/retry-loading.png`, fullPage: true });
  await page.waitForSelector('[data-testid="tutorial-panel"]', { timeout: 45000 });
  const retryState = await page.evaluate(() => window.__shadowRecruitDebug?.captureTesterState());
  if (
    retryState?.phase !== 'tutorial' ||
    retryState.completion.alerts !== 0 ||
    retryState.objectives.collectedRequired !== 0 ||
    retryState.objectives.exitUnlocked
  ) {
    throw new Error(`Retry screenshot state did not reset cleanly: ${JSON.stringify(retryState)}`);
  }
  await page.screenshot({ path: `${outputDir}/retry-tutorial-reset.png`, fullPage: true });
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
