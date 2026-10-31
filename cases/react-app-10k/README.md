# React application with 10k modules

A deterministic synthetic operations workspace using React 19, Tailwind CSS 4,
Zod 4, and TanStack Router. It models CRM, commerce, support, finance, and team
workspaces with lazy routes, shared navigation, URL-driven filtering, sorting, pagination, tables,
progress charts, activity lists, and validated forms. No backend, authentication
service, external fonts, or network data is required.

## Workload

- 40 business routes, each loading 25 panels through a literal dynamic import.
- Each panel has 10 runtime modules: four React components, a Zod schema,
  deterministic fixtures, selectors, formatting, labels, and trend calculations.
- 10,042 generated runtime modules plus 7 handwritten runtime modules:
  **10,049 reachable application modules**, excluding dependencies, declarations,
  CSS, and assets. Zod schemas parse the data actually rendered by the panels.
- All generated modules are reachable from the application entry, including
  lazy imports. The graph verifier rejects missing, unreferenced, or type-only
  filler modules. Bundlers may combine or remove modules during optimization;
  this count describes their input graph, not output chunks.
- The initial route loads 250 panel modules and its page, plus shared code and
  dependencies. Other routes stay lazy. Startup and memory therefore measure
  the overview route, **not all 10k modules loaded in the browser**. Production
  builds include all routes.

The architecture follows a client-rendered business SPA: feature-colocated TSX
and domain utilities, schema validation at route/form/data boundaries, shareable
URL state, shared UI, lazy routes, imported assets, and utility CSS. It does not
model SSR/RSC, authentication, backend latency, or a particular production app.
[Router search state](https://tanstack.com/router/latest/docs/guide/search-params)
and [Tailwind compatibility](https://tailwindcss.com/docs/compatibility) inform
the routing and browser-target choices.

The fixture is synthetic: its repeated domain patterns make the workload
reproducible, but do not reproduce the distribution of a particular real app.
It complements the existing generated React trees and dependency-heavy cases.

```text
src/
  app/                 # Router, root route, persistent application shell
  shared/              # Search schema, router-state hook, filter / saved-view form
  assets/              # Imported SVG
  styles.css           # Tailwind entry and explicit source scanning
  generated/
    routes.ts          # Code-based TanStack routes; no router build plugin
    navigation.ts
    customers/
      page.tsx
      summary/
        Panel.tsx, PanelHeader.tsx, Metric.tsx, Details.tsx
        schema.ts, data.ts, selectors.ts, format.ts, labels.ts, trend.ts
      pipeline/ ...
    orders/ ...
```

## Generation

Only the generator and its inputs are versioned; `src/generated/` is gitignored.
`benchmark-config.mjs` generates the workload **before** timed processes and
memory sampling start. Tool configurations also ensure it exists for direct
CLI use. A generator-content fingerprint avoids rewriting unchanged files,
including between cold/warm builds and HMR updates.

```bash
pnpm --filter react-app-10k generate
pnpm --filter react-app-10k verify
pnpm --filter react-app-10k verify:all
pnpm --filter react-app-10k typecheck

# Restore generated files after manual edits or partial deletion
pnpm --filter react-app-10k generate --force
```

To change the workload, edit `workload.mjs` or `generate.mjs`. Keep at least
10,000 reachable application runtime modules; the verifier enforces this.

## Configuration parity

| Setting               | Contract for every included tool                                             |
| --------------------- | ---------------------------------------------------------------------------- |
| Browser target        | Chrome 111 (Tailwind 4 baseline; older cases use Chrome 93)                  |
| Input                 | Same TS/TSX source, React automatic JSX runtime, no React Compiler           |
| Routing               | Same explicit TanStack route tree and dynamic import boundaries              |
| CSS                   | Same `@tailwindcss/postcss` version, options, source set, and CSS entry      |
| Tailwind optimization | Disabled inside PostCSS; production bundler minifies CSS                     |
| Development           | Lazy dynamic imports, source maps, React Fast Refresh, CSS HMR, SPA fallback |
| Production            | JS/CSS minification and tree shaking enabled; source maps disabled           |
| Dependencies          | Bundled, with no externalization or import rewriting                         |
| Assets                | Emitted files, no data URL inlining; public path `/`                         |
| Extra work            | No type checking, linting, PWA, analyzer, or compressed-size reporting       |

Native compiler, minifier, module runtime, chunk layout, and cache implementations
remain tool-specific, as in the existing benchmarks. Development explicitly uses
lazy dynamic-import compilation in Rspack, Rsbuild, webpack, and Utoo; Vite
serves modules on demand. Entries are not lazy in the bundler configurations.
All tools use the same initial URL, disabled route preloading, ready marker,
and root/leaf edits. Dependency scanning and prebundling can still differ, so
startup is not an equal-number-of-transformed-files test. Matching these settings
does not make the internal algorithms or output byte-identical. Rspack and
webpack use SWC for application TSX; Vite uses its normal React/Oxc pipeline.
Rsbuild's additional vendor chunk presets are disabled. Persistent caches are
enabled where supported and cleared by the runner for cold measurements.

## Run and validate

The default matrix includes **Rspack, Rsbuild, Vite, webpack, and Utoo**. All
pass both production and development checks. Parcel 2.16.4 was tried with this
workload and failed during production scope hoisting (`@parcel/packager-js: Asset was skipped or not found`), so it is
excluded without turning off scope hoisting.

Farm, standalone Rollup, Rolldown, esbuild, and the existing Bun adapter are not
included in this full dev/build matrix. Their adapters have not been implemented
and validated against the complete contract above (including the browser target,
React Fast Refresh, and shared PostCSS pipeline). This does not imply that these
tools cannot bundle the application's JavaScript.

From the repository root:

```bash
CASE=react-app-10k pnpm benchmark
CASE=react-app-10k TOOLS=rspack,rsbuild,vite,webpack,utoo pnpm benchmark
pnpm --filter react-app-10k start:vite
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
Its HMR metrics edit `app/Shell.tsx` and the overview summary's `Metric.tsx`.
The CSS HMR checks above validate compatibility; they are not a new timed metric.

No benchmark results are published for this case until a full CI measurement.
