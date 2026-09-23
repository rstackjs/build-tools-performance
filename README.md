# Build Tools Comparison

Benchmark comparing JavaScript bundlers and build tools ([Rspack](https://github.com/web-infra-dev/rspack), [Rsbuild](https://github.com/web-infra-dev/rsbuild), [webpack](https://github.com/webpack/webpack), [Vite](https://github.com/vitejs/vite), [Rolldown](https://github.com/rolldown/rolldown), [esbuild](https://github.com/evanw/esbuild), [Rollup](https://github.com/rollup/rollup), [Parcel](https://github.com/parcel-bundler/parcel), [Farm](https://github.com/farm-fe/farm) and [Utoo](https://github.com/utooland/utoo)) for dev server startup time, build performance and bundle size for applications with different module sizes.

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

- Build target is set to `es2022` (`Chrome >= 93`) for all tools.
- Minification is enabled in production for all tools.
- Source map is enabled in development and disabled in production for all tools.
- Benchmarks run on GitHub Actions with variable hardware, which may cause inconsistent results.

Tooling details:

- webpack is configured to use SWC instead of Babel / Terser.
- Vite uses Rolldown and Oxc.

## Results

> Data from [GitHub Actions](https://github.com/rstackjs/build-tools-performance/actions/runs/35840288835) (2026-09-23, commit `e0caefef`). Values are medians of three measured runs after two warmups; memory is process-tree physical footprint in MiB. See [memory methodology](#memory-methodology).

---

### react-1k

A React app with 1,000 components and 1,500 modules from node_modules, using dynamic imports to simulate SPA.

```bash
CASE=react-1k pnpm benchmark
```

Development metrics:

| Name             | Startup (no cache) | Startup (with cache) | HMR    |
| ---------------- | ------------------ | -------------------- | ------ |
| Rspack CLI 2.2.7 | 1103ms🥇           | 944ms🥈              | 96ms🥈 |
| Rsbuild 2.2.9    | 1321ms🥈           | 1106ms🥉             | 106ms  |
| Vite 8.3.0       | 5355ms             | 5282ms               | 122ms  |
| webpack 5.111.1  | 6206ms             | 4424ms               | 379ms  |
| Farm 1.7.11      | 1865ms🥉           | 760ms🥇              | 98ms🥉 |
| Parcel 2.16.4    | 4730ms             | 1280ms               | 143ms  |
| Utoo 1.5.20      | 5154ms             | 1214ms               | 81ms🥇 |

Build metrics:

| Name             | Build (no cache) | Build (with cache) | Output size | Gzipped size |
| ---------------- | ---------------- | ------------------ | ----------- | ------------ |
| Rspack CLI 2.2.7 | 729ms🥉          | 391ms🥇            | 847.6kB     | 230.8kB      |
| Rsbuild 2.2.9    | 592ms🥇          | 392ms🥈            | 845.3kB🥈   | 221.0kB🥇    |
| Vite 8.3.0       | 717ms🥈          | 725ms              | 825.6kB🥇   | 225.8kB🥈    |
| webpack 5.111.1  | 4945ms           | 1768ms             | 847.4kB🥉   | 230.3kB🥉    |
| Farm 1.7.11      | 2054ms           | 958ms              | 1095.0kB    | 265.9kB      |
| Parcel 2.16.4    | 4221ms           | 843ms              | 971.5kB     | 239.0kB      |
| Utoo 1.5.20      | 4328ms           | 539ms🥉            | 850.1kB     | 239.7kB      |

Dev memory (MiB):

| Name             | Steady (no cache) | Steady (with cache) | Peak (no cache) | Peak (with cache) |
| ---------------- | ----------------- | ------------------- | --------------- | ----------------- |
| Rspack CLI 2.2.7 | 261.0🥉           | 276.3🥉             | 283.8🥈         | 286.0🥉           |
| Rsbuild 2.2.9    | 218.9🥈           | 228.8🥈             | 242.1🥇         | 229.5🥈           |
| Vite 8.3.0       | 419.4             | 294.7               | 419.5           | 294.8             |
| webpack 5.111.1  | 736.9             | 682.1               | 869.3           | 776.9             |
| Farm 1.7.11      | 354.2             | 301.8               | 377.2🥉         | 305.1             |
| Parcel 2.16.4    | 1001.6            | 700.3               | 1080.0          | 757.7             |
| Utoo 1.5.20      | 151.2🥇           | 178.7🥇             | 404.3           | 179.1🥇           |

Build memory (MiB):

| Name             | Peak (no cache) | Peak (with cache) |
| ---------------- | --------------- | ----------------- |
| Rspack CLI 2.2.7 | 205.4🥈         | 181.2🥉           |
| Rsbuild 2.2.9    | 204.2🥇         | 166.5🥈           |
| Vite 8.3.0       | 235.0🥉         | 239.3             |
| webpack 5.111.1  | 601.3           | 429.4             |
| Farm 1.7.11      | 284.7           | 258.4             |
| Parcel 2.16.4    | 1009.1          | 393.3             |
| Utoo 1.5.20      | 355.9           | 134.0🥇           |

---

### react-5k

A React app with 5,000 components and 5,000 modules from node_modules, using dynamic imports to simulate SPA.

```bash
CASE=react-5k pnpm benchmark
```

Development metrics:

| Name             | Startup (no cache) | Startup (with cache) | HMR     |
| ---------------- | ------------------ | -------------------- | ------- |
| Rspack CLI 2.2.7 | 843ms🥇            | 754ms🥉              | 92ms🥇  |
| Rsbuild 2.2.9    | 1046ms🥈           | 641ms🥈              | 114ms🥈 |
| Vite 8.3.0       | 3418ms             | 2544ms               | 119ms🥉 |
| webpack 5.111.1  | 8993ms             | 6782ms               | 942ms   |
| Farm 1.7.11      | 1110ms🥉           | 571ms🥇              | 153ms   |
| Parcel 2.16.4    | 14068ms            | 1670ms               | 323ms   |

Build metrics:

| Name             | Build (no cache) | Build (with cache) | Output size | Gzipped size |
| ---------------- | ---------------- | ------------------ | ----------- | ------------ |
| Rspack CLI 2.2.7 | 1811ms🥉         | 901ms🥇            | 2707.9kB🥉  | 682.8kB🥉    |
| Rsbuild 2.2.9    | 1528ms🥈         | 916ms🥈            | 2637.9kB🥈  | 675.6kB🥇    |
| Vite 8.3.0       | 1509ms🥇         | 1078ms🥉           | 2541.6kB🥇  | 693.4kB      |
| webpack 5.111.1  | 10772ms          | 2983ms             | 2710.7kB    | 682.1kB🥈    |
| Farm 1.7.11      | 5124ms           | 1774ms             | 3459.4kB    | 801.0kB      |
| Parcel 2.16.4    | 12311ms          | 1819ms             | 3403.9kB    | 767.8kB      |

Dev memory (MiB):

| Name             | Steady (no cache) | Steady (with cache) | Peak (no cache) | Peak (with cache) |
| ---------------- | ----------------- | ------------------- | --------------- | ----------------- |
| Rspack CLI 2.2.7 | 202.9🥈           | 211.0🥈             | 219.2🥈         | 218.6🥈           |
| Rsbuild 2.2.9    | 183.9🥇           | 191.3🥇             | 191.5🥇         | 192.4🥇           |
| Vite 8.3.0       | 664.1             | 234.7🥉             | 678.7           | 237.0🥉           |
| webpack 5.111.1  | 1194.6            | 1700.6              | 1965.8          | 1824.9            |
| Farm 1.7.11      | 344.8🥉           | 320.8               | 351.2🥉         | 322.3             |
| Parcel 2.16.4    | 1377.8            | 1030.5              | 1550.4          | 1190.1            |

Build memory (MiB):

| Name             | Peak (no cache) | Peak (with cache) |
| ---------------- | --------------- | ----------------- |
| Rspack CLI 2.2.7 | 502.2🥉         | 441.0🥉           |
| Rsbuild 2.2.9    | 499.3🥈         | 388.5🥈           |
| Vite 8.3.0       | 612.7           | 613.2             |
| webpack 5.111.1  | 1347.9          | 933.0             |
| Farm 1.7.11      | 422.9🥇         | 379.0🥇           |
| Parcel 2.16.4    | 1761.3          | 625.8             |

---

### react-10k

A React app with 10,000 components and 10,000 modules from node_modules, using dynamic imports to simulate SPA.

```bash
CASE=react-10k pnpm benchmark
```

Development metrics:

| Name             | Startup (no cache) | Startup (with cache) | HMR     |
| ---------------- | ------------------ | -------------------- | ------- |
| Rspack CLI 2.2.7 | 989ms🥇            | 895ms🥇              | 100ms🥈 |
| Rsbuild 2.2.9    | 1401ms🥈           | 1139ms🥈             | 133ms🥉 |
| Vite 8.3.0       | 8548ms🥉           | 5700ms🥉             | 85ms🥇  |
| webpack 5.111.1  | 21701ms            | 19136ms              | 2665ms  |

Build metrics:

| Name             | Build (no cache) | Build (with cache) | Output size | Gzipped size |
| ---------------- | ---------------- | ------------------ | ----------- | ------------ |
| Rspack CLI 2.2.7 | 3644ms🥈         | 1750ms🥇           | 5630.8kB🥉  | 1361.6kB🥉   |
| Rsbuild 2.2.9    | 4132ms🥉         | 2248ms🥈           | 5452.8kB🥈  | 1337.3kB🥇   |
| Vite 8.3.0       | 2416ms🥇         | 2466ms🥉           | 5232.3kB🥇  | 1407.1kB     |
| webpack 5.111.1  | 22756ms          | 5824ms             | 5638.3kB    | 1361.1kB🥈   |

Dev memory (MiB):

| Name             | Steady (no cache) | Steady (with cache) | Peak (no cache) | Peak (with cache) |
| ---------------- | ----------------- | ------------------- | --------------- | ----------------- |
| Rspack CLI 2.2.7 | 250.5🥈           | 263.5🥈             | 281.7🥈         | 275.1🥈           |
| Rsbuild 2.2.9    | 219.5🥇           | 248.6🥇             | 238.5🥇         | 249.8🥇           |
| Vite 8.3.0       | 1079.6🥉          | 299.6🥉             | 1100.1🥉        | 303.3🥉           |
| webpack 5.111.1  | 2106.5            | 2348.8              | 2804.2          | 2482.6            |

Build memory (MiB):

| Name             | Peak (no cache) | Peak (with cache) |
| ---------------- | --------------- | ----------------- |
| Rspack CLI 2.2.7 | 924.4🥈         | 815.7🥈           |
| Rsbuild 2.2.9    | 917.7🥇         | 703.4🥇           |
| Vite 8.3.0       | 1142.2🥉        | 1133.5🥉          |
| webpack 5.111.1  | 2102.8          | 1576.1            |

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
| Rspack CLI 2.2.7 | 5840ms🥉         | 1970ms🥈           | 4949.4kB🥉  | 1441.7kB🥈   |
| Rsbuild 2.2.9    | 7354ms           | 2580ms🥉           | 4949.2kB🥈  | 1441.3kB🥇   |
| Vite 8.3.0       | 4360ms🥇         | 3898ms             | 4948.9kB🥇  | 1448.2kB     |
| webpack 5.111.1  | 35674ms          | 18587ms            | 4963.1kB    | 1443.4kB🥉   |
| esbuild 0.28.2   | 5333ms🥈         | 4330ms             | 6129.1kB    | 1794.5kB     |
| Farm 1.7.11      | 19544ms          | 5571ms             | 8454.1kB    | 2868.4kB     |
| Parcel 2.16.4    | 33675ms          | 2844ms             | 5220.9kB    | 1479.4kB     |
| Utoo 1.5.20      | 24077ms          | 1423ms🥇           | 5098.8kB    | 1487.5kB     |

Build memory (MiB):

| Name             | Peak (no cache) | Peak (with cache) |
| ---------------- | --------------- | ----------------- |
| Rspack CLI 2.2.7 | 1159.2🥇        | 1341.6            |
| Rsbuild 2.2.9    | 1285.5🥉        | 1356.5            |
| Vite 8.3.0       | 1730.2          | 1727.0            |
| webpack 5.111.1  | 2366.8          | 2240.8            |
| esbuild 0.28.2   | 1382.1          | 1289.7🥉          |
| Farm 1.7.11      | 1658.2          | 1351.3            |
| Parcel 2.16.4    | 3008.0          | 720.5🥈           |
| Utoo 1.5.20      | 1210.5🥈        | 248.3🥇           |

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
| Rspack CLI 2.2.7 | 2307ms           | 763ms🥈            | 1776.8kB    | 541.3kB🥉    |
| Rsbuild 2.2.9    | 1812ms           | 769ms🥉            | 1776.4kB🥉  | 541.2kB🥈    |
| Vite 8.3.0       | 1369ms🥉         | 1407ms             | 1771.2kB🥈  | 541.7kB      |
| Rollup 4.63.4    | 10643ms          | 10640ms            | 1719.7kB🥇  | 528.5kB🥇    |
| Rolldown 1.2.9   | 1115ms🥇         | 1067ms             | 1794.6kB    | 542.3kB      |
| webpack 5.111.1  | 7321ms           | 2222ms             | 1792.4kB    | 547.6kB      |
| esbuild 0.28.2   | 1218ms🥈         | 1237ms             | 2099.4kB    | 615.8kB      |
| Farm 1.7.11      | 5736ms           | 1963ms             | 2264.6kB    | 758.9kB      |
| Utoo 1.5.20      | 7161ms           | 552ms🥇            | 1907.8kB    | 585.5kB      |

Build memory (MiB):

| Name             | Peak (no cache) | Peak (with cache) |
| ---------------- | --------------- | ----------------- |
| Rspack CLI 2.2.7 | 369.3🥇         | 559.0             |
| Rsbuild 2.2.9    | 371.9🥈         | 574.2             |
| Vite 8.3.0       | 550.6           | 561.7             |
| Rollup 4.63.4    | 1251.1          | 1259.9            |
| Rolldown 1.2.9   | 513.2           | 511.6             |
| webpack 5.111.1  | 854.1           | 432.9🥈           |
| esbuild 0.28.2   | 423.6🥉         | 454.4🥉           |
| Farm 1.7.11      | 561.1           | 506.5             |
| Utoo 1.5.20      | 449.7           | 122.3🥇           |

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
