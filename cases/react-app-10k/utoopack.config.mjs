import { createBrowserUtooConfig } from '../../shared/utoopack.config.mjs';
import { browserslist } from './settings.mjs';

export default createBrowserUtooConfig({
  entry: './src/index.tsx',
  htmlTemplate: './index-template.html',
  target: browserslist[0],
  devServer: {
    hot: true,
    dynamicHmrChunkLists: true,
    lazyDynamicImports: true,
  },
  module: { rules: { '*.svg': { type: 'asset' } } },
  images: { inlineLimit: 0 },
  output: { publicPath: '/' },
});
