// Importing settings generates sources before startup/build timing and memory sampling.
import { port } from './settings.mjs';

export const config = {
  port,
  supportedTools: ['rspack', 'rsbuild', 'vite', 'webpack', 'utoo'],
  rootFile: 'app/Shell.tsx',
  leafFile: 'generated/overview/summary/Metric.tsx',
  readySelector: '[data-benchmark-ready="true"]',
};
