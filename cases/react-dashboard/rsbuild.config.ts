import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { port, browserslist, sourceMap } from './settings.mjs';

export default defineConfig({
  plugins: [pluginReact()],
  html: { template: './index-template.html' },
  // Use Rspack's ordinary shared-chunk rules, without Rsbuild's vendor presets.
  splitChunks: { preset: 'none', chunks: 'async' },
  output: {
    overrideBrowserslist: browserslist,
    sourceMap: { js: sourceMap ? 'source-map' : false, css: sourceMap },
    dataUriLimit: 0,
  },
  tools: {
    htmlPlugin: { minify: false },
  },
  performance: { buildCache: true, printFileSize: false },
  server: { port, strictPort: true },
});
