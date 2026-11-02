import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginTailwindcss } from '@rsbuild/plugin-tailwindcss';
import { port, sourceMap } from './settings.mjs';

export default defineConfig({
  plugins: [pluginReact(), pluginTailwindcss({ optimize: false })],
  html: { template: './index-template.html' },
  // Use Rspack's ordinary shared-chunk rules, without Rsbuild's vendor presets.
  splitChunks: { preset: 'none', chunks: 'async' },
  output: {
    sourceMap: { js: sourceMap ? 'source-map' : false, css: sourceMap },
    dataUriLimit: 0,
  },
  tools: {
    htmlPlugin: { minify: false },
  },
  performance: { buildCache: true, printFileSize: false },
  server: { port, strictPort: true },
});
