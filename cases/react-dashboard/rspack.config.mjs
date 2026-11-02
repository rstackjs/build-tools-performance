import { rspack } from '@rspack/core';
import { ReactRefreshRspackPlugin } from '@rspack/plugin-react-refresh';
import { port, production, sourceMap, swcOptions } from './settings.mjs';

export default {
  extends: '../../shared/rspack.config.mjs',
  entry: './src/index.tsx',
  devtool: sourceMap ? 'source-map' : false,
  output: { publicPath: '/', clean: production },
  lazyCompilation: production ? false : { entries: false, imports: true },
  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        exclude: /node_modules/,
        use: { loader: 'builtin:swc-loader', options: swcOptions },
      },
      {
        test: /\.css$/,
        use: { loader: '@tailwindcss/webpack', options: { optimize: false } },
      },
      { test: /\.svg$/, type: 'asset/resource' },
    ],
  },
  plugins: [
    new rspack.HtmlRspackPlugin({
      template: './index-template.html',
      minify: false,
    }),
    !production && new ReactRefreshRspackPlugin(),
  ].filter(Boolean),
  devServer: { port, historyApiFallback: true },
};
