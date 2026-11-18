import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { targetVite } from '../../shared/constants.mjs';
import { port } from './settings.mjs';

export default defineConfig({
  plugins: [react()],
  css: { devSourcemap: true },
  build: {
    target: targetVite,
    assetsInlineLimit: 0,
    reportCompressedSize: false,
  },
  server: { port, strictPort: true },
});
