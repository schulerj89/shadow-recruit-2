import { getLevelById, levels } from '../src/game/levels';
import { distance, pointInBounds, pointInRect } from '../src/game/math';
import type { LevelDefinition } from '../src/game/types';

let failures = 0;
const requestedLevelId = process.env.PLAYTHROUGH_LEVEL_ID;
const levelsToValidate = requestedLevelId ? [getLevelById(requestedLevelId)] : levels;

if (levelsToValidate.some((level) => !level)) {
  console.error(`[playthrough] Unknown PLAYTHROUGH_LEVEL_ID: ${requestedLevelId}`);
  process.exit(1);
}

const selectedLevels = levelsToValidate.filter((level): level is LevelDefinition => Boolean(level));

for (const level of selectedLevels) {
  validateRoute(level);
  validateUnlockOrder(level);
}

if (failures > 0) {
  console.error(`[playthrough] ${failures} validation failure(s)`);
  process.exitCode = 1;
} else {
  console.info(`[playthrough] ${selectedLevels.map((level) => level.id).join(', ')} route, collision, objectives, doors, and extraction validated`);
}

function validateRoute(level: LevelDefinition): void {
  for (const point of level.validationRoute) {
    if (!pointInBounds(point, level.bounds, 0.45)) {
      fail(`${level.id}: route point out of bounds: ${point.x},${point.z}`);
    }

    for (const blocker of [...level.walls, ...level.blockers]) {
      if (pointInRect(point, blocker, 0.34)) {
        fail(`${level.id}: route point ${point.x},${point.z} intersects ${blocker.id}`);
      }
    }
  }

  for (const objective of level.objectives) {
    const reachable = level.validationRoute.some((point) => distance(point, objective.position) <= objective.radius + 0.6);
    if (!reachable) fail(`${level.id}: route never reaches objective ${objective.id}`);
  }

  const reachesExtraction = level.validationRoute.some((point) => distance(point, level.extraction) <= 2.8);
  if (!reachesExtraction) fail(`${level.id}: route never reaches extraction`);
}

function validateUnlockOrder(level: LevelDefinition): void {
  const collected = new Set<string>();
  const openedDoors = new Set<string>();

  for (const point of level.validationRoute) {
    for (const objective of level.objectives) {
      if (!collected.has(objective.id) && distance(point, objective.position) <= objective.radius + 0.6) {
        collected.add(objective.id);
        for (const doorId of objective.unlocks) openedDoors.add(doorId);
      }
    }

    for (const door of level.doors) {
      if (distance(point, door.center) <= 2.4 && !openedDoors.has(door.id)) {
        fail(`${level.id}: route reaches ${door.id} before its unlock objective`);
      }
    }
  }

  for (const objective of level.objectives.filter((item) => item.required)) {
    if (!collected.has(objective.id)) fail(`${level.id}: required objective missing from route: ${objective.id}`);
  }
}

function fail(message: string): void {
  failures += 1;
  console.error(`[playthrough] ${message}`);
}
