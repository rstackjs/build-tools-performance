import tailwindcss from '@tailwindcss/postcss';
import config from './postcss.config.mjs';

// Inline PostCSS APIs expect plugin instances; config-file loaders accept names.
// Both adapters use the same options from postcss.config.mjs.
export default {
  plugins: [tailwindcss(config.plugins['@tailwindcss/postcss'])],
};
