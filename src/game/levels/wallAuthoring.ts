import { add, length, normalize, scale, subtract, vec } from '../math';
import type { Vec2 } from '../types';

export type WallAuthoringPoint = readonly number[] | Vec2;

export type WallOpeningDefinition = {
  id: string;
  centerOffset: number;
  width: number;
};

export type WallSegmentDefinition = {
  id: string;
  from: string;
  to: string;
  openings?: readonly WallOpeningDefinition[];
  height?: number;
};

export type WallAuthoringDefinition = {
  metadata?: {
    id: string;
    name: string;
  };
  wallThickness: number;
  wallHeight: number;
  endpoints: Record<string, WallAuthoringPoint>;
  walls: readonly WallSegmentDefinition[];
};

export type GeneratedWallSpan = {
  id: string;
  wallId: string;
  fromEndpointId: string;
  toEndpointId: string;
  startOffset: number;
  endOffset: number;
  extendedStartOffset: number;
  extendedEndOffset: number;
  clippedByOpeningIds: readonly string[];
  center: Vec2;
  direction: Vec2;
  normal: Vec2;
  yaw: number;
  length: number;
  thickness: number;
  height: number;
};

export type GeneratedWallGeometry = {
  id: string;
  sourceWallId: string;
  sourceSpanId: string;
  center: Vec2;
  direction: Vec2;
  normal: Vec2;
  yaw: number;
  length: number;
  thickness: number;
  height: number;
};

export type WallEndpointDebugMarker = {
  id: string;
  position: Vec2;
  wallIds: readonly string[];
  usageCount: number;
  color: '#ef4444' | '#38bdf8';
  radius: number;
  renderable: boolean;
};

export type GeneratedWallAssembly = {
  id: string;
  wallThickness: number;
  wallHeight: number;
  spans: readonly GeneratedWallSpan[];
  visualMeshes: readonly GeneratedWallGeometry[];
  colliders: readonly GeneratedWallGeometry[];
  endpointMarkers: readonly WallEndpointDebugMarker[];
};

export type FloodFillConfig = {
  bounds: { min: Vec2; max: Vec2 };
  outsideSeed: Vec2;
  target: Vec2;
  cellSize: number;
};

export type FloodFillResult = {
  reachable: boolean;
  visitedCells: number;
  blockedCells: number;
  targetCell: { x: number; z: number };
  outsideCell: { x: number; z: number };
};

type NormalizedEndpoint = {
  id: string;
  position: Vec2;
  wallIds: string[];
};

type NormalizedOpening = {
  id: string;
  startOffset: number;
  endOffset: number;
};

type RawSpan = {
  index: number;
  startOffset: number;
  endOffset: number;
  clippedByOpeningIds: readonly string[];
};

const EPSILON = 0.00001;

export function generateWallAssembly(source: WallAuthoringDefinition, options: { debug?: boolean } = {}): GeneratedWallAssembly {
  assertPositiveFinite(source.wallThickness, 'wallThickness');
  assertPositiveFinite(source.wallHeight, 'wallHeight');

  const endpoints = normalizeEndpoints(source.endpoints);
  const endpointUsage = new Map<string, string[]>();
  const spans: GeneratedWallSpan[] = [];

  for (const wall of source.walls) {
    const from = endpointById(endpoints, wall.from);
    const to = endpointById(endpoints, wall.to);
    const wallVector = subtract(to.position, from.position);
    const wallLength = length(wallVector);
    assertPositiveFinite(wallLength, `${wall.id} length`);

    pushUsage(endpointUsage, wall.from, wall.id);
    pushUsage(endpointUsage, wall.to, wall.id);

    const direction = normalize(wallVector);
    const normal = vec(-direction.z, direction.x);
    const yaw = Math.atan2(direction.x, direction.z);
    const openings = normalizeOpenings(wall, wallLength);
    const rawSpans = subtractOpenings(wall.id, wallLength, openings);

    for (const rawSpan of rawSpans) {
      const startIsEndpoint = rawSpan.startOffset <= EPSILON;
      const endIsEndpoint = rawSpan.endOffset >= wallLength - EPSILON;
      const extendedStartOffset = rawSpan.startOffset - (startIsEndpoint ? source.wallThickness / 2 : 0);
      const extendedEndOffset = rawSpan.endOffset + (endIsEndpoint ? source.wallThickness / 2 : 0);
      const spanLength = extendedEndOffset - extendedStartOffset;
      const centerOffset = (extendedStartOffset + extendedEndOffset) / 2;
      const center = add(from.position, scale(direction, centerOffset));

      spans.push({
        id: `${wall.id}:span-${rawSpan.index}`,
        wallId: wall.id,
        fromEndpointId: wall.from,
        toEndpointId: wall.to,
        startOffset: round(rawSpan.startOffset),
        endOffset: round(rawSpan.endOffset),
        extendedStartOffset: round(extendedStartOffset),
        extendedEndOffset: round(extendedEndOffset),
        clippedByOpeningIds: rawSpan.clippedByOpeningIds,
        center: roundVec(center),
        direction: roundVec(direction),
        normal: roundVec(normal),
        yaw: round(yaw),
        length: round(spanLength),
        thickness: source.wallThickness,
        height: wall.height ?? source.wallHeight,
      });
    }
  }

  const visualMeshes = spans.map((span) => geometryFromSpan(span, 'visual'));
  const colliders = spans.map((span) => geometryFromSpan(span, 'collision'));
  const endpointMarkers = options.debug ? endpointDebugMarkers(endpoints, endpointUsage, source.wallThickness) : [];

  return {
    id: source.metadata?.id ?? 'endpoint-wall-assembly',
    wallThickness: source.wallThickness,
    wallHeight: source.wallHeight,
    spans,
    visualMeshes,
    colliders,
    endpointMarkers,
  };
}

export function floodFillOutsideReachability(assembly: GeneratedWallAssembly, config: FloodFillConfig): FloodFillResult {
  assertPositiveFinite(config.cellSize, 'cellSize');
  const width = config.bounds.max.x - config.bounds.min.x;
  const depth = config.bounds.max.z - config.bounds.min.z;
  assertPositiveFinite(width, 'flood bounds width');
  assertPositiveFinite(depth, 'flood bounds depth');

  const columns = Math.ceil(width / config.cellSize);
  const rows = Math.ceil(depth / config.cellSize);
  const outsideCell = pointToCell(config.outsideSeed, config);
  const targetCell = pointToCell(config.target, config);
  const queue: { x: number; z: number }[] = [outsideCell];
  const visited = new Set<string>();
  let blockedCells = 0;

  while (queue.length > 0) {
    const cell = queue.shift();
    if (!cell) break;
    if (cell.x < 0 || cell.x >= columns || cell.z < 0 || cell.z >= rows) continue;

    const key = cellKey(cell);
    if (visited.has(key)) continue;
    visited.add(key);

    const point = cellCenter(cell, config);
    if (collidersContainingPoint(assembly, point).length > 0) {
      blockedCells += 1;
      continue;
    }

    if (cell.x === targetCell.x && cell.z === targetCell.z) {
      return { reachable: true, visitedCells: visited.size, blockedCells, outsideCell, targetCell };
    }

    queue.push(
      { x: cell.x + 1, z: cell.z },
      { x: cell.x - 1, z: cell.z },
      { x: cell.x, z: cell.z + 1 },
      { x: cell.x, z: cell.z - 1 },
    );
  }

  return { reachable: false, visitedCells: visited.size, blockedCells, outsideCell, targetCell };
}

export function collidersContainingPoint(assembly: GeneratedWallAssembly, point: Vec2): readonly GeneratedWallGeometry[] {
  return assembly.colliders.filter((collider) => pointInGeneratedWall(point, collider));
}

export function assertVisualCollisionPairsShareSource(assembly: GeneratedWallAssembly): readonly string[] {
  const errors: string[] = [];
  if (assembly.visualMeshes.length !== assembly.colliders.length) {
    errors.push(`visual/collision count mismatch: ${assembly.visualMeshes.length} visual, ${assembly.colliders.length} collision`);
    return errors;
  }

  for (let index = 0; index < assembly.visualMeshes.length; index += 1) {
    const visual = assembly.visualMeshes[index];
    const collider = assembly.colliders[index];
    if (!collider) {
      errors.push(`missing collider for ${visual.id}`);
      continue;
    }

    const sameSource = visual.sourceWallId === collider.sourceWallId && visual.sourceSpanId === collider.sourceSpanId;
    const sameTransform = close(visual.center.x, collider.center.x) &&
      close(visual.center.z, collider.center.z) &&
      close(visual.yaw, collider.yaw) &&
      close(visual.length, collider.length) &&
      close(visual.thickness, collider.thickness) &&
      close(visual.height, collider.height);

    if (!sameSource || !sameTransform) {
      errors.push(`visual/collision drift for ${visual.id} and ${collider.id}`);
    }
  }

  return errors;
}

function normalizeEndpoints(source: Record<string, WallAuthoringPoint>): Map<string, NormalizedEndpoint> {
  const endpoints = new Map<string, NormalizedEndpoint>();
  for (const [id, point] of Object.entries(source)) {
    endpoints.set(id, { id, position: roundVec(pointFromAuthoring(point, id)), wallIds: [] });
  }
  return endpoints;
}

function endpointById(endpoints: Map<string, NormalizedEndpoint>, id: string): NormalizedEndpoint {
  const endpoint = endpoints.get(id);
  if (!endpoint) throw new Error(`Unknown wall endpoint: ${id}`);
  return endpoint;
}

function pushUsage(endpointUsage: Map<string, string[]>, endpointId: string, wallId: string): void {
  const usage = endpointUsage.get(endpointId) ?? [];
  usage.push(wallId);
  endpointUsage.set(endpointId, usage);
}

function normalizeOpenings(wall: WallSegmentDefinition, wallLength: number): readonly NormalizedOpening[] {
  const openings = [...(wall.openings ?? [])].map((opening) => {
    assertPositiveFinite(opening.width, `${wall.id}/${opening.id} width`);
    const startOffset = opening.centerOffset - opening.width / 2;
    const endOffset = opening.centerOffset + opening.width / 2;
    if (startOffset < -EPSILON || endOffset > wallLength + EPSILON) {
      throw new Error(`${wall.id}/${opening.id} opening must fit inside the wall segment.`);
    }
    return {
      id: opening.id,
      startOffset: Math.max(0, startOffset),
      endOffset: Math.min(wallLength, endOffset),
    };
  }).sort((a, b) => a.startOffset - b.startOffset || a.endOffset - b.endOffset);

  for (let index = 1; index < openings.length; index += 1) {
    const previous = openings[index - 1];
    const current = openings[index];
    if (previous && current && current.startOffset < previous.endOffset - EPSILON) {
      throw new Error(`${wall.id}/${current.id} overlaps opening ${previous.id}.`);
    }
  }

  return openings;
}

function subtractOpenings(wallId: string, wallLength: number, openings: readonly NormalizedOpening[]): readonly RawSpan[] {
  const spans: RawSpan[] = [];
  let cursor = 0;
  let index = 0;

  for (const opening of openings) {
    if (opening.startOffset > cursor + EPSILON) {
      spans.push({
        index,
        startOffset: cursor,
        endOffset: opening.startOffset,
        clippedByOpeningIds: [opening.id],
      });
      index += 1;
    }
    cursor = Math.max(cursor, opening.endOffset);
  }

  if (cursor < wallLength - EPSILON) {
    spans.push({
      index,
      startOffset: cursor,
      endOffset: wallLength,
      clippedByOpeningIds: openings.length > 0 ? [openings[openings.length - 1]?.id ?? `${wallId}:opening`] : [],
    });
  }

  return spans;
}

function geometryFromSpan(span: GeneratedWallSpan, kind: 'visual' | 'collision'): GeneratedWallGeometry {
  return {
    id: `${span.id}:${kind}`,
    sourceWallId: span.wallId,
    sourceSpanId: span.id,
    center: span.center,
    direction: span.direction,
    normal: span.normal,
    yaw: span.yaw,
    length: span.length,
    thickness: span.thickness,
    height: span.height,
  };
}

function endpointDebugMarkers(
  endpoints: Map<string, NormalizedEndpoint>,
  endpointUsage: Map<string, string[]>,
  wallThickness: number,
): readonly WallEndpointDebugMarker[] {
  return [...endpoints.values()].map((endpoint) => {
    const wallIds = endpointUsage.get(endpoint.id) ?? [];
    return {
      id: endpoint.id,
      position: endpoint.position,
      wallIds,
      usageCount: wallIds.length,
      color: wallIds.length === 1 ? '#ef4444' : '#38bdf8',
      radius: round(wallThickness * 0.45),
      renderable: true,
    };
  });
}

function pointInGeneratedWall(point: Vec2, wall: GeneratedWallGeometry): boolean {
  const delta = subtract(point, wall.center);
  const along = delta.x * wall.direction.x + delta.z * wall.direction.z;
  const across = delta.x * wall.normal.x + delta.z * wall.normal.z;
  return Math.abs(along) <= wall.length / 2 + EPSILON && Math.abs(across) <= wall.thickness / 2 + EPSILON;
}

function pointToCell(point: Vec2, config: FloodFillConfig): { x: number; z: number } {
  return {
    x: Math.floor((point.x - config.bounds.min.x) / config.cellSize),
    z: Math.floor((point.z - config.bounds.min.z) / config.cellSize),
  };
}

function cellCenter(cell: { x: number; z: number }, config: FloodFillConfig): Vec2 {
  return {
    x: config.bounds.min.x + (cell.x + 0.5) * config.cellSize,
    z: config.bounds.min.z + (cell.z + 0.5) * config.cellSize,
  };
}

function cellKey(cell: { x: number; z: number }): string {
  return `${cell.x}:${cell.z}`;
}

function pointFromAuthoring(point: WallAuthoringPoint, id: string): Vec2 {
  if (isPointArray(point)) {
    const x = Number(point[0]);
    const z = Number(point.length >= 3 ? point[2] : point[1]);
    if (!Number.isFinite(x) || !Number.isFinite(z)) throw new Error(`Endpoint ${id} contains non-finite coordinates.`);
    return vec(x, z);
  }

  if (!Number.isFinite(point.x) || !Number.isFinite(point.z)) {
    throw new Error(`Endpoint ${id} contains non-finite coordinates.`);
  }
  return vec(point.x, point.z);
}

function isPointArray(point: WallAuthoringPoint): point is readonly number[] {
  return Array.isArray(point);
}

function assertPositiveFinite(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be a positive finite number.`);
  }
}

function roundVec(point: Vec2): Vec2 {
  return { x: round(point.x), z: round(point.z) };
}

function round(value: number): number {
  return Math.round(value * 100000) / 100000;
}

function close(a: number, b: number): boolean {
  return Math.abs(a - b) <= 0.0001;
}
