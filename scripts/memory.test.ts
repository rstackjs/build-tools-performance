import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { setTimeout as sleep } from 'node:timers/promises';
import { test } from 'node:test';
import { createMemorySampler } from './memory.ts';

test(
  'samples child allocations, preserves their peak, and excludes the driver',
  { timeout: 20000 },
  async () => {
    const sampler = await createMemorySampler();
    const root = spawn(
      process.execPath,
      [
        '-e',
        `
    const { spawn } = require('node:child_process');
    let child;
    process.on('message', (message) => {
      if (message === 'allocate') {
        child = spawn(process.execPath, ['-e',
          'global.buffer = Buffer.alloc(160 * 1024 * 1024, 1); process.send(process.pid); setInterval(() => {}, 1000);'],
          { stdio: ['ignore', 'ignore', 'inherit', 'ipc'] });
        child.on('message', (pid) => process.send(pid));
        child.on('exit', () => process.send('released'));
      } else if (message === 'release') child.kill();
    });
    process.send('ready');
  `,
      ],
      { detached: true, stdio: ['ignore', 'ignore', 'inherit', 'ipc'] },
    );
    const monitor = sampler.start(root.pid!);
    try {
      await once(root, 'message');
      const allocated = once(root, 'message');
      root.send('allocate');
      const [childPid] = await allocated;
      await sleep(500);
      const released = once(root, 'message');
      root.send('release');
      await released;
      const steady = await monitor.steady();
      const peak = await monitor.stop();
      assert.ok(
        peak > steady.bytes + 100 * 1024 ** 2,
        `transient child allocation must contribute to the peak (peak=${peak}, steady=${steady.bytes})`,
      );
      assert.ok(
        monitor.samples.some((sample) =>
          sample.processes.some(({ pid }) => pid === childPid),
        ),
      );
      assert.ok(
        monitor.samples.every((sample) =>
          sample.processes.every(({ pid }) => pid !== process.pid),
        ),
      );
    } finally {
      await monitor.stop();
      process.kill(-root.pid!, 'SIGKILL');
      await sampler.close();
    }
  },
);
