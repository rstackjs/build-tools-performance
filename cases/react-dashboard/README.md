# React dashboard

A synthetic enterprise operations dashboard with 60 lazy routes across 8 business domains, CSS Modules, and 37 common libraries, including React, TanStack Router, Zod, and Recharts.

Run from the repository root:

```bash
CASE=react-dashboard pnpm benchmark
pnpm --filter react-dashboard start:vite
pnpm --filter react-dashboard typecheck
# Regenerate sources after manual edits or partial deletion
pnpm --filter react-dashboard generate --force
```

- The fixture generates over 24,000 reachable application modules before timing
  and memory sampling; dependencies, declarations, CSS, and assets are excluded
  from this count. Edit `workload.mjs` or `generate.mjs` to change its size.
  Repeated panels reuse a shared CSS Module; global CSS provides the reset and
  theme variables.
- Generated panels include domain-specific records, validation, filtering,
  statistics, budget utilization, review alerts, and activity details.
- Approvals, procurement, and releases include a state-machine-driven approval
  workflow. Reports and forecasts provide revenue distributions, CSV downloads,
  shareable filters, and report presets stored in IndexedDB. Audit and
  notifications show a session activity log. The shell and workspaces include
  bundled English/Chinese translations.
- Additional libraries are used by these features: D3 Array/Scale for analytics,
  XState for approvals, Dexie for presets, Headless UI for report tabs,
  i18next/react-i18next for translations, query-string for report links, and
  Nano ID/mitt for activity identifiers and notifications.
- Startup loads only the overview route and waits for its data; production builds
  include all routes. Data is deterministic and requires no backend. This is a
  client-rendered SPA, not an SSR/RSC benchmark.
- Rspack, Rsbuild, Vite, webpack, and Utoo share the source, Chrome 93 target,
  and CSS Modules styles; each tool handles CSS processing and production
  minification. Rspack and webpack use their built-in CSS Modules support.
  Development uses on-demand loading, source maps, and React/CSS HMR; production
  enables JS/CSS minification and tree shaking, disables source maps, and emits
  assets as files. Compiler, chunking, and cache implementations remain native.
- Each development session gets a fresh browser context. Cold/warm refers to
  build-tool caches; OS caches are not flushed. Bundle sizes reflect tree shaking,
  minification, and chunking together, rather than a per-library score.

See the [results](../../README.md#react-dashboard) and
[memory methodology](../../README.md#memory-methodology).
