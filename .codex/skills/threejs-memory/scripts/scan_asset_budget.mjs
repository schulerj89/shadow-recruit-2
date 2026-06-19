#!/usr/bin/env node
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const usage = `Usage:
  node scan_asset_budget.mjs <dir> [--max-total-mb <n>] [--largest <n>] [--json]

Scans asset payload size by extension and reports largest files.
`;

const ignoreDirs = new Set(['.git', 'node_modules', 'dist', 'build', 'coverage']);

function parseArgs(argv) {
  const args = { _: [], largest: 15 };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--help' || token === '-h') args.help = true;
    else if (token === '--json') args.json = true;
    else if (token === '--max-total-mb') {
      args.maxTotalMb = Number(argv[++i]);
    } else if (token === '--largest') {
      args.largest = Number(argv[++i]);
    } else {
      args._.push(token);
    }
  }
  return args;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(value >= 100 ? 0 : value >= 10 ? 1 : 2)} ${units[index]}`;
}

async function walk(root, current = root, files = []) {
  const entries = await readdir(current, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(current, entry.name);
    if (entry.isDirectory()) {
      if (!ignoreDirs.has(entry.name)) await walk(root, fullPath, files);
    } else if (entry.isFile()) {
      const info = await stat(fullPath);
      files.push({
        path: path.relative(root, fullPath).replace(/\\/g, '/'),
        bytes: info.size,
        ext: path.extname(entry.name).toLowerCase() || '<none>'
      });
    }
  }
  return files;
}

function summarize(files) {
  const byExt = new Map();
  for (const file of files) {
    const item = byExt.get(file.ext) || { ext: file.ext, files: 0, bytes: 0 };
    item.files += 1;
    item.bytes += file.bytes;
    byExt.set(file.ext, item);
  }
  return [...byExt.values()].sort((a, b) => b.bytes - a.bytes);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(usage);
    return;
  }

  const root = args._[0];
  if (!root) throw new Error('Provide a directory to scan.');

  const files = await walk(path.resolve(root));
  const totalBytes = files.reduce((sum, file) => sum + file.bytes, 0);
  const byExtension = summarize(files);
  const largest = [...files].sort((a, b) => b.bytes - a.bytes).slice(0, args.largest);
  const overBudget = Number.isFinite(args.maxTotalMb) && totalBytes > args.maxTotalMb * 1024 * 1024;

  const report = {
    root,
    files: files.length,
    totalBytes,
    totalHuman: formatBytes(totalBytes),
    maxTotalMb: Number.isFinite(args.maxTotalMb) ? args.maxTotalMb : null,
    overBudget,
    byExtension: byExtension.map((item) => ({ ...item, human: formatBytes(item.bytes) })),
    largest: largest.map((item) => ({ ...item, human: formatBytes(item.bytes) }))
  };

  if (args.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(`Root: ${root}`);
    console.log(`Files: ${report.files}`);
    console.log(`Total: ${report.totalHuman}${overBudget ? ` (over ${args.maxTotalMb} MB budget)` : ''}`);
    console.log('\nBy extension:');
    for (const item of report.byExtension) {
      console.log(`  ${item.ext.padEnd(8)} ${String(item.files).padStart(5)} files  ${item.human}`);
    }
    console.log('\nLargest files:');
    for (const item of report.largest) {
      console.log(`  ${item.human.padStart(10)}  ${item.path}`);
    }
  }

  if (overBudget) process.exitCode = 2;
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
