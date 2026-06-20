#!/usr/bin/env node

import fs from 'node:fs';

const DEFAULT_EPSILON = 0.0001;
const DEFAULT_CLEARANCE = 1.0;

const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  printHelp();
  process.exit(args.length === 0 ? 1 : 0);
}

const inputPath = args[0];
const options = parseOptions(args.slice(1));
const epsilon = Number.isFinite(options.epsilon) ? options.epsilon : DEFAULT_EPSILON;
const minClearance = Number.isFinite(options.minClearance) ? options.minClearance : DEFAULT_CLEARANCE;

const result = validateLevel(readJson(inputPath), { epsilon, minClearance });

if (options.json) {
  console.log(JSON.stringify(result, null, 2));
} else {
  printHuman(result);
}

process.exit(result.errors.length > 0 ? 1 : 0);

function parseOptions(tokens) {
  const parsed = { json: false, epsilon: DEFAULT_EPSILON, minClearance: DEFAULT_CLEARANCE };

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];

    if (token === '--json') {
      parsed.json = true;
    } else if (token === '--epsilon') {
      parsed.epsilon = numberOption(tokens[++i], '--epsilon');
    } else if (token === '--min-clearance') {
      parsed.minClearance = numberOption(tokens[++i], '--min-clearance');
    } else {
      throw new Error(`Unknown option: ${token}`);
    }
  }

  return parsed;
}

function numberOption(value, name) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new Error(`${name} requires a finite number`);
  }
  return number;
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`Failed to read ${filePath}: ${error.message}`);
  }
}

function validateLevel(level, config) {
  const errors = [];
  const warnings = [];
  const rects = [];
  const nonSolidRects = [];
  const zoneRects = [];
  const points = [];
  const ids = new Set();

  const bounds = level.bounds ? rectFromSpec(level.bounds, 'bounds', 0, errors, warnings) : null;
  if (!bounds) {
    errors.push(issue('missing-bounds', 'Level must declare bounds.'));
  }

  for (const collection of ['walls', 'doors', 'blockers', 'colliders']) {
    for (const [index, spec] of asArray(level[collection]).entries()) {
      const rect = rectFromSpec(spec, collection, index, errors, warnings);
      if (!rect) continue;

      if (ids.has(rect.id)) {
        errors.push(issue('duplicate-id', `${rect.id} is reused.`));
      }
      ids.add(rect.id);
      rects.push(rect);
    }
  }

  for (const collection of ['setDressing']) {
    for (const [index, spec] of asArray(level[collection]).entries()) {
      const rect = rectFromSpec(spec, collection, index, errors, warnings);
      if (!rect) continue;

      if (ids.has(rect.id)) {
        errors.push(issue('duplicate-id', `${rect.id} is reused.`));
      }
      ids.add(rect.id);
      nonSolidRects.push(rect);
    }
  }

  for (const [index, spec] of asArray(level.zones).entries()) {
    const rect = rectFromSpec(spec, 'zones', index, errors, warnings);
    if (!rect) continue;

    if (ids.has(rect.id)) {
      errors.push(issue('duplicate-id', `${rect.id} is reused.`));
    }
    ids.add(rect.id);
    zoneRects.push(rect);
  }

  for (const collection of ['spawns', 'objectives', 'exits']) {
    for (const [index, spec] of asArray(level[collection]).entries()) {
      const point = pointFromSpec(spec, collection, index, errors);
      if (point) points.push(point);
    }
  }

  if (bounds) {
    for (const rect of [...rects, ...nonSolidRects, ...zoneRects]) {
      if (!containsRect(bounds, rect, config.epsilon)) {
        errors.push(issue('out-of-bounds', `${rect.id} extends outside level bounds.`, { rect: rectData(rect) }));
      }
    }

    for (const point of points) {
      if (!containsPoint(bounds, point, config.epsilon)) {
        errors.push(issue('point-out-of-bounds', `${point.id} is outside level bounds.`, { point: pointData(point) }));
      }
    }
  }

  for (let i = 0; i < rects.length; i += 1) {
    for (let j = i + 1; j < rects.length; j += 1) {
      const a = rects[i];
      const b = rects[j];
      const overlap = rectOverlap(a, b);

      if (overlap.x > config.epsilon && overlap.z > config.epsilon) {
        errors.push(issue('wall-overlap', `${a.id} overlaps ${b.id}.`, {
          overlapWidth: round(overlap.x),
          overlapDepth: round(overlap.z),
          overlapArea: round(overlap.x * overlap.z)
        }));
        continue;
      }

      const gap = corridorGap(a, b, config.epsilon);
      if (gap > config.epsilon && gap < config.minClearance) {
        warnings.push(issue('narrow-gap', `${a.id} and ${b.id} leave only ${round(gap)} units of clearance.`, {
          minClearance: config.minClearance
        }));
      }
    }
  }

  for (const point of points) {
    for (const rect of rects) {
      if (containsPoint(inflateRect(rect, config.minClearance), point, config.epsilon)) {
        warnings.push(issue('point-near-blocker', `${point.id} is inside or too close to ${rect.id}.`, {
          minClearance: config.minClearance
        }));
      }
    }
  }

  return {
    ok: errors.length === 0,
    summary: {
      bounds: Boolean(bounds),
      rectangles: rects.length,
      nonSolidRectangles: nonSolidRects.length,
      zones: zoneRects.length,
      points: points.length,
      errors: errors.length,
      warnings: warnings.length,
      epsilon: config.epsilon,
      minClearance: config.minClearance
    },
    errors,
    warnings
  };
}

function rectFromSpec(spec, collection, index, errors, warnings) {
  if (!spec || typeof spec !== 'object') {
    errors.push(issue('invalid-rect', `${collection}[${index}] must be an object.`));
    return null;
  }

  const id = String(spec.id || `${collection}[${index}]`);
  let min;
  let max;

  if (spec.bounds?.min && spec.bounds?.max) {
    min = vec2(spec.bounds.min);
    max = vec2(spec.bounds.max);
  } else if (spec.min && spec.max) {
    min = vec2(spec.min);
    max = vec2(spec.max);
  } else if (spec.center && spec.size) {
    const center = vec2(spec.center);
    const size = size2(spec.size);
    min = { x: center.x - size.x / 2, z: center.z - size.z / 2 };
    max = { x: center.x + size.x / 2, z: center.z + size.z / 2 };
  } else if (spec.position && spec.size) {
    const center = vec2(spec.position);
    const size = size2(spec.size);
    min = { x: center.x - size.x / 2, z: center.z - size.z / 2 };
    max = { x: center.x + size.x / 2, z: center.z + size.z / 2 };
  } else if (hasFinite(spec.minX) && hasFinite(spec.minZ) && hasFinite(spec.maxX) && hasFinite(spec.maxZ)) {
    min = { x: Number(spec.minX), z: Number(spec.minZ) };
    max = { x: Number(spec.maxX), z: Number(spec.maxZ) };
  } else if (hasFinite(spec.x) && hasFinite(spec.z) && hasFinite(spec.width) && hasFinite(spec.depth)) {
    const x = Number(spec.x);
    const z = Number(spec.z);
    const width = Number(spec.width);
    const depth = Number(spec.depth);
    const originIsMin = spec.origin === 'min' || spec.anchor === 'min';
    min = originIsMin ? { x, z } : { x: x - width / 2, z: z - depth / 2 };
    max = originIsMin ? { x: x + width, z: z + depth } : { x: x + width / 2, z: z + depth / 2 };
  } else {
    errors.push(issue('invalid-rect', `${id} must use min/max, center/size, position/size, minX/minZ/maxX/maxZ, or x/z/width/depth.`));
    return null;
  }

  if (!finiteVec(min) || !finiteVec(max)) {
    errors.push(issue('invalid-number', `${id} contains non-finite rectangle coordinates.`));
    return null;
  }

  const rect = normalizeRect({ id, collection, minX: min.x, minZ: min.z, maxX: max.x, maxZ: max.z });
  if (rect.maxX - rect.minX <= 0 || rect.maxZ - rect.minZ <= 0) {
    errors.push(issue('zero-area-rect', `${id} must have positive width and depth.`, { rect: rectData(rect) }));
    return null;
  }

  const rotation = Number(spec.rotationY ?? spec.yaw ?? spec.rotation ?? 0);
  if (Number.isFinite(rotation) && Math.abs(rotation) > 0.0001) {
    warnings.push(issue('rotated-rect', `${id} is rotated; this script can only prove axis-aligned overlap. Use OBB/SAT or physics scene queries before approval.`, {
      rotation
    }));
  }

  return rect;
}

function pointFromSpec(spec, collection, index, errors) {
  if (!spec || typeof spec !== 'object') {
    errors.push(issue('invalid-point', `${collection}[${index}] must be an object or coordinate array.`));
    return null;
  }

  const id = String(spec.id || `${collection}[${index}]`);
  const raw = spec.position ?? spec.point ?? spec.center ?? spec;
  const point = vec2(raw);

  if (!finiteVec(point)) {
    errors.push(issue('invalid-point', `${id} contains non-finite point coordinates.`));
    return null;
  }

  return { id, collection, x: point.x, z: point.z };
}

function vec2(value) {
  if (!value || typeof value !== 'object') return { x: NaN, z: NaN };
  if (Array.isArray(value)) {
    if (value.length >= 3) return { x: Number(value[0]), z: Number(value[2]) };
    return { x: Number(value[0]), z: Number(value[1]) };
  }
  return { x: Number(value.x), z: Number(value.z ?? value.y) };
}

function size2(value) {
  if (Array.isArray(value)) {
    if (value.length >= 3) return { x: Number(value[0]), z: Number(value[2]) };
    return { x: Number(value[0]), z: Number(value[1]) };
  }
  return { x: Number(value.x ?? value.width), z: Number(value.z ?? value.depth ?? value.y ?? value.height) };
}

function finiteVec(value) {
  return Number.isFinite(value.x) && Number.isFinite(value.z);
}

function hasFinite(value) {
  return Number.isFinite(Number(value));
}

function normalizeRect(rect) {
  return {
    ...rect,
    minX: Math.min(rect.minX, rect.maxX),
    minZ: Math.min(rect.minZ, rect.maxZ),
    maxX: Math.max(rect.minX, rect.maxX),
    maxZ: Math.max(rect.minZ, rect.maxZ)
  };
}

function containsRect(bounds, rect, epsilon) {
  return rect.minX >= bounds.minX - epsilon &&
    rect.maxX <= bounds.maxX + epsilon &&
    rect.minZ >= bounds.minZ - epsilon &&
    rect.maxZ <= bounds.maxZ + epsilon;
}

function containsPoint(rect, point, epsilon) {
  return point.x >= rect.minX - epsilon &&
    point.x <= rect.maxX + epsilon &&
    point.z >= rect.minZ - epsilon &&
    point.z <= rect.maxZ + epsilon;
}

function rectOverlap(a, b) {
  return {
    x: Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX),
    z: Math.min(a.maxZ, b.maxZ) - Math.max(a.minZ, b.minZ)
  };
}

function corridorGap(a, b, epsilon) {
  const overlap = rectOverlap(a, b);
  const gapX = Math.max(b.minX - a.maxX, a.minX - b.maxX, 0);
  const gapZ = Math.max(b.minZ - a.maxZ, a.minZ - b.maxZ, 0);

  if (overlap.z > epsilon && gapX > epsilon) return gapX;
  if (overlap.x > epsilon && gapZ > epsilon) return gapZ;
  return Infinity;
}

function inflateRect(rect, amount) {
  return {
    ...rect,
    minX: rect.minX - amount,
    minZ: rect.minZ - amount,
    maxX: rect.maxX + amount,
    maxZ: rect.maxZ + amount
  };
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function issue(code, message, details = {}) {
  return { code, message, ...details };
}

function rectData(rect) {
  return {
    minX: round(rect.minX),
    minZ: round(rect.minZ),
    maxX: round(rect.maxX),
    maxZ: round(rect.maxZ)
  };
}

function pointData(point) {
  return { x: round(point.x), z: round(point.z) };
}

function round(value) {
  return Math.round(value * 10000) / 10000;
}

function printHuman(result) {
  console.log(result.ok ? 'Level geometry validation passed.' : 'Level geometry validation failed.');
  console.log(`rectangles=${result.summary.rectangles} nonSolidRectangles=${result.summary.nonSolidRectangles ?? 0} zones=${result.summary.zones ?? 0} points=${result.summary.points} errors=${result.summary.errors} warnings=${result.summary.warnings}`);

  for (const error of result.errors) {
    console.error(`ERROR ${error.code}: ${error.message}`);
  }

  for (const warning of result.warnings) {
    console.warn(`WARN ${warning.code}: ${warning.message}`);
  }
}

function printHelp() {
  console.log(`Usage: node validate_level_geometry.mjs <level.json> [--min-clearance 1.0] [--epsilon 0.0001] [--json]

Input schema:
{
  "bounds": { "min": [-20, -20], "max": [20, 20] },
  "walls": [
    { "id": "north-wall-west", "center": [-6, -10], "size": [8, 1] },
    { "id": "north-wall-east", "center": [6, -10], "size": [8, 1] }
  ],
  "doors": [
    { "id": "north-door", "center": [0, -10], "size": [4, 0.8] }
  ],
  "spawns": [
    { "id": "player", "position": [0, 0] }
  ],
  "objectives": [
    { "id": "terminal", "position": [5, 0] }
  ],
  "zones": [
    {
      "id": "entry",
      "label": "Entry",
      "bounds": { "min": [-20, -20], "max": [20, 0] },
      "expectedLandmarks": ["terminal"]
    }
  ]
}

Coordinates use the X/Z ground plane. Arrays of length 3 are read as [x, y, z].
The optional setDressing collection is bounds-checked as non-solid visual geometry and excluded from overlap/clearance blocking.
The optional zones collection is bounds-checked as QA metadata and excluded from overlap/clearance blocking.`);
}
