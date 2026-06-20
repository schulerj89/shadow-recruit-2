#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { collectLevelAdapters, formatLevelRegistry } from './level-registry.mjs';

const root = process.cwd();
const dataDir = path.join(root, 'data', 'levels');
const levelsDir = path.join(root, 'src', 'game', 'levels');
const indexPath = path.join(levelsDir, 'index.ts');
const validatorPath = path.join(root, '.codex', 'skills', 'threejs-level-geometry-validator', 'scripts', 'validate_level_geometry.mjs');
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
  validateGeometry(geometryFile);
}

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
  const match = source.match(/from ['"]\.\.\/\.\.\/\.\.\/data\/levels\/([^'"]+\.geometry\.json)['"]/);
  if (!match) {
    warnings.push(`${file} does not import a data/levels/*.geometry.json file.`);
    return null;
  }
  return {
    file,
    moduleName: file.replace(/\.ts$/, ''),
    geometryFile: match[1],
  };
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
