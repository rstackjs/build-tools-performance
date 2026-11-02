// The CLI hardcodes port 3000. Use the same public server API with our case port.
console.log('Benchmark Start Time:', Date.now());
const { serve } = await import('@utoo/pack');
const { default: config } = await import('./utoopack.config.mjs');
const { port } = await import('./settings.mjs');
const { tracing, ...compilerConfig } = config;
await serve(
  { config: compilerConfig, tracing },
  import.meta.dirname,
  undefined,
  {
    port,
    logServerInfo: true,
    historyApiFallback: true,
  },
);
