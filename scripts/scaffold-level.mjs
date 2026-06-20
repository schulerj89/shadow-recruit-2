#!/usr/bin/env node

import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const args = parseArgs(process.argv.slice(2));

if (args.help || !args.slug) {
  printHelp();
  process.exit(args.help ? 0 : 1);
}

const slug = args.slug;
if (!/^[a-z][a-z0-9-]*$/.test(slug)) {
  throw new Error(`Level slug must be lowercase kebab-case, got: ${slug}`);
}

const root = process.cwd();
const geometryPath = path.join(root, 'data', 'levels', `${slug}.geometry.json`);
const moduleName = toCamel(slug);
const exportName = `${moduleName}Level`;
const adapterPath = path.join(root, 'src', 'game', 'levels', `${moduleName}.ts`);
const name = args.name ?? titleFromSlug(slug);
const chapter = args.chapter ?? 'Operation New Shadow';
const geometry = buildGeometryTemplate();
const adapter = buildAdapterTemplate({ slug, exportName, name, chapter });
const plannedFiles = [
  { path: geometryPath, content: `${JSON.stringify(geometry, null, 2)}\n` },
  { path: adapterPath, content: adapter },
];

if (!args.force) {
  for (const file of plannedFiles) {
    if (existsSync(file.path)) {
      throw new Error(`${path.relative(root, file.path)} already exists. Re-run with --force to overwrite.`);
    }
  }
}

if (args.dryRun) {
  console.info(`[level-scaffold] dry run for ${slug}`);
  for (const file of plannedFiles) console.info(`would write ${path.relative(root, file.path)}`);
  printNextSteps({ slug, moduleName, exportName });
  process.exit(0);
}

for (const file of plannedFiles) {
  await mkdir(path.dirname(file.path), { recursive: true });
  await writeFile(file.path, file.content);
  console.info(`[level-scaffold] wrote ${path.relative(root, file.path)}`);
}

printNextSteps({ slug, moduleName, exportName });

function parseArgs(tokens) {
  const parsed = { dryRun: false, force: false, help: false, slug: '' };
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token === '--dry-run') parsed.dryRun = true;
    else if (token === '--force') parsed.force = true;
    else if (token === '--help' || token === '-h') parsed.help = true;
    else if (token === '--') continue;
    else if (token === '--name') parsed.name = requireValue(tokens[++index], '--name');
    else if (token === '--chapter') parsed.chapter = requireValue(tokens[++index], '--chapter');
    else if (!parsed.slug) parsed.slug = token;
    else throw new Error(`Unknown argument: ${token}`);
  }
  return parsed;
}

function requireValue(value, name) {
  if (!value || value.startsWith('--')) throw new Error(`${name} requires a value.`);
  return value;
}

function buildGeometryTemplate() {
  return {
    bounds: { min: [-48, -42], max: [48, 42] },
    walls: [
      { id: 'outer-north', center: [0, 41.5], size: [96, 1], height: 3.6 },
      { id: 'outer-south', center: [0, -41.5], size: [96, 1], height: 3.6 },
      { id: 'outer-west', center: [-47.5, 0], size: [1, 83], height: 3.6 },
      { id: 'outer-east', center: [47.5, 0], size: [1, 83], height: 3.6 },
      { id: 'entry-divider-west', center: [-25, -14], size: [46, 1], height: 3.3 },
      { id: 'entry-divider-east', center: [25, -14], size: [46, 1], height: 3.3 },
      { id: 'vault-divider-west', center: [-25, 14], size: [46, 1], height: 3.3 },
      { id: 'vault-divider-east', center: [25, 14], size: [46, 1], height: 3.3 },
      { id: 'extraction-divider-west', center: [-25, 28], size: [46, 1], height: 3.3 },
      { id: 'extraction-divider-east', center: [25, 28], size: [46, 1], height: 3.3 },
    ],
    blockers: [
      { id: 'south-cover-west', center: [-31, -32], size: [7, 4], height: 1.35 },
      { id: 'south-cover-east', center: [31, -32], size: [7, 4], height: 1.35 },
      { id: 'mid-security-bank-west', center: [-29, -2], size: [6, 9], height: 1.8 },
      { id: 'mid-security-bank-east', center: [29, -2], size: [6, 9], height: 1.8 },
      { id: 'command-table', center: [0, 22], size: [12, 3.5], height: 1.0 },
    ],
    setDressing: [
      { id: 'south-cable-run', asset: 'cable-tray', center: [0, -39], size: [68, 1.2], height: 0.18 },
      { id: 'west-wall-machinery', asset: 'wall-machinery', center: [-45, -4], size: [1.4, 46], height: 1.1 },
      { id: 'east-wall-machinery', asset: 'wall-machinery', center: [45, -4], size: [1.4, 46], height: 1.1 },
      { id: 'north-extraction-machinery-west', asset: 'extraction-beacon', center: [-28, 36], size: [20, 2], height: 0.85 },
      { id: 'north-extraction-machinery-east', asset: 'extraction-beacon', center: [28, 36], size: [20, 2], height: 0.85 },
    ],
    zones: [
      {
        id: 'south-entry',
        label: 'South Entry',
        bounds: { min: [-48, -42], max: [48, -14] },
        screenshot: 'gameplay-level-one.png',
        expectedLandmarks: ['access-keycard', 'entry-door', 'south-cover-west', 'south-cover-east'],
      },
      {
        id: 'mid-security',
        label: 'Mid Security',
        bounds: { min: [-48, -14], max: [48, 14] },
        screenshot: 'tutorial-03-terminal.png',
        expectedLandmarks: ['security-terminal', 'vault-door', 'mid-security-bank-west', 'mid-security-bank-east'],
      },
      {
        id: 'north-command',
        label: 'North Command And Extraction',
        bounds: { min: [-48, 14], max: [48, 42] },
        screenshot: 'complete.png',
        expectedLandmarks: ['command-codes', 'extraction', 'command-table', 'north-extraction-machinery-west', 'north-extraction-machinery-east'],
      },
    ],
    doors: [
      { id: 'entry-door', center: [0, -14], size: [4, 0.8], height: 3.3 },
      { id: 'vault-door', center: [0, 14], size: [4, 0.8], height: 3.3 },
      { id: 'extraction-door', center: [0, 28], size: [4, 0.8], height: 3.3 },
    ],
    spawns: [{ id: 'player', position: [0, -36] }],
    objectives: [
      { id: 'access-keycard', position: [-34, -31] },
      { id: 'security-terminal', position: [34, 0] },
      { id: 'command-codes', position: [-34, 25] },
      { id: 'extraction', position: [0, 36] },
    ],
  };
}

function buildAdapterTemplate({ slug, exportName, name, chapter }) {
  return `import geometry from '../../../data/levels/${slug}.geometry.json';
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

export const ${exportName}: LevelDefinition = {
  id: '${slug}',
  name: '${escapeTs(name)}',
  chapter: '${escapeTs(chapter)}',
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
  ],
  validationRoute: [
    vec(0, -36),
    vec(-34, -31),
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
      text: 'Cadet, this scaffolded mission is ready for a layout pass. Confirm patrol timing, route language, cover purpose, and objective readability before art polish. Good luck, cadet.',
    },
    {
      id: 'keycard',
      title: 'First Lock',
      target: 'access-keycard',
      text: 'The keycard unlocks the first gate. Use this beat to teach the primary route and the first cover decision. Good luck, cadet.',
    },
    {
      id: 'terminal',
      title: 'Security Stack',
      target: 'security-terminal',
      text: 'The terminal unlocks the vault gate. Keep the approach readable and leave room for stealth timing. Good luck, cadet.',
    },
    {
      id: 'codes',
      title: 'Command Codes',
      target: 'command-codes',
      text: 'The command codes unlock extraction. Stage this area with a landmark silhouette and visible escape line. Good luck, cadet.',
    },
    {
      id: 'extraction',
      title: 'Extraction',
      target: 'extraction',
      text: 'The extraction point should be obvious from the final approach and still leave space for pressure. Good luck, cadet.',
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
    throw new Error(\`Missing set dressing asset for \${rect.id}\`);
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
  if (!metadata) throw new Error(\`Missing door metadata for \${rect.id}\`);
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
  if (!point) throw new Error(\`Missing geometry point: \${id}\`);
  return pointFromArray(point.position);
}
`;
}

function toCamel(value) {
  return value.replace(/-([a-z0-9])/g, (_, char) => char.toUpperCase());
}

function titleFromSlug(value) {
  return value.split('-').map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`).join(' ');
}

function escapeTs(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function printNextSteps({ slug, moduleName, exportName }) {
  console.info('');
  console.info('Next steps:');
  console.info(`1. Review data/levels/${slug}.geometry.json and tune rooms, doors, blockers, objectives, patrols, zones, and set dressing.`);
  console.info(`2. Run: node .codex/skills/threejs-level-geometry-validator/scripts/validate_level_geometry.mjs data/levels/${slug}.geometry.json --min-clearance 1.1`);
  console.info(`3. Register in src/game/levels/index.ts with: import { ${exportName} } from './${moduleName}';`);
  console.info(`4. Add ${exportName} to the exported levels array, then run npm run level:doctor and npm run test:playthrough.`);
}

function printHelp() {
  console.log(`Usage: npm run level:scaffold -- -- <level-slug> [--name "Mission Name"] [--chapter "Operation Name"] [--dry-run] [--force]

Direct Node usage:
node scripts/scaffold-level.mjs <level-slug> [--name "Mission Name"] [--chapter "Operation Name"] [--dry-run] [--force]

Creates:
- data/levels/<level-slug>.geometry.json
- src/game/levels/<camelLevelSlug>.ts

The generated level is a large coordinate-backed Shadow Recruit mission template with outer walls, split divider walls, three sliding doors, objectives, validation route, density zones, set dressing, and sentry patrol metadata. It is not added to src/game/levels/index.ts automatically.`);
}
