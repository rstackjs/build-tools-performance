import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { targetVite } from '../../shared/constants.mjs';
import { port } from './settings.mjs';

export default defineConfig({
  plugins: [react(), tailwindcss({ optimize: false })],
  css: { devSourcemap: true },
  build: {
    target: targetVite,
    assetsInlineLimit: 0,
    reportCompressedSize: false,
  },
  server: { port, strictPort: true },
});
