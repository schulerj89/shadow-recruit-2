import { mkdir } from 'node:fs/promises';
import { chromium, type ConsoleMessage } from 'playwright';
import { PNG } from 'pngjs';
import packageInfo from '../package.json';
import { defaultLevel } from '../src/game/levels';

const baseUrl = process.env.SMOKE_URL ?? 'http://127.0.0.1:5173/';
const screenshotDir = process.env.SMOKE_SCREENSHOT_DIR ?? `artifacts/smoke/v${packageInfo.version}`;
const headless = process.env.SMOKE_HEADLESS !== 'false';
const aaaReadyLevelFootprintRatio = 0.18;
const aaaReadyZoneFootprintRatio = 0.2;

type RuntimeAssetAuditState = {
  id: string;
  source: string;
  path: string;
  expectedFormat: string;
  loaded: boolean;
  failed: boolean;
  fallbackVisible: boolean;
  grade: string;
};

type OperativeDebugState = {
  selectedId: string;
  assetAuditId: string;
  traitIds: readonly string[];
  base: Record<string, number>;
  effective: Record<string, number>;
  changedScalars: readonly string[];
  traits: readonly { id: string; applied: boolean; scalar: string; baseValue: number; effectiveValue: number }[];
  probes: readonly { id: string; traitId: string; grade: string; expectedDelta: number; actualDelta: number; tolerance: number }[];
};

type OperativeCatalogDebugState = {
  id: string;
  name: string;
  assetAuditId: string;
  traitIds: readonly string[];
  changedScalars: readonly string[];
  base: Record<string, number>;
  effective: Record<string, number>;
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
  await mkdir(screenshotDir, { recursive: true });
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__shadowRecruitDebug?.ready(), undefined, { timeout: 30000 });
  await expectPhase('title');
  await page.evaluate(() => window.__shadowRecruitDebug?.clearTitleOrbitAngle());
  await expectNonblankCanvas();
  const titleHeroVisible = await page.evaluate(() => window.__shadowRecruitDebug?.playerVisible());
  if (!titleHeroVisible) {
    throw new Error('Expected title hero model to be visible.');
  }
  const titleComposition = await page.evaluate(() => window.__shadowRecruitDebug?.titleComposition());
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
    titleComposition.levelPreviewVisible ||
    !titleComposition.titleBackdropVisible ||
    !titleComposition.titleFloorVisible ||
    !titleTreatment?.wordmarkReadable ||
    !titleTreatment.wordmarkBounds ||
    titleTreatment.wordmarkBounds.areaRatio < 0.04 ||
    titleTreatment.panelOverlapRatio > 0.01 ||
    titleTreatment.heroOverlapRatio > 0.32
  ) {
    throw new Error(`Expected static title hero, native wordmark, door backdrop, and floor to be readable, got ${JSON.stringify(titleComposition)}`);
  }
  await expectAudioState('title', { muted: false, unlocked: false });
  await page.screenshot({ path: `${screenshotDir}/01-title.png`, fullPage: true });
  await page.evaluate(() => window.__shadowRecruitDebug?.setTitleOrbitAngle(1.85));
  const laterTitleComposition = await page.evaluate(() => window.__shadowRecruitDebug?.titleComposition());
  const titleCameraDelta = laterTitleComposition
    ? Math.hypot(
      laterTitleComposition.cameraPosition.x - titleComposition.cameraPosition.x,
      laterTitleComposition.cameraPosition.z - titleComposition.cameraPosition.z,
    )
    : Infinity;
  if (
    !laterTitleComposition?.titleBackdropVisible ||
    !laterTitleComposition.titleFloorVisible ||
    laterTitleComposition.levelPreviewVisible ||
    titleCameraDelta > 0.01
  ) {
    throw new Error(`Expected static title camera with no Level 1 orbit preview, got ${JSON.stringify({ titleComposition, laterTitleComposition, titleCameraDelta })}`);
  }

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
  await expectAudioState('title', { muted: true, unlocked: true });
  await page.getByRole('button', { name: 'Back' }).click();
  await expectPhase('title');

  await page.getByRole('button', { name: 'Start' }).click();
  await page.waitForSelector('[data-testid="hero-select-panel"]', { timeout: 12000 });
  const missions = await page.evaluate(() => window.__shadowRecruitDebug?.missions());
  const missionSelectValue = await page.getByLabel('Mission').inputValue();
  const missionBrief = await page.locator('[data-testid="mission-brief"]').innerText();
  const heroSelectCopy = await page.locator('[data-testid="hero-select-panel"]').innerText();
  assertNoPlayerFacingInternalTerms(heroSelectCopy, 'hero-select panel');
  if (
    !missions?.some((mission) => mission.id === defaultLevel.id && mission.objectiveCount === 3 && mission.enemyCount === 3) ||
    missionSelectValue !== defaultLevel.id ||
    !missionBrief.includes(defaultLevel.name) ||
    !missionBrief.includes('3 required objectives') ||
    !missionBrief.includes('3 sentries') ||
    !missionBrief.includes('4 mission sectors')
  ) {
    throw new Error(`Expected mission catalog selector for ${defaultLevel.id}, got ${JSON.stringify({ missions, missionSelectValue, missionBrief })}`);
  }
  await page.getByText('Echo Vanguard').click();
  const selectedHero = await page.evaluate(() => window.__shadowRecruitDebug?.selectedHero());
  if (selectedHero !== 'echo-vanguard') {
    throw new Error(`Expected Echo Vanguard selection, got ${selectedHero}`);
  }
  const operativeCatalog = await page.evaluate(() => window.__shadowRecruitDebug?.operativeCatalog()) as
    | readonly OperativeCatalogDebugState[]
    | undefined;
  if (
    !operativeCatalog ||
    operativeCatalog.length < 2 ||
    operativeCatalog.filter((hero) => hero.changedScalars.length > 0).length < 2 ||
    !operativeCatalog.some((hero) => hero.id === 'shadow-operative' && hero.changedScalars.length === 0) ||
    !operativeCatalog.some((hero) => hero.id === 'echo-vanguard' && hero.assetAuditId === 'hero:echo-vanguard' && hero.changedScalars.includes('enemyDetectionRadius'))
  ) {
    throw new Error(`Expected mechanically distinct operative catalog, got ${JSON.stringify(operativeCatalog)}`);
  }
  const selectedOperative = await page.evaluate(() => window.__shadowRecruitDebug?.operativeMechanics()) as
    | OperativeDebugState
    | undefined;
  assertOperativeMechanics(selectedOperative, 'echo-vanguard');
  const selectedHeroVisible = await page.evaluate(() => window.__shadowRecruitDebug?.playerVisible());
  if (!selectedHeroVisible) {
    throw new Error('Expected selected hero preview to remain visible.');
  }
  await page.screenshot({ path: `${screenshotDir}/03-hero-select.png`, fullPage: true });
  await page.getByRole('button', { name: `Start ${defaultLevel.name}` }).click();
  await page.waitForSelector('[data-testid="loading-panel"]', { timeout: 12000 });
  const loadingState = await page.evaluate(() => window.__shadowRecruitDebug?.loadingState());
  if (!loadingState?.active || loadingState.value <= 0 || loadingState.history.length === 0) {
    throw new Error(`Expected observable loading state before tutorial, got ${JSON.stringify(loadingState)}`);
  }
  await expectAudioState('loading', { muted: true, unlocked: true });
  await page.screenshot({ path: `${screenshotDir}/03b-loading-level-one.png`, fullPage: true });
  await page.waitForSelector('[data-testid="tutorial-panel"]', { timeout: 45000 });
  await expectAudioState('gameplay', { muted: true, unlocked: true });

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
    const focus = await page.evaluate(() => window.__shadowRecruitDebug?.cinematicFocus());
    const alignment = await page.evaluate(() => window.__shadowRecruitDebug?.tutorialAlignment());
    const alignmentCheck = alignment?.find((check) => check.id === expected.id);
    if (!tutorial?.step || tutorial.index !== i || tutorial.total !== tutorialSteps.length) {
      throw new Error(`Expected tutorial index ${i}, got ${JSON.stringify(tutorial)}`);
    }
    if (tutorial.step.id !== expected.id || tutorial.step.title !== expected.title || tutorial.step.target !== expected.target) {
      throw new Error(`Unexpected tutorial step: ${JSON.stringify({ expected, tutorial })}`);
    }
    if (!focus?.active || focus.target !== expected.target || !focus.focusPoint) {
      throw new Error(`Expected tutorial camera to focus ${expected.target}, got ${JSON.stringify(focus)}`);
    }
    if (!alignmentCheck || alignmentCheck.grade !== 'pass' || alignmentCheck.target !== expected.target || alignmentCheck.missingKeywords.length > 0) {
      throw new Error(`Tutorial alignment failed: ${JSON.stringify({ expected, alignmentCheck })}`);
    }
    if (alignmentCheck.focusDistance !== null && alignmentCheck.focusDistance > 0.35) {
      throw new Error(`Tutorial camera focus is not aligned to ${expected.target}: ${JSON.stringify(alignmentCheck)}`);
    }
    if (!/good luck, cadet\.$/i.test(tutorial.step.text.trim())) {
      throw new Error(`Tutorial step ${expected.id} must end with Good luck, cadet: ${tutorial.step.text}`);
    }
    await page.screenshot({ path: `${screenshotDir}/${String(i + 4).padStart(2, '0')}-tutorial-${expected.id}.png`, fullPage: true });
    const button = page.getByRole('button', { name: /Next|Begin Mission/ });
    await button.click();
  }
  await expectPhase('playing');
  await page.locator('[data-testid="debug-panel"]').waitFor({ state: 'visible', timeout: 10000 });
  const gameplayState = await page.evaluate(() => window.__shadowRecruitDebug?.captureTesterState());
  const gameplayCamera = gameplayState?.gameplayCamera;
  if (
    !gameplayCamera?.readable ||
    gameplayCamera.cameraDistance > 7.1 ||
    gameplayCamera.playerScreenHeightRatio < 0.12 ||
    gameplayCamera.playerScreenOccupancy < 0.004
  ) {
    throw new Error(`Expected closer player-readable gameplay camera, got ${JSON.stringify(gameplayCamera)}`);
  }
  if (
    !gameplayState?.gameplayViewDensity ||
    gameplayState.gameplayViewDensity.grade !== 'pass' ||
    gameplayState.gameplayViewDensity.bands.some((band) =>
      typeof band.negativeSpaceRatio !== 'number' ||
      typeof band.maxNegativeSpaceRatio !== 'number' ||
      band.negativeSpaceRatio > band.maxNegativeSpaceRatio
    )
  ) {
    throw new Error(`Expected active gameplay camera to have near/mid/far tactical detail, got ${JSON.stringify(gameplayState?.gameplayViewDensity)}`);
  }
  await expectMissionGuidance('access-keycard', 'objective');
  await collectObjectiveAndExpectFocus('access-keycard', 'lobby-door', '09-focus-lobby-door.png', 'security-terminal');
  await collectObjectiveAndExpectFocus('security-terminal', 'server-door', '10-focus-server-door.png', 'command-codes');
  await collectObjectiveAndExpectFocus('command-codes', 'extraction-door', '11-focus-extraction-door.png', 'extraction');
  await page.evaluate(() => {
    window.__shadowRecruitDebug?.movePlayerTo({ x: 0, z: 33 });
  });
  await expectPhase('complete');
  await page.locator('[data-testid="complete-panel"][data-completion-cue="triumphant"]').waitFor({ state: 'visible', timeout: 10000 });
  await expectStat('complete-stat-objectives', '3/3');
  await expectStat('complete-stat-alerts', '0');
  await expectStat('complete-stat-profile', 'performance');
  await page.screenshot({ path: `${screenshotDir}/12-complete.png`, fullPage: true });
  await expectAudioState('complete', { muted: true, unlocked: true });

  const state = await page.evaluate(() => window.__shadowRecruitDebug?.captureTesterState());
  if (!state || state.objectives.collectedRequired !== state.objectives.totalRequired) {
    throw new Error(`Expected completed objectives, got ${JSON.stringify(state)}`);
  }
  assertOperativeMechanics(state.operative as OperativeDebugState | undefined, 'echo-vanguard');
  if (
    state.levelId !== defaultLevel.id ||
    state.missionCatalog.length !== missions.length ||
    !state.missionCatalog.some((mission) => mission.id === defaultLevel.id && mission.name === defaultLevel.name)
  ) {
    throw new Error(`Expected tester state to expose selected mission catalog, got ${JSON.stringify({ levelId: state.levelId, missionCatalog: state.missionCatalog })}`);
  }
  if (state.loading.history.length < 3 || !state.loading.history.some((step) => step.label.includes('tactical dressing'))) {
    throw new Error(`Expected tester state to retain mission loading history, got ${JSON.stringify(state.loading)}`);
  }
  if (!state.completion.active || !state.completion.triumphantCue || state.completion.objectivesCompleted !== 3 || state.completion.objectivesTotal !== 3 || state.completion.alerts !== 0) {
    throw new Error(`Expected completion stats with triumphant cue, got ${JSON.stringify(state.completion)}`);
  }
  if (!state.audio || state.audio.activeTrack !== 'complete' || !state.audio.muted || !state.audio.unlocked) {
    throw new Error(`Expected final tester audio state to retain muted completion cue, got ${JSON.stringify(state.audio)}`);
  }
  if (state.renderer.drawCalls <= 0 || state.renderer.triangles <= 0) {
    throw new Error(`Expected live renderer metrics, got ${JSON.stringify(state.renderer)}`);
  }
  if (
    state.memory.loadedAssets < 9 ||
    state.memory.failedAssetIds.length > 0 ||
    !state.memory.loadedAssetIds.includes('sentry') ||
    !state.memory.loadedAssetIds.includes('codes') ||
    !state.memory.loadedAssetIds.includes('cover-barricade') ||
    !state.memory.loadedAssetIds.includes('cable-tray') ||
    !state.memory.loadedAssetIds.includes('wall-machinery') ||
    !state.memory.loadedAssetIds.includes('extraction-beacon')
  ) {
    throw new Error(`Expected loaded GLB asset metrics, got ${JSON.stringify(state.memory)}`);
  }
  const requiredAuditIds = [
    'hero:echo-vanguard',
    'sentry',
    'keycard',
    'terminal',
    'codes',
    'cover-barricade',
    'cable-tray',
    'wall-machinery',
    'extraction-beacon',
  ];
  const assetAudit = (state.memory.assetAudit ?? []) as readonly RuntimeAssetAuditState[];
  if (
    assetAudit.length < requiredAuditIds.length ||
    requiredAuditIds.some((id) => !assetAudit.some((asset) => asset.id === id && asset.loaded && asset.grade === 'pass')) ||
    assetAudit.some((asset) => asset.failed || asset.fallbackVisible || asset.expectedFormat !== 'glb' || !asset.path.includes('.glb')) ||
    assetAudit.some((asset) => !['sneak-game-seed', 'repo-generated-glb'].includes(asset.source))
  ) {
    throw new Error(`Expected explicit GLB provenance audit with no visible fallbacks, got ${JSON.stringify(assetAudit)}`);
  }
  const blockerCover = state.assetQuality.find((check) => check.id === 'level-blocker-cover');
  const blockerChecks = state.assetQuality.filter((check) => check.category === 'blocker');
  if (!blockerCover || blockerCover.grade !== 'pass' || blockerChecks.length < defaultLevel.blockers.length + 1 || blockerChecks.some((check) => check.grade !== 'pass')) {
    throw new Error(`Expected every Level 1 blocker to use required cover-barricade GLB visuals, got ${JSON.stringify(blockerChecks)}`);
  }
  if (!state.geometry || state.geometry.doorContinuity.length !== 3 || state.geometry.objectBounds.length < 20) {
    throw new Error(`Expected coordinate geometry diagnostics for doors and scene objects, got ${JSON.stringify(state.geometry)}`);
  }
  if (
    state.geometry.wallRunContinuity.length < state.geometry.doorContinuity.length ||
    state.geometry.wallRunContinuity.some((check) =>
      check.grade !== 'pass' ||
      check.intervals.length < 3 ||
      !Array.isArray(check.connections) ||
      check.connections.length < check.intervals.length - 1 ||
      check.connections.some((edge) => edge.state === 'void') ||
      !Array.isArray(check.doorOwnership) ||
      !Array.isArray(check.cameraProbes) ||
      check.cameraProbes.length < 1 ||
      check.cameraProbes.some((probe) => probe.visibleVoid || probe.grade === 'fail') ||
      check.gaps.length > 0
    )
  ) {
    throw new Error(`Expected sorted wall-run ledgers, connection graphs, ownership rows, and camera probes with no unowned visible spans, got ${JSON.stringify(state.geometry.wallRunContinuity)}`);
  }
  const setDressingVisibility = state.geometry.setDressingVisibility;
  if (
    setDressingVisibility.length !== state.geometry.levelDensity.setDressingCount ||
    setDressingVisibility.some((check) => check.grade !== 'pass' || !check.loaded || !check.visible || !check.grounded || check.footprintCoverage < 0.35)
  ) {
    throw new Error(`Expected every authored set-dressing GLB placement to be loaded, visible, grounded, and coordinate-covered, got ${JSON.stringify(setDressingVisibility)}`);
  }
  if (
    state.geometry.levelDensity.grade === 'fail' ||
    state.geometry.levelDensity.setDressingCount < 10 ||
    state.geometry.levelDensity.setDressingRatio < aaaReadyLevelFootprintRatio
  ) {
    throw new Error(`Expected coordinate-backed level set dressing to clear the AAA density gate, got ${JSON.stringify(state.geometry.levelDensity)}`);
  }
  if (
    state.geometry.levelDensity.zones.length < 4 ||
    state.geometry.levelDensity.zones.some((zone) =>
      zone.grade !== 'pass' ||
      zone.landmarkCount < zone.expectedLandmarks.length ||
      zone.totalFootprintRatio < aaaReadyZoneFootprintRatio ||
      zone.interactableCount < 1
    )
  ) {
    throw new Error(`Expected every named density zone to pass AAA readiness with landmarks and interactables, got ${JSON.stringify(state.geometry.levelDensity.zones)}`);
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
  if (
    !state.renderBudget ||
    state.renderBudget.performanceProfile !== 'performance' ||
    state.renderBudget.grade !== 'pass' ||
    state.renderBudget.drawCallHeadroom < 0 ||
    state.renderBudget.triangleHeadroom < 0 ||
    state.renderBudget.geometryHeadroom < 0 ||
    state.renderBudget.textureHeadroom < 0 ||
    state.renderBudget.pixelRatioHeadroom < -0.01 ||
    state.renderBudget.shadowsEnabled
  ) {
    throw new Error(`Expected performance profile render budget to pass with headroom, got ${JSON.stringify(state.renderBudget)}`);
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

async function collectObjectiveAndExpectFocus(
  objectiveId: string,
  doorId: string,
  screenshotName: string,
  expectedGuidanceTarget: string,
): Promise<void> {
  await page.evaluate((id) => window.__shadowRecruitDebug?.collectObjective(id), objectiveId);
  await expectPhase('cinematic-focus');
  const focus = await page.evaluate(() => window.__shadowRecruitDebug?.cinematicFocus());
  if (!focus?.active || focus.target !== doorId || focus.remainingMs <= 0) {
    throw new Error(`Expected ${doorId} cinematic focus after ${objectiveId}, got ${JSON.stringify(focus)}`);
  }
  await expectMissionGuidance(expectedGuidanceTarget, expectedGuidanceTarget === 'extraction' ? 'extraction' : 'objective');
  const door = defaultLevel.doors.find((candidate) => candidate.id === doorId);
  if (!door || !focus.focusPoint || Math.hypot(focus.focusPoint.x - door.center.x, focus.focusPoint.z - door.center.z) > 0.1) {
    throw new Error(`Expected ${doorId} focus point to match authored door center, got ${JSON.stringify({ focus, door })}`);
  }
  const doors = await page.evaluate(() => window.__shadowRecruitDebug?.doors());
  if (!doors?.find((door) => door.id === doorId && door.open)) {
    throw new Error(`Expected ${doorId} to be open, got ${JSON.stringify(doors)}`);
  }
  await page.screenshot({ path: `${screenshotDir}/${screenshotName}`, fullPage: true });
  await expectPhase('playing');
}

async function expectMissionGuidance(expectedTargetId: string, expectedKind: 'objective' | 'extraction'): Promise<void> {
  const state = await page.evaluate(() => window.__shadowRecruitDebug?.captureTesterState());
  const guidance = state?.missionGuidance;
  const hudTarget = await page.locator('[data-testid="mission-guidance"]').getAttribute('data-target-id');
  const hudLabel = await page.locator('[data-testid="mission-guidance-label"]').innerText();
  const hudDetail = await page.locator('[data-testid="mission-guidance-detail"]').innerText();
  if (
    !guidance?.active ||
    guidance.targetId !== expectedTargetId ||
    guidance.targetKind !== expectedKind ||
    hudTarget !== expectedTargetId ||
    !hudLabel.trim() ||
    !/^\d+(\.\d+)?m (N|NE|E|SE|S|SW|W|NW)$/.test(hudDetail.trim())
  ) {
    throw new Error(`Expected ${expectedTargetId} ${expectedKind} mission guidance, got ${JSON.stringify({ guidance, hudTarget, hudLabel, hudDetail })}`);
  }
}

async function expectStat(testId: string, value: string): Promise<void> {
  const text = await page.locator(`[data-testid="${testId}"] strong`).innerText({ timeout: 10000 });
  if (text.trim() !== value) {
    throw new Error(`Expected ${testId} to be ${value}, got ${text}`);
  }
}

async function expectAudioState(
  activeTrack: 'title' | 'loading' | 'gameplay' | 'complete',
  expected: { muted: boolean; unlocked: boolean },
): Promise<void> {
  const state = await page.evaluate(() => window.__shadowRecruitDebug?.audioState());
  if (!state || state.activeTrack !== activeTrack || state.muted !== expected.muted || state.unlocked !== expected.unlocked) {
    throw new Error(`Expected audio ${activeTrack} muted=${expected.muted} unlocked=${expected.unlocked}, got ${JSON.stringify(state)}`);
  }
}

function assertOperativeMechanics(operative: OperativeDebugState | undefined, expectedHeroId: string): void {
  if (!operative || operative.selectedId !== expectedHeroId || operative.assetAuditId !== `hero:${expectedHeroId}`) {
    throw new Error(`Expected ${expectedHeroId} operative mechanics, got ${JSON.stringify(operative)}`);
  }
  if (operative.traitIds.length === 0 || operative.traits.some((trait) => !trait.applied)) {
    throw new Error(`Expected selected operative traits to be applied, got ${JSON.stringify(operative.traits)}`);
  }
  const changedScalars = Object.keys(operative.base).filter((key) =>
    Math.abs((operative.effective[key] ?? 0) - (operative.base[key] ?? 0)) > 0.001
  );
  if (changedScalars.length === 0 || operative.changedScalars.length === 0) {
    throw new Error(`Selected operative changed no gameplay scalars, got ${JSON.stringify(operative)}`);
  }
  if (operative.probes.length < operative.traitIds.length || operative.probes.some((probe) => probe.grade !== 'pass')) {
    throw new Error(`Expected every operative trait to have a passing mechanics probe, got ${JSON.stringify(operative.probes)}`);
  }
}

function assertNoPlayerFacingInternalTerms(copy: string, surface: string): void {
  const bannedTerms = [/\bGLB\b/i, /\bdensity zones?\b/i, /\basset audit\b/i, /\bruntime\b/i];
  const leaked = bannedTerms.find((term) => term.test(copy));
  if (leaked) {
    throw new Error(`Player-facing ${surface} leaks internal vocabulary ${leaked}: ${JSON.stringify(copy)}`);
  }
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
