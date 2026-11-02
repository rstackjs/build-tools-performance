// @ts-check
import { defineConfig } from 'rolldown';
import { isProd, targetVite } from './constants.mjs';

export default defineConfig({
  transform: {
    target: targetVite,
    define: {
      'process.env.NODE_ENV': JSON.stringify(
        isProd ? 'production' : 'development',
      ),
    },
  },
  output: {
    minify: isProd,
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
});
