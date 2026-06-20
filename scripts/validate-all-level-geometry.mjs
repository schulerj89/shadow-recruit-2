#!/usr/bin/env node

import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const dataDir = path.join(root, 'data', 'levels');
const validatorPath = path.join(root, '.codex', 'skills', 'threejs-level-geometry-validator', 'scripts', 'validate_level_geometry.mjs');
const geometryFiles = existsSync(dataDir)
  ? readdirSync(dataDir).filter((file) => file.endsWith('.geometry.json')).sort()
  : [];

if (geometryFiles.length === 0) {
  console.error('[level-geometry] no data/levels/*.geometry.json files found.');
  process.exit(1);
}

let failures = 0;
for (const file of geometryFiles) {
  const geometryPath = path.join(dataDir, file);
  const result = spawnSync(process.execPath, [validatorPath, geometryPath, '--min-clearance', '1.1', '--json'], {
    cwd: root,
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    failures += 1;
    console.error(`[level-geometry] ${file} failed`);
    console.error((result.stderr || result.stdout).trim());
    continue;
  }
  const summary = JSON.parse(result.stdout).summary;
  console.info(`[level-geometry] ${file}: rectangles=${summary.rectangles}; nonSolid=${summary.nonSolidRectangles}; zones=${summary.zones}; warnings=${summary.warnings}`);
}

if (failures > 0) {
  console.error(`[level-geometry] ${failures} geometry validation failure(s).`);
  process.exit(1);
}

console.info(`[level-geometry] ${geometryFiles.length} geometry file(s) passed.`);
