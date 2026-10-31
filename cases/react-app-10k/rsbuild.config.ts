import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { port, browserslist, production, sourceMap } from './settings.mjs';
import postcss from './postcss-options.mjs';

export default defineConfig({
  plugins: [pluginReact()],
  source: { entry: { index: './src/index.tsx' } },
  html: { template: './index-template.html' },
  // Use Rspack's ordinary shared-chunk rules, without Rsbuild's vendor presets.
  splitChunks: { preset: 'none', chunks: 'async' },
  output: {
    target: 'web',
    overrideBrowserslist: browserslist,
    polyfill: 'off',
    sourceMap: { js: sourceMap ? 'source-map' : false, css: sourceMap },
    minify: production,
    dataUriLimit: 0,
    distPath: { root: 'dist' },
    assetPrefix: '/',
    cleanDistPath: true,
  },
  tools: {
    // Replace Rsbuild's defaults so all tools run exactly one Tailwind pass.
    postcss: () => ({
      postcssOptions: { ...postcss, config: false },
      sourceMap,
    }),
    htmlPlugin: { minify: false },
  },
  performance: { buildCache: true, printFileSize: false },
  server: { port, strictPort: true },
});
