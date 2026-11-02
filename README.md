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
| **Chunks**               | Total number of emitted JavaScript and CSS files                                       |

## Notes

- Build targets are `Chrome >= 93` or `es2022`.
- Minification is enabled in production for all tools.
- Source map is enabled in development and disabled in production for all tools.
- Benchmarks run on GitHub Actions with variable hardware, which may cause inconsistent results.

Tooling details:

- webpack is configured to use SWC instead of Babel / Terser.
- Vite uses Rolldown and Oxc.

## Results

> Data from [GitHub Actions](https://github.com/rstackjs/build-tools-performance/actions/runs/41406628042) (2026-11-02, benchmark commit `0f8febaf`).

---

### react-dashboard

A synthetic enterprise operations dashboard with 40 lazy routes and 29 common libraries, including React, Tailwind CSS, TanStack Router, Zod, and Recharts.

See [case details](cases/react-dashboard/README.md).

```bash
CASE=react-dashboard pnpm benchmark
```

Development metrics:

| Name             | Startup (no cache) | Startup (with cache) | HMR     |
| ---------------- | ------------------ | -------------------- | ------- |
| Rspack CLI 2.3.0 | 2110ms🥇           | 1578ms🥇             | 468ms🥉 |
| Rsbuild 2.3.0    | 3427ms🥈           | 1615ms🥈             | 593ms   |
| Vite 8.3.5       | 3887ms🥉           | 3356ms🥉             | 345ms🥈 |
| webpack 5.112.2  | 6636ms             | 4410ms               | 715ms   |
| Utoo 1.5.34      | 7313ms             | 7229ms               | 313ms🥇 |

Build metrics:

| Name             | Build (no cache) | Build (with cache) | Output size | Gzipped size | Chunks |
| ---------------- | ---------------- | ------------------ | ----------- | ------------ | ------ |
| Rspack CLI 2.3.0 | 2646ms🥇         | 1555ms🥈           | 4151.5kB🥉  | 638.5kB🥉    | 44     |
| Rsbuild 2.3.0    | 3245ms🥉         | 1263ms🥇           | 4149.3kB🥈  | 636.4kB🥈    | 44     |
| Vite 8.3.5       | 2763ms🥈         | 1975ms🥉           | 4165.5kB    | 648.2kB      | 45     |
| webpack 5.112.2  | 17765ms          | 5378ms             | 4154.4kB    | 640.0kB      | 44     |
| Utoo 1.5.34      | 18886ms          | 2716ms             | 4132.2kB🥇  | 617.2kB🥇    | 47     |

Dev memory (MiB):

| Name             | Steady (no cache) | Steady (with cache) | Peak (no cache) | Peak (with cache) |
| ---------------- | ----------------- | ------------------- | --------------- | ----------------- |
| Rspack CLI 2.3.0 | 591.7🥈           | 867.4🥉             | 608.5🥇         | 867.4🥉           |
| Rsbuild 2.3.0    | 609.8🥉           | 921.0               | 655.2🥈         | 938.8             |
| Vite 8.3.5       | 1023.9            | 336.9🥈             | 1056.0          | 336.9🥇           |
| webpack 5.112.2  | 868.7             | 884.6               | 996.7           | 1001.3            |
| Utoo 1.5.34      | 359.0🥇           | 260.2🥇             | 740.0🥉         | 436.1🥈           |

Build memory (MiB):

| Name             | Peak (no cache) | Peak (with cache) |
| ---------------- | --------------- | ----------------- |
| Rspack CLI 2.3.0 | 746.6🥇         | 793.0🥈           |
| Rsbuild 2.3.0    | 772.4🥈         | 857.0🥉           |
| Vite 8.3.5       | 1051.3🥉        | 1041.9            |
| webpack 5.112.2  | 1634.7          | 1319.5            |
| Utoo 1.5.34      | 1266.4          | 304.8🥇           |

---

### react-1k

A React app with 1,000 components and 1,500 modules from node_modules, using dynamic imports to simulate SPA.

```bash
CASE=react-1k pnpm benchmark
```

Development metrics:

| Name             | Startup (no cache) | Startup (with cache) | HMR    |
| ---------------- | ------------------ | -------------------- | ------ |
| Rspack CLI 2.3.0 | 1115ms🥇           | 953ms🥇              | 99ms🥉 |
| Rsbuild 2.3.0    | 1278ms🥉           | 1204ms🥉             | 112ms  |
| Vite 8.3.5       | 5556ms             | 4487ms               | 141ms  |
| webpack 5.112.2  | 4980ms             | 4569ms               | 386ms  |
| Farm 1.7.11      | 1724ms             | 1277ms               | 154ms  |
| Parcel 2.16.4    | 3897ms             | 1343ms               | 166ms  |
| Utoo 1.5.34      | 4503ms             | 4502ms               | 91ms🥈 |
| Bun 1.4.4        | 1121ms🥈           | 991ms🥈              | 8ms🥇  |

Build metrics:

| Name             | Build (no cache) | Build (with cache) | Output size | Gzipped size | Chunks |
| ---------------- | ---------------- | ------------------ | ----------- | ------------ | ------ |
| Rspack CLI 2.3.0 | 744ms🥉          | 372ms🥉            | 847.4kB     | 229.3kB🥉    | 7      |
| Rsbuild 2.3.0    | 749ms            | 322ms🥈            | 845.2kB🥉   | 221.0kB🥇    | 10     |
| Vite 8.3.5       | 601ms🥈          | 703ms              | 825.7kB🥈   | 226.2kB🥈    | 7      |
| webpack 5.112.2  | 4400ms           | 1397ms             | 847.3kB     | 230.3kB      | 7      |
| Farm 1.7.11      | 2041ms           | 1082ms             | 1094.9kB    | 267.2kB      | 19     |
| Parcel 2.16.4    | 4370ms           | 956ms              | 971.4kB     | 239.0kB      | 7      |
| Utoo 1.5.34      | 4267ms           | 711ms              | 850.6kB     | 239.9kB      | 11     |
| Bun 1.4.4        | 231ms🥇          | 220ms🥇            | 822.1kB🥇   | 240.5kB      | 7      |

Dev memory (MiB):

| Name             | Steady (no cache) | Steady (with cache) | Peak (no cache) | Peak (with cache) |
| ---------------- | ----------------- | ------------------- | --------------- | ----------------- |
| Rspack CLI 2.3.0 | 238.9             | 272.5               | 243.6🥉         | 272.6             |
| Rsbuild 2.3.0    | 217.5🥉           | 233.7🥉             | 227.1🥈         | 235.6🥉           |
| Vite 8.3.5       | 418.2             | 291.4               | 418.7           | 291.4             |
| webpack 5.112.2  | 689.4             | 723.9               | 860.2           | 811.2             |
| Farm 1.7.11      | 343.2             | 300.6               | 359.8           | 314.1             |
| Parcel 2.16.4    | 1070.6            | 722.9               | 1085.1          | 793.0             |
| Utoo 1.5.34      | 131.5🥈           | 180.4🥈             | 406.4           | 180.6🥈           |
| Bun 1.4.4        | 51.1🥇            | 51.9🥇              | 140.7🥇         | 139.4🥇           |

Build memory (MiB):

| Name             | Peak (no cache) | Peak (with cache) |
| ---------------- | --------------- | ----------------- |
| Rspack CLI 2.3.0 | 190.2🥈         | 169.4             |
| Rsbuild 2.3.0    | 193.0🥉         | 162.3🥉           |
| Vite 8.3.5       | 240.3           | 239.7             |
| webpack 5.112.2  | 560.7           | 438.8             |
| Farm 1.7.11      | 279.2           | 259.7             |
| Parcel 2.16.4    | 1032.3          | 410.7             |
| Utoo 1.5.34      | 348.5           | 137.4🥈           |
| Bun 1.4.4        | 84.0🥇          | 98.5🥇            |

---

### react-5k

A React app with 5,000 components and 5,000 modules from node_modules, using dynamic imports to simulate SPA.

```bash
CASE=react-5k pnpm benchmark
```

Development metrics:

| Name             | Startup (no cache) | Startup (with cache) | HMR     |
| ---------------- | ------------------ | -------------------- | ------- |
| Rspack CLI 2.3.0 | 1311ms🥈           | 983ms🥇              | 84ms🥇  |
| Rsbuild 2.3.0    | 1074ms🥇           | 995ms🥈              | 84ms🥈  |
| Vite 8.3.5       | 3373ms             | 2774ms               | 137ms🥉 |
| webpack 5.112.2  | 13957ms            | 11451ms              | 1209ms  |
| Farm 1.7.11      | 1876ms🥉           | 1256ms🥉             | 148ms   |
| Parcel 2.16.4    | 13442ms            | 1438ms               | 329ms   |

Build metrics:

| Name             | Build (no cache) | Build (with cache) | Output size | Gzipped size | Chunks |
| ---------------- | ---------------- | ------------------ | ----------- | ------------ | ------ |
| Rspack CLI 2.3.0 | 2591ms🥉         | 1059ms🥈           | 2707.7kB🥉  | 682.4kB🥉    | 17     |
| Rsbuild 2.3.0    | 2255ms🥈         | 921ms🥇            | 2637.8kB🥈  | 675.6kB🥇    | 20     |
| Vite 8.3.5       | 1266ms🥇         | 1206ms🥉           | 2541.8kB🥇  | 693.7kB      | 10     |
| webpack 5.112.2  | 14374ms          | 4432ms             | 2710.7kB    | 682.1kB🥈    | 17     |
| Farm 1.7.11      | 5538ms           | 2033ms             | 3459.4kB    | 805.1kB      | 38     |
| Parcel 2.16.4    | 12161ms          | 2347ms             | 3403.9kB    | 767.7kB      | 10     |

Dev memory (MiB):

| Name             | Steady (no cache) | Steady (with cache) | Peak (no cache) | Peak (with cache) |
| ---------------- | ----------------- | ------------------- | --------------- | ----------------- |
| Rspack CLI 2.3.0 | 197.0🥈           | 209.0🥈             | 205.6🥈         | 213.6🥈           |
| Rsbuild 2.3.0    | 176.5🥇           | 185.8🥇             | 178.3🥇         | 185.8🥇           |
| Vite 8.3.5       | 653.7             | 239.8🥉             | 662.8           | 239.8🥉           |
| webpack 5.112.2  | 1775.0            | 1695.2              | 1912.0          | 1779.5            |
| Farm 1.7.11      | 347.0🥉           | 321.4               | 351.0🥉         | 326.7             |
| Parcel 2.16.4    | 1323.1            | 1017.2              | 1458.9          | 1152.6            |

Build memory (MiB):

| Name             | Peak (no cache) | Peak (with cache) |
| ---------------- | --------------- | ----------------- |
| Rspack CLI 2.3.0 | 426.9🥇         | 427.6🥉           |
| Rsbuild 2.3.0    | 442.1🥉         | 388.0🥈           |
| Vite 8.3.5       | 613.0           | 619.3             |
| webpack 5.112.2  | 1082.1          | 932.9             |
| Farm 1.7.11      | 434.3🥈         | 379.6🥇           |
| Parcel 2.16.4    | 1850.3          | 553.4             |

---

### react-10k

A React app with 10,000 components and 10,000 modules from node_modules, using dynamic imports to simulate SPA.

```bash
CASE=react-10k pnpm benchmark
```

Development metrics:

| Name             | Startup (no cache) | Startup (with cache) | HMR     |
| ---------------- | ------------------ | -------------------- | ------- |
| Rspack CLI 2.3.0 | 2107ms🥇           | 1382ms🥈             | 94ms🥇  |
| Rsbuild 2.3.0    | 2147ms🥈           | 1240ms🥇             | 122ms🥉 |
| Vite 8.3.5       | 9814ms🥉           | 6224ms🥉             | 107ms🥈 |
| webpack 5.112.2  | 31843ms            | 24330ms              | 3880ms  |

Build metrics:

| Name             | Build (no cache) | Build (with cache) | Output size | Gzipped size | Chunks |
| ---------------- | ---------------- | ------------------ | ----------- | ------------ | ------ |
| Rspack CLI 2.3.0 | 3984ms🥈         | 2027ms🥈           | 5630.6kB🥉  | 1361.1kB🥉   | 18     |
| Rsbuild 2.3.0    | 4408ms🥉         | 1880ms🥇           | 5452.6kB🥈  | 1337.3kB🥇   | 21     |
| Vite 8.3.5       | 2501ms🥇         | 2589ms🥉           | 5232.4kB🥇  | 1407.5kB     | 10     |
| webpack 5.112.2  | 34762ms          | 8996ms             | 5638.2kB    | 1361.0kB🥈   | 18     |

Dev memory (MiB):

| Name             | Steady (no cache) | Steady (with cache) | Peak (no cache) | Peak (with cache) |
| ---------------- | ----------------- | ------------------- | --------------- | ----------------- |
| Rspack CLI 2.3.0 | 246.2🥈           | 266.4🥈             | 253.4🥈         | 269.2🥈           |
| Rsbuild 2.3.0    | 229.6🥇           | 236.3🥇             | 232.1🥇         | 237.0🥇           |
| Vite 8.3.5       | 653.2🥉           | 272.1🥉             | 1062.1🥉        | 288.3🥉           |
| webpack 5.112.2  | 2400.7            | 2294.8              | 2604.9          | 2505.1            |

Build memory (MiB):

| Name             | Peak (no cache) | Peak (with cache) |
| ---------------- | --------------- | ----------------- |
| Rspack CLI 2.3.0 | 779.0🥇         | 738.6🥈           |
| Rsbuild 2.3.0    | 789.3🥈         | 657.3🥇           |
| Vite 8.3.5       | 1149.0🥉        | 1151.9🥉          |
| webpack 5.112.2  | 1944.8          | 1503.5            |

---

### ui-components

A React app that imports UI components from several popular UI libraries.

Including [@mui/material](https://npmjs.com/package/@mui/material), [@radix-ui/themes](https://npmjs.com/package/@radix-ui/themes), [antd](https://npmjs.com/package/antd), [antd-mobile](https://npmjs.com/package/antd-mobile), [@chakra-ui/react](https://npmjs.com/package/@chakra-ui/react), [@fluentui/react](https://npmjs.com/package/@fluentui/react), [@headlessui/react](https://npmjs.com/package/@headlessui/react), [@mantine/core](https://npmjs.com/package/@mantine/core), [react-bootstrap](https://npmjs.com/package/react-bootstrap), [primereact](https://npmjs.com/package/primereact), [rsuite](https://npmjs.com/package/rsuite), [@arco-design/web-react](https://npmjs.com/package/@arco-design/web-react), [@coreui/react](https://npmjs.com/package/@coreui/react), [element-plus](https://npmjs.com/package/element-plus), [ant-design-vue](https://npmjs.com/package/ant-design-vue), [naive-ui](https://npmjs.com/package/naive-ui), [primevue](https://npmjs.com/package/primevue), [vant](https://npmjs.com/package/vant), and [vuetify](https://npmjs.com/package/vuetify).

```bash
CASE=ui-components pnpm benchmark
```

Build metrics:

| Name             | Build (no cache) | Build (with cache) | Output size | Gzipped size | Chunks |
| ---------------- | ---------------- | ------------------ | ----------- | ------------ | ------ |
| Rspack CLI 2.3.0 | 5347ms🥉         | 1799ms🥇           | 4940.5kB🥈  | 1435.4kB🥈   | 2      |
| Rsbuild 2.3.0    | 4868ms🥈         | 1823ms🥈           | 4940.2kB🥇  | 1434.9kB🥇   | 2      |
| Vite 8.3.5       | 4006ms🥇         | 3547ms             | 4941.6kB🥉  | 1441.3kB     | 2      |
| webpack 5.112.2  | 19966ms          | 8601ms             | 4953.8kB    | 1436.6kB🥉   | 2      |
| esbuild 0.28.2   | 6236ms           | 5815ms             | 6155.9kB    | 1790.3kB     | 2      |
| Farm 1.7.11      | 17668ms          | 5422ms             | 8472.3kB    | 2894.8kB     | 6      |
| Parcel 2.16.4    | 34657ms          | 2399ms             | 5335.1kB    | 1511.2kB     | 4      |
| Utoo 1.5.34      | 26409ms          | 2370ms🥉           | 4984.3kB    | 1448.8kB     | 4      |

Build memory (MiB):

| Name             | Peak (no cache) | Peak (with cache) |
| ---------------- | --------------- | ----------------- |
| Rspack CLI 2.3.0 | 1065.2🥇        | 1281.5            |
| Rsbuild 2.3.0    | 1190.2🥉        | 1277.5🥉          |
| Vite 8.3.5       | 1772.2          | 1768.5            |
| webpack 5.112.2  | 1844.7          | 1442.8            |
| esbuild 0.28.2   | 1360.8          | 1411.8            |
| Farm 1.7.11      | 1628.6          | 1383.6            |
| Parcel 2.16.4    | 3188.8          | 788.6🥈           |
| Utoo 1.5.34      | 1124.3🥈        | 252.0🥇           |

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

| Name             | Build (no cache) | Build (with cache) | Output size | Gzipped size | Chunks |
| ---------------- | ---------------- | ------------------ | ----------- | ------------ | ------ |
| Rspack CLI 2.3.0 | 1590ms           | 449ms🥇            | 1817.8kB    | 553.5kB🥉    | 1      |
| Rsbuild 2.3.0    | 1871ms           | 902ms              | 1817.5kB🥉  | 553.4kB🥈    | 1      |
| Vite 8.3.5       | 1084ms🥈         | 995ms              | 1813.6kB🥈  | 554.6kB      | 1      |
| Rollup 4.65.1    | 10930ms          | 9996ms             | 1764.4kB🥇  | 542.6kB🥇    | 1      |
| Rolldown 1.2.15  | 1293ms🥉         | 891ms              | 1844.8kB    | 557.4kB      | 1      |
| webpack 5.112.2  | 6451ms           | 1593ms             | 1836.4kB    | 561.4kB      | 1      |
| esbuild 0.28.2   | 811ms🥇          | 837ms🥉            | 2135.2kB    | 627.8kB      | 1      |
| Farm 1.7.11      | 4398ms           | 1741ms             | 2313.2kB    | 776.1kB      | 2      |
| Utoo 1.5.34      | 6847ms           | 708ms🥈            | 1846.1kB    | 562.7kB      | 2      |

Build memory (MiB):

| Name             | Peak (no cache) | Peak (with cache) |
| ---------------- | --------------- | ----------------- |
| Rspack CLI 2.3.0 | 360.8🥇         | 528.7             |
| Rsbuild 2.3.0    | 367.0🥈         | 542.9             |
| Vite 8.3.5       | 546.1           | 546.3             |
| Rollup 4.65.1    | 1104.0          | 1176.1            |
| Rolldown 1.2.15  | 527.0           | 529.0             |
| webpack 5.112.2  | 749.4           | 411.9🥈           |
| esbuild 0.28.2   | 404.5🥉         | 465.2🥉           |
| Farm 1.7.11      | 564.8           | 510.1             |
| Utoo 1.5.34      | 462.0           | 133.4🥇           |

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
