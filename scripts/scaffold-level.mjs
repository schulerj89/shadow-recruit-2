#!/usr/bin/env node

import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { collectLevelAdapters, formatLevelRegistry, getLevelRegistryPath } from './level-registry.mjs';

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
const indexPath = getLevelRegistryPath(root);
const name = args.name ?? titleFromSlug(slug);
const chapter = args.chapter ?? 'Operation New Shadow';
const geometry = buildGeometryTemplate({ slug, name, chapter });
const adapter = buildAdapterTemplate({ slug, exportName, name, chapter });
const plannedFiles = [
  { path: geometryPath, content: `${JSON.stringify(geometry, null, 2)}\n`, allowExisting: false },
  { path: adapterPath, content: adapter, allowExisting: false },
];

if (args.register) {
  const indexSource = await readFile(indexPath, 'utf8');
  const registeredIndex = formatLevelRegistry(collectLevelAdapters({
    root,
    extraAdapters: [{ file: `${moduleName}.ts`, source: adapter }],
  }));
  if (registeredIndex !== indexSource) {
    plannedFiles.push({ path: indexPath, content: registeredIndex, allowExisting: true });
  }
}

if (!args.force) {
  for (const file of plannedFiles) {
    if (!file.allowExisting && existsSync(file.path)) {
      throw new Error(`${path.relative(root, file.path)} already exists. Re-run with --force to overwrite.`);
    }
  }
}

if (args.dryRun) {
  console.info(`[level-scaffold] dry run for ${slug}`);
  for (const file of plannedFiles) console.info(`would write ${path.relative(root, file.path)}`);
  printNextSteps({ slug, moduleName, exportName, registered: args.register });
  process.exit(0);
}

for (const file of plannedFiles) {
  await mkdir(path.dirname(file.path), { recursive: true });
  await writeFile(file.path, file.content);
  console.info(`[level-scaffold] wrote ${path.relative(root, file.path)}`);
}

printNextSteps({ slug, moduleName, exportName, registered: args.register });

function parseArgs(tokens) {
  const parsed = { dryRun: false, force: false, help: false, register: false, slug: '' };
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token === '--dry-run') parsed.dryRun = true;
    else if (token === '--force') parsed.force = true;
    else if (token === '--register') parsed.register = true;
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

function buildGeometryTemplate({ slug, name, chapter }) {
  return {
    metadata: {
      id: slug,
      name,
      chapter,
    },
    bounds: { min: [-48, -42], max: [48, 42] },
    walls: [
      { id: 'outer-north', center: [0, 41.5], size: [96, 1], height: 3.6 },
      { id: 'outer-south', center: [0, -41.5], size: [96, 1], height: 3.6 },
      { id: 'outer-west', center: [-47.5, 0], size: [1, 82], height: 3.6 },
      { id: 'outer-east', center: [47.5, 0], size: [1, 82], height: 3.6 },
      { id: 'entry-divider-west', center: [-24.5, -14], size: [45, 1], height: 3.3 },
      { id: 'entry-divider-east', center: [24.5, -14], size: [45, 1], height: 3.3 },
      { id: 'vault-divider-west', center: [-24.5, 14], size: [45, 1], height: 3.3 },
      { id: 'vault-divider-east', center: [24.5, 14], size: [45, 1], height: 3.3 },
      { id: 'extraction-divider-west', center: [-24.5, 28], size: [45, 1], height: 3.3 },
      { id: 'extraction-divider-east', center: [24.5, 28], size: [45, 1], height: 3.3 },
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
      { id: 'south-floor-spine', asset: 'cable-tray', center: [0, -26], size: [60, 1.2], height: 0.18 },
      { id: 'south-warning-strip', asset: 'cable-tray', center: [0, -18], size: [60, 1.2], height: 0.16 },
      { id: 'south-floor-decal-run', asset: 'cable-tray', center: [0, -34], size: [60, 1.4], height: 0.16 },
      { id: 'south-wall-machinery-west', asset: 'wall-machinery', center: [-45, -28], size: [1.4, 24], height: 1.05 },
      { id: 'south-wall-machinery-east', asset: 'wall-machinery', center: [45, -28], size: [1.4, 24], height: 1.05 },
      { id: 'south-overhead-cable-west', asset: 'cable-tray', center: [-18, -20], size: [30, 1.2], height: 0.2 },
      { id: 'south-overhead-cable-east', asset: 'cable-tray', center: [18, -20], size: [30, 1.2], height: 0.2 },
      { id: 'south-service-track-east', asset: 'cable-tray', center: [30, -22], size: [18, 1.2], height: 0.16 },
      { id: 'west-wall-machinery', asset: 'wall-machinery', center: [-45, -4], size: [1.4, 46], height: 1.1 },
      { id: 'east-wall-machinery', asset: 'wall-machinery', center: [45, -4], size: [1.4, 46], height: 1.1 },
      { id: 'mid-floor-spine', asset: 'cable-tray', center: [0, 0], size: [60, 1.2], height: 0.18 },
      { id: 'mid-hazard-strip-south', asset: 'cable-tray', center: [0, -10], size: [60, 1.2], height: 0.16 },
      { id: 'mid-hazard-strip-north', asset: 'cable-tray', center: [0, 10], size: [60, 1.2], height: 0.16 },
      { id: 'mid-overhead-rack-west', asset: 'wall-machinery', center: [-24, 12], size: [28, 1.2], height: 0.9 },
      { id: 'mid-overhead-rack-east', asset: 'wall-machinery', center: [24, 12], size: [28, 1.2], height: 0.9 },
      { id: 'mid-server-power-run', asset: 'wall-machinery', center: [0, 6], size: [40, 1.4], height: 0.95 },
      { id: 'north-floor-guidance-west', asset: 'cable-tray', center: [-20, 22], size: [26, 1.2], height: 0.16 },
      { id: 'north-floor-guidance-east', asset: 'cable-tray', center: [20, 22], size: [26, 1.2], height: 0.16 },
      { id: 'north-mid-spine', asset: 'cable-tray', center: [0, 32], size: [60, 1.2], height: 0.18 },
      { id: 'north-command-rack-west', asset: 'wall-machinery', center: [-30, 18], size: [24, 1.4], height: 0.9 },
      { id: 'north-command-rack-east', asset: 'wall-machinery', center: [30, 18], size: [24, 1.4], height: 0.9 },
      { id: 'north-extraction-cable-spine', asset: 'cable-tray', center: [0, 39], size: [68, 1.2], height: 0.18 },
      { id: 'north-wall-machinery-west', asset: 'wall-machinery', center: [-45, 28], size: [1.4, 26], height: 1.05 },
      { id: 'north-wall-machinery-east', asset: 'wall-machinery', center: [45, 28], size: [1.4, 26], height: 1.05 },
      { id: 'north-hazard-strip', asset: 'cable-tray', center: [0, 26], size: [60, 1.2], height: 0.16 },
      { id: 'north-extraction-machinery-west', asset: 'extraction-beacon', center: [-28, 36], size: [20, 2], height: 0.85 },
      { id: 'north-extraction-machinery-east', asset: 'extraction-beacon', center: [28, 36], size: [20, 2], height: 0.85 },
    ],
    zones: [
      {
        id: 'south-entry',
        label: 'South Entry',
        bounds: { min: [-48, -42], max: [48, -14] },
        screenshot: 'gameplay-level-one.png',
        expectedLandmarks: ['access-keycard', 'entry-door', 'south-cover-west', 'south-cover-east', 'south-floor-spine', 'south-wall-machinery-west', 'south-wall-machinery-east'],
      },
      {
        id: 'mid-security',
        label: 'Mid Security',
        bounds: { min: [-48, -14], max: [48, 14] },
        screenshot: 'tutorial-03-terminal.png',
        expectedLandmarks: ['security-terminal', 'vault-door', 'mid-security-bank-west', 'mid-security-bank-east', 'mid-floor-spine', 'mid-server-power-run'],
      },
      {
        id: 'north-command',
        label: 'North Command And Extraction',
        bounds: { min: [-48, 14], max: [48, 42] },
        screenshot: 'complete.png',
        expectedLandmarks: ['command-codes', 'extraction', 'command-table', 'north-extraction-machinery-west', 'north-extraction-machinery-east', 'north-mid-spine', 'north-hazard-strip'],
      },
    ],
    doors: [
      { id: 'entry-door', center: [0, -14], size: [4, 0.8], height: 3.3, axis: 'x', opensWhen: ['access-keycard'], speed: 1.8 },
      { id: 'vault-door', center: [0, 14], size: [4, 0.8], height: 3.3, axis: 'x', opensWhen: ['security-terminal'], speed: 1.8 },
      { id: 'extraction-door', center: [0, 28], size: [4, 0.8], height: 3.3, axis: 'x', opensWhen: ['command-codes'], speed: 1.9 },
    ],
    spawns: [{ id: 'player', position: [0, -36] }],
    objectives: [
      { id: 'access-keycard', type: 'keycard', label: 'Recover the access keycard', position: [-38, -31], radius: 1.55, required: true, unlocks: ['entry-door'], asset: 'keycard' },
      { id: 'security-terminal', type: 'terminal', label: 'Breach the security terminal', position: [34, 0], radius: 1.75, required: true, unlocks: ['vault-door'], asset: 'terminal' },
      { id: 'command-codes', type: 'codes', label: 'Copy the command codes', position: [-34, 25], radius: 1.55, required: true, unlocks: ['extraction-door'], asset: 'codes' },
      { id: 'extraction', position: [0, 36] },
    ],
    enemies: [
      {
        id: 'sentry-south',
        label: 'South sentry',
        start: [16, -32],
        patrol: [[16, -32], [-12, -28], [12, -18]],
        speed: 2.0,
        detectionRadius: 2.4,
      },
      {
        id: 'sentry-mid',
        label: 'Mid sentry',
        start: [20, 4],
        patrol: [[20, 4], [36, 7], [18, -8]],
        speed: 1.9,
        detectionRadius: 2.4,
      },
      {
        id: 'sentry-north',
        label: 'North sentry',
        start: [18, 31],
        patrol: [[18, 31], [-18, 30], [12, 22]],
        speed: 1.95,
        detectionRadius: 2.35,
      },
    ],
    validationRoute: [
      [0, -36],
      [-38, -31],
      [0, -15],
      [2, -10],
      [34, 0],
      [0, 13],
      [-34, 25],
      [0, 27],
      [0, 36],
    ],
    tutorial: [
      {
        id: 'hero',
        title: 'Insertion',
        target: 'hero',
        text: 'Cadet, this scaffolded mission is ready for a layout pass. Confirm patrol timing, route language, cover purpose, and objective readability before art polish. Good luck, cadet.',
        alignmentKeywords: ['cadet', 'mission', 'patrol'],
      },
      {
        id: 'keycard',
        title: 'First Lock',
        target: 'access-keycard',
        text: 'The keycard unlocks the first gate. Use this beat to teach the primary route and the first cover decision. Good luck, cadet.',
        alignmentKeywords: ['keycard', 'gate', 'cover'],
      },
      {
        id: 'terminal',
        title: 'Security Stack',
        target: 'security-terminal',
        text: 'The terminal unlocks the vault gate. Keep the approach readable and leave room for stealth timing. Good luck, cadet.',
        alignmentKeywords: ['terminal', 'gate', 'stealth'],
      },
      {
        id: 'codes',
        title: 'Command Codes',
        target: 'command-codes',
        text: 'The command codes unlock extraction. Stage this area with a landmark silhouette and visible escape line. Good luck, cadet.',
        alignmentKeywords: ['command codes', 'extraction', 'landmark'],
      },
      {
        id: 'extraction',
        title: 'Extraction',
        target: 'extraction',
        text: 'The extraction point should be obvious from the final approach and still leave space for pressure. Good luck, cadet.',
        alignmentKeywords: ['extraction', 'final approach', 'pressure'],
      },
    ],
  };
}

function buildAdapterTemplate({ slug, exportName }) {
  return `import geometry from '../../../data/levels/${slug}.geometry.json';
import type { LevelDefinition } from '../types';
import { levelFromGeometry, type LevelGeometrySource } from './levelFromGeometry';

export const ${exportName}: LevelDefinition = levelFromGeometry(geometry as LevelGeometrySource);
`;
}

function toCamel(value) {
  return value.replace(/-([a-z0-9])/g, (_, char) => char.toUpperCase());
}

function titleFromSlug(value) {
  return value.split('-').map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`).join(' ');
}

function printNextSteps({ slug, moduleName, exportName, registered }) {
  console.info('');
  console.info('Next steps:');
  console.info(`1. Review data/levels/${slug}.geometry.json and tune metadata, rooms, doors, blockers, objectives, sentries, route, tutorial beats, zones, and set dressing.`);
  console.info(`2. Run: node .codex/skills/threejs-level-geometry-validator/scripts/validate_level_geometry.mjs data/levels/${slug}.geometry.json --min-clearance 1.1`);
  if (registered) {
    console.info(`3. ${exportName} is included in the generated src/game/levels/index.ts registry for the mission selector.`);
    console.info('4. Run npm run level:doctor and PLAYTHROUGH_LEVEL_ID=<level-id> npm run playthrough:browser when the route is tuned.');
  } else {
    console.info(`3. Register when ready with: npm run level:scaffold -- -- ${slug} --register --force`);
    console.info('4. Or run npm run level:registry after the adapter is ready, then run npm run level:doctor.');
  }
}

function printHelp() {
  console.log(`Usage: npm run level:scaffold -- -- <level-slug> [--name "Mission Name"] [--chapter "Operation Name"] [--register] [--dry-run] [--force]

Direct Node usage:
node scripts/scaffold-level.mjs <level-slug> [--name "Mission Name"] [--chapter "Operation Name"] [--register] [--dry-run] [--force]

Creates:
- data/levels/<level-slug>.geometry.json
- src/game/levels/<camelLevelSlug>.ts
- optionally regenerates src/game/levels/index.ts when --register is passed

The generated level is a large coordinate-backed Shadow Recruit mission template with outer walls, split divider walls, three sliding doors, objectives, validation route, density zones, set dressing, and sentry patrol metadata. Use --register when the new mission should appear in the player-facing mission selector.`);
}
