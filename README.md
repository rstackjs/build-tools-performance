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

- Build targets are `Chrome >= 93` or `es2022`.
- Minification is enabled in production for all tools.
- Source map is enabled in development and disabled in production for all tools.
- Benchmarks run on GitHub Actions with variable hardware, which may cause inconsistent results.

Tooling details:

- webpack is configured to use SWC instead of Babel / Terser.
- Vite uses Rolldown and Oxc.

## Results

> Data from [GitHub Actions](https://github.com/rstackjs/build-tools-performance/actions/runs/41301198735) (2026-11-01, benchmark commit `8d085d4d`).

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
| Rspack CLI 2.3.0 | 2416ms🥇           | 1765ms🥇             | 534ms🥉 |
| Rsbuild 2.3.0    | 2539ms🥈           | 2292ms🥈             | 611ms   |
| Vite 8.3.5       | 3484ms🥉           | 2390ms🥉             | 348ms🥈 |
| webpack 5.112.2  | 7326ms             | 5090ms               | 740ms   |
| Utoo 1.5.34      | 6813ms             | 7911ms               | 323ms🥇 |

Build metrics:

| Name             | Build (no cache) | Build (with cache) | Output size | Gzipped size |
| ---------------- | ---------------- | ------------------ | ----------- | ------------ |
| Rspack CLI 2.3.0 | 3003ms🥈         | 1525ms🥈           | 4151.5kB🥉  | 638.5kB🥉    |
| Rsbuild 2.3.0    | 3951ms🥉         | 1501ms🥇           | 4148.4kB🥈  | 636.0kB🥈    |
| Vite 8.3.5       | 1799ms🥇         | 1810ms🥉           | 4160.2kB    | 646.7kB      |
| webpack 5.112.2  | 14537ms          | 4346ms             | 4154.3kB    | 640.0kB      |
| Utoo 1.5.34      | 19130ms          | 2509ms             | 4131.3kB🥇  | 616.8kB🥇    |

Dev memory (MiB):

| Name             | Steady (no cache) | Steady (with cache) | Peak (no cache) | Peak (with cache) |
| ---------------- | ----------------- | ------------------- | --------------- | ----------------- |
| Rspack CLI 2.3.0 | 572.9🥈           | 883.7               | 597.8🥇         | 899.1🥉           |
| Rsbuild 2.3.0    | 640.8🥉           | 916.6               | 666.1🥈         | 949.6             |
| Vite 8.3.5       | 1027.0            | 338.0🥈             | 1064.4          | 338.0🥇           |
| webpack 5.112.2  | 1083.2            | 865.0🥉             | 1101.6          | 945.8             |
| Utoo 1.5.34      | 357.2🥇           | 258.8🥇             | 737.4🥉         | 434.9🥈           |

Build memory (MiB):

| Name             | Peak (no cache) | Peak (with cache) |
| ---------------- | --------------- | ----------------- |
| Rspack CLI 2.3.0 | 750.5🥇         | 797.3🥈           |
| Rsbuild 2.3.0    | 759.2🥈         | 846.0🥉           |
| Vite 8.3.5       | 1048.7🥉        | 1047.0            |
| webpack 5.112.2  | 1491.5          | 1323.8            |
| Utoo 1.5.34      | 1283.1          | 304.2🥇           |

---

### react-1k

A React app with 1,000 components and 1,500 modules from node_modules, using dynamic imports to simulate SPA.

```bash
CASE=react-1k pnpm benchmark
```

Development metrics:

| Name             | Startup (no cache) | Startup (with cache) | HMR     |
| ---------------- | ------------------ | -------------------- | ------- |
| Rspack CLI 2.3.0 | 1158ms🥉           | 779ms                | 109ms🥉 |
| Rsbuild 2.3.0    | 839ms🥈            | 671ms🥉              | 112ms   |
| Vite 8.3.5       | 3227ms             | 2892ms               | 140ms   |
| webpack 5.112.2  | 4670ms             | 2999ms               | 357ms   |
| Farm 1.7.11      | 1403ms             | 669ms🥈              | 151ms   |
| Parcel 2.16.4    | 3370ms             | 831ms                | 176ms   |
| Utoo 1.5.34      | 3696ms             | 3001ms               | 91ms🥈  |
| Bun 1.4.4        | 738ms🥇            | 564ms🥇              | 11ms🥇  |

Build metrics:

| Name             | Build (no cache) | Build (with cache) | Output size | Gzipped size |
| ---------------- | ---------------- | ------------------ | ----------- | ------------ |
| Rspack CLI 2.3.0 | 529ms            | 295ms🥉            | 847.4kB     | 229.3kB🥉    |
| Rsbuild 2.3.0    | 457ms🥈          | 276ms🥈            | 845.2kB🥉   | 221.0kB🥇    |
| Vite 8.3.5       | 480ms🥉          | 444ms              | 825.7kB🥈   | 226.2kB🥈    |
| webpack 5.112.2  | 4749ms           | 1357ms             | 847.3kB     | 230.3kB      |
| Farm 1.7.11      | 1533ms           | 817ms              | 1094.9kB    | 267.2kB      |
| Parcel 2.16.4    | 3217ms           | 809ms              | 971.4kB     | 239.0kB      |
| Utoo 1.5.34      | 3763ms           | 669ms              | 850.6kB     | 239.9kB      |
| Bun 1.4.4        | 196ms🥇          | 195ms🥇            | 822.1kB🥇   | 240.5kB      |

Dev memory (MiB):

| Name             | Steady (no cache) | Steady (with cache) | Peak (no cache) | Peak (with cache) |
| ---------------- | ----------------- | ------------------- | --------------- | ----------------- |
| Rspack CLI 2.3.0 | 244.5             | 269.3               | 256.7🥉         | 273.4             |
| Rsbuild 2.3.0    | 215.9🥉           | 232.4🥉             | 222.7🥈         | 237.9🥉           |
| Vite 8.3.5       | 410.7             | 293.7               | 410.9           | 293.8             |
| webpack 5.112.2  | 687.0             | 717.8               | 838.9           | 818.0             |
| Farm 1.7.11      | 358.7             | 307.0               | 367.0           | 308.8             |
| Parcel 2.16.4    | 1014.9            | 731.1               | 1073.7          | 810.3             |
| Utoo 1.5.34      | 140.2🥈           | 180.6🥈             | 422.6           | 181.3🥈           |
| Bun 1.4.4        | 51.2🥇            | 51.1🥇              | 140.2🥇         | 140.2🥇           |

Build memory (MiB):

| Name             | Peak (no cache) | Peak (with cache) |
| ---------------- | --------------- | ----------------- |
| Rspack CLI 2.3.0 | 186.6🥈         | 165.1             |
| Rsbuild 2.3.0    | 191.5🥉         | 162.1🥉           |
| Vite 8.3.5       | 239.3           | 238.1             |
| webpack 5.112.2  | 570.8           | 444.3             |
| Farm 1.7.11      | 277.8           | 253.9             |
| Parcel 2.16.4    | 992.3           | 443.8             |
| Utoo 1.5.34      | 352.0           | 140.0🥈           |
| Bun 1.4.4        | 83.4🥇          | 97.1🥇            |

---

### react-5k

A React app with 5,000 components and 5,000 modules from node_modules, using dynamic imports to simulate SPA.

```bash
CASE=react-5k pnpm benchmark
```

Development metrics:

| Name             | Startup (no cache) | Startup (with cache) | HMR     |
| ---------------- | ------------------ | -------------------- | ------- |
| Rspack CLI 2.3.0 | 1423ms🥉           | 956ms🥇              | 79ms🥇  |
| Rsbuild 2.3.0    | 1024ms🥇           | 964ms🥈              | 97ms🥈  |
| Vite 8.3.5       | 5947ms             | 3443ms               | 137ms🥉 |
| webpack 5.112.2  | 17305ms            | 10715ms              | 1388ms  |
| Farm 1.7.11      | 1354ms🥈           | 1139ms🥉             | 149ms   |
| Parcel 2.16.4    | 16690ms            | 2177ms               | 508ms   |

Build metrics:

| Name             | Build (no cache) | Build (with cache) | Output size | Gzipped size |
| ---------------- | ---------------- | ------------------ | ----------- | ------------ |
| Rspack CLI 2.3.0 | 1701ms🥈         | 802ms🥇            | 2707.7kB🥉  | 682.4kB🥉    |
| Rsbuild 2.3.0    | 2069ms🥉         | 1136ms🥉           | 2637.8kB🥈  | 675.6kB🥇    |
| Vite 8.3.5       | 1096ms🥇         | 963ms🥈            | 2541.8kB🥇  | 693.7kB      |
| webpack 5.112.2  | 17491ms          | 4590ms             | 2710.7kB    | 682.1kB🥈    |
| Farm 1.7.11      | 6564ms           | 3093ms             | 3459.4kB    | 805.1kB      |
| Parcel 2.16.4    | 15925ms          | 2368ms             | 3403.9kB    | 767.7kB      |

Dev memory (MiB):

| Name             | Steady (no cache) | Steady (with cache) | Peak (no cache) | Peak (with cache) |
| ---------------- | ----------------- | ------------------- | --------------- | ----------------- |
| Rspack CLI 2.3.0 | 192.0🥈           | 212.0🥈             | 194.7🥈         | 218.1🥈           |
| Rsbuild 2.3.0    | 180.0🥇           | 191.8🥇             | 180.0🥇         | 191.9🥇           |
| Vite 8.3.5       | 658.2             | 228.3🥉             | 671.2           | 228.4🥉           |
| webpack 5.112.2  | 1896.5            | 1663.2              | 1918.0          | 1742.3            |
| Farm 1.7.11      | 345.6🥉           | 317.9               | 351.2🥉         | 322.7             |
| Parcel 2.16.4    | 1378.3            | 1102.9              | 1627.2          | 1211.7            |

Build memory (MiB):

| Name             | Peak (no cache) | Peak (with cache) |
| ---------------- | --------------- | ----------------- |
| Rspack CLI 2.3.0 | 422.0🥇         | 420.0🥉           |
| Rsbuild 2.3.0    | 440.1🥉         | 378.7🥇           |
| Vite 8.3.5       | 612.9           | 616.0             |
| webpack 5.112.2  | 1113.0          | 925.5             |
| Farm 1.7.11      | 434.3🥈         | 381.0🥈           |
| Parcel 2.16.4    | 1769.4          | 548.9             |

---

### react-10k

A React app with 10,000 components and 10,000 modules from node_modules, using dynamic imports to simulate SPA.

```bash
CASE=react-10k pnpm benchmark
```

Development metrics:

| Name             | Startup (no cache) | Startup (with cache) | HMR     |
| ---------------- | ------------------ | -------------------- | ------- |
| Rspack CLI 2.3.0 | 1278ms🥈           | 981ms🥈              | 97ms🥇  |
| Rsbuild 2.3.0    | 1256ms🥇           | 948ms🥇              | 115ms🥈 |
| Vite 8.3.5       | 6826ms🥉           | 5742ms🥉             | 134ms🥉 |
| webpack 5.112.2  | 20597ms            | 16740ms              | 2293ms  |

Build metrics:

| Name             | Build (no cache) | Build (with cache) | Output size | Gzipped size |
| ---------------- | ---------------- | ------------------ | ----------- | ------------ |
| Rspack CLI 2.3.0 | 2915ms🥈         | 1574ms🥈           | 5630.6kB🥉  | 1361.1kB🥉   |
| Rsbuild 2.3.0    | 3507ms🥉         | 1518ms🥇           | 5452.6kB🥈  | 1337.3kB🥇   |
| Vite 8.3.5       | 1840ms🥇         | 1744ms🥉           | 5232.4kB🥇  | 1407.5kB     |
| webpack 5.112.2  | 23310ms          | 6334ms             | 5638.2kB    | 1361.0kB🥈   |

Dev memory (MiB):

| Name             | Steady (no cache) | Steady (with cache) | Peak (no cache) | Peak (with cache) |
| ---------------- | ----------------- | ------------------- | --------------- | ----------------- |
| Rspack CLI 2.3.0 | 238.8🥈           | 265.7🥈             | 245.2🥈         | 274.9🥈           |
| Rsbuild 2.3.0    | 219.8🥇           | 232.0🥇             | 223.5🥇         | 233.3🥇           |
| Vite 8.3.5       | 1060.5🥉          | 285.2🥉             | 1082.6🥉        | 285.2🥉           |
| webpack 5.112.2  | 2469.0            | 2346.3              | 2713.4          | 2490.4            |

Build memory (MiB):

| Name             | Peak (no cache) | Peak (with cache) |
| ---------------- | --------------- | ----------------- |
| Rspack CLI 2.3.0 | 781.2🥇         | 753.6🥈           |
| Rsbuild 2.3.0    | 789.2🥈         | 663.3🥇           |
| Vite 8.3.5       | 1159.0🥉        | 1189.7🥉          |
| webpack 5.112.2  | 1956.3          | 1503.8            |

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
| Rspack CLI 2.3.0 | 7020ms           | 1811ms🥈           | 4940.5kB🥉  | 1435.4kB🥈   |
| Rsbuild 2.3.0    | 5456ms🥉         | 1713ms🥇           | 4940.2kB🥈  | 1434.9kB🥇   |
| Vite 8.3.5       | 4769ms🥈         | 3392ms             | 4936.6kB🥇  | 1440.4kB     |
| webpack 5.112.2  | 22606ms          | 11182ms            | 4953.8kB    | 1436.6kB🥉   |
| esbuild 0.28.2   | 4191ms🥇         | 3153ms             | 6151.4kB    | 1790.0kB     |
| Farm 1.7.11      | 20039ms          | 5451ms             | 8574.1kB    | 2901.0kB     |
| Parcel 2.16.4    | 32411ms          | 2865ms             | 5335.1kB    | 1511.2kB     |
| Utoo 1.5.34      | 22336ms          | 2525ms🥉           | 4984.3kB    | 1448.8kB     |

Build memory (MiB):

| Name             | Peak (no cache) | Peak (with cache) |
| ---------------- | --------------- | ----------------- |
| Rspack CLI 2.3.0 | 1069.3🥇        | 1243.6🥉          |
| Rsbuild 2.3.0    | 1186.4🥉        | 1284.1            |
| Vite 8.3.5       | 1772.0          | 1771.4            |
| webpack 5.112.2  | 1715.5          | 1443.0            |
| esbuild 0.28.2   | 1408.1          | 1413.6            |
| Farm 1.7.11      | 1695.3          | 1393.0            |
| Parcel 2.16.4    | 3257.9          | 707.4🥈           |
| Utoo 1.5.34      | 1152.5🥈        | 253.4🥇           |

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
| Rspack CLI 2.3.0 | 1403ms           | 446ms🥇            | 1817.8kB    | 553.5kB🥉    |
| Rsbuild 2.3.0    | 1320ms           | 569ms🥈            | 1817.5kB🥉  | 553.4kB🥈    |
| Vite 8.3.5       | 1186ms🥉         | 863ms              | 1813.6kB🥈  | 554.6kB      |
| Rollup 4.65.1    | 7488ms           | 10028ms            | 1764.2kB🥇  | 542.6kB🥇    |
| Rolldown 1.2.15  | 790ms🥇          | 675ms              | 1835.9kB    | 555.8kB      |
| webpack 5.112.2  | 5340ms           | 1087ms             | 1836.4kB    | 561.4kB      |
| esbuild 0.28.2   | 957ms🥈          | 905ms              | 2135.2kB    | 627.8kB      |
| Farm 1.7.11      | 4653ms           | 1545ms             | 2313.2kB    | 776.1kB      |
| Utoo 1.5.34      | 6329ms           | 668ms🥉            | 1846.1kB    | 562.7kB      |

Build memory (MiB):

| Name             | Peak (no cache) | Peak (with cache) |
| ---------------- | --------------- | ----------------- |
| Rspack CLI 2.3.0 | 361.0🥇         | 525.8             |
| Rsbuild 2.3.0    | 366.3🥈         | 529.4             |
| Vite 8.3.5       | 543.2           | 541.3             |
| Rollup 4.65.1    | 1282.1          | 1279.6            |
| Rolldown 1.2.15  | 519.2           | 522.3             |
| webpack 5.112.2  | 749.1           | 411.9🥈           |
| esbuild 0.28.2   | 476.3           | 429.7🥉           |
| Farm 1.7.11      | 564.6           | 509.2             |
| Utoo 1.5.34      | 457.8🥉         | 130.0🥇           |

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
