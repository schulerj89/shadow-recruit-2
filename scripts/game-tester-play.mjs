#!/usr/bin/env node
import { spawn } from 'node:child_process';
import http from 'node:http';
import net from 'node:net';

const host = '127.0.0.1';
const preferredPort = Number(process.env.TESTER_PORT ?? 5184);
const externalUrl = process.env.TESTER_URL;
const qaDate = process.env.QA_DATE ?? '2026-06-20';
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';

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
  };

  console.info(`[tester-play] using ${baseUrl}`);
  await runNpmScript('verify', env);
  await runNpmScript('playthrough:browser', env);
  await runNpmScript('screenshots', env);
  await runNpmScript('test:fps', env);
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
