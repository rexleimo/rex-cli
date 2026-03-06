import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, writeFile, chmod, mkdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const BRIDGE = path.join(ROOT, 'scripts', 'contextdb-shell-bridge.mjs');

async function createFakeCodexCommand() {
  const binDir = await mkdtemp(path.join(os.tmpdir(), 'aios-bridge-bin-'));
  if (process.platform === 'win32') {
    const file = path.join(binDir, 'codex.cmd');
    await writeFile(file, '@echo off\r\necho CODEX_HOME=%CODEX_HOME%\r\n', 'utf8');
    return binDir;
  }

  const file = path.join(binDir, 'codex');
  await writeFile(file, '#!/usr/bin/env bash\necho "CODEX_HOME=${CODEX_HOME:-<unset>}"\n', 'utf8');
  await chmod(file, 0o755);
  return binDir;
}

function runBridge({ cwd, codeHome, pathPrefix }) {
  const env = { ...process.env };
  env.PATH = `${pathPrefix}${path.delimiter}${env.PATH || ''}`;
  env.CODEX_HOME = codeHome;

  const result = spawnSync('node', [
    BRIDGE,
    '--agent', 'codex-cli',
    '--command', 'codex',
    '--cwd', cwd,
    '--',
    '--help',
  ], {
    cwd: ROOT,
    env,
    encoding: 'utf8',
  });

  return result;
}

function parseReportedCodeHome(stdout) {
  const line = (stdout || '').trim().split(/\r?\n/).find((x) => x.startsWith('CODEX_HOME='));
  return line ? line.slice('CODEX_HOME='.length) : '';
}

test('relative CODEX_HOME is resolved against invocation cwd', async () => {
  const cwd = await mkdtemp(path.join(os.tmpdir(), 'aios-bridge-cwd-'));
  await mkdir(path.join(cwd, 'rel-home'), { recursive: true });
  const fakeBin = await createFakeCodexCommand();

  const result = runBridge({
    cwd,
    codeHome: './rel-home',
    pathPrefix: fakeBin,
  });

  assert.equal(result.status, 0);
  assert.equal(parseReportedCodeHome(result.stdout), path.resolve(cwd, 'rel-home'));
});

test('absolute CODEX_HOME is preserved', async () => {
  const cwd = await mkdtemp(path.join(os.tmpdir(), 'aios-bridge-cwd-'));
  const absoluteHome = await mkdtemp(path.join(os.tmpdir(), 'aios-bridge-codex-home-'));
  const fakeBin = await createFakeCodexCommand();

  const result = runBridge({
    cwd,
    codeHome: absoluteHome,
    pathPrefix: fakeBin,
  });

  assert.equal(result.status, 0);
  assert.equal(parseReportedCodeHome(result.stdout), absoluteHome);
});
