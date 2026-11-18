import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createRequire } from 'node:module';
import { targetVite } from '../../shared/constants.mjs';
import { port } from './settings.mjs';

const { dependencies } = createRequire(import.meta.url)('./package.json');

export default defineConfig({
  plugins: [react()],
  // Prebundle lazy-route dependencies up front to avoid navigation reloads.
  optimizeDeps: {
    include: [
      ...Object.keys(dependencies).map((name) =>
        name === '@hookform/resolvers' ? `${name}/zod` : name,
      ),
      'react-dom/client',
    ],
  },
  css: { devSourcemap: true },
  build: {
    target: targetVite,
    assetsInlineLimit: 0,
    reportCompressedSize: false,
  },
  server: { port, strictPort: true },
});
