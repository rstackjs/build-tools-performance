# React dashboard

A synthetic enterprise operations dashboard with 40 lazy routes and 29 common libraries, including React, Tailwind CSS, TanStack Router, Zod, and Recharts.

Run from the repository root:

```bash
CASE=react-dashboard pnpm benchmark
pnpm --filter react-dashboard start:vite
pnpm --filter react-dashboard typecheck
pnpm --filter react-dashboard verify:all
# Regenerate sources after manual edits or partial deletion
pnpm --filter react-dashboard generate --force
```

- The fixture generates over 10,000 reachable application modules before timing
  and memory sampling; dependencies, declarations, CSS, and assets are excluded
  from this count. Edit `workload.mjs` or `generate.mjs` to change its size.
- Startup loads only the overview route and waits for its data; production builds
  include all routes. Data is deterministic and requires no backend. This is a
  client-rendered SPA, not an SSR/RSC benchmark.
- Rspack, Rsbuild, Vite, webpack, and Utoo share the source, Chrome 93 target,
  Tailwind version, and CSS scan scope, using dedicated Tailwind integrations
  with `optimize: false`; each bundler handles production CSS minification.
  Development uses on-demand loading, source maps, and React/CSS HMR; production
  enables JS/CSS minification and tree shaking, disables source maps, and emits
  assets as files. Compiler, chunking, and cache implementations remain native.
- CI checks all routes' content and styles, business interactions, and
  state-preserving HMR before measuring. Run verification sequentially because
  tools share `dist/` and HMR checks temporarily edit source files. CSS HMR is
  verified but not separately timed.
- Each development session gets a fresh browser context. Cold/warm refers to
  build-tool caches; OS caches are not flushed. Bundle sizes reflect tree shaking,
  minification, and chunking together, rather than a per-library score.

See the [results](../../README.md#react-dashboard) and
[memory methodology](../../README.md#memory-methodology).
