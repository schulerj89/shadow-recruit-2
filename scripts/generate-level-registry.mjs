#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { collectLevelAdapters, formatLevelRegistry, getLevelRegistryPath } from './level-registry.mjs';

const args = parseArgs(process.argv.slice(2));
const root = process.cwd();
const registryPath = getLevelRegistryPath(root);
const adapters = collectLevelAdapters({ root });
const nextSource = formatLevelRegistry(adapters);
const currentSource = await readText(registryPath);
const relativePath = path.relative(root, registryPath);

if (args.check) {
  if (currentSource !== nextSource) {
    console.error(`[level-registry] ${relativePath} is stale. Run npm run level:registry.`);
    process.exit(1);
  }
  console.info(`[level-registry] ${relativePath} is current.`);
  process.exit(0);
}

if (args.dryRun) {
  if (currentSource === nextSource) {
    console.info(`[level-registry] ${relativePath} is already current.`);
  } else {
    console.info(`[level-registry] would write ${relativePath}`);
  }
  process.exit(0);
}

if (currentSource === nextSource) {
  console.info(`[level-registry] ${relativePath} is already current.`);
} else {
  await writeFile(registryPath, nextSource);
  console.info(`[level-registry] wrote ${relativePath}`);
}

function parseArgs(tokens) {
  const parsed = { check: false, dryRun: false };
  for (const token of tokens) {
    if (token === '--check') parsed.check = true;
    else if (token === '--dry-run') parsed.dryRun = true;
    else throw new Error(`Unknown argument: ${token}`);
  }
  return parsed;
}

async function readText(filePath) {
  try {
    return await readFile(filePath, 'utf8');
  } catch {
    return '';
  }
}
