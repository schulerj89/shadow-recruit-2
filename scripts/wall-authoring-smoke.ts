import { readFileSync } from 'node:fs';
import {
  assertVisualCollisionPairsShareSource,
  collidersContainingPoint,
  floodFillOutsideReachability,
  generateWallAssembly,
  type FloodFillConfig,
  type WallAuthoringDefinition,
} from '../src/game/levels/wallAuthoring';
import type { Vec2 } from '../src/game/types';

type WallAuthoringFixture = WallAuthoringDefinition & {
  testSeeds: {
    bounds: { min: readonly number[]; max: readonly number[] };
    outsideSeed: readonly number[];
    insideSeed: readonly number[];
    cellSize: number;
  };
};

const fixture = JSON.parse(readFileSync('data/levels/endpoint-wall-test-room.json', 'utf8')) as WallAuthoringFixture;
const seedConfig = floodConfigFromFixture(fixture);

const validDoorwayAssembly = generateWallAssembly(fixture, { debug: true });
assertEqual(validDoorwayAssembly.spans.length, 5, 'doorway fixture should subtract the doorway into five wall spans');
assertDebugMarkers(validDoorwayAssembly, fixture);
assertNoPairDrift(validDoorwayAssembly);
assertNoSingletonEndpoints(validDoorwayAssembly.endpointMarkers.map((marker) => ({ id: marker.id, usageCount: marker.usageCount, color: marker.color })));
assertEndpointOverlap(validDoorwayAssembly, fixture);

const doorwayReachability = floodFillOutsideReachability(validDoorwayAssembly, seedConfig);
assertEqual(doorwayReachability.reachable, true, 'room with an authored doorway should be reachable through that opening');

const closedFixture = withoutOpenings(fixture);
const closedAssembly = generateWallAssembly(closedFixture, { debug: true });
assertEqual(closedAssembly.spans.length, 4, 'closed room should generate one span per wall');
assertDebugMarkers(closedAssembly, closedFixture);
assertNoPairDrift(closedAssembly);
assertEndpointOverlap(closedAssembly, closedFixture);

const sealedReachability = floodFillOutsideReachability(closedAssembly, seedConfig);
assertEqual(sealedReachability.reachable, false, 'closed rectangular room should not leak from outside to inside');

const shortenedFixture = withShortenedEastWall(closedFixture);
const shortenedAssembly = generateWallAssembly(shortenedFixture, { debug: true });
const redEndpoints = shortenedAssembly.endpointMarkers.filter((marker) => marker.color === '#ef4444').map((marker) => marker.id).sort();
assertDebugMarkers(shortenedAssembly, shortenedFixture);
assertEqual(redEndpoints.join(','), 'ne,ne-short', 'shortened wall should mark unshared endpoints in red');
assertNoPairDrift(shortenedAssembly);

const shortenedReachability = floodFillOutsideReachability(shortenedAssembly, seedConfig);
assertEqual(shortenedReachability.reachable, true, 'deliberately shortened wall should fail the sealed-room leak test');

console.info('[wall-authoring] endpoint room passed');
console.info(`[wall-authoring] doorway spans=${validDoorwayAssembly.spans.length}; closed spans=${closedAssembly.spans.length}; shortened red endpoints=${redEndpoints.join(', ')}`);
console.info(`[wall-authoring] doorway reachable=${doorwayReachability.reachable}; closed reachable=${sealedReachability.reachable}; shortened reachable=${shortenedReachability.reachable}`);

function floodConfigFromFixture(source: WallAuthoringFixture): FloodFillConfig {
  return {
    bounds: {
      min: pointFromArray(source.testSeeds.bounds.min),
      max: pointFromArray(source.testSeeds.bounds.max),
    },
    outsideSeed: pointFromArray(source.testSeeds.outsideSeed),
    target: pointFromArray(source.testSeeds.insideSeed),
    cellSize: source.testSeeds.cellSize,
  };
}

function withoutOpenings(source: WallAuthoringFixture): WallAuthoringFixture {
  return {
    ...source,
    metadata: {
      id: `${source.metadata?.id ?? 'endpoint-room'}-closed`,
      name: `${source.metadata?.name ?? 'Endpoint Room'} Closed`,
    },
    walls: source.walls.map((wall) => ({ ...wall, openings: [] })),
  };
}

function withShortenedEastWall(source: WallAuthoringFixture): WallAuthoringFixture {
  return {
    ...source,
    metadata: {
      id: `${source.metadata?.id ?? 'endpoint-room'}-shortened`,
      name: `${source.metadata?.name ?? 'Endpoint Room'} Shortened`,
    },
    endpoints: {
      ...source.endpoints,
      'ne-short': [4, 2.1],
    },
    walls: source.walls.map((wall) => wall.id === 'east-wall' ? { ...wall, to: 'ne-short' } : wall),
  };
}

function assertNoPairDrift(assembly: ReturnType<typeof generateWallAssembly>): void {
  const drift = assertVisualCollisionPairsShareSource(assembly);
  if (drift.length > 0) {
    throw new Error(`Expected visual and collision geometry to share wall definitions: ${drift.join('; ')}`);
  }
}

function assertDebugMarkers(assembly: ReturnType<typeof generateWallAssembly>, source: WallAuthoringFixture): void {
  const expectedIds = Object.keys(source.endpoints).sort();
  const markerIds = assembly.endpointMarkers.map((marker) => marker.id).sort();
  assertEqual(markerIds.join(','), expectedIds.join(','), 'debug mode should emit one endpoint marker per named endpoint');

  const nonRenderable = assembly.endpointMarkers.filter((marker) => !marker.renderable);
  if (nonRenderable.length > 0) {
    throw new Error(`Debug endpoint markers should all be renderable: ${nonRenderable.map((marker) => marker.id).join(', ')}`);
  }
}

function assertNoSingletonEndpoints(markers: readonly { id: string; usageCount: number; color: string }[]): void {
  const singletons = markers.filter((marker) => marker.usageCount === 1 || marker.color === '#ef4444');
  if (singletons.length > 0) {
    throw new Error(`Valid room should not have singleton endpoints: ${singletons.map((marker) => marker.id).join(', ')}`);
  }
}

function assertEndpointOverlap(assembly: ReturnType<typeof generateWallAssembly>, source: WallAuthoringFixture): void {
  for (const marker of assembly.endpointMarkers) {
    const sourcePoint = source.endpoints[marker.id];
    if (!sourcePoint) continue;

    const containing = collidersContainingPoint(assembly, pointFromAuthoring(sourcePoint));
    if (marker.usageCount >= 2 && containing.length < 2) {
      throw new Error(`Endpoint ${marker.id} should be covered by overlapping wall collision spans, found ${containing.length}.`);
    }
  }
}

function pointFromArray(value: readonly number[]): Vec2 {
  return { x: Number(value[0]), z: Number(value.length >= 3 ? value[2] : value[1]) };
}

function pointFromAuthoring(value: WallAuthoringFixture['endpoints'][string]): Vec2 {
  if (isPointArray(value)) return pointFromArray(value);
  return value;
}

function isPointArray(value: WallAuthoringFixture['endpoints'][string]): value is readonly number[] {
  return Array.isArray(value);
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
  }
}
