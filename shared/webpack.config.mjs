// @ts-check
import MinimizerPlugin from 'minimizer-webpack-plugin';
import { isProd, targetBrowser } from './constants.mjs';

export default {
  devtool: isProd ? false : undefined,
  target: ['web', `browserslist:${targetBrowser}`],
  resolve: {
    extensions: ['...', '.tsx', '.ts', '.jsx'],
  },
  cache: {
    type: 'filesystem',
    name: `webpack-web-${isProd ? 'prod' : 'dev'}`,
  },
  optimization: {
    minimize: isProd ? { javascript: false } : false,
    minimizer: [
      new MinimizerPlugin({ minify: MinimizerPlugin.swcMinify }),
      '...',
    ],
  },
  experiments: {
    css: true,
    html: true,
  },
};
