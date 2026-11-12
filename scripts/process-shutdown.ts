import type { ChildProcess } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import { RetryableError } from './benchmark-utils.ts';

type ShutdownOptions = {
  snapshot: (rootPid: number) => Promise<{ pid: number }[]>;
  timeoutMs: number;
  // Signal only the tool process; it owns its workers and cache flush.
  gracefulRoot?: boolean;
};

export async function stopProcessTree(
  child: ChildProcess,
  { snapshot, timeoutMs, gracefulRoot = false }: ShutdownOptions,
): Promise<void> {
  const rootPid = child.pid;
  if (!rootPid) return;

  const signalPid = (pid: number, signal: NodeJS.Signals) => {
    try {
      process.kill(pid, signal);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ESRCH') throw error;
    }
  };
  const signalTree = async (signal: NodeJS.Signals) => {
    const processes = await snapshot(rootPid);
    for (const { pid } of processes.reverse()) signalPid(pid, signal);
  };
  const waitForExit = async (timeout: number) => {
    const deadline = Date.now() + timeout;
    do {
      if (!(await snapshot(rootPid)).length) return true;
      await sleep(50);
    } while (Date.now() < deadline);
    return false;
  };

  let onExit: (() => void) | undefined;
  const exited = new Promise<void>((resolve) => {
    if (child.exitCode !== null || child.signalCode !== null) resolve();
    else {
      onExit = () => resolve();
      child.once('exit', onExit);
    }
  });
  try {
    if (gracefulRoot) {
      if (child.exitCode === null && child.signalCode === null)
        signalPid(rootPid, 'SIGTERM');
    } else {
      await signalTree('SIGTERM');
    }
    if (await waitForExit(timeoutMs)) {
      if (gracefulRoot) {
        await exited;
        if (child.exitCode !== 0) {
          throw new RetryableError(
            `Command ${rootPid} did not exit gracefully: code=${child.exitCode}, signal=${child.signalCode}`,
          );
        }
      }
      return;
    }

    await signalTree('SIGKILL');
    if (!(await waitForExit(5000)))
      throw new Error(`Command ${rootPid} survived SIGKILL`);
    // A forced exit may have interrupted cache persistence: discard the pair.
    throw new RetryableError(`Command ${rootPid} required SIGKILL`);
  } finally {
    if (onExit) child.off('exit', onExit);
  }
}
