#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { collectLevelAdapters, formatLevelRegistry, parseLevelAdapter } from './level-registry.mjs';

const root = process.cwd();
const dataDir = path.join(root, 'data', 'levels');
const levelsDir = path.join(root, 'src', 'game', 'levels');
const indexPath = path.join(levelsDir, 'index.ts');
const validatorPath = path.join(root, '.codex', 'skills', 'threejs-level-geometry-validator', 'scripts', 'validate_level_geometry.mjs');
const runtimeDoctorPath = path.join(root, 'scripts', 'level-runtime-doctor.ts');
const geometryPattern = /\.geometry\.json$/;
const errors = [];
const warnings = [];

const geometryFiles = listFiles(dataDir).filter((file) => geometryPattern.test(file));
const adapterFiles = listFiles(levelsDir).filter((file) => file.endsWith('.ts') && file !== 'index.ts');
const adapterImports = adapterFiles.map(readAdapterImport).filter(Boolean);
const indexSource = readText(indexPath);
const registry = readRegistry(indexSource);
const expectedRegistry = readExpectedRegistry();

if (expectedRegistry && indexSource !== expectedRegistry) {
  errors.push('src/game/levels/index.ts is stale. Run npm run level:registry to regenerate the static mission selector registry.');
}

if (geometryFiles.length === 0) {
  errors.push('No geometry files found in data/levels.');
}

for (const geometryFile of geometryFiles) {
  const adapter = adapterImports.find((item) => item.geometryFile === geometryFile);
  if (!adapter) {
    errors.push(`${geometryFile} has no TypeScript adapter importing it from src/game/levels.`);
    continue;
  }

  const importEntry = registry.imports.get(adapter.moduleName);
  if (!importEntry) {
    errors.push(`${adapter.file} exists but src/game/levels/index.ts does not import ./${adapter.moduleName}. Run npm run level:registry or re-run the scaffold with --register --force.`);
    continue;
  }

  if (!registry.levelNames.has(importEntry.exportName)) {
    errors.push(`${importEntry.exportName} from ./${adapter.moduleName} is not included in the exported levels array. Run npm run level:registry or re-run the scaffold with --register --force.`);
  }
}

for (const adapter of adapterImports) {
  if (!geometryFiles.includes(adapter.geometryFile)) {
    errors.push(`${adapter.file} imports missing geometry file ${adapter.geometryFile}.`);
  }
}

for (const geometryFile of geometryFiles) {
  validateAuthoringSchema(geometryFile);
  validateGeometry(geometryFile);
}

validateRuntimeRegistry();

if (errors.length > 0) {
  console.error('[level-doctor] failed');
  for (const error of errors) console.error(`ERROR ${error}`);
  for (const warning of warnings) console.warn(`WARN ${warning}`);
  process.exit(1);
}

console.info(`[level-doctor] ${geometryFiles.length} geometry file(s), ${adapterImports.length} adapter(s), and ${registry.levelNames.size} registered level(s) are aligned.`);
for (const warning of warnings) console.warn(`WARN ${warning}`);

function listFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((entry) => existsSync(path.join(dir, entry)));
}

function readText(filePath) {
  try {
    return readFileSync(filePath, 'utf8');
  } catch (error) {
    errors.push(`Failed to read ${path.relative(root, filePath)}: ${error.message}`);
    return '';
  }
}

function readExpectedRegistry() {
  try {
    return formatLevelRegistry(collectLevelAdapters({ root }));
  } catch (error) {
    errors.push(`Failed to generate expected level registry: ${error.message}`);
    return '';
  }
}

function readAdapterImport(file) {
  const source = readText(path.join(levelsDir, file));
  return parseLevelAdapter({ file, source });
}

function readRegistry(source) {
  const imports = new Map();
  const levelNames = new Set();

  for (const match of source.matchAll(/import\s+\{\s*([A-Za-z0-9_$]+)\s*\}\s+from\s+['"]\.\/([^'"]+)['"]/g)) {
    imports.set(match[2], { exportName: match[1], moduleName: match[2] });
  }

  const levelsMatch = source.match(/levels\s*=\s*\[([^\]]*)\]/m);
  if (levelsMatch) {
    for (const name of levelsMatch[1].split(',').map((item) => item.trim()).filter(Boolean)) {
      levelNames.add(name);
    }
  } else {
    errors.push('src/game/levels/index.ts does not expose a levels array.');
  }

  return { imports, levelNames };
}

function validateGeometry(geometryFile) {
  const geometryPath = path.join(dataDir, geometryFile);
  const result = spawnSync(process.execPath, [validatorPath, geometryPath, '--min-clearance', '1.1', '--json'], {
    cwd: root,
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    errors.push(`${geometryFile} failed geometry validation: ${result.stderr || result.stdout}`.trim());
    return;
  }

  try {
    const parsed = JSON.parse(result.stdout);
    if (parsed.summary?.warnings > 0) {
      warnings.push(`${geometryFile} passed geometry validation with ${parsed.summary.warnings} warning(s).`);
    }
  } catch (error) {
    warnings.push(`${geometryFile} validator output could not be parsed: ${error.message}`);
  }
}

function validateRuntimeRegistry() {
  const tsxCliPath = path.join(root, 'node_modules', 'tsx', 'dist', 'cli.mjs');
  const result = spawnSync(process.execPath, [tsxCliPath, runtimeDoctorPath], {
    cwd: root,
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    const output = [result.error?.message, result.stderr, result.stdout].filter(Boolean).join('\n').trim();
    errors.push(`Runtime level registry validation failed: ${output || 'no child-process output'}`);
  } else if (result.stdout?.trim()) {
    console.info(result.stdout.trim());
  }
}

function validateAuthoringSchema(geometryFile) {
  const relativeFile = path.join('data', 'levels', geometryFile);
  let geometry;
  try {
    geometry = JSON.parse(readText(path.join(dataDir, geometryFile)));
  } catch (error) {
    errors.push(`${relativeFile} could not be parsed as JSON: ${error.message}`);
    return;
  }

  if (!isObject(geometry.metadata)) {
    errors.push(`${relativeFile} is missing metadata { id, name, chapter } for the mission selector.`);
  } else {
    for (const key of ['id', 'name', 'chapter']) {
      if (!nonEmptyString(geometry.metadata[key])) {
        errors.push(`${relativeFile} metadata.${key} must be a non-empty string.`);
      }
    }
  }

  const doorIds = new Set();
  for (const door of arrayOf(geometry.doors)) {
    if (!nonEmptyString(door.id)) {
      errors.push(`${relativeFile} has a door without an id.`);
      continue;
    }
    doorIds.add(door.id);
    if (door.axis !== 'x' && door.axis !== 'z') {
      errors.push(`${relativeFile}/${door.id} must declare door axis "x" or "z".`);
    }
    if (!Array.isArray(door.opensWhen) || door.opensWhen.length === 0 || door.opensWhen.some((id) => !nonEmptyString(id))) {
      errors.push(`${relativeFile}/${door.id} must declare at least one opensWhen objective id.`);
    }
    if (!Number.isFinite(door.speed) || door.speed <= 0) {
      errors.push(`${relativeFile}/${door.id} must declare positive door speed.`);
    }
  }

  const objectiveIds = new Set();
  const requiredObjectiveIds = [];
  for (const objective of arrayOf(geometry.objectives)) {
    if (!nonEmptyString(objective.id)) {
      errors.push(`${relativeFile} has an objective without an id.`);
      continue;
    }
    objectiveIds.add(objective.id);
    if (objective.id === 'extraction') continue;
    requiredObjectiveIds.push(objective.id);
    if (!['keycard', 'terminal', 'codes'].includes(objective.type)) {
      errors.push(`${relativeFile}/${objective.id} must declare objective type keycard, terminal, or codes.`);
    }
    if (!nonEmptyString(objective.label)) {
      errors.push(`${relativeFile}/${objective.id} must declare a player-facing objective label.`);
    }
    if (!Number.isFinite(objective.radius) || objective.radius <= 0) {
      errors.push(`${relativeFile}/${objective.id} must declare a positive interaction radius.`);
    }
    if (objective.required !== true) {
      errors.push(`${relativeFile}/${objective.id} must explicitly set required=true until optional objectives are supported by QA.`);
    }
    if (!['keycard', 'terminal', 'codes'].includes(objective.asset)) {
      errors.push(`${relativeFile}/${objective.id} must declare a supported objective GLB asset id.`);
    }
    for (const doorId of arrayOf(objective.unlocks)) {
      if (!doorIds.has(doorId)) {
        errors.push(`${relativeFile}/${objective.id} unlocks unknown door ${doorId}.`);
      }
    }
  }

  if (!objectiveIds.has('extraction')) {
    errors.push(`${relativeFile} must include an extraction point in objectives.`);
  }

  for (const door of arrayOf(geometry.doors)) {
    for (const objectiveId of arrayOf(door.opensWhen)) {
      if (!objectiveIds.has(objectiveId)) {
        errors.push(`${relativeFile}/${door.id} opensWhen references unknown objective ${objectiveId}.`);
      }
    }
  }

  const enemyIds = new Set();
  for (const enemy of arrayOf(geometry.enemies)) {
    if (!nonEmptyString(enemy.id)) {
      errors.push(`${relativeFile} has an enemy without an id.`);
      continue;
    }
    enemyIds.add(enemy.id);
    if (!nonEmptyString(enemy.label)) {
      errors.push(`${relativeFile}/${enemy.id} must declare a player-facing enemy label.`);
    }
    if (!isPoint(enemy.start)) {
      errors.push(`${relativeFile}/${enemy.id} must declare start coordinates.`);
    }
    if (!Array.isArray(enemy.patrol) || enemy.patrol.length < 2 || enemy.patrol.some((point) => !isPoint(point))) {
      errors.push(`${relativeFile}/${enemy.id} must declare at least two patrol points.`);
    }
    if (!Number.isFinite(enemy.speed) || enemy.speed <= 0) {
      errors.push(`${relativeFile}/${enemy.id} must declare positive speed.`);
    }
    if (!Number.isFinite(enemy.detectionRadius) || enemy.detectionRadius <= 0) {
      errors.push(`${relativeFile}/${enemy.id} must declare positive detectionRadius.`);
    }
  }

  if (enemyIds.size === 0) {
    errors.push(`${relativeFile} must declare at least one sentry enemy for stealth QA.`);
  }

  if (!Array.isArray(geometry.validationRoute) || geometry.validationRoute.length < requiredObjectiveIds.length + 2 || geometry.validationRoute.some((point) => !isPoint(point))) {
    errors.push(`${relativeFile} must declare a validationRoute that reaches every required objective and extraction.`);
  }

  const validTargets = new Set(['hero', 'scene', 'extraction', ...objectiveIds, ...doorIds, ...enemyIds]);
  const tutorial = arrayOf(geometry.tutorial);
  if (tutorial.length < 5) {
    errors.push(`${relativeFile} must declare at least five tutorial beats for hero, objectives, sentry, and extraction.`);
  }
  for (const step of tutorial) {
    if (!nonEmptyString(step.id) || !nonEmptyString(step.title) || !nonEmptyString(step.target) || !nonEmptyString(step.text)) {
      errors.push(`${relativeFile} has a tutorial step missing id, title, target, or text.`);
      continue;
    }
    if (!validTargets.has(step.target)) {
      errors.push(`${relativeFile}/tutorial/${step.id} targets unknown scene object ${step.target}.`);
    }
    if (!/good luck, cadet\.$/i.test(step.text.trim())) {
      errors.push(`${relativeFile}/tutorial/${step.id} must end with "Good luck, cadet."`);
    }
    if (!Array.isArray(step.alignmentKeywords) || step.alignmentKeywords.length === 0 || step.alignmentKeywords.some((keyword) => !nonEmptyString(keyword))) {
      errors.push(`${relativeFile}/tutorial/${step.id} must include alignmentKeywords for screenshot QA.`);
    }
  }
}

function arrayOf(value) {
  return Array.isArray(value) ? value : [];
}

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isPoint(value) {
  return Array.isArray(value)
    && value.length >= 2
    && Number.isFinite(value[0])
    && Number.isFinite(value[value.length >= 3 ? 2 : 1]);
}
