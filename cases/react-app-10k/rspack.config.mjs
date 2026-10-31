import { rspack } from '@rspack/core';
import { ReactRefreshRspackPlugin } from '@rspack/plugin-react-refresh';
import { port, production, sourceMap, swcOptions } from './settings.mjs';
import postcss from './postcss-options.mjs';

export default {
  mode: production ? 'production' : 'development',
  target: ['web', 'browserslist:Chrome >= 111'],
  entry: './src/index.tsx',
  devtool: sourceMap ? 'source-map' : false,
  output: { path: `${import.meta.dirname}/dist`, publicPath: '/', clean: true },
  resolve: { extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'] },
  cache: { type: 'persistent' },
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
        type: 'css/auto',
        use: {
          loader: 'postcss-loader',
          options: { postcssOptions: { ...postcss, config: false }, sourceMap },
        },
      },
      { test: /\.svg$/, type: 'asset/resource' },
    ],
  },
  optimization: { minimize: production },
  plugins: [
    new rspack.HtmlRspackPlugin({
      template: './index-template.html',
      minify: false,
    }),
    !production && new ReactRefreshRspackPlugin(),
  ].filter(Boolean),
  devServer: { port, historyApiFallback: true, hot: true },
};
