import { createBrowserUtooConfig } from '../../shared/utoopack.config.mjs';
import { browserslist } from './settings.mjs';

export default createBrowserUtooConfig({
  entry: './src/index.tsx',
  htmlTemplate: './index-template.html',
  target: browserslist[0],
  module: {
    rules: {
      '*.svg': { type: 'asset' },
      '*.css': {
        type: 'css',
        loaders: [
          { loader: '@tailwindcss/webpack', options: { optimize: false } },
        ],
      },
    },
  },
  images: { inlineLimit: 0 },
  output: { publicPath: '/' },
});
