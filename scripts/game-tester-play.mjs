#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import path from 'node:path';

const host = '127.0.0.1';
const preferredPort = Number(process.env.TESTER_PORT ?? 5184);
const externalUrl = process.env.TESTER_URL;
const qaDate = process.env.QA_DATE ?? '2026-06-20';
const packageInfo = JSON.parse(readFileSync('package.json', 'utf8'));
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const playthroughRoot = path.join('artifacts', 'playthrough', `v${packageInfo.version}`);
const playthroughMatrixPath = process.env.PLAYTHROUGH_MATRIX_PATH ?? path.join(playthroughRoot, 'matrix.json');

let server;
let baseUrl = externalUrl;

try {
  if (!baseUrl) {
    const port = await findOpenPort(Number.isFinite(preferredPort) ? preferredPort : 5184);
    baseUrl = `http://${host}:${port}/`;
    server = spawn(
      ...commandSpec(npxCmd, ['vite', '--host', host, '--port', String(port), '--strictPort']),
      {
        detached: process.platform !== 'win32',
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );
    pipeServerOutput(server);
    await waitForServer(baseUrl, server);
  }

  const env = {
    ...process.env,
    QA_DATE: qaDate,
    SMOKE_URL: baseUrl,
    PLAYTHROUGH_URL: baseUrl,
    SCREENSHOT_URL: baseUrl,
    FAILURE_RETRY_URL: baseUrl,
    FPS_URL: baseUrl,
    PLAYTHROUGH_MATRIX_PATH: playthroughMatrixPath,
  };

  console.info(`[tester-play] using ${baseUrl}`);
  await runNpmScript('verify', env);
  await runBrowserPlaythroughMatrix(env);
  await runNpmScript('screenshots', env);
  await runNpmScript('tester:report', env);
  console.info('[tester-play] complete');
} finally {
  if (server) {
    await stopProcessTree(server);
  }
}

async function findOpenPort(startPort) {
  for (let port = startPort; port < startPort + 50; port += 1) {
    if (await portIsOpen(port)) return port;
  }
  throw new Error(`No open local port found from ${startPort} to ${startPort + 49}.`);
}

function portIsOpen(port) {
  return new Promise((resolve) => {
    const candidate = net.createServer();
    candidate.once('error', () => resolve(false));
    candidate.once('listening', () => {
      candidate.close(() => resolve(true));
    });
    candidate.listen(port, host);
  });
}

async function waitForServer(url, processHandle) {
  const deadline = Date.now() + 45_000;
  let lastError = 'not ready';
  while (Date.now() < deadline) {
    if (processHandle.exitCode !== null) {
      throw new Error(`Vite exited before ${url} became ready with code ${processHandle.exitCode}.`);
    }
    try {
      const statusCode = await httpStatus(url);
      if (statusCode && statusCode < 500) return;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await delay(500);
  }
  throw new Error(`Vite did not become ready at ${url}: ${lastError}`);
}

function httpStatus(url) {
  return new Promise((resolve, reject) => {
    const request = http.get(url, (response) => {
      response.resume();
      response.on('end', () => resolve(response.statusCode));
    });
    request.setTimeout(2000, () => {
      request.destroy(new Error('request timed out'));
    });
    request.on('error', reject);
  });
}

function runNpmScript(script, env) {
  console.info(`[tester-play] npm run ${script}`);
  return runCommand(npmCmd, ['run', script], { env, stdio: 'inherit' });
}

async function runBrowserPlaythroughMatrix(env) {
  const levelIds = readRegisteredLevelIds();
  const matrix = [];

  for (const [index, levelId] of levelIds.entries()) {
    const outputDir = index === 0 ? playthroughRoot : path.join(playthroughRoot, levelId);
    const playthroughEnv = {
      ...env,
      PLAYTHROUGH_LEVEL_ID: levelId,
      PLAYTHROUGH_OUTPUT_DIR: outputDir,
    };

    console.info(`[tester-play] browser playthrough ${levelId}`);
    await runNpmScript('playthrough:browser', playthroughEnv);
    matrix.push({
      levelId,
      reportPath: path.join(outputDir, 'playthrough-report.json'),
      status: 'pass',
    });
  }

  await mkdir(path.dirname(playthroughMatrixPath), { recursive: true });
  await writeFile(playthroughMatrixPath, JSON.stringify({
    build: `v${packageInfo.version}`,
    generatedAt: new Date().toISOString(),
    levels: matrix,
  }, null, 2));
  console.info(`[tester-play] browser playthrough matrix wrote ${playthroughMatrixPath}`);
}

function readRegisteredLevelIds() {
  const indexSource = readFileSync(path.join('src', 'game', 'levels', 'index.ts'), 'utf8');
  const imports = new Map();
  for (const match of indexSource.matchAll(/import\s+\{\s*([A-Za-z0-9_$]+)\s*\}\s+from\s+['"]\.\/([^'"]+)['"]/g)) {
    imports.set(match[1], match[2]);
  }

  const levelsMatch = indexSource.match(/levels\s*=\s*\[([^\]]*)\]/m);
  if (!levelsMatch) throw new Error('Cannot find registered levels array in src/game/levels/index.ts.');

  const levelIds = levelsMatch[1]
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((exportName) => {
      const moduleName = imports.get(exportName);
      if (!moduleName) throw new Error(`Cannot find import for registered level ${exportName}.`);
      const adapterSource = readFileSync(path.join('src', 'game', 'levels', `${moduleName}.ts`), 'utf8');
      const exportMatch = adapterSource.match(new RegExp(`export\\s+const\\s+${exportName}\\s*:\\s*LevelDefinition\\s*=\\s*{[\\s\\S]*?\\n};`));
      const idMatch = (exportMatch?.[0] ?? adapterSource).match(/^\s*id:\s*['"]([^'"]+)['"]/m);
      if (!idMatch) throw new Error(`Cannot find id for registered level ${exportName}.`);
      return idMatch[1];
    });

  if (levelIds.length === 0) throw new Error('No registered level IDs found for browser playthrough matrix.');
  return levelIds;
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(...commandSpec(command, args), options);
    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} ${args.join(' ')} exited with code ${code ?? 'null'} signal ${signal ?? 'none'}.`));
      }
    });
  });
}

function commandSpec(command, args) {
  if (process.platform !== 'win32') return [command, args];
  if (!command.endsWith('.cmd')) return [command, args];
  return ['cmd.exe', ['/d', '/c', command, ...args]];
}

async function stopProcessTree(processHandle) {
  if (processHandle.exitCode !== null) return;
  if (process.platform === 'win32') {
    await runCommand('taskkill', ['/PID', String(processHandle.pid), '/T', '/F'], { stdio: 'ignore' }).catch(() => {});
    return;
  }

  try {
    process.kill(-processHandle.pid, 'SIGTERM');
  } catch {
    processHandle.kill('SIGTERM');
  }
  await delay(1500);
  if (processHandle.exitCode === null) {
    try {
      process.kill(-processHandle.pid, 'SIGKILL');
    } catch {
      processHandle.kill('SIGKILL');
    }
  }
}

function pipeServerOutput(processHandle) {
  processHandle.stdout?.on('data', (chunk) => process.stdout.write(`[vite] ${chunk}`));
  processHandle.stderr?.on('data', (chunk) => process.stderr.write(`[vite] ${chunk}`));
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
