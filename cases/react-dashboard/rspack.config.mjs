import { rspack } from '@rspack/core';
import { ReactRefreshRspackPlugin } from '@rspack/plugin-react-refresh';
import { port, production, sourceMap, swcOptions } from './settings.mjs';

export default {
  extends: '../../shared/rspack.config.mjs',
  target: ['web', 'browserslist:Chrome >= 111'],
  entry: './src/index.tsx',
  devtool: sourceMap ? 'source-map' : false,
  output: { publicPath: '/', clean: true },
  lazyCompilation: production ? false : { entries: false, imports: true },
  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        exclude: /node_modules/,
        use: { loader: 'builtin:swc-loader', options: swcOptions },
      },
      { test: /\.css$/, use: 'postcss-loader' },
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
