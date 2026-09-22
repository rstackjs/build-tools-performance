import type { ChildProcess } from 'node:child_process';

export class RetryableError extends Error {}

export function monitorProcess(child: ChildProcess) {
  const output = { stdout: '', stderr: '' };
  for (const stream of ['stdout', 'stderr'] as const) {
    child[stream]?.on('data', (data: Buffer) => {
      output[stream] = (output[stream] + data.toString()).slice(-65536);
    });
  }
  const exited = new Promise<{
    code: number | null;
    signal: NodeJS.Signals | null;
    error?: string;
  }>((resolve) => {
    child.once('error', (error) =>
      resolve({ code: null, signal: null, error: error.message }),
    );
    child.once('exit', (code, signal) => resolve({ code, signal }));
  });
  return { output, exited };
}

// The caller owns process/page cleanup; the signal releases phase listeners.
export async function runPhase<T>(
  name: string,
  timeoutMs: number,
  operation: (signal: AbortSignal) => Promise<T>,
  failure?: Promise<never>,
): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () =>
        reject(new RetryableError(`${name} timed out after ${timeoutMs}ms`)),
      timeoutMs,
    );
  });
  try {
    return await Promise.race([
      operation(controller.signal),
      timeout,
      ...(failure ? [failure] : []),
    ]);
  } finally {
    clearTimeout(timer!);
    controller.abort();
  }
}

// Each attempt must restore its resources before resolving or rejecting.
export async function runWithRetry<T>(
  operation: (attempt: number) => Promise<T>,
  onFailure: (error: unknown, attempt: number, willRetry: boolean) => void,
): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await operation(attempt);
    } catch (error) {
      const willRetry = attempt < 2 && error instanceof RetryableError;
      onFailure(error, attempt, willRetry);
      if (!willRetry) throw error;
    }
  }
}
