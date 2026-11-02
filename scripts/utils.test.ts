import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { getFileSizes } from './utils.ts';

test('counts JavaScript output files across directories and module formats', async (t) => {
  const dir = await mkdtemp(path.join(tmpdir(), 'benchmark-chunks-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await mkdir(path.join(dir, 'assets'));
  await Promise.all(
    [
      'entry.js',
      'runtime.js',
      'assets/async.mjs',
      'assets/worker.cjs',
      'assets/styles.css',
      'assets/logo.svg',
      'assets/async.mjs.map',
      'runtime.js.LICENSE.txt',
      'manifest.json',
      'index.html',
    ].map((file) => writeFile(path.join(dir, file), 'fixture')),
  );

  assert.equal((await getFileSizes(dir)).chunkCount, 4);
});

test('reports zero JavaScript chunks for an empty output directory', async (t) => {
  const dir = await mkdtemp(path.join(tmpdir(), 'benchmark-chunks-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  assert.equal((await getFileSizes(dir)).chunkCount, 0);
});
