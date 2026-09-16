// @ts-check
import { isProd, targetBrowser } from './constants.mjs';

const defaultExtensions = ['.ts', '.tsx', '.js', '.jsx'];

/**
 * @param {Record<string, any>} config
 */
export const createUtooConfig = (config) => {
  const { output, resolve, optimization, ...rest } = config;

  return {
    mode: isProd ? 'production' : 'development',
    sourceMaps: !isProd,
    tracing: false,
    persistentCaching: true,
    stats: false,
    ...rest,
    output: {
      path: 'dist',
      clean: true,
      ...output,
    },
    resolve: {
      extensions: defaultExtensions,
      ...resolve,
    },
    optimization: {
      minify: isProd,
      concatenateModules: isProd,
      removeUnusedExports: isProd,
      removeUnusedImports: isProd,
      ...optimization,
    },
  };
};

/**
 * @param {{ entry: string, htmlTemplate?: string, react?: boolean } & Record<string, any>} config
 */
export const createBrowserUtooConfig = ({
  entry,
  htmlTemplate = './index-rspack.html',
  ...config
}) =>
  createUtooConfig({
    target: targetBrowser,
    entry: [
      {
        import: entry,
        html: {
          template: htmlTemplate,
        },
      },
    ],
    devServer: {
      port: 3000,
      hot: true,
      dynamicHmrChunkLists: true,
      lazyDynamicImports: true,
    },
    ...config,
  });
