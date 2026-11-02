import HtmlWebpackPlugin from 'html-webpack-plugin';
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';
import { port, production, sourceMap, swcOptions } from './settings.mjs';

export default {
  extends: '../../shared/webpack.config.mjs',
  entry: './src/index.tsx',
  devtool: sourceMap ? 'source-map' : false,
  output: { publicPath: '/', clean: true },
  experiments: {
    html: false,
    lazyCompilation: production ? false : { entries: false, imports: true },
  },
  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        exclude: /node_modules/,
        use: { loader: 'swc-loader', options: swcOptions },
      },
      {
        test: /\.css$/,
        type: 'css/auto',
        use: { loader: '@tailwindcss/webpack', options: { optimize: false } },
      },
      { test: /\.svg$/, type: 'asset/resource' },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({ template: './index-template.html', minify: false }),
    !production && new ReactRefreshWebpackPlugin(),
  ].filter(Boolean),
  devServer: { port, historyApiFallback: true },
};
