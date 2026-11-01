import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { port, browserTarget, sourceMap } from './settings.mjs';
import postcss from './postcss-options.mjs';

export default defineConfig({
  plugins: [react()],
  base: '/',
  css: { postcss, devSourcemap: sourceMap },
  build: {
    target: browserTarget,
    sourcemap: sourceMap,
    minify: 'oxc',
    cssMinify: 'lightningcss',
    cssTarget: browserTarget,
    assetsInlineLimit: 0,
    reportCompressedSize: false,
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: { port, strictPort: true },
});
