import { execFile } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { setTimeout as sleep } from 'node:timers/promises';

const exec = promisify(execFile);
export const memoryKind =
  process.platform === 'darwin' ? 'physical footprint' : 'RSS';
export const sampleIntervalMs = 50;
export const steadyIdleMs = 5000;
export const steadyWindowMs = 2000;

export const median = (values: number[]): number => {
  if (!values.length) throw new Error('No samples collected');
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
};

export type MemorySample = {
  time: number;
  bytes: number;
  processes: { pid: number; bytes: number }[];
};

// Compile once, before any timed benchmark. No Node/V8 instrumentation or GC.
export async function createMemorySampler() {
  if (!['darwin', 'linux'].includes(process.platform)) {
    throw new Error('Memory benchmarks currently support macOS and Linux');
  }
  const directory = await mkdtemp(
    path.join(os.tmpdir(), 'build-tools-memory-'),
  );
  const binary = path.join(directory, 'footprint');
  try {
    if (process.platform === 'darwin') {
      await exec('cc', [
        '-O2',
        '-Wall',
        '-Wextra',
        path.join(import.meta.dirname, 'memory-footprint.c'),
        '-o',
        binary,
      ]);
    }
  } catch (error) {
    await rm(directory, { recursive: true, force: true });
    throw error;
  }

  async function snapshot(rootPid: number): Promise<MemorySample['processes']> {
    if (process.platform === 'darwin') {
      const { stdout } = await exec(binary, [String(rootPid)]);
      return JSON.parse(stdout);
    }
    // Linux fallback: sum RSS, including shared pages in each process. This is
    // intentionally labelled RSS and is not interchangeable with macOS footprint.
    const { stdout } = await exec('ps', ['-e', '-o', 'pid=,ppid=,pgid=,rss=']);
    const rows = stdout
      .trim()
      .split('\n')
      .map((line) => {
        const [pid, ppid, pgid, rss] = line.trim().split(/\s+/).map(Number);
        return { pid, ppid, pgid, bytes: rss * 1024 };
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
      .filter((row) => selected.has(row.pid))
      .map(({ pid, bytes }) => ({ pid, bytes }));
  }

  // Pay first-execution/OS validation costs before starting a measured command.
  await snapshot(process.pid);

  return {
    snapshot,
    close: () => rm(directory, { recursive: true, force: true }),
    start(rootPid: number) {
      const samples: MemorySample[] = [];
      let stopped = false;
      let failure: unknown;
      const loop = (async () => {
        while (!stopped) {
          const started = Date.now();
          const processes = await snapshot(rootPid);
          if (processes.length) {
            samples.push({
              time: Date.now(),
              bytes: processes.reduce((total, item) => total + item.bytes, 0),
              processes,
            });
          }
          if (!stopped)
            await sleep(Math.max(0, sampleIntervalMs - (Date.now() - started)));
        }
      })().catch((error) => {
        failure = error;
      });
      return {
        samples,
        async steady() {
          await sleep(steadyIdleMs);
          const start = Date.now();
          await sleep(steadyWindowMs);
          if (failure) throw failure;
          const window = samples.filter((sample) => sample.time >= start);
          if (window.length < 5)
            throw new Error('Insufficient steady-state memory samples');
          return {
            bytes: median(window.map((sample) => sample.bytes)),
            start,
            end: Date.now(),
          };
        },
        async stop() {
          stopped = true;
          await loop;
          if (failure) throw failure;
          return Math.max(...samples.map((sample) => sample.bytes), 0);
        },
      };
    },
  };
}
