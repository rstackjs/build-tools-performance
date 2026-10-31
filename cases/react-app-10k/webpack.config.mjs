import HtmlWebpackPlugin from 'html-webpack-plugin';
import MinimizerPlugin from 'minimizer-webpack-plugin';
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';
import { port, production, sourceMap, swcOptions } from './settings.mjs';
import postcss from './postcss-options.mjs';

export default {
  mode: production ? 'production' : 'development',
  target: ['web', 'browserslist:Chrome >= 111'],
  entry: './src/index.tsx',
  devtool: sourceMap ? 'source-map' : false,
  output: { path: `${import.meta.dirname}/dist`, publicPath: '/', clean: true },
  resolve: { extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'] },
  cache: {
    type: 'filesystem',
    name: `react-app-10k-${production ? 'prod' : 'dev'}`,
  },
  experiments: {
    css: true,
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
        use: {
          loader: 'postcss-loader',
          options: { postcssOptions: { ...postcss, config: false }, sourceMap },
        },
      },
      { test: /\.svg$/, type: 'asset/resource' },
    ],
  },
  optimization: {
    minimize: production ? { javascript: false, html: false } : false,
    minimizer: [
      new MinimizerPlugin({ minify: MinimizerPlugin.swcMinify }),
      '...',
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({ template: './index-template.html', minify: false }),
    !production && new ReactRefreshWebpackPlugin(),
  ].filter(Boolean),
  devServer: { port, historyApiFallback: true, hot: true },
};
