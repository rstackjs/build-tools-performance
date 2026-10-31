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
| **Output size**          | Total size of the output bundle, minified with the configured minifier                 |
| **Gzipped size**         | Gzipped size of the output bundle, represents actual network transfer size             |

## Notes

- The `react-app-10k` case targets `Chrome >= 111` for every included tool,
  matching Tailwind CSS 4. Older cases retain their existing target configurations.
- Minification is enabled in production for all tools.
- Source map is enabled in development and disabled in production for all tools.
- Each development session starts in a fresh browser context, isolating HTTP cache
  and site storage. Cold/warm refers to build-tool caches; OS caches are not flushed.
- Benchmarks run on GitHub Actions with variable hardware, which may cause inconsistent results.

Tooling details:

- webpack is configured to use SWC instead of Babel / Terser.
- Vite uses Rolldown and Oxc.

## Results

> Data from [GitHub Actions](https://github.com/rstackjs/build-tools-performance/actions/runs/41162227276) (2026-10-31, benchmark commit `32a3460f`). Values are medians of three measured runs; timing includes two warmups, while memory skips warmups. Memory is process-tree physical footprint in MiB. See [memory methodology](#memory-methodology).

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
Development uses lazy dynamic imports / on-demand modules for every tool;
native dependency scanning, prebundling, and cache implementations still differ.
Source generation is excluded from measurements. See the [case methodology](cases/react-app-10k/README.md)
for configuration details, limitations, and tool selection.

```bash
CASE=react-app-10k pnpm benchmark
```

Development metrics:

| Name             | Startup (no cache) | Startup (with cache) | HMR     |
| ---------------- | ------------------ | -------------------- | ------- |
| Rspack CLI 2.3.0 | 1328ms🥇           | 856ms🥈              | 417ms🥉 |
| Rsbuild 2.3.0    | 1689ms🥈           | 829ms🥇              | 449ms   |
| Vite 8.3.5       | 2813ms             | 1667ms🥉             | 392ms🥈 |
| webpack 5.112.2  | 3614ms             | 2068ms               | 511ms   |
| Utoo 1.5.34      | 2789ms🥉           | 2749ms               | 301ms🥇 |

Build metrics:

| Name             | Build (no cache) | Build (with cache) | Output size | Gzipped size |
| ---------------- | ---------------- | ------------------ | ----------- | ------------ |
| Rspack CLI 2.3.0 | 1968ms🥈         | 924ms🥇            | 3204.0kB    | 351.5kB🥉    |
| Rsbuild 2.3.0    | 2082ms🥉         | 929ms🥈            | 3202.4kB🥈  | 350.2kB🥈    |
| Vite 8.3.5       | 1621ms🥇         | 1853ms🥉           | 3216.6kB    | 359.3kB      |
| webpack 5.112.2  | 11703ms          | 3907ms             | 3203.3kB🥉  | 352.0kB      |
| Utoo 1.5.34      | 13995ms          | 2135ms             | 3191.2kB🥇  | 332.6kB🥇    |

Dev memory (MiB):

| Name             | Steady (no cache) | Steady (with cache) | Peak (no cache) | Peak (with cache) |
| ---------------- | ----------------- | ------------------- | --------------- | ----------------- |
| Rspack CLI 2.3.0 | 487.9🥉           | 444.7               | 487.9🥈         | 444.7🥉           |
| Rsbuild 2.3.0    | 292.1🥇           | 284.8🥈             | 570.3🥉         | 504.5             |
| Vite 8.3.5       | 876.8             | 328.0🥉             | 908.3           | 336.7🥇           |
| webpack 5.112.2  | 627.1             | 643.0               | 680.0           | 716.9             |
| Utoo 1.5.34      | 295.2🥈           | 264.4🥇             | 457.2🥇         | 352.2🥈           |

Build memory (MiB):

| Name             | Peak (no cache) | Peak (with cache) |
| ---------------- | --------------- | ----------------- |
| Rspack CLI 2.3.0 | 553.5🥇         | 443.9🥈           |
| Rsbuild 2.3.0    | 606.6🥈         | 500.1🥉           |
| Vite 8.3.5       | 792.1🥉         | 806.8             |
| webpack 5.112.2  | 1379.0          | 1056.4            |
| Utoo 1.5.34      | 1103.3          | 251.9🥇           |

---

### react-1k

A React app with 1,000 components and 1,500 modules from node_modules, using dynamic imports to simulate SPA.

```bash
CASE=react-1k pnpm benchmark
```

Development metrics:

| Name             | Startup (no cache) | Startup (with cache) | HMR    |
| ---------------- | ------------------ | -------------------- | ------ |
| Rspack CLI 2.3.0 | 1670ms🥉           | 1067ms🥉             | 100ms  |
| Rsbuild 2.3.0    | 1430ms🥈           | 1542ms               | 122ms  |
| Vite 8.3.5       | 6022ms             | 4661ms               | 90ms🥉 |
| webpack 5.112.2  | 7113ms             | 6964ms               | 430ms  |
| Farm 1.7.11      | 1711ms             | 1054ms🥈             | 101ms  |
| Parcel 2.16.4    | 5579ms             | 1350ms               | 147ms  |
| Utoo 1.5.34      | 6200ms             | 4638ms               | 79ms🥈 |
| Bun 1.4.4        | 988ms🥇            | 705ms🥇              | 9ms🥇  |

Build metrics:

| Name             | Build (no cache) | Build (with cache) | Output size | Gzipped size |
| ---------------- | ---------------- | ------------------ | ----------- | ------------ |
| Rspack CLI 2.3.0 | 673ms            | 332ms🥈            | 847.4kB     | 229.3kB🥉    |
| Rsbuild 2.3.0    | 609ms🥉          | 382ms🥉            | 845.2kB🥉   | 221.0kB🥇    |
| Vite 8.3.5       | 512ms🥈          | 533ms              | 825.7kB🥈   | 226.2kB🥈    |
| webpack 5.112.2  | 6615ms           | 2011ms             | 847.3kB     | 230.3kB      |
| Farm 1.7.11      | 2051ms           | 912ms              | 1094.9kB    | 267.2kB      |
| Parcel 2.16.4    | 4818ms           | 907ms              | 971.4kB     | 239.0kB      |
| Utoo 1.5.34      | 5065ms           | 729ms              | 850.6kB     | 239.9kB      |
| Bun 1.4.4        | 193ms🥇          | 188ms🥇            | 822.1kB🥇   | 240.5kB      |

Dev memory (MiB):

| Name             | Steady (no cache) | Steady (with cache) | Peak (no cache) | Peak (with cache) |
| ---------------- | ----------------- | ------------------- | --------------- | ----------------- |
| Rspack CLI 2.3.0 | 243.6             | 266.2               | 246.2🥉         | 270.3             |
| Rsbuild 2.3.0    | 220.4🥉           | 235.5🥉             | 224.0🥈         | 235.5🥉           |
| Vite 8.3.5       | 410.4             | 284.1               | 410.5           | 286.3             |
| webpack 5.112.2  | 717.0             | 727.9               | 803.6           | 774.4             |
| Farm 1.7.11      | 351.7             | 313.1               | 368.7           | 314.8             |
| Parcel 2.16.4    | 1003.1            | 755.6               | 1077.7          | 813.2             |
| Utoo 1.5.34      | 124.8🥈           | 179.9🥈             | 398.8           | 180.6🥈           |
| Bun 1.4.4        | 51.2🥇            | 51.1🥇              | 139.9🥇         | 141.6🥇           |

Build memory (MiB):

| Name             | Peak (no cache) | Peak (with cache) |
| ---------------- | --------------- | ----------------- |
| Rspack CLI 2.3.0 | 184.3🥈         | 151.9             |
| Rsbuild 2.3.0    | 194.0🥉         | 147.4🥉           |
| Vite 8.3.5       | 239.0           | 238.6             |
| webpack 5.112.2  | 581.9           | 444.5             |
| Farm 1.7.11      | 276.0           | 258.7             |
| Parcel 2.16.4    | 1039.7          | 446.0             |
| Utoo 1.5.34      | 356.6           | 136.9🥈           |
| Bun 1.4.4        | 102.9🥇         | 86.0🥇            |

---

### react-5k

A React app with 5,000 components and 5,000 modules from node_modules, using dynamic imports to simulate SPA.

```bash
CASE=react-5k pnpm benchmark
```

Development metrics:

| Name             | Startup (no cache) | Startup (with cache) | HMR     |
| ---------------- | ------------------ | -------------------- | ------- |
| Rspack CLI 2.3.0 | 1405ms🥈           | 925ms🥇              | 86ms🥇  |
| Rsbuild 2.3.0    | 1176ms🥇           | 930ms🥈              | 86ms🥈  |
| Vite 8.3.5       | 5285ms             | 3217ms               | 134ms🥉 |
| webpack 5.112.2  | 14930ms            | 11858ms              | 1279ms  |
| Farm 1.7.11      | 1667ms🥉           | 946ms🥉              | 139ms   |
| Parcel 2.16.4    | 14303ms            | 1701ms               | 393ms   |

Build metrics:

| Name             | Build (no cache) | Build (with cache) | Output size | Gzipped size |
| ---------------- | ---------------- | ------------------ | ----------- | ------------ |
| Rspack CLI 2.3.0 | 1992ms🥈         | 798ms🥇            | 2707.7kB🥉  | 682.4kB🥉    |
| Rsbuild 2.3.0    | 2065ms🥉         | 1023ms🥈           | 2637.8kB🥈  | 675.6kB🥇    |
| Vite 8.3.5       | 1166ms🥇         | 1177ms🥉           | 2541.8kB🥇  | 693.7kB      |
| webpack 5.112.2  | 18344ms          | 4700ms             | 2710.7kB    | 682.1kB🥈    |
| Farm 1.7.11      | 6775ms           | 2420ms             | 3459.4kB    | 805.1kB      |
| Parcel 2.16.4    | 13914ms          | 2040ms             | 3403.9kB    | 767.7kB      |

Dev memory (MiB):

| Name             | Steady (no cache) | Steady (with cache) | Peak (no cache) | Peak (with cache) |
| ---------------- | ----------------- | ------------------- | --------------- | ----------------- |
| Rspack CLI 2.3.0 | 197.0🥈           | 208.5🥈             | 199.9🥈         | 211.2🥈           |
| Rsbuild 2.3.0    | 174.4🥇           | 184.8🥇             | 178.5🥇         | 184.8🥇           |
| Vite 8.3.5       | 637.7             | 232.1🥉             | 673.0           | 232.2🥉           |
| webpack 5.112.2  | 1910.1            | 921.8               | 1975.3          | 1902.4            |
| Farm 1.7.11      | 350.5🥉           | 307.9               | 351.1🥉         | 319.7             |
| Parcel 2.16.4    | 1340.2            | 1116.2              | 1509.9          | 1249.9            |

Build memory (MiB):

| Name             | Peak (no cache) | Peak (with cache) |
| ---------------- | --------------- | ----------------- |
| Rspack CLI 2.3.0 | 423.2🥇         | 420.7🥉           |
| Rsbuild 2.3.0    | 439.3🥈         | 377.3🥇           |
| Vite 8.3.5       | 614.1           | 614.8             |
| webpack 5.112.2  | 1111.6          | 922.3             |
| Farm 1.7.11      | 440.0🥉         | 380.0🥈           |
| Parcel 2.16.4    | 1779.8          | 660.9             |

---

### react-10k

A React app with 10,000 components and 10,000 modules from node_modules, using dynamic imports to simulate SPA.

```bash
CASE=react-10k pnpm benchmark
```

Development metrics:

| Name             | Startup (no cache) | Startup (with cache) | HMR     |
| ---------------- | ------------------ | -------------------- | ------- |
| Rspack CLI 2.3.0 | 1143ms🥈           | 724ms🥈              | 110ms🥇 |
| Rsbuild 2.3.0    | 854ms🥇            | 633ms🥇              | 121ms🥈 |
| Vite 8.3.5       | 4332ms🥉           | 2887ms🥉             | 147ms🥉 |
| webpack 5.112.2  | 12820ms            | 9114ms               | 1519ms  |

Build metrics:

| Name             | Build (no cache) | Build (with cache) | Output size | Gzipped size |
| ---------------- | ---------------- | ------------------ | ----------- | ------------ |
| Rspack CLI 2.3.0 | 2332ms🥉         | 1007ms🥇           | 5630.6kB🥉  | 1361.1kB🥉   |
| Rsbuild 2.3.0    | 2035ms🥈         | 1039ms🥈           | 5452.6kB🥈  | 1337.3kB🥇   |
| Vite 8.3.5       | 1411ms🥇         | 1195ms🥉           | 5232.4kB🥇  | 1407.5kB     |
| webpack 5.112.2  | 14638ms          | 4519ms             | 5638.2kB    | 1361.0kB🥈   |

Dev memory (MiB):

| Name             | Steady (no cache) | Steady (with cache) | Peak (no cache) | Peak (with cache) |
| ---------------- | ----------------- | ------------------- | --------------- | ----------------- |
| Rspack CLI 2.3.0 | 239.9🥈           | 271.2🥈             | 248.3🥈         | 274.2🥈           |
| Rsbuild 2.3.0    | 219.7🥇           | 236.6🥇             | 223.0🥇         | 236.6🥇           |
| Vite 8.3.5       | 1048.3🥉          | 284.5🥉             | 1064.6🥉        | 284.6🥉           |
| webpack 5.112.2  | 2309.1            | 2283.0              | 2850.6          | 2490.4            |

Build memory (MiB):

| Name             | Peak (no cache) | Peak (with cache) |
| ---------------- | --------------- | ----------------- |
| Rspack CLI 2.3.0 | 780.7🥇         | 741.0🥈           |
| Rsbuild 2.3.0    | 783.1🥈         | 663.1🥇           |
| Vite 8.3.5       | 1183.4🥉        | 1175.3🥉          |
| webpack 5.112.2  | 1996.8          | 1502.3            |

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
| Rspack CLI 2.3.0 | 6888ms🥉         | 2460ms🥇           | 4940.5kB🥉  | 1435.4kB🥈   |
| Rsbuild 2.3.0    | 7907ms           | 2532ms🥈           | 4940.2kB🥈  | 1434.9kB🥇   |
| Vite 8.3.5       | 5825ms🥈         | 4941ms             | 4936.6kB🥇  | 1440.4kB     |
| webpack 5.112.2  | 23259ms          | 11175ms            | 4953.8kB    | 1436.6kB🥉   |
| esbuild 0.28.2   | 5550ms🥇         | 5272ms             | 6151.4kB    | 1790.0kB     |
| Farm 1.7.11      | 20906ms          | 5798ms             | 8553.6kB    | 2894.6kB     |
| Parcel 2.16.4    | 37072ms          | 3768ms             | 5335.1kB    | 1511.2kB     |
| Utoo 1.5.34      | 21535ms          | 2545ms🥉           | 4984.3kB    | 1448.8kB     |

Build memory (MiB):

| Name             | Peak (no cache) | Peak (with cache) |
| ---------------- | --------------- | ----------------- |
| Rspack CLI 2.3.0 | 1063.0🥇        | 1257.1🥉          |
| Rsbuild 2.3.0    | 1171.0🥉        | 1279.6            |
| Vite 8.3.5       | 1773.4          | 1779.2            |
| webpack 5.112.2  | 1785.5          | 1415.5            |
| esbuild 0.28.2   | 1355.7          | 1381.3            |
| Farm 1.7.11      | 1655.9          | 1385.4            |
| Parcel 2.16.4    | 3331.2          | 769.4🥈           |
| Utoo 1.5.34      | 1087.3🥈        | 249.7🥇           |

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
| Rspack CLI 2.3.0 | 1643ms           | 574ms🥇            | 1798.1kB    | 547.8kB🥉    |
| Rsbuild 2.3.0    | 1760ms           | 604ms🥈            | 1797.8kB🥉  | 547.7kB🥈    |
| Vite 8.3.5       | 1374ms🥉         | 1440ms             | 1794.5kB🥈  | 548.9kB      |
| Rollup 4.65.1    | 9108ms           | 7521ms             | 1744.4kB🥇  | 536.4kB🥇    |
| Rolldown 1.2.15  | 958ms🥇          | 885ms              | 1816.8kB    | 550.1kB      |
| webpack 5.112.2  | 7436ms           | 1392ms             | 1816.7kB    | 555.3kB      |
| esbuild 0.28.2   | 1278ms🥈         | 1073ms             | 2115.6kB    | 622.0kB      |
| Farm 1.7.11      | 4805ms           | 1634ms             | 2292.7kB    | 769.0kB      |
| Utoo 1.5.34      | 7608ms           | 733ms🥉            | 1826.4kB    | 557.2kB      |

Build memory (MiB):

| Name             | Peak (no cache) | Peak (with cache) |
| ---------------- | --------------- | ----------------- |
| Rspack CLI 2.3.0 | 356.5🥇         | 528.8             |
| Rsbuild 2.3.0    | 368.3🥈         | 543.3             |
| Vite 8.3.5       | 540.8           | 537.4             |
| Rollup 4.65.1    | 1192.6          | 1215.2            |
| Rolldown 1.2.15  | 524.3           | 530.4             |
| webpack 5.112.2  | 747.7           | 408.1🥈           |
| esbuild 0.28.2   | 425.9🥉         | 418.2🥉           |
| Farm 1.7.11      | 564.3           | 509.1             |
| Utoo 1.5.34      | 480.3           | 134.8🥇           |

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
