#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

const usage = `Usage:
  node generate_image_asset.mjs --prompt "..." [options]
  node generate_image_asset.mjs --prompt-file prompt.txt [options]

Options:
  --out <path>          Output image path. Default: artifacts/imagegen/<timestamp>.png
  --model <id>          OpenAI image model. Default: gpt-image-2
  --size <WxH>          Image size. Default: 1024x1024
  --quality <value>     low, medium, high, or auto. Default: medium
  --format <value>      png, webp, or jpeg. Default: inferred from --out or png
  --background <value>  auto, transparent, or opaque
  --api-key-file <path> Key file override. Env: OPENAI_API_KEY_FILE
  --help                Show this help

Credential lookup:
  OPENAI_API_KEY, then --api-key-file, then OPENAI_API_KEY_FILE,
  then C:\\Users\\<you>\\Projects\\openai_key.txt.
`;

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--help' || token === '-h') {
      args.help = true;
      continue;
    }
    if (!token.startsWith('--')) {
      throw new Error(`Unexpected argument: ${token}`);
    }
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      args[key] = next;
      i += 1;
    } else {
      args[key] = true;
    }
  }
  return args;
}

async function readTrimmed(filePath) {
  try {
    return (await readFile(filePath, 'utf8')).trim();
  } catch {
    return '';
  }
}

async function loadApiKey(args) {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY.trim();

  const keyFiles = [
    args['api-key-file'],
    process.env.OPENAI_API_KEY_FILE,
    path.join(os.homedir(), 'Projects', 'openai_key.txt')
  ].filter(Boolean);

  for (const filePath of keyFiles) {
    const value = await readTrimmed(filePath);
    if (value) return value;
  }

  return '';
}

function inferFormat(outPath, explicitFormat) {
  if (explicitFormat) return explicitFormat === 'jpg' ? 'jpeg' : explicitFormat;
  const ext = path.extname(outPath).toLowerCase().replace('.', '');
  if (ext === 'jpg') return 'jpeg';
  if (['png', 'jpeg', 'webp'].includes(ext)) return ext;
  return 'png';
}

function timestampName(format) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return path.join('artifacts', 'imagegen', `${stamp}.${format === 'jpeg' ? 'jpg' : format}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(usage);
    return;
  }

  const prompt = args.prompt || (args['prompt-file'] ? await readFile(args['prompt-file'], 'utf8') : '');
  if (!prompt.trim()) {
    throw new Error('Provide --prompt or --prompt-file.');
  }

  const model = args.model || 'gpt-image-2';
  const size = args.size || '1024x1024';
  const quality = args.quality || 'medium';
  const outPath = args.out || timestampName(inferFormat('', args.format));
  const outputFormat = inferFormat(outPath, args.format);

  if (args.background === 'transparent' && outputFormat === 'jpeg') {
    throw new Error('Transparent background requires png or webp output.');
  }

  const apiKey = await loadApiKey(args);
  if (!apiKey) {
    throw new Error('Missing OpenAI API key. Set OPENAI_API_KEY or provide an ignored local key file.');
  }

  const body = {
    model,
    prompt: prompt.trim(),
    size,
    quality,
    output_format: outputFormat,
    n: 1
  };

  if (args.background) body.background = args.background;

  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = json.error?.message || JSON.stringify(json);
    throw new Error(`OpenAI image request failed (${response.status}): ${detail}`);
  }

  const b64 = json.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error('OpenAI response did not include data[0].b64_json.');
  }

  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, Buffer.from(b64, 'base64'));

  console.log(JSON.stringify({
    output: outPath,
    model,
    size,
    quality,
    format: outputFormat
  }, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
