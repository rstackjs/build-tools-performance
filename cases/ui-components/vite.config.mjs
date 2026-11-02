// @ts-check
import { defineConfig } from 'vite';
import { targetVite } from '../../shared/constants.mjs';

export default defineConfig({
  build: {
    target: targetVite,
  },
});
