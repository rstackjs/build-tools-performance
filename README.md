# Build Tools Comparison

Benchmark comparing JavaScript bundlers and build tools ([Rspack](https://github.com/web-infra-dev/rspack), [Rsbuild](https://github.com/web-infra-dev/rsbuild), [webpack](https://github.com/webpack/webpack), [Vite](https://github.com/vitejs/vite), [Rolldown](https://github.com/rolldown/rolldown), [esbuild](https://github.com/evanw/esbuild), [Rollup](https://github.com/rollup/rollup), [Parcel](https://github.com/parcel-bundler/parcel), [Farm](https://github.com/farm-fe/farm), [Utoo](https://github.com/utooland/utoo) and [Bun](https://bun.com)) for dev server startup time, build performance and bundle size for applications with different module sizes.

## Metrics

| Name                     | Description                                                                            |
| ------------------------ | -------------------------------------------------------------------------------------- |
| **Startup (no cache)**   | Time from starting the dev server to page loaded                                       |
| **Startup (with cache)** | Time from starting the dev server to page loaded with cache                            |
| **HMR**                  | Time to HMR after changing a module                                                    |
| **Build (no cache)**     | Time taken to build the production bundles                                             |
| **Build (with cache)**   | Time taken to build the production bundles with cache                                  |
| **Memory steady**        | Dev server memory after 10 HMR updates and a fixed idle window, with and without cache |
| **Memory peak**          | Sampled peak memory during dev or a production build, with and without cache           |
| **Output size**          | Total size of the output bundle, minified with the default minifier                    |
| **Gzipped size**         | Gzipped size of the output bundle, represents actual network transfer size             |

## Notes

- Browser targets are aligned within each case: `Chrome >= 111` for
  `react-app-10k` (Tailwind CSS 4), and `es2022` / `Chrome >= 93` for older cases.
- Minification is enabled in production for all tools.
- Source map is enabled in development and disabled in production for all tools.
- Benchmarks run on GitHub Actions with variable hardware, which may cause inconsistent results.

Tooling details:

- webpack is configured to use SWC instead of Babel / Terser.
- Vite uses Rolldown and Oxc.

## Results

> Data from [GitHub Actions](https://github.com/rstackjs/build-tools-performance/actions/runs/40882896569) (2026-10-29, commit `2361c7c3`). Values are medians of three measured runs; timing includes two warmups, while memory skips warmups. Memory is process-tree physical footprint in MiB. See [memory methodology](#memory-methodology).

---

### react-app-10k

A synthetic operations workspace using React 19, Tailwind CSS 4, Zod 4, and
TanStack Router, with **10,049 reachable application modules** across 40 lazy
business routes. It includes tables, charts, activity lists, URL-driven filters,
sorting and pagination, and validated forms in feature-oriented directories.

All five tools use the same source graph, route boundaries, PostCSS pipeline,
browser target, and minification/source-map policy. CI checks identical content
and styles across all routes in development and production, plus state-preserving
React HMR and Tailwind/CSS updates, before measuring performance.

Startup loads the default route; production builds cover the entire graph.
Native eager/on-demand compilation and cache implementations remain tool-specific.
Source generation is excluded from measurements. See the [case methodology](cases/react-app-10k/README.md)
for configuration details, limitations, and tool selection.

```bash
CASE=react-app-10k pnpm benchmark
```

Results pending this PR's complete Benchmark CI run.

---

### react-1k

A React app with 1,000 components and 1,500 modules from node_modules, using dynamic imports to simulate SPA.

```bash
CASE=react-1k pnpm benchmark
```

Development metrics:

| Name             | Startup (no cache) | Startup (with cache) | HMR    |
| ---------------- | ------------------ | -------------------- | ------ |
| Rspack CLI 2.3.0 | 1974ms             | 1323ms               | 101ms  |
| Rsbuild 2.3.0    | 1496ms🥉           | 1131ms🥉             | 120ms  |
| Vite 8.3.5       | 4802ms             | 3885ms               | 69ms🥈 |
| webpack 5.112.2  | 8870ms             | 5178ms               | 486ms  |
| Farm 1.7.11      | 1434ms🥈           | 748ms🥇              | 135ms  |
| Parcel 2.16.4    | 6149ms             | 1795ms               | 243ms  |
| Utoo 1.5.34      | 4883ms             | 6067ms               | 95ms🥉 |
| Bun 1.4.4        | 1024ms🥇           | 860ms🥈              | 10ms🥇 |

Build metrics:

| Name             | Build (no cache) | Build (with cache) | Output size | Gzipped size |
| ---------------- | ---------------- | ------------------ | ----------- | ------------ |
| Rspack CLI 2.3.0 | 1017ms           | 454ms🥉            | 847.4kB     | 229.3kB🥉    |
| Rsbuild 2.3.0    | 771ms🥉          | 453ms🥈            | 845.2kB🥉   | 221.0kB🥇    |
| Vite 8.3.5       | 635ms🥈          | 546ms              | 825.7kB🥈   | 226.2kB🥈    |
| webpack 5.112.2  | 5953ms           | 1819ms             | 847.3kB     | 230.3kB      |
| Farm 1.7.11      | 1715ms           | 962ms              | 1094.9kB    | 267.2kB      |
| Parcel 2.16.4    | 6524ms           | 1588ms             | 971.4kB     | 239.0kB      |
| Utoo 1.5.34      | 6171ms           | 1133ms             | 850.6kB     | 239.9kB      |
| Bun 1.4.4        | 215ms🥇          | 224ms🥇            | 822.1kB🥇   | 240.5kB      |

Dev memory (MiB):

| Name             | Steady (no cache) | Steady (with cache) | Peak (no cache) | Peak (with cache) |
| ---------------- | ----------------- | ------------------- | --------------- | ----------------- |
| Rspack CLI 2.3.0 | 252.1             | 269.7               | 284.6🥉         | 271.6             |
| Rsbuild 2.3.0    | 215.8🥉           | 227.9🥉             | 224.2🥈         | 229.6🥉           |
| Vite 8.3.5       | 419.1             | 287.6               | 419.1           | 291.7             |
| webpack 5.112.2  | 682.2             | 718.2               | 831.9           | 785.8             |
| Farm 1.7.11      | 356.1             | 301.8               | 366.6           | 306.6             |
| Parcel 2.16.4    | 991.7             | 733.3               | 1105.7          | 824.2             |
| Utoo 1.5.34      | 131.5🥈           | 180.2🥈             | 413.4           | 180.8🥈           |
| Bun 1.4.4        | 51.0🥇            | 51.5🥇              | 140.2🥇         | 139.4🥇           |

Build memory (MiB):

| Name             | Peak (no cache) | Peak (with cache) |
| ---------------- | --------------- | ----------------- |
| Rspack CLI 2.3.0 | 184.0🥈         | 164.2             |
| Rsbuild 2.3.0    | 187.8🥉         | 162.4🥉           |
| Vite 8.3.5       | 239.6           | 238.7             |
| webpack 5.112.2  | 586.6           | 441.0             |
| Farm 1.7.11      | 275.4           | 257.4             |
| Parcel 2.16.4    | 1017.8          | 412.5             |
| Utoo 1.5.34      | 348.1           | 138.8🥈           |
| Bun 1.4.4        | 93.9🥇          | 101.8🥇           |

---

### react-5k

A React app with 5,000 components and 5,000 modules from node_modules, using dynamic imports to simulate SPA.

```bash
CASE=react-5k pnpm benchmark
```

Development metrics:

| Name             | Startup (no cache) | Startup (with cache) | HMR    |
| ---------------- | ------------------ | -------------------- | ------ |
| Rspack CLI 2.3.0 | 1361ms🥈           | 1225ms🥉             | 80ms🥇 |
| Rsbuild 2.3.0    | 1073ms🥇           | 912ms🥇              | 100ms  |
| Vite 8.3.5       | 6037ms             | 3214ms               | 86ms🥈 |
| webpack 5.112.2  | 16204ms            | 12850ms              | 1515ms |
| Farm 1.7.11      | 1593ms🥉           | 980ms🥈              | 93ms🥉 |
| Parcel 2.16.4    | 16859ms            | 2387ms               | 471ms  |

Build metrics:

| Name             | Build (no cache) | Build (with cache) | Output size | Gzipped size |
| ---------------- | ---------------- | ------------------ | ----------- | ------------ |
| Rspack CLI 2.3.0 | 3141ms🥉         | 1267ms🥈           | 2707.7kB🥉  | 682.4kB🥉    |
| Rsbuild 2.3.0    | 3113ms🥈         | 966ms🥇            | 2637.8kB🥈  | 675.6kB🥇    |
| Vite 8.3.5       | 1653ms🥇         | 1523ms🥉           | 2541.8kB🥇  | 693.7kB      |
| webpack 5.112.2  | 17046ms          | 4275ms             | 2710.7kB    | 682.1kB🥈    |
| Farm 1.7.11      | 7375ms           | 2633ms             | 3459.4kB    | 805.1kB      |
| Parcel 2.16.4    | 15288ms          | 2469ms             | 3403.9kB    | 767.7kB      |

Dev memory (MiB):

| Name             | Steady (no cache) | Steady (with cache) | Peak (no cache) | Peak (with cache) |
| ---------------- | ----------------- | ------------------- | --------------- | ----------------- |
| Rspack CLI 2.3.0 | 194.4🥈           | 212.9🥈             | 225.4🥈         | 240.0🥈           |
| Rsbuild 2.3.0    | 188.5🥇           | 183.2🥇             | 188.5🥇         | 183.2🥇           |
| Vite 8.3.5       | 663.3             | 240.0🥉             | 676.4           | 240.0🥉           |
| webpack 5.112.2  | 1900.6            | 912.0               | 1957.7          | 1924.8            |
| Farm 1.7.11      | 346.9🥉           | 320.6               | 354.1🥉         | 323.9             |
| Parcel 2.16.4    | 1372.8            | 1014.9              | 1603.7          | 1311.4            |

Build memory (MiB):

| Name             | Peak (no cache) | Peak (with cache) |
| ---------------- | --------------- | ----------------- |
| Rspack CLI 2.3.0 | 425.4🥇         | 423.1🥉           |
| Rsbuild 2.3.0    | 439.2🥉         | 377.6🥇           |
| Vite 8.3.5       | 617.7           | 614.1             |
| webpack 5.112.2  | 1095.8          | 926.8             |
| Farm 1.7.11      | 429.6🥈         | 380.2🥈           |
| Parcel 2.16.4    | 1801.1          | 554.4             |

---

### react-10k

A React app with 10,000 components and 10,000 modules from node_modules, using dynamic imports to simulate SPA.

```bash
CASE=react-10k pnpm benchmark
```

Development metrics:

| Name             | Startup (no cache) | Startup (with cache) | HMR     |
| ---------------- | ------------------ | -------------------- | ------- |
| Rspack CLI 2.3.0 | 1689ms🥈           | 900ms🥇              | 123ms🥉 |
| Rsbuild 2.3.0    | 1243ms🥇           | 1000ms🥈             | 96ms🥈  |
| Vite 8.3.5       | 9107ms🥉           | 4562ms🥉             | 59ms🥇  |
| webpack 5.112.2  | 27382ms            | 18755ms              | 3343ms  |

Build metrics:

| Name             | Build (no cache) | Build (with cache) | Output size | Gzipped size |
| ---------------- | ---------------- | ------------------ | ----------- | ------------ |
| Rspack CLI 2.3.0 | 3828ms🥈         | 1616ms🥇           | 5630.6kB🥉  | 1361.1kB🥉   |
| Rsbuild 2.3.0    | 5716ms🥉         | 3007ms🥉           | 5452.6kB🥈  | 1337.3kB🥇   |
| Vite 8.3.5       | 2585ms🥇         | 2169ms🥈           | 5232.4kB🥇  | 1407.5kB     |
| webpack 5.112.2  | 23777ms          | 7167ms             | 5638.2kB    | 1361.0kB🥈   |

Dev memory (MiB):

| Name             | Steady (no cache) | Steady (with cache) | Peak (no cache) | Peak (with cache) |
| ---------------- | ----------------- | ------------------- | --------------- | ----------------- |
| Rspack CLI 2.3.0 | 239.0🥈           | 277.5🥈             | 251.8🥈         | 316.6🥉           |
| Rsbuild 2.3.0    | 215.0🥇           | 237.9🥇             | 228.2🥇         | 243.0🥇           |
| Vite 8.3.5       | 1080.0🥉          | 289.8🥉             | 1100.8🥉        | 289.9🥈           |
| webpack 5.112.2  | 2056.8            | 2222.4              | 2736.6          | 2489.2            |

Build memory (MiB):

| Name             | Peak (no cache) | Peak (with cache) |
| ---------------- | --------------- | ----------------- |
| Rspack CLI 2.3.0 | 777.0🥇         | 742.7🥈           |
| Rsbuild 2.3.0    | 781.6🥈         | 653.5🥇           |
| Vite 8.3.5       | 1161.6🥉        | 1148.2🥉          |
| webpack 5.112.2  | 1994.6          | 1511.1            |

---

### ui-components

A React app that imports UI components from several popular UI libraries.

Including [@mui/material](https://npmjs.com/package/@mui/material), [@radix-ui/themes](https://npmjs.com/package/@radix-ui/themes), [antd](https://npmjs.com/package/antd), [antd-mobile](https://npmjs.com/package/antd-mobile), [@chakra-ui/react](https://npmjs.com/package/@chakra-ui/react), [@fluentui/react](https://npmjs.com/package/@fluentui/react), [@headlessui/react](https://npmjs.com/package/@headlessui/react), [@mantine/core](https://npmjs.com/package/@mantine/core), [react-bootstrap](https://npmjs.com/package/react-bootstrap), [primereact](https://npmjs.com/package/primereact), [rsuite](https://npmjs.com/package/rsuite), [@arco-design/web-react](https://npmjs.com/package/@arco-design/web-react), [@coreui/react](https://npmjs.com/package/@coreui/react), [element-plus](https://npmjs.com/package/element-plus), [ant-design-vue](https://npmjs.com/package/ant-design-vue), [naive-ui](https://npmjs.com/package/naive-ui), [primevue](https://npmjs.com/package/primevue), [vant](https://npmjs.com/package/vant), and [vuetify](https://npmjs.com/package/vuetify).

```bash
CASE=ui-components pnpm benchmark
```

Build metrics:

| Name             | Build (no cache) | Build (with cache) | Output size | Gzipped size |
| ---------------- | ---------------- | ------------------ | ----------- | ------------ |
| Rspack CLI 2.3.0 | 6185ms🥇         | 1777ms🥇           | 4940.5kB🥉  | 1435.4kB🥈   |
| Rsbuild 2.3.0    | 8008ms           | 2911ms🥉           | 4940.2kB🥈  | 1434.9kB🥇   |
| Vite 8.3.5       | 7089ms🥈         | 5374ms             | 4936.6kB🥇  | 1440.4kB     |
| webpack 5.112.2  | 23498ms          | 9628ms             | 4953.8kB    | 1436.6kB🥉   |
| esbuild 0.28.2   | 7972ms🥉         | 7408ms             | 6151.4kB    | 1790.0kB     |
| Farm 1.7.11      | 23264ms          | 6458ms             | 8553.6kB    | 2894.6kB     |
| Parcel 2.16.4    | 34505ms          | 3468ms             | 5335.1kB    | 1511.2kB     |
| Utoo 1.5.34      | 36443ms          | 2405ms🥈           | 4984.3kB    | 1448.8kB     |

Build memory (MiB):

| Name             | Peak (no cache) | Peak (with cache) |
| ---------------- | --------------- | ----------------- |
| Rspack CLI 2.3.0 | 1062.6🥇        | 1251.1🥉          |
| Rsbuild 2.3.0    | 1188.2🥉        | 1279.2            |
| Vite 8.3.5       | 1773.4          | 1774.5            |
| webpack 5.112.2  | 1744.7          | 1436.2            |
| esbuild 0.28.2   | 1435.3          | 1349.2            |
| Farm 1.7.11      | 1691.1          | 1383.1            |
| Parcel 2.16.4    | 3089.9          | 733.8🥈           |
| Utoo 1.5.34      | 1143.7🥈        | 249.9🥇           |

---

### popular-libs

A browser app that imports a small number of live exports from 50 popular,
modern frontend libraries to compare tree-shaking quality across bundlers.

It keeps the original React/Vue/state/data set and adds 30 more mainstream
frontend packages with ESM-friendly entry points where practical, including
[axios](https://npmjs.com/package/axios),
[dayjs](https://npmjs.com/package/dayjs),
[clsx](https://npmjs.com/package/clsx),
[tailwind-merge](https://npmjs.com/package/tailwind-merge),
[class-variance-authority](https://npmjs.com/package/class-variance-authority),
[i18next](https://npmjs.com/package/i18next),
[react-i18next](https://npmjs.com/package/react-i18next),
[vue-i18n](https://npmjs.com/package/vue-i18n),
[immer](https://npmjs.com/package/immer),
[swr](https://npmjs.com/package/swr),
[framer-motion](https://npmjs.com/package/framer-motion),
[three](https://npmjs.com/package/three),
[lucide-react](https://npmjs.com/package/lucide-react),
[@headlessui/react](https://npmjs.com/package/@headlessui/react),
[@headlessui/vue](https://npmjs.com/package/@headlessui/vue),
[@heroicons/react](https://npmjs.com/package/@heroicons/react),
[@heroicons/vue](https://npmjs.com/package/@heroicons/vue),
[@radix-ui/react-slot](https://npmjs.com/package/@radix-ui/react-slot),
[query-string](https://npmjs.com/package/query-string),
[mitt](https://npmjs.com/package/mitt),
[fuse.js](https://npmjs.com/package/fuse.js),
[idb](https://npmjs.com/package/idb),
[dexie](https://npmjs.com/package/dexie),
[ky](https://npmjs.com/package/ky),
[lit](https://npmjs.com/package/lit),
[xstate](https://npmjs.com/package/xstate),
[preact](https://npmjs.com/package/preact),
[solid-js](https://npmjs.com/package/solid-js),
[swiper](https://npmjs.com/package/swiper), and
[remeda](https://npmjs.com/package/remeda).

```bash
CASE=popular-libs pnpm benchmark
```

Build metrics:

| Name             | Build (no cache) | Build (with cache) | Output size | Gzipped size |
| ---------------- | ---------------- | ------------------ | ----------- | ------------ |
| Rspack CLI 2.3.0 | 2149ms           | 659ms🥇            | 1798.1kB    | 547.8kB🥉    |
| Rsbuild 2.3.0    | 2728ms           | 1129ms             | 1797.8kB🥉  | 547.7kB🥈    |
| Vite 8.3.5       | 1648ms🥉         | 1215ms             | 1794.5kB🥈  | 548.9kB      |
| Rollup 4.65.1    | 11789ms          | 11773ms            | 1744.4kB🥇  | 536.4kB🥇    |
| Rolldown 1.2.15  | 986ms🥇          | 930ms🥉            | 1816.8kB    | 550.1kB      |
| webpack 5.112.2  | 7635ms           | 1770ms             | 1816.7kB    | 555.3kB      |
| esbuild 0.28.2   | 1538ms🥈         | 997ms              | 2115.6kB    | 622.0kB      |
| Farm 1.7.11      | 6339ms           | 1824ms             | 2292.7kB    | 768.9kB      |
| Utoo 1.5.34      | 7868ms           | 791ms🥈            | 1826.4kB    | 557.2kB      |

Build memory (MiB):

| Name             | Peak (no cache) | Peak (with cache) |
| ---------------- | --------------- | ----------------- |
| Rspack CLI 2.3.0 | 359.5🥇         | 528.6             |
| Rsbuild 2.3.0    | 369.0🥈         | 539.1             |
| Vite 8.3.5       | 541.3           | 544.5             |
| Rollup 4.65.1    | 1167.6          | 1343.2            |
| Rolldown 1.2.15  | 519.3           | 523.6             |
| webpack 5.112.2  | 746.6           | 415.9🥉           |
| esbuild 0.28.2   | 435.9🥉         | 407.7🥈           |
| Farm 1.7.11      | 567.2           | 507.8             |
| Utoo 1.5.34      | 455.3           | 131.2🥇           |

---

## Run locally

Run the `benchmark.ts` script to get the results (requires Node.js >= 22):

```bash
# Run the benchmark for the react-5k case
pnpm benchmark

# Run the benchmark for the react-10k case
CASE=react-10k pnpm benchmark
```

If you want to start the project with the specified tool, try:

```bash
pnpm i # install dependencies

# Cd to the case directory
cd cases/react-5k
cd cases/react-10k
cd cases/popular-libs

# Dev server
pnpm start:rspack # Start Rspack
pnpm start:rsbuild # Start Rsbuild
pnpm start:webpack # Start webpack
pnpm start:vite # Start Vite
pnpm start:farm # Start Farm

# Build
pnpm build:rspack # Build Rspack
pnpm build:rsbuild # Build Rsbuild
pnpm build:webpack # Build webpack
pnpm build:vite # Build Vite
pnpm build:farm # Build Farm
```

### Options

Use `CASE` to switch the benchmark case:

```bash
CASE=react-1k pnpm benchmark
CASE=react-5k pnpm benchmark
CASE=react-10k pnpm benchmark
CASE=popular-libs pnpm benchmark
```

Use `TOOLS` to specify the build tools or bundlers:

```bash
# Run with all tools
TOOLS=all pnpm benchmark

# Run Rspack and Rsbuild
TOOLS=rspack,rsbuild pnpm benchmark
```

Use `RUN_TIMES` to specify the number of runs (defaults to `3`):

```bash
RUN_TIMES=3 pnpm benchmark
```

Use `WARMUP_TIMES` to specify the number of warmup runs (defaults to `2`):

```bash
WARMUP_TIMES=2 pnpm benchmark
```

Use `FARM=true` to run Farm:

```bash
FARM=true pnpm benchmark
```

## Credits

Forked from [farm-fe/performance-compare](https://github.com/farm-fe/performance-compare), thanks to the Farm team!

## Memory methodology

- Sample the command process tree every ~50 ms, excluding the browser and benchmark driver. Use macOS **physical footprint** (requires Xcode Command Line Tools) or Linux **RSS**; these metrics are not comparable across platforms.
- Measure timing and memory in separate passes, each with cold/warm caches and natural GC.
- **Dev steady:** load `/`, perform 10 root/leaf HMR updates, then idle for 5 seconds and take the median over 2 seconds. **Peak:** the largest sampled process-tree total during dev startup through this window, or during a build.
- Report **MiB** as the median across runs. Raw samples and summaries are saved in `results/` and uploaded as CI artifacts.
