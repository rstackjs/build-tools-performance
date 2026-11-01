// Use the same PostCSS plugin in every tool, without Tailwind's additional
// minification pass. The bundlers perform production CSS minification.
export default {
  plugins: {
    '@tailwindcss/postcss': { base: import.meta.dirname, optimize: false },
  },
};
