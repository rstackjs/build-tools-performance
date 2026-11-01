import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { port, browserTarget } from './settings.mjs';

export default defineConfig({
  plugins: [react()],
  css: { devSourcemap: true },
  build: {
    target: browserTarget,
    assetsInlineLimit: 0,
    reportCompressedSize: false,
  },
  server: { port, strictPort: true },
});
