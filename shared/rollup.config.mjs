// @ts-check
import path from 'node:path';
import commonjs from '@rollup/plugin-commonjs';
import html from '@rollup/plugin-html';
import json from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import postcss from 'rollup-plugin-postcss';
import postcssUrl from 'postcss-url';
import { minify, swc } from 'rollup-plugin-swc3';
import { isProd, target, targetBrowser } from './constants.mjs';

const extensions = ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json'];

export default {
  // Keep Rollup well below the file-descriptor limit on GitHub macOS runners.
  maxParallelFileOps: 8,
  onwarn(warning, warn) {
    if (
      warning.code === 'MODULE_LEVEL_DIRECTIVE' ||
      warning.code === 'THIS_IS_UNDEFINED'
    ) {
      return;
    }
    warn(warning);
  },
  output: {
    dir: 'dist',
    format: 'es',
    sourcemap: false,
    entryFileNames: 'assets/[name]-[hash].js',
    chunkFileNames: 'assets/[name]-[hash].js',
    assetFileNames: 'assets/[name]-[hash][extname]',
  },
  plugins: [
    replace({
      preventAssignment: true,
      'process.env.NODE_ENV': JSON.stringify(
        isProd ? 'production' : 'development',
      ),
    }),
    nodeResolve({
      browser: true,
      preferBuiltins: false,
      extensions,
      mainFields: ['browser', 'module', 'main'],
      exportConditions: ['browser', 'import', 'default'],
    }),
    commonjs({
      transformMixedEsModules: true,
    }),
    json(),
    postcss({
      config: false,
      inject: false,
      extract: path.resolve('dist/assets/styles.css'),
      minimize: isProd,
      extensions: ['.css', '.less', '.scss', '.sass'],
      plugins: [
        postcssUrl({
          url: 'copy',
          assetsPath: 'assets',
          useHash: true,
        }),
      ],
    }),
    swc({
      tsconfig: false,
      include: /\.[mc]?[jt]sx?$/,
      exclude: [],
      env: { targets: targetBrowser },
      module: {
        type: 'es6',
      },
      sourceMaps: false,
    }),
    isProd &&
      minify({
        module: true,
        compress: true,
        mangle: true,
        ecma: Number(target.slice(2)),
      }),
    html({ fileName: 'index.html' }),
  ],
};
