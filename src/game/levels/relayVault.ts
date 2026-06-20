import geometry from '../../../data/levels/relay-vault.geometry.json';
import type { DoorDefinition, LevelDefinition, LevelZoneDefinition, ObjectiveDefinition, RectSpec, SetDressingAssetId, SetDressingDefinition, Vec2 } from '../types';
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

type GeometryZone = {
  id: string;
  label: string;
  bounds: { min: readonly number[]; max: readonly number[] };
  screenshot?: string;
  expectedLandmarks: readonly string[];
};

const objectiveOrder = ['access-keycard', 'security-terminal', 'command-codes'] as const;
type ObjectiveId = typeof objectiveOrder[number];

const objectiveMetadata = {
  'access-keycard': {
    id: 'access-keycard',
    type: 'keycard',
    label: 'Recover the access keycard',
    radius: 1.55,
    required: true,
    unlocks: ['entry-door'],
    asset: 'keycard',
  },
  'security-terminal': {
    id: 'security-terminal',
    type: 'terminal',
    label: 'Breach the security terminal',
    radius: 1.75,
    required: true,
    unlocks: ['vault-door'],
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
  'entry-door': {
    axis: 'x',
    opensWhen: ['access-keycard'],
    speed: 1.8,
  },
  'vault-door': {
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

export const relayVaultLevel: LevelDefinition = {
  id: 'relay-vault',
  name: 'Relay Vault',
  chapter: 'Operation Night Compass',
  bounds: {
    min: pointFromArray(geometry.bounds.min),
    max: pointFromArray(geometry.bounds.max),
  },
  start: requiredPoint(geometry.spawns, 'player'),
  extraction: requiredPoint(geometry.objectives, 'extraction'),
  walls: geometry.walls.map(rectFromGeometry),
  blockers: geometry.blockers.map(rectFromGeometry),
  setDressing: geometry.setDressing.map(setDressingFromGeometry),
  zones: geometry.zones.map(zoneFromGeometry),
  doors: geometry.doors.map(doorFromGeometry),
  objectives: objectiveOrder.map(objectiveFromGeometry),
  enemies: [
    {
      id: 'sentry-south',
      label: 'South sentry',
      start: vec(16, -32),
      patrol: [vec(16, -32), vec(-12, -28), vec(12, -18)],
      speed: 2.0,
      detectionRadius: 2.4,
    },
    {
      id: 'sentry-mid',
      label: 'Mid sentry',
      start: vec(20, 4),
      patrol: [vec(20, 4), vec(36, 7), vec(18, -8)],
      speed: 1.9,
      detectionRadius: 2.4,
    },
    {
      id: 'sentry-north',
      label: 'North sentry',
      start: vec(18, 31),
      patrol: [vec(18, 31), vec(-18, 30), vec(12, 22)],
      speed: 1.95,
      detectionRadius: 2.35,
    },
  ],
  validationRoute: [
    vec(0, -36),
    vec(-38, -31),
    vec(0, -15),
    vec(2, -10),
    vec(34, 0),
    vec(0, 13),
    vec(-34, 25),
    vec(0, 27),
    vec(0, 36),
  ],
  tutorial: [
    {
      id: 'hero',
      title: 'Insertion',
      target: 'hero',
      text: 'Cadet, Relay Vault stores a live signal mirror under Night Compass. Move through the entry locks, stay off the sentry lanes, and keep the relay core intact. Good luck, cadet.',
      alignmentKeywords: ['cadet', 'relay vault', 'sentry'],
    },
    {
      id: 'keycard',
      title: 'First Lock',
      target: 'access-keycard',
      text: 'The access keycard opens the south entry gate. Cross from cover to cover and watch the first sentry sweep before committing. Good luck, cadet.',
      alignmentKeywords: ['keycard', 'gate', 'cover'],
    },
    {
      id: 'terminal',
      title: 'Security Stack',
      target: 'security-terminal',
      text: 'The security terminal drops the vault gate. Hack it from the service-bank shadow, then move before the mid sentry doubles back. Good luck, cadet.',
      alignmentKeywords: ['terminal', 'gate', 'stealth'],
    },
    {
      id: 'codes',
      title: 'Command Codes',
      target: 'command-codes',
      text: 'The command codes authorize extraction. Grab the relay packet from the north console and keep the exit lane in sight. Good luck, cadet.',
      alignmentKeywords: ['command codes', 'extraction', 'landmark'],
    },
    {
      id: 'extraction',
      title: 'Extraction',
      target: 'extraction',
      text: 'Extraction is the lit relay pad past the final divider. Hold the zone until command confirms the mirror is burned. Good luck, cadet.',
      alignmentKeywords: ['extraction', 'final approach', 'pressure'],
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
