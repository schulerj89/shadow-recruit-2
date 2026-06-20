import { levelOne } from '../src/game/levels/levelOne';
import { distance, pointInBounds, pointInRect } from '../src/game/math';

let failures = 0;

validateRoute();
validateUnlockOrder();

if (failures > 0) {
  console.error(`[playthrough] ${failures} validation failure(s)`);
  process.exitCode = 1;
} else {
  console.info(`[playthrough] ${levelOne.id} route, collision, objectives, doors, and extraction validated`);
}

function validateRoute(): void {
  for (const point of levelOne.validationRoute) {
    if (!pointInBounds(point, levelOne.bounds, 0.45)) {
      fail(`route point out of bounds: ${point.x},${point.z}`);
    }

    for (const blocker of [...levelOne.walls, ...levelOne.blockers]) {
      if (pointInRect(point, blocker, 0.34)) {
        fail(`route point ${point.x},${point.z} intersects ${blocker.id}`);
      }
    }
  }

  for (const objective of levelOne.objectives) {
    const reachable = levelOne.validationRoute.some((point) => distance(point, objective.position) <= objective.radius + 0.6);
    if (!reachable) fail(`route never reaches objective ${objective.id}`);
  }

  const reachesExtraction = levelOne.validationRoute.some((point) => distance(point, levelOne.extraction) <= 2.8);
  if (!reachesExtraction) fail('route never reaches extraction');
}

function validateUnlockOrder(): void {
  const collected = new Set<string>();
  const openedDoors = new Set<string>();

  for (const point of levelOne.validationRoute) {
    for (const objective of levelOne.objectives) {
      if (!collected.has(objective.id) && distance(point, objective.position) <= objective.radius + 0.6) {
        collected.add(objective.id);
        for (const doorId of objective.unlocks) openedDoors.add(doorId);
      }
    }

    for (const door of levelOne.doors) {
      if (distance(point, door.center) <= 2.4 && !openedDoors.has(door.id)) {
        fail(`route reaches ${door.id} before its unlock objective`);
      }
    }
  }

  for (const objective of levelOne.objectives.filter((item) => item.required)) {
    if (!collected.has(objective.id)) fail(`required objective missing from route: ${objective.id}`);
  }
}

function fail(message: string): void {
  failures += 1;
  console.error(`[playthrough] ${message}`);
}
