import { build } from 'esbuild';
import { isProd, targetVite } from './constants.mjs';

export default async (config) => {
  const startTime = Date.now();

  await build({
    outdir: 'dist',
    format: 'esm',
    target: targetVite,
    bundle: true,
    define: {
      'process.env.NODE_ENV': JSON.stringify(
        isProd ? 'production' : 'development',
      ),
    },
    minify: isProd,
    ...config,
  });

  const endTime = Date.now() - startTime;
  console.log(`esbuild built in ${endTime} ms`);
};
