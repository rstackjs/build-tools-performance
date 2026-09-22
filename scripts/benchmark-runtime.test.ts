import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { test } from 'node:test';
import {
  monitorProcess,
  RetryableError,
  runPhase,
  runWithRetry,
} from './benchmark-runtime.ts';

test(
  'detects server exit after startup, preserving output and exit code',
  { timeout: 5000 },
  async () => {
    const child = spawn(
      process.execPath,
      [
        '-e',
        `
    console.log('ready');
    process.on('message', () => { console.error('server failed'); process.exit(7); });
  `,
      ],
      { stdio: ['ignore', 'pipe', 'pipe', 'ipc'] },
    );
    const monitor = monitorProcess(child);
    try {
      await runPhase('startup', 2000, async () => {
        await once(child.stdout!, 'data');
      });
      const failure = monitor.exited.then((exit) => {
        throw new RetryableError(`exit: ${exit.code}`);
      });
      await assert.rejects(
        runPhase(
          'HMR',
          2000,
          () => {
            child.send('exit');
            return new Promise(() => {});
          },
          failure,
        ),
        /exit: 7/,
      );
      assert.match(monitor.output.stdout, /ready/);
      assert.match(monitor.output.stderr, /server failed/);
      // Also catches an exit which happened between phases.
      await assert.rejects(
        runPhase('next HMR', 2000, () => new Promise(() => {}), failure),
        /exit: 7/,
      );
    } finally {
      child.kill('SIGKILL');
      await monitor.exited;
    }
  },
);

test(
  'timeout releases listeners and the caller terminates the pending process',
  { timeout: 5000 },
  async () => {
    const child = spawn(process.execPath, [
      '-e',
      'setInterval(() => {}, 1000)',
    ]);
    const monitor = monitorProcess(child);
    const baseline = child.stdout!.listenerCount('data');
    try {
      await assert.rejects(
        runPhase(
          'build',
          30,
          (signal) =>
            new Promise(() => {
              const onData = () => {};
              child.stdout!.on('data', onData);
              signal.addEventListener(
                'abort',
                () => child.stdout!.off('data', onData),
                { once: true },
              );
            }),
        ),
        (error: unknown) =>
          error instanceof RetryableError &&
          /build timed out/.test(error.message),
      );
      assert.equal(child.stdout!.listenerCount('data'), baseline);
    } finally {
      child.kill('SIGKILL');
      await monitor.exited;
    }
    assert.equal(child.signalCode, 'SIGKILL');
  },
);

test('retries the cold/warm pair after cleanup and discards partial results', async () => {
  const events: string[] = [];
  const failures: boolean[] = [];
  const result = await runWithRetry(
    async (attempt) => {
      const pending: number[] = [];
      try {
        events.push(`cold ${attempt}`);
        pending.push(attempt * 10);
        events.push(`warm ${attempt}`);
        if (attempt === 1) throw new RetryableError('HMR timeout');
        pending.push(attempt * 100);
        return pending;
      } finally {
        events.push(`cleanup ${attempt}`);
      }
    },
    (_, attempt, willRetry) => {
      assert.equal(events.at(-1), `cleanup ${attempt}`);
      failures.push(willRetry);
    },
  );
  assert.deepEqual(result, [20, 200]);
  assert.deepEqual(events, [
    'cold 1',
    'warm 1',
    'cleanup 1',
    'cold 2',
    'warm 2',
    'cleanup 2',
  ]);
  assert.deepEqual(failures, [true]);
});

test('stops after two transient failures and never retries deterministic errors', async () => {
  for (const error of [
    new RetryableError('timeout'),
    new Error('compile failed'),
  ]) {
    let calls = 0;
    const failures: boolean[] = [];
    await assert.rejects(
      runWithRetry(
        async () => {
          calls++;
          throw error;
        },
        (_, __, willRetry) => failures.push(willRetry),
      ),
      (actual) => actual === error,
    );
    assert.equal(calls, error instanceof RetryableError ? 2 : 1);
    assert.deepEqual(
      failures,
      error instanceof RetryableError ? [true, false] : [false],
    );
  }
});

test('successful phases abort listener scopes and successful attempts are not retried', async () => {
  let signal: AbortSignal | undefined;
  let calls = 0;
  const result = await runWithRetry(
    async () => {
      calls++;
      return runPhase('build', 1000, async (scope) => {
        signal = scope;
        return 42;
      });
    },
    () => assert.fail('successful results must not be retried'),
  );
  assert.equal(result, 42);
  assert.equal(calls, 1);
  assert.equal(signal?.aborted, true);
});
