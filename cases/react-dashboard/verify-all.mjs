import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { config } from './benchmark-config.mjs';

// Validation runs outside benchmark measurements. Run sequentially because the
// tools share dist/ and the HMR checks temporarily edit application sources.
const directory = mkdtempSync(path.join(tmpdir(), 'react-app-parity-'));
let baseline;
try {
  for (const tool of config.supportedTools) {
    for (const mode of ['production', 'development']) {
      const report = path.join(directory, `${tool}-${mode}.json`);
      const result = spawnSync(
        process.execPath,
        [
          'verify.mjs',
          '--tool',
          tool,
          '--report',
          report,
          ...(mode === 'development' ? ['--dev'] : []),
        ],
        { cwd: import.meta.dirname, stdio: 'inherit' },
      );
      assert.equal(result.status, 0, `${tool} ${mode} verification failed`);
      const actual = JSON.parse(readFileSync(report, 'utf8'));
      baseline ??= actual;
      assert.deepEqual(
        actual,
        baseline,
        `${tool} ${mode} changed application content or styles`,
      );
    }
  }
  console.log(
    'All tools and modes render identical route content and baseline styles.',
  );
} finally {
  rmSync(directory, { recursive: true, force: true });
}
