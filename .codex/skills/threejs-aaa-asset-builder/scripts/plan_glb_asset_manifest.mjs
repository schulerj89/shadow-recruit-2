#!/usr/bin/env node
import { readFile } from 'node:fs/promises';

const usage = `Usage:
  node plan_glb_asset_manifest.mjs <manifest.json> [--json]

Validates a non-secret GLB asset manifest and prints provider-specific production steps.
No provider API calls are made.
`;

function parseArgs(argv) {
  const args = { _: [] };
  for (const token of argv) {
    if (token === '--help' || token === '-h') args.help = true;
    else if (token === '--json') args.json = true;
    else args._.push(token);
  }
  return args;
}

function requireString(asset, field, errors) {
  if (typeof asset[field] !== 'string' || !asset[field].trim()) {
    errors.push(`${asset.id || '<unknown>'}: missing string field ${field}`);
  }
}

function validateAsset(asset, index) {
  const errors = [];
  if (!asset || typeof asset !== 'object') return [`assets[${index}] must be an object`];

  requireString(asset, 'id', errors);
  if (asset.id && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(asset.id)) {
    errors.push(`${asset.id}: id must be lowercase hyphen-case`);
  }

  requireString(asset, 'provider', errors);
  if (asset.provider && !['meshy', 'tripo', 'manual'].includes(asset.provider)) {
    errors.push(`${asset.id}: provider must be meshy, tripo, or manual`);
  }

  requireString(asset, 'kind', errors);
  requireString(asset, 'runtimePath', errors);

  if (!asset.prompt && !asset.sourceImage && asset.provider !== 'manual') {
    errors.push(`${asset.id}: provide prompt or sourceImage`);
  }

  if (!Array.isArray(asset.targetFormats) || !asset.targetFormats.includes('glb')) {
    errors.push(`${asset.id}: targetFormats must include glb`);
  }

  if (!Number.isFinite(asset.budgetBytes) || asset.budgetBytes <= 0) {
    errors.push(`${asset.id}: budgetBytes must be a positive number`);
  }

  if (!asset.collision) {
    errors.push(`${asset.id}: describe collision proxy`);
  }

  return errors;
}

function providerSteps(asset) {
  if (asset.provider === 'meshy') {
    return [
      'Create preview task for shape review.',
      'Review silhouette, scale, origin, topology, and collision proxy.',
      'Create refine task for texture after preview acceptance.',
      'Request GLB output and store non-secret task metadata.',
      'Validate in Three.js with loader metrics and screenshot.'
    ];
  }

  if (asset.provider === 'tripo') {
    const steps = [
      'Create v3 generation task and poll until success.',
      'Download output.model_url immediately after success.',
      'Validate GLB scale, pivot, materials, and triangle budget.'
    ];
    if (asset.rig || asset.animations) {
      steps.splice(2, 0, 'Run rig-check before rigging.', 'Run rig task, then retarget requested animations.');
    }
    return steps;
  }

  return [
    'Import or author the GLB manually.',
    'Record source metadata and license/provenance.',
    'Validate runtime path, registry entry, screenshot, and memory budget.'
  ];
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(usage);
    return;
  }

  const manifestPath = args._[0];
  if (!manifestPath) throw new Error('Provide a manifest JSON path.');

  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  if (!Array.isArray(manifest.assets)) {
    throw new Error('Manifest must include an assets array.');
  }

  const results = manifest.assets.map((asset, index) => ({
    id: asset.id || `assets[${index}]`,
    provider: asset.provider,
    errors: validateAsset(asset, index),
    steps: providerSteps(asset)
  }));

  const errorCount = results.reduce((sum, item) => sum + item.errors.length, 0);

  if (args.json) {
    console.log(JSON.stringify({ kit: manifest.kit || null, errorCount, assets: results }, null, 2));
  } else {
    console.log(`Kit: ${manifest.kit || '<unnamed>'}`);
    console.log(`Assets: ${results.length}`);
    for (const result of results) {
      console.log(`\n${result.id} (${result.provider || 'unknown'})`);
      if (result.errors.length) {
        for (const error of result.errors) console.log(`  ERROR: ${error}`);
      } else {
        for (const step of result.steps) console.log(`  - ${step}`);
      }
    }
  }

  if (errorCount > 0) process.exitCode = 2;
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
