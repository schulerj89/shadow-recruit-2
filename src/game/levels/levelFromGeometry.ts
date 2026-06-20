import type {
  DoorDefinition,
  EnemyDefinition,
  LevelDefinition,
  LevelZoneDefinition,
  ObjectiveAssetId,
  ObjectiveDefinition,
  ObjectiveType,
  RectSpec,
  SetDressingAssetId,
  SetDressingDefinition,
  TutorialStep,
  Vec2,
} from '../types';
import { vec } from '../math';

export type LevelGeometrySource = {
  metadata: {
    id: string;
    name: string;
    chapter: string;
  };
  bounds: { min: readonly number[]; max: readonly number[] };
  walls: readonly GeometryRect[];
  blockers: readonly GeometryRect[];
  setDressing: readonly GeometrySetDressingRect[];
  zones: readonly GeometryZone[];
  doors: readonly GeometryDoor[];
  spawns: readonly GeometryPoint[];
  objectives: readonly GeometryObjective[];
  enemies: readonly GeometryEnemy[];
  validationRoute: readonly (readonly number[])[];
  tutorial: readonly GeometryTutorialStep[];
};

type GeometryRect = {
  id: string;
  center: readonly number[];
  size: readonly number[];
  height?: number;
};

type GeometrySetDressingRect = GeometryRect & {
  asset: string;
};

type GeometryDoor = GeometryRect & {
  axis: 'x' | 'z';
  opensWhen: readonly string[];
  speed: number;
};

type GeometryPoint = {
  id: string;
  position: readonly number[];
};

type GeometryObjective = GeometryPoint & {
  type?: ObjectiveType;
  label?: string;
  radius?: number;
  required?: boolean;
  unlocks?: readonly string[];
  asset?: ObjectiveAssetId;
};

type GeometryEnemy = {
  id: string;
  label: string;
  start: readonly number[];
  patrol: readonly (readonly number[])[];
  speed: number;
  detectionRadius: number;
};

type GeometryZone = {
  id: string;
  label: string;
  bounds: { min: readonly number[]; max: readonly number[] };
  screenshot?: string;
  expectedLandmarks: readonly string[];
};

type GeometryTutorialStep = {
  id: string;
  title: string;
  text: string;
  target: string;
  alignmentKeywords: readonly string[];
};

const defaultObjectiveMetadata: Record<string, Pick<ObjectiveDefinition, 'type' | 'label' | 'radius' | 'required' | 'asset'>> = {
  'access-keycard': {
    type: 'keycard',
    label: 'Recover the access keycard',
    radius: 1.55,
    required: true,
    asset: 'keycard',
  },
  'security-terminal': {
    type: 'terminal',
    label: 'Hack the security terminal',
    radius: 1.75,
    required: true,
    asset: 'terminal',
  },
  'command-codes': {
    type: 'codes',
    label: 'Copy the command codes',
    radius: 1.55,
    required: true,
    asset: 'codes',
  },
};

export function levelFromGeometry(source: LevelGeometrySource): LevelDefinition {
  return {
    id: source.metadata.id,
    name: source.metadata.name,
    chapter: source.metadata.chapter,
    bounds: {
      min: pointFromArray(source.bounds.min),
      max: pointFromArray(source.bounds.max),
    },
    start: requiredPoint(source.spawns, 'player'),
    extraction: requiredPoint(source.objectives, 'extraction'),
    walls: source.walls.map(rectFromGeometry),
    blockers: source.blockers.map(rectFromGeometry),
    setDressing: source.setDressing.map(setDressingFromGeometry),
    zones: source.zones.map(zoneFromGeometry),
    doors: source.doors.map(doorFromGeometry),
    objectives: source.objectives.filter((objective) => objective.id !== 'extraction').map(objectiveFromGeometry),
    enemies: source.enemies.map(enemyFromGeometry),
    validationRoute: source.validationRoute.map(pointFromArray),
    tutorial: source.tutorial.map(tutorialFromGeometry),
  };
}

function pointFromArray(value: readonly number[]): Vec2 {
  return vec(Number(value[0] ?? 0), Number((value.length >= 3 ? value[2] : value[1]) ?? 0));
}

function rectFromGeometry(rect: GeometryRect): RectSpec {
  return {
    id: rect.id,
    center: pointFromArray(rect.center),
    size: pointFromArray(rect.size),
    ...(rect.height === undefined ? {} : { height: rect.height }),
  };
}

function setDressingFromGeometry(rect: GeometrySetDressingRect): SetDressingDefinition {
  if (!isSetDressingAssetId(rect.asset)) {
    throw new Error(`Missing set dressing asset for ${rect.id}`);
  }
  return {
    ...rectFromGeometry(rect),
    asset: rect.asset,
  };
}

function zoneFromGeometry(zone: GeometryZone): LevelZoneDefinition {
  return {
    id: zone.id,
    label: zone.label,
    bounds: {
      min: pointFromArray(zone.bounds.min),
      max: pointFromArray(zone.bounds.max),
    },
    ...(zone.screenshot ? { screenshot: zone.screenshot } : {}),
    expectedLandmarks: zone.expectedLandmarks,
  };
}

function doorFromGeometry(rect: GeometryDoor): DoorDefinition {
  return {
    ...rectFromGeometry(rect),
    axis: rect.axis,
    opensWhen: rect.opensWhen,
    speed: rect.speed,
  };
}

function objectiveFromGeometry(point: GeometryObjective): ObjectiveDefinition {
  const defaults = defaultObjectiveMetadata[point.id];
  const type = point.type ?? defaults?.type;
  const label = point.label ?? defaults?.label;
  const radius = point.radius ?? defaults?.radius;
  const required = point.required ?? defaults?.required;
  const asset = point.asset ?? defaults?.asset;

  if (!type || !label || !radius || required === undefined || !asset) {
    throw new Error(`Missing objective metadata for ${point.id}`);
  }

  return {
    id: point.id,
    type,
    label,
    position: pointFromArray(point.position),
    radius,
    required,
    unlocks: point.unlocks ?? [],
    asset,
  };
}

function enemyFromGeometry(enemy: GeometryEnemy): EnemyDefinition {
  return {
    id: enemy.id,
    label: enemy.label,
    start: pointFromArray(enemy.start),
    patrol: enemy.patrol.map(pointFromArray),
    speed: enemy.speed,
    detectionRadius: enemy.detectionRadius,
  };
}

function tutorialFromGeometry(step: GeometryTutorialStep): TutorialStep {
  return {
    id: step.id,
    title: step.title,
    target: step.target,
    text: step.text,
    alignmentKeywords: step.alignmentKeywords,
  };
}

function requiredPoint(points: readonly GeometryPoint[], id: string): Vec2 {
  const point = points.find((item) => item.id === id);
  if (!point) throw new Error(`Missing geometry point: ${id}`);
  return pointFromArray(point.position);
}

function isSetDressingAssetId(value: unknown): value is SetDressingAssetId {
  return value === 'cable-tray' || value === 'wall-machinery' || value === 'extraction-beacon';
}
