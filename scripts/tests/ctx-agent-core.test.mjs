import assert from 'node:assert/strict';
import test from 'node:test';

import { isBetterSqlite3AbiMismatch, shouldAutoRebuildNative } from '../ctx-agent-core.mjs';

test('detects better-sqlite3 Node ABI mismatch errors', () => {
  const detail = [
    'contextdb init failed: dlopen(/tmp/better_sqlite3.node, 0x0001):',
    'The module was compiled against a different Node.js version using',
    'NODE_MODULE_VERSION 115.',
    'This version of Node.js requires NODE_MODULE_VERSION 127.',
  ].join('\n');

  assert.equal(isBetterSqlite3AbiMismatch(detail), true);
});

test('does not treat unrelated native addon errors as better-sqlite3 ABI mismatch', () => {
  const detail = 'Error: Cannot find module "playwright"';
  assert.equal(isBetterSqlite3AbiMismatch(detail), false);
});

test('auto-rebuild env defaults to enabled', () => {
  assert.equal(shouldAutoRebuildNative({}), true);
});

test('auto-rebuild env accepts explicit off values', () => {
  assert.equal(shouldAutoRebuildNative({ CTXDB_AUTO_REBUILD_NATIVE: '0' }), false);
  assert.equal(shouldAutoRebuildNative({ CTXDB_AUTO_REBUILD_NATIVE: 'false' }), false);
  assert.equal(shouldAutoRebuildNative({ CTXDB_AUTO_REBUILD_NATIVE: 'off' }), false);
});

test('auto-rebuild env accepts explicit on values', () => {
  assert.equal(shouldAutoRebuildNative({ CTXDB_AUTO_REBUILD_NATIVE: '1' }), true);
  assert.equal(shouldAutoRebuildNative({ CTXDB_AUTO_REBUILD_NATIVE: 'true' }), true);
  assert.equal(shouldAutoRebuildNative({ CTXDB_AUTO_REBUILD_NATIVE: 'on' }), true);
});
