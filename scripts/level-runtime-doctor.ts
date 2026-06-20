import { levels } from '../src/game/levels';
import type { LevelDefinition, ObjectiveDefinition, TutorialStep, Vec2 } from '../src/game/types';

const errors: string[] = [];

for (const level of levels) {
  validateLevel(level);
}

if (errors.length > 0) {
  console.error('[level-runtime-doctor] failed');
  for (const error of errors) console.error(`ERROR ${error}`);
  process.exit(1);
}

console.info(`[level-runtime-doctor] ${levels.length} registered level(s) instantiate with mission metadata, routes, sentries, doors, objectives, and tutorial beats.`);

function validateLevel(level: LevelDefinition): void {
  const prefix = level.id || '<missing-level-id>';
  if (!nonEmpty(level.id)) errors.push(`${prefix}: missing level id.`);
  if (!nonEmpty(level.name)) errors.push(`${prefix}: missing level name.`);
  if (!nonEmpty(level.chapter)) errors.push(`${prefix}: missing level chapter.`);
  if (!isPoint(level.start)) errors.push(`${prefix}: missing player start.`);
  if (!isPoint(level.extraction)) errors.push(`${prefix}: missing extraction point.`);
  if (level.walls.length < 4) errors.push(`${prefix}: expected at least four wall segments.`);
  if (level.zones.length === 0) errors.push(`${prefix}: missing density zones.`);
  if (level.doors.length === 0) errors.push(`${prefix}: missing authored sliding doors.`);
  if (level.enemies.length === 0) errors.push(`${prefix}: missing sentry enemies.`);
  if (level.validationRoute.length < level.objectives.filter((objective) => objective.required).length + 2) {
    errors.push(`${prefix}: validation route is too short to prove objective and extraction flow.`);
  }

  const objectiveIds = new Set(level.objectives.map((objective) => objective.id));
  const doorIds = new Set(level.doors.map((door) => door.id));
  const enemyIds = new Set(level.enemies.map((enemy) => enemy.id));

  for (const objective of level.objectives) validateObjective(prefix, objective, doorIds);
  for (const door of level.doors) {
    if (!door.opensWhen.length) errors.push(`${prefix}/${door.id}: door must declare unlock objectives.`);
    if (door.opensWhen.some((objectiveId) => !objectiveIds.has(objectiveId))) {
      errors.push(`${prefix}/${door.id}: door references an unknown unlock objective.`);
    }
    if (!Number.isFinite(door.speed) || door.speed <= 0) errors.push(`${prefix}/${door.id}: door speed must be positive.`);
  }
  for (const enemy of level.enemies) {
    if (!nonEmpty(enemy.label)) errors.push(`${prefix}/${enemy.id}: sentry label is missing.`);
    if (!isPoint(enemy.start)) errors.push(`${prefix}/${enemy.id}: sentry start is missing.`);
    if (enemy.patrol.length < 2 || enemy.patrol.some((point) => !isPoint(point))) {
      errors.push(`${prefix}/${enemy.id}: sentry patrol must have at least two valid points.`);
    }
  }

  validateTutorial(prefix, level.tutorial, new Set(['hero', 'scene', 'extraction', ...objectiveIds, ...doorIds, ...enemyIds]));
}

function validateObjective(prefix: string, objective: ObjectiveDefinition, doorIds: Set<string>): void {
  if (!nonEmpty(objective.label)) errors.push(`${prefix}/${objective.id}: objective label is missing.`);
  if (!Number.isFinite(objective.radius) || objective.radius <= 0) errors.push(`${prefix}/${objective.id}: objective radius must be positive.`);
  if (!objective.required) errors.push(`${prefix}/${objective.id}: objective must be required until optional-objective QA exists.`);
  if (objective.unlocks.some((doorId) => !doorIds.has(doorId))) {
    errors.push(`${prefix}/${objective.id}: objective unlocks an unknown door.`);
  }
}

function validateTutorial(prefix: string, tutorial: readonly TutorialStep[], validTargets: Set<string>): void {
  if (tutorial.length < 5) errors.push(`${prefix}: expected at least five tutorial beats.`);
  for (const step of tutorial) {
    if (!nonEmpty(step.id) || !nonEmpty(step.title) || !nonEmpty(step.target) || !nonEmpty(step.text)) {
      errors.push(`${prefix}/tutorial: tutorial step is missing id, title, target, or text.`);
      continue;
    }
    if (!validTargets.has(step.target)) errors.push(`${prefix}/tutorial/${step.id}: target ${step.target} is not a known level object.`);
    if (!/good luck, cadet\.$/i.test(step.text.trim())) errors.push(`${prefix}/tutorial/${step.id}: text must end with "Good luck, cadet."`);
    if (step.alignmentKeywords.length === 0) errors.push(`${prefix}/tutorial/${step.id}: alignment keywords are missing.`);
  }
}

function nonEmpty(value: string): boolean {
  return value.trim().length > 0;
}

function isPoint(point: Vec2): boolean {
  return Number.isFinite(point.x) && Number.isFinite(point.z);
}
