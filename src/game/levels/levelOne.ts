import geometry from '../../../data/levels/level-one.geometry.json';
import type { DoorDefinition, LevelDefinition, ObjectiveDefinition, RectSpec, SetDressingAssetId, SetDressingDefinition, Vec2 } from '../types';
import { vec } from '../math';

type GeometryRect = {
  id: string;
  center: readonly number[];
  size: readonly number[];
  height?: number;
  asset?: string;
};

type GeometryPoint = {
  id: string;
  position: readonly number[];
};

const objectiveOrder = ['access-keycard', 'security-terminal', 'command-codes'] as const;
type ObjectiveId = typeof objectiveOrder[number];

const objectiveMetadata = {
  'access-keycard': {
    id: 'access-keycard',
    type: 'keycard',
    label: 'Recover the lobby keycard',
    radius: 1.55,
    required: true,
    unlocks: ['lobby-door'],
    asset: 'keycard',
  },
  'security-terminal': {
    id: 'security-terminal',
    type: 'terminal',
    label: 'Hack the security terminal',
    radius: 1.75,
    required: true,
    unlocks: ['server-door'],
    asset: 'terminal',
  },
  'command-codes': {
    id: 'command-codes',
    type: 'codes',
    label: 'Copy the command codes',
    radius: 1.55,
    required: true,
    unlocks: ['extraction-door'],
    asset: 'codes',
  },
} satisfies Record<ObjectiveId, Omit<ObjectiveDefinition, 'position'>>;

const doorMetadata = {
  'lobby-door': {
    axis: 'x',
    opensWhen: ['access-keycard'],
    speed: 1.8,
  },
  'server-door': {
    axis: 'x',
    opensWhen: ['security-terminal'],
    speed: 1.8,
  },
  'extraction-door': {
    axis: 'x',
    opensWhen: ['command-codes'],
    speed: 1.9,
  },
} satisfies Record<string, Pick<DoorDefinition, 'axis' | 'opensWhen' | 'speed'>>;
type DoorId = keyof typeof doorMetadata;

export const levelOne: LevelDefinition = {
  id: 'blacksite-threshold',
  name: 'Blacksite Threshold',
  chapter: 'Operation Glass Dagger',
  bounds: {
    min: pointFromArray(geometry.bounds.min),
    max: pointFromArray(geometry.bounds.max),
  },
  start: requiredPoint(geometry.spawns, 'player'),
  extraction: requiredPoint(geometry.objectives, 'extraction'),
  walls: geometry.walls.map(rectFromGeometry),
  blockers: geometry.blockers.map(rectFromGeometry),
  setDressing: geometry.setDressing.map(setDressingFromGeometry),
  doors: geometry.doors.map(doorFromGeometry),
  objectives: objectiveOrder.map(objectiveFromGeometry),
  enemies: [
    {
      id: 'sentry-lobby',
      label: 'Lobby sentry',
      start: vec(16, -25),
      patrol: [vec(16, -25), vec(-8, -23), vec(10, -13)],
      speed: 2.1,
      detectionRadius: 2.45,
    },
    {
      id: 'sentry-server',
      label: 'Server sentry',
      start: vec(18, 12),
      patrol: [vec(18, 12), vec(31, 15), vec(18, 1)],
      speed: 1.9,
      detectionRadius: 2.4,
    },
    {
      id: 'sentry-command',
      label: 'Command sentry',
      start: vec(-14, 25),
      patrol: [vec(-14, 25), vec(12, 25), vec(-3, 32)],
      speed: 2.0,
      detectionRadius: 2.35,
    },
  ],
  validationRoute: [
    vec(0, -29),
    vec(-31, -25),
    vec(0, -19),
    vec(1, -16),
    vec(30, -3),
    vec(15, 4),
    vec(16, 7),
    vec(-32, 14),
    vec(0, 19),
    vec(0, 24),
    vec(0, 33),
  ],
  tutorial: [
    {
      id: 'hero',
      title: 'Insertion',
      target: 'hero',
      text: 'Cadet, this is your first Shadow Recruit field operation. Move quietly, keep your suit low, and read the room before you cross open ground. Good luck, cadet.',
    },
    {
      id: 'keycard',
      title: 'First Lock',
      target: 'access-keycard',
      text: 'Your first objective is the lobby keycard. Secure it to open the first sliding security door. Good luck, cadet.',
    },
    {
      id: 'terminal',
      title: 'Security Stack',
      target: 'security-terminal',
      text: 'The terminal controls the server-wing door. Get close, interact, and let the deck burn through the lock. Good luck, cadet.',
    },
    {
      id: 'sentry',
      title: 'Avoid Contact',
      target: 'sentry-lobby',
      text: 'Avoid sentries. If one closes in, you are done. Use cover, watch patrol timing, and do not sprint into a sightline. Good luck, cadet.',
    },
    {
      id: 'extraction',
      title: 'Extraction',
      target: 'extraction',
      text: 'When the command codes unlock the final door, move to the extraction pad and hold the zone. Good luck, cadet.',
    },
  ],
};

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

function setDressingFromGeometry(rect: GeometryRect): SetDressingDefinition {
  if (!isSetDressingAssetId(rect.asset)) {
    throw new Error(`Missing set dressing asset for ${rect.id}`);
  }
  return {
    ...rectFromGeometry(rect),
    asset: rect.asset,
  };
}

function isSetDressingAssetId(value: unknown): value is SetDressingAssetId {
  return value === 'cable-tray' || value === 'wall-machinery' || value === 'extraction-beacon';
}

function doorFromGeometry(rect: GeometryRect): DoorDefinition {
  const metadata = isDoorId(rect.id) ? doorMetadata[rect.id] : undefined;
  if (!metadata) throw new Error(`Missing door metadata for ${rect.id}`);
  return {
    ...rectFromGeometry(rect),
    ...metadata,
  };
}

function isDoorId(value: string): value is DoorId {
  return value in doorMetadata;
}

function objectiveFromGeometry(id: ObjectiveId): ObjectiveDefinition {
  return {
    ...objectiveMetadata[id],
    position: requiredPoint(geometry.objectives, id),
  };
}

function requiredPoint(points: readonly GeometryPoint[], id: string): Vec2 {
  const point = points.find((item) => item.id === id);
  if (!point) throw new Error(`Missing geometry point: ${id}`);
  return pointFromArray(point.position);
}
