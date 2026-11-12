import assert from 'node:assert/strict';
import { execFile, spawn, type ChildProcess } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test, { type TestContext } from 'node:test';
import { promisify } from 'node:util';
import { RetryableError } from './benchmark-utils.ts';
import { stopProcessTree } from './process-shutdown.ts';

const execFileAsync = promisify(execFile);

// Include reparented members of the command's process group, as the benchmark
// sampler does, so a wrapper exiting cannot hide a still-running tool.
async function snapshot(rootPid: number): Promise<{ pid: number }[]> {
  const { stdout } = await execFileAsync('ps', [
    '-A',
    '-o',
    'pid=,ppid=,pgid=,stat=',
  ]);
  const rows = stdout
    .trim()
    .split('\n')
    .map((line) => {
      const [pid, ppid, pgid, status] = line.trim().split(/\s+/);
      return {
        pid: Number(pid),
        ppid: Number(ppid),
        pgid: Number(pgid),
        status,
      };
    });
  const selected = new Set(
    rows
      .filter((row) => row.pid === rootPid || row.pgid === rootPid)
      .map((row) => row.pid),
  );
  for (let previous = -1; previous !== selected.size;) {
    previous = selected.size;
    for (const row of rows) if (selected.has(row.ppid)) selected.add(row.pid);
  }
  return rows
    .filter((row) => selected.has(row.pid) && !row.status.startsWith('Z'))
    .map(({ pid }) => ({ pid }));
}

async function fixture(t: TestContext, source: string): Promise<ChildProcess> {
  const child = spawn(
    process.execPath,
    ['--input-type=module', '--eval', source],
    {
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  const exited = once(child, 'exit');
  t.after(async () => {
    if (child.pid) {
      try {
        process.kill(-child.pid, 'SIGKILL');
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ESRCH') throw error;
      }
    }
    await exited;
  });
  await new Promise<void>((resolve, reject) => {
    let output = '';
    let errors = '';
    const timeout = setTimeout(
      () => finish(new Error(`Fixture timed out: ${errors}`)),
      5000,
    );
    const onData = (data: Buffer) => {
      output += data.toString();
      if (output.includes('READY')) finish();
    };
    const onErrorData = (data: Buffer) => {
      errors += data.toString();
    };
    const onExit = () =>
      finish(new Error(`Fixture exited before ready: ${errors}`));
    const finish = (error?: Error) => {
      clearTimeout(timeout);
      child.stdout!.off('data', onData);
      child.stderr!.off('data', onErrorData);
      child.off('exit', onExit);
      child.off('error', finish);
      if (error) reject(error);
      else resolve();
    };
    child.stdout!.on('data', onData);
    child.stderr!.on('data', onErrorData);
    child.once('exit', onExit);
    child.once('error', finish);
  });
  return child;
}

test(
  'graceful shutdown sends one signal and awaits the tool cache flush',
  {
    skip: process.platform === 'win32',
    timeout: 10000,
  },
  async (t) => {
    const directory = await mkdtemp(
      path.join(os.tmpdir(), 'benchmark-shutdown-'),
    );
    t.after(() => rm(directory, { recursive: true, force: true }));
    const marker = path.join(directory, 'flushed');
    const tool = `
    import { writeFileSync } from 'node:fs';
    const onSignal = () => {
      process.off('SIGTERM', onSignal);
      setTimeout(() => {
        writeFileSync(${JSON.stringify(marker)}, 'cache flushed');
        process.exit(0);
      }, 200);
    };
    process.on('SIGTERM', onSignal);
    setInterval(() => {}, 1000);
    console.log('READY');
  `;
    // A forwarding launcher reproduces the original cross-env race: signalling
    // both descendants and ancestors would deliver SIGTERM twice to the tool.
    const child = await fixture(
      t,
      `
    import { spawn } from 'node:child_process';
    const tool = spawn(process.execPath, ['--input-type=module', '--eval', ${JSON.stringify(tool)}], {
      stdio: ['ignore', 'inherit', 'inherit'],
    });
    process.on('SIGTERM', () => setTimeout(() => tool.kill('SIGTERM'), 10));
    tool.once('exit', (code) => process.exit(code ?? 1));
  `,
    );

    await stopProcessTree(child, {
      snapshot,
      timeoutMs: 3000,
      gracefulRoot: true,
    });

    assert.equal(await readFile(marker, 'utf8'), 'cache flushed');
    assert.equal(child.exitCode, 0);
    assert.equal(child.signalCode, null);
    assert.deepEqual(await snapshot(child.pid!), []);
  },
);

test(
  'forced shutdown discards the cache pair after all processes exit',
  {
    skip: process.platform === 'win32',
    timeout: 10000,
  },
  async (t) => {
    const child = await fixture(
      t,
      `
    process.on('SIGTERM', () => {});
    setInterval(() => {}, 1000);
    console.log('READY');
  `,
    );

    await assert.rejects(
      stopProcessTree(child, { snapshot, timeoutMs: 100, gracefulRoot: true }),
      (error: unknown) =>
        error instanceof RetryableError &&
        /required SIGKILL/.test(error.message),
    );
    assert.equal(child.signalCode, 'SIGKILL');
    assert.deepEqual(await snapshot(child.pid!), []);
  },
);

test(
  'an unacknowledged signal exit discards the cache pair',
  {
    skip: process.platform === 'win32',
    timeout: 10000,
  },
  async (t) => {
    const child = await fixture(
      t,
      `
    setInterval(() => {}, 1000);
    console.log('READY');
  `,
    );

    await assert.rejects(
      stopProcessTree(child, { snapshot, timeoutMs: 3000, gracefulRoot: true }),
      (error: unknown) =>
        error instanceof RetryableError &&
        /did not exit gracefully/.test(error.message),
    );
    assert.equal(child.signalCode, 'SIGTERM');
    assert.deepEqual(await snapshot(child.pid!), []);
  },
);
