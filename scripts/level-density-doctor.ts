import { levels } from '../src/game/levels';
import type { LevelDefinition, LevelZoneDefinition, RectSpec, Vec2 } from '../src/game/types';

const args = parseArgs(process.argv.slice(2));
const levelTarget = readThreshold('LEVEL_DENSITY_TARGET', 0.18);
const zoneTarget = readThreshold('ZONE_DENSITY_TARGET', 0.2);
const errors: string[] = [];
const summaries = levels.map((level) => summarizeLevel(level));

if (args.json) {
  console.log(JSON.stringify({
    ok: errors.length === 0,
    thresholds: { levelTarget, zoneTarget },
    levels: summaries,
    errors,
  }, null, 2));
} else {
  for (const summary of summaries) {
    console.info(`[level-density] ${summary.id}: total=${formatRatio(summary.ratio)} target=${formatRatio(levelTarget)} zones=${summary.zones.map((zone) => `${zone.id}:${formatRatio(zone.ratio)}`).join(', ')}`);
  }
  if (errors.length === 0) {
    console.info(`[level-density] ${summaries.length} registered level(s) meet AAA density thresholds.`);
  }
}

if (errors.length > 0) {
  for (const error of errors) console.error(`ERROR ${error}`);
  process.exit(1);
}

type LevelDensitySummary = {
  id: string;
  floorArea: number;
  footprintArea: number;
  ratio: number;
  zones: ZoneDensitySummary[];
};

type ZoneDensitySummary = {
  id: string;
  label: string;
  floorArea: number;
  footprintArea: number;
  ratio: number;
  setDressingCount: number;
  blockerCount: number;
  landmarkCount: number;
  expectedLandmarkCount: number;
  interactableCount: number;
};

function summarizeLevel(level: LevelDefinition): LevelDensitySummary {
  const floorArea = areaFromBounds(level.bounds);
  const footprintArea = totalFootprint(level, {
    id: '__level',
    label: 'Whole Level',
    bounds: level.bounds,
    expectedLandmarks: [],
  });
  const ratio = ratioOf(footprintArea, floorArea);
  const zones = level.zones.map((zone) => summarizeZone(level, zone));

  if (ratio < levelTarget) {
    errors.push(`${level.id}: level tactical footprint ${formatRatio(ratio)} is below ${formatRatio(levelTarget)}.`);
  }
  if (level.zones.length === 0) {
    errors.push(`${level.id}: no density zones are authored.`);
  }
  for (const zone of zones) {
    if (zone.ratio < zoneTarget) {
      errors.push(`${level.id}/${zone.id}: zone tactical footprint ${formatRatio(zone.ratio)} is below ${formatRatio(zoneTarget)}.`);
    }
    if (zone.landmarkCount < zone.expectedLandmarkCount) {
      errors.push(`${level.id}/${zone.id}: expected landmarks present ${zone.landmarkCount}/${zone.expectedLandmarkCount}.`);
    }
    if (zone.interactableCount < 1) {
      errors.push(`${level.id}/${zone.id}: no objective, door, or extraction milestone is inside the zone.`);
    }
  }

  return {
    id: level.id,
    floorArea: roundMetric(floorArea),
    footprintArea: roundMetric(footprintArea),
    ratio: roundMetric(ratio),
    zones,
  };
}

function summarizeZone(level: LevelDefinition, zone: LevelZoneDefinition): ZoneDensitySummary {
  const floorArea = areaFromBounds(zone.bounds);
  const footprintArea = totalFootprint(level, zone);
  return {
    id: zone.id,
    label: zone.label,
    floorArea: roundMetric(floorArea),
    footprintArea: roundMetric(footprintArea),
    ratio: roundMetric(ratioOf(footprintArea, floorArea)),
    setDressingCount: level.setDressing.filter((dressing) => rectZoneOverlapArea(dressing, zone) > 0).length,
    blockerCount: level.blockers.filter((blocker) => rectZoneOverlapArea(blocker, zone) > 0).length,
    landmarkCount: zone.expectedLandmarks.filter((id) => landmarkPresent(level, id, zone)).length,
    expectedLandmarkCount: zone.expectedLandmarks.length,
    interactableCount: level.objectives.filter((objective) => pointInBounds(objective.position, zone.bounds)).length
      + level.doors.filter((door) => pointInBounds(door.center, zone.bounds)).length
      + (pointInBounds(level.extraction, zone.bounds) ? 1 : 0),
  };
}

function totalFootprint(level: LevelDefinition, zone: LevelZoneDefinition): number {
  const blockerArea = level.blockers.reduce((sum, blocker) => sum + rectZoneOverlapArea(blocker, zone), 0);
  const setDressingArea = level.setDressing.reduce((sum, dressing) => sum + rectZoneOverlapArea(dressing, zone), 0);
  const objectiveArea = level.objectives
    .filter((objective) => pointInBounds(objective.position, zone.bounds))
    .reduce((sum, objective) => sum + Math.PI * objective.radius * objective.radius, 0);
  const enemyArea = level.enemies
    .filter((enemy) => pointInBounds(enemy.start, zone.bounds))
    .reduce((sum, enemy) => sum + Math.PI * enemy.detectionRadius * enemy.detectionRadius, 0);
  const extractionArea = pointInBounds(level.extraction, zone.bounds) ? Math.PI * 2.5 * 2.5 : 0;
  return blockerArea + setDressingArea + objectiveArea + enemyArea + extractionArea;
}

function rectZoneOverlapArea(rect: RectSpec, zone: LevelZoneDefinition): number {
  const minX = rect.center.x - rect.size.x / 2;
  const maxX = rect.center.x + rect.size.x / 2;
  const minZ = rect.center.z - rect.size.z / 2;
  const maxZ = rect.center.z + rect.size.z / 2;
  const overlapX = Math.max(0, Math.min(maxX, zone.bounds.max.x) - Math.max(minX, zone.bounds.min.x));
  const overlapZ = Math.max(0, Math.min(maxZ, zone.bounds.max.z) - Math.max(minZ, zone.bounds.min.z));
  return overlapX * overlapZ;
}

function landmarkPresent(level: LevelDefinition, id: string, zone: LevelZoneDefinition): boolean {
  return level.blockers.some((blocker) => blocker.id === id && rectZoneOverlapArea(blocker, zone) > 0)
    || level.setDressing.some((dressing) => dressing.id === id && rectZoneOverlapArea(dressing, zone) > 0)
    || level.objectives.some((objective) => objective.id === id && pointInBounds(objective.position, zone.bounds))
    || level.doors.some((door) => door.id === id && pointInBounds(door.center, zone.bounds))
    || level.enemies.some((enemy) => enemy.id === id && pointInBounds(enemy.start, zone.bounds))
    || (id === 'extraction' && pointInBounds(level.extraction, zone.bounds));
}

function areaFromBounds(bounds: { min: Vec2; max: Vec2 }): number {
  return Math.max(0, bounds.max.x - bounds.min.x) * Math.max(0, bounds.max.z - bounds.min.z);
}

function pointInBounds(point: Vec2, bounds: { min: Vec2; max: Vec2 }): boolean {
  return point.x >= bounds.min.x && point.x <= bounds.max.x && point.z >= bounds.min.z && point.z <= bounds.max.z;
}

function ratioOf(value: number, total: number): number {
  return total > 0 ? value / total : 0;
}

function roundMetric(value: number): number {
  return Number(value.toFixed(4));
}

function formatRatio(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function readThreshold(name: string, fallback: number): number {
  const value = process.env[name];
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 1) {
    throw new Error(`${name} must be a ratio between 0 and 1, got ${value}`);
  }
  return parsed;
}

function parseArgs(tokens: readonly string[]): { json: boolean } {
  const parsed = { json: false };
  for (const token of tokens) {
    if (token === '--json') parsed.json = true;
    else if (token === '--') continue;
    else throw new Error(`Unknown argument: ${token}`);
  }
  return parsed;
}
