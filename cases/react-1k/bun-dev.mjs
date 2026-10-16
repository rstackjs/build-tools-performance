import { spawn } from 'node:child_process';

// Printed before the Bun process starts so the harness can measure startup.
console.log('Benchmark Start Time:', Date.now());

// Keep in sync with the Bun BuildTool port in scripts/benchmark.ts.
const port = '3000';
const child = spawn('bun', ['--port', port, './index.html'], {
  stdio: 'inherit',
  cwd: import.meta.dirname,
  env: process.env,
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    child.kill(signal);
  });
}
