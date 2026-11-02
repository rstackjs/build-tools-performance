import { ensureGenerated } from './generate.mjs';

ensureGenerated();
export const port = Number(process.env.REACT_APP_PORT ?? 18080);
export const production = process.env.NODE_ENV === 'production';
export const browserTarget = 'chrome111';
export const browserslist = ['Chrome >= 111'];
export const sourceMap = !production;
export const swcOptions = {
  env: { targets: { chrome: '111' } },
  jsc: {
    parser: { syntax: 'typescript', tsx: true },
    transform: {
      react: {
        runtime: 'automatic',
        development: !production,
        refresh: !production,
      },
    },
  },
};
