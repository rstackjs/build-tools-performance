import { createBrowserUtooConfig } from '../../shared/utoopack.config.mjs';
import './settings.mjs';

export default createBrowserUtooConfig({
  entry: './src/index.tsx',
  htmlTemplate: './index-template.html',
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
