// @ts-check
import { defineConfig } from '@farmfe/core';
import { isProd, target, targetBrowser } from '../../shared/constants.mjs';

export default defineConfig({
  compilation: {
    sourcemap: !isProd,
    presetEnv: { options: { targets: targetBrowser } },
    script: { target },
    css: { prefixer: { targets: targetBrowser } },
  },
  plugins: ['@farmfe/plugin-react'],
});
