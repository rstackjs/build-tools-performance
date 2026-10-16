import { spawn } from 'node:child_process';

// Printed before the Bun process starts so the harness can measure build time.
console.log('Benchmark Start Time:', Date.now());

const child = spawn(
  'bun',
  [
    'build',
    './index.html',
    '--outdir=dist',
    '--target=browser',
    '--minify',
    '--production',
    '--define',
    'process.env.NODE_ENV:"production"',
  ],
  {
    stdio: 'inherit',
    cwd: import.meta.dirname,
    env: {
      ...process.env,
      NODE_ENV: 'production',
    },
  },
);

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
