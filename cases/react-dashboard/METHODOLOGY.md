# Benchmark methodology

## Generation

Only the generator and its inputs are versioned; `src/generated/` is gitignored.
`benchmark-config.mjs` generates the workload **before** timed processes and
memory sampling start. Tool configurations also ensure it exists for direct
CLI use. A generator-content fingerprint avoids rewriting unchanged files,
including between cold/warm builds and HMR updates.

```bash
pnpm --filter react-dashboard generate
pnpm --filter react-dashboard verify
pnpm --filter react-dashboard verify:all
pnpm --filter react-dashboard typecheck

# Restore generated files after manual edits or partial deletion
pnpm --filter react-dashboard generate --force
```

To change the workload, edit `workload.mjs` or `generate.mjs`. Keep at least
10,000 reachable application runtime modules; the verifier enforces this.

## Configuration parity

Rspack and webpack extend the repository's shared configurations, as the other
cases do. Tailwind uses dedicated integrations instead of `@tailwindcss/postcss`:

| Tool             | Tailwind integration                                                                                                   |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Rsbuild          | [`@rsbuild/plugin-tailwindcss`](https://rsbuild.rs/plugins/list/plugin-tailwindcss)                                    |
| Vite             | [`@tailwindcss/vite`](https://tailwindcss.com/docs/installation/using-vite)                                            |
| Rspack / webpack | [`@tailwindcss/webpack`](https://github.com/tailwindlabs/tailwindcss/tree/main/packages/%40tailwindcss-webpack) loader |
| Utoo             | `@tailwindcss/webpack` through its webpack-loader compatibility layer                                                  |

All integrations resolve Tailwind CSS 4.3.3 and scan the explicit `@source`
directives in the same CSS entry. `optimize: false` skips Tailwind's additional
Lightning CSS pass; production CSS minification remains enabled in each build
tool. No global PostCSS configuration is present, avoiding duplicate Tailwind
processing. Defaults are only overridden where needed for the contract below.

| Setting               | Contract for every included tool                                             |
| --------------------- | ---------------------------------------------------------------------------- |
| Browser target        | Chrome 111 (Tailwind 4 baseline; older cases use Chrome 93)                  |
| Input                 | Same TS/TSX source, React automatic JSX runtime, no React Compiler           |
| Routing               | Same explicit TanStack route tree and dynamic import boundaries              |
| CSS                   | Same Tailwind version, source set, and CSS entry; dedicated integrations     |
| Tailwind optimization | Disabled in each Tailwind integration; production bundler minifies CSS       |
| Development           | Lazy dynamic imports, source maps, React Fast Refresh, CSS HMR, SPA fallback |
| Production            | JS/CSS minification and tree shaking enabled; source maps disabled           |
| Dependencies          | Bundled, with no externalization or import rewriting                         |
| Assets                | Emitted files, no data URL inlining; public path `/`                         |
| Extra work            | No type checking, linting, PWA, analyzer, or compressed-size reporting       |

Native compiler, minifier, module runtime, chunk layout, and cache implementations
remain tool-specific, as in the existing benchmarks. Development uses
lazy dynamic-import compilation in Rspack, Rsbuild, webpack, and Utoo; Vite
serves modules on demand. Entries are not lazy in the bundler configurations.
All tools use the same initial URL, disabled route preloading, ready marker,
and root/leaf edits. Dependency scanning and prebundling can still differ, so
startup is not an equal-number-of-transformed-files test. Matching these settings
does not make the internal algorithms or output byte-identical. Rspack and
webpack use SWC for application TSX; Vite uses its normal React/Oxc pipeline.
Rsbuild's additional vendor chunk presets are disabled. Persistent caches are
enabled where supported and cleared by the runner for cold measurements. Each
development session uses a fresh browser context, so HTTP cache, cookies, storage,
and service workers cannot leak between tools or cold/warm sessions. OS caches
are not flushed; warm measurements retain only the tool cache.

## Run and validate

The default matrix includes **Rspack, Rsbuild, Vite, webpack, and Utoo**. All
pass both production and development checks. Parcel 2.16.4 was tried with the earlier version of this
fixture and failed during production scope hoisting (`@parcel/packager-js: Asset was skipped or not found`), so it is
excluded without turning off scope hoisting.

Farm, standalone Rollup, Rolldown, esbuild, and the existing Bun adapter are not
included in this full dev/build matrix. Their adapters have not been implemented
and validated against the complete contract above (including the browser target,
React Fast Refresh, and equivalent Tailwind processing). This does not imply that these
tools cannot bundle the application's JavaScript.

From the repository root:

```bash
CASE=react-dashboard pnpm benchmark
CASE=react-dashboard TOOLS=rspack,rsbuild,vite,webpack,utoo pnpm benchmark
pnpm --filter react-dashboard start:vite
```

From this case directory, validate each included tool before changing the matrix:

```bash
node verify.mjs --tool vite
node verify.mjs --tool vite --dev
```

`verify:all` runs both modes for every included tool and compares hashes of all
40 routes' rendered content and baseline computed styles. CI runs this check and
type checking before benchmark measurements; the runner then clears tool caches.

The production check builds and serves the output, navigates every route, checks
25 panels per route, exercises filtering and invalid/valid Zod form submissions,
checks URL-state persistence, sorting, pagination, active-only filtering,
computed Tailwind styles and the SVG, and tests a direct nested URL.
It also rejects production source maps and browser exceptions.

Development servers use port 18080 by default. Set `REACT_APP_PORT` to override
it for both the runner and tool configurations. The development verifier selects
an available port automatically. Utoo uses a small wrapper around its public
`serve()` API because version 1.5.34 of its CLI hardcodes port 3000; the wrapper
prints the same startup timestamp before loading the tool and configuration.

The development check additionally edits root/leaf components while checking
that React state and the document survive, adds a previously absent Tailwind
class, and edits CSS. Files and child processes are restored/closed afterward.
Run these checks sequentially: builds share `dist/`, and HMR checks edit sources.

The benchmark waits for the overview page's `data-benchmark-ready` marker,
rather than counting the shell or a loading placeholder as a loaded page.
The ready selector also waits for the overview account query to resolve.
Its HMR metrics edit `app/Shell.tsx` and the overview summary's `Metric.tsx`.
The CSS HMR checks above validate compatibility; they are not a new timed metric.

## Workload and tree shaking

The generator creates 40 lazy business routes with 25 panels each, and ten runtime
modules per panel. Handwritten application code provides shared navigation,
forms, preferences, and an overview dashboard. The graph verifier enforces at
least 10,000 reachable application modules, excluding dependencies, declarations,
CSS, and assets, and checks that every declared runtime dependency is imported.
Startup loads only the overview route; production builds include all routes.

Lucide, date-fns, lodash-es, Recharts, and TanStack Table use selected exports
from their public package entries. Table registers only the features it uses.
No tool-specific import rewriting or dependency externalization is configured.
Unused library exports remain available for the bundlers to eliminate. Output
and gzip sizes measure the combined result of tree shaking, minification, and
chunking; they are not an isolated per-library tree-shaking score.

TanStack Query loads fixed account fixtures through an Axios in-process adapter;
there is no backend or external network dependency. Recharts animations are
turned off. CI also checks the chart, virtualized account table, Markdown/GFM,
command search, pinned state, and action notifications. Account content is
included in the cross-tool parity checks, and startup waits for its data.

This is a reproducible synthetic client-rendered SPA, with repeated domain
patterns. It does not model SSR/RSC or the dependency distribution of a specific
production application.
