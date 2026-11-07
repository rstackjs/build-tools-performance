// Configuration guide: https://rstack.rs/config
import { define } from 'rstack';

// Harness-only. Case apps stay on their own bundler CLIs so benchmark subjects
// are not rewritten through Rstack CLI.
define.fmt({
  singleQuote: true,
  ignorePatterns: ['cases/**', 'shared/**', 'results/**'],
});

define.test({
  include: ['scripts/**/*.test.ts'],
  testEnvironment: 'node',
  testTimeout: 20_000,
});
