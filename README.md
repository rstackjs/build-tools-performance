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

> Data from [GitHub Actions](https://github.com/rstackjs/build-tools-performance/actions/runs/35555591750) (2026-09-21, commit `85dbbf2d`). Values are medians of three measured runs after two warmups; memory is process-tree physical footprint in MiB. See [memory methodology](#memory-methodology).

---

### react-1k

A React app with 1,000 components and 1,500 modules from node_modules, using dynamic imports to simulate SPA.

```bash
CASE=react-1k pnpm benchmark
```

Development metrics:

| Name                | Startup (no cache) | Startup (with cache) | HMR     |
| ------------------- | ------------------ | -------------------- | ------- |
| Rspack CLI 2.2.5    | 901ms🥇            | 962ms                | 91ms🥇  |
| Rsbuild 2.2.7       | 1252ms🥈           | 914ms🥉              | 125ms🥉 |
| Vite 8.3.0          | 3868ms             | 3400ms               | 130ms   |
| webpack 5.111.0     | 7496ms             | 4608ms               | 417ms   |
| Farm 1.7.11         | 1478ms🥉           | 724ms🥈              | 146ms   |
| Parcel 2.16.4       | 4882ms             | 1110ms               | 191ms   |
| Utoo 1.5.19-alpha.1 | 5027ms             | 694ms🥇              | 97ms🥈  |

Build metrics:

| Name                | Build (no cache) | Build (with cache) | Output size | Gzipped size |
| ------------------- | ---------------- | ------------------ | ----------- | ------------ |
| Rspack CLI 2.2.5    | 615ms🥈          | 331ms🥇            | 847.6kB     | 230.8kB      |
| Rsbuild 2.2.7       | 862ms🥉          | 351ms🥈            | 845.3kB🥈   | 221.0kB🥇    |
| Vite 8.3.0          | 535ms🥇          | 463ms              | 825.6kB🥇   | 225.8kB🥈    |
| webpack 5.111.0     | 4525ms           | 1546ms             | 847.4kB🥉   | 230.3kB🥉    |
| Farm 1.7.11         | 1842ms           | 927ms              | 1095.0kB    | 265.9kB      |
| Parcel 2.16.4       | 4285ms           | 948ms              | 971.5kB     | 239.0kB      |
| Utoo 1.5.19-alpha.1 | 4553ms           | 409ms🥉            | 850.1kB     | 239.7kB      |

Memory metrics:

| Name                | Dev steady (no cache) | Dev peak (no cache) | Dev steady (with cache) | Dev peak (with cache) | Build peak (no cache) | Build peak (with cache) |
| ------------------- | --------------------- | ------------------- | ----------------------- | --------------------- | --------------------- | ----------------------- |
| Rspack CLI 2.2.5    | 264.8 MiB🥈           | 297.4 MiB🥇         | 281.2 MiB🥉             | 281.2 MiB🥉           | 205.3 MiB🥇           | 190.1 MiB🥉             |
| Rsbuild 2.2.7       | 339.2 MiB🥉           | 358.8 MiB🥈         | 245.4 MiB🥈             | 245.4 MiB🥈           | 302.4 MiB             | 160.4 MiB🥈             |
| Vite 8.3.0          | 360.3 MiB             | 387.8 MiB           | 288.1 MiB               | 288.8 MiB             | 239.9 MiB🥈           | 237.1 MiB               |
| webpack 5.111.0     | 721.9 MiB             | 860.0 MiB           | 654.2 MiB               | 781.7 MiB             | 598.8 MiB             | 434.9 MiB               |
| Farm 1.7.11         | 364.0 MiB             | 373.1 MiB🥉         | 304.2 MiB               | 304.2 MiB             | 277.4 MiB🥉           | 256.6 MiB               |
| Parcel 2.16.4       | 986.3 MiB             | 1079.6 MiB          | 753.0 MiB               | 834.5 MiB             | 993.0 MiB             | 402.6 MiB               |
| Utoo 1.5.19-alpha.1 | 155.1 MiB🥇           | 412.1 MiB           | 179.0 MiB🥇             | 179.0 MiB🥇           | 352.6 MiB             | 133.8 MiB🥇             |

---

### react-5k

A React app with 5,000 components and 5,000 modules from node_modules, using dynamic imports to simulate SPA.

```bash
CASE=react-5k pnpm benchmark
```

Development metrics:

| Name             | Startup (no cache) | Startup (with cache) | HMR     |
| ---------------- | ------------------ | -------------------- | ------- |
| Rspack CLI 2.2.5 | 615ms🥇            | 471ms🥇              | 101ms🥇 |
| Rsbuild 2.2.7    | 908ms🥈            | 518ms🥈              | 109ms🥈 |
| Vite 8.3.0       | 3198ms             | 1902ms               | 137ms🥉 |
| webpack 5.111.0  | 8209ms             | 6311ms               | 809ms   |
| Farm 1.7.11      | 1288ms🥉           | 531ms🥉              | 140ms   |
| Parcel 2.16.4    | 10231ms            | 1088ms               | 192ms   |

Build metrics:

| Name             | Build (no cache) | Build (with cache) | Output size | Gzipped size |
| ---------------- | ---------------- | ------------------ | ----------- | ------------ |
| Rspack CLI 2.2.5 | 1308ms🥈         | 653ms🥈            | 2707.9kB🥉  | 682.8kB🥉    |
| Rsbuild 2.2.7    | 1895ms🥉         | 627ms🥇            | 2637.9kB🥈  | 675.6kB🥇    |
| Vite 8.3.0       | 934ms🥇          | 1004ms🥉           | 2541.6kB🥇  | 693.4kB      |
| webpack 5.111.0  | 8851ms           | 2924ms             | 2710.9kB    | 682.2kB🥈    |
| Farm 1.7.11      | 4597ms           | 1978ms             | 3459.4kB    | 801.0kB      |
| Parcel 2.16.4    | 9380ms           | 1327ms             | 3403.9kB    | 767.8kB      |

Memory metrics:

| Name             | Dev steady (no cache) | Dev peak (no cache) | Dev steady (with cache) | Dev peak (with cache) | Build peak (no cache) | Build peak (with cache) |
| ---------------- | --------------------- | ------------------- | ----------------------- | --------------------- | --------------------- | ----------------------- |
| Rspack CLI 2.2.5 | 204.9 MiB🥇           | 220.9 MiB🥇         | 211.0 MiB🥈             | 219.2 MiB🥈           | 514.0 MiB🥈           | 500.0 MiB🥉             |
| Rsbuild 2.2.7    | 239.2 MiB🥈           | 249.5 MiB🥈         | 193.9 MiB🥇             | 193.9 MiB🥇           | 846.6 MiB             | 398.2 MiB🥈             |
| Vite 8.3.0       | 446.2 MiB             | 650.1 MiB           | 223.5 MiB🥉             | 226.3 MiB🥉           | 609.6 MiB🥉           | 617.9 MiB               |
| webpack 5.111.0  | 1884.0 MiB            | 1953.0 MiB          | 1694.8 MiB              | 1783.2 MiB            | 1245.2 MiB            | 936.7 MiB               |
| Farm 1.7.11      | 350.6 MiB🥉           | 358.8 MiB🥉         | 325.6 MiB               | 326.2 MiB             | 424.5 MiB🥇           | 381.7 MiB🥇             |
| Parcel 2.16.4    | 1400.5 MiB            | 1592.9 MiB          | 1064.1 MiB              | 1153.5 MiB            | 1761.3 MiB            | 633.4 MiB               |

---

### react-10k

A React app with 10,000 components and 10,000 modules from node_modules, using dynamic imports to simulate SPA.

```bash
CASE=react-10k pnpm benchmark
```

Development metrics:

| Name             | Startup (no cache) | Startup (with cache) | HMR    |
| ---------------- | ------------------ | -------------------- | ------ |
| Rspack CLI 2.2.5 | 1051ms🥈           | 707ms🥈              | 98ms🥈 |
| Rsbuild 2.2.7    | 953ms🥇            | 554ms🥇              | 99ms🥉 |
| Vite 8.3.0       | 5072ms🥉           | 2710ms🥉             | 85ms🥇 |
| webpack 5.111.0  | 16291ms            | 12251ms              | 1849ms |

Build metrics:

| Name             | Build (no cache) | Build (with cache) | Output size | Gzipped size |
| ---------------- | ---------------- | ------------------ | ----------- | ------------ |
| Rspack CLI 2.2.5 | 2598ms🥈         | 1214ms🥈           | 5630.8kB🥉  | 1361.6kB🥉   |
| Rsbuild 2.2.7    | 2878ms🥉         | 980ms🥇            | 5452.8kB🥈  | 1337.3kB🥇   |
| Vite 8.3.0       | 1183ms🥇         | 1338ms🥉           | 5232.3kB🥇  | 1407.1kB     |
| webpack 5.111.0  | 18168ms          | 5536ms             | 5638.3kB    | 1361.1kB🥈   |

Memory metrics:

| Name             | Dev steady (no cache) | Dev peak (no cache) | Dev steady (with cache) | Dev peak (with cache) | Build peak (no cache) | Build peak (with cache) |
| ---------------- | --------------------- | ------------------- | ----------------------- | --------------------- | --------------------- | ----------------------- |
| Rspack CLI 2.2.5 | 254.7 MiB🥇           | 286.2 MiB🥇         | 267.3 MiB🥈             | 279.5 MiB🥈           | 938.5 MiB🥇           | 817.9 MiB🥈             |
| Rsbuild 2.2.7    | 258.0 MiB🥈           | 369.6 MiB🥈         | 235.6 MiB🥇             | 235.6 MiB🥇           | 1552.6 MiB🥉          | 713.3 MiB🥇             |
| Vite 8.3.0       | 562.3 MiB🥉           | 1112.2 MiB🥉        | 292.3 MiB🥉             | 292.7 MiB🥉           | 1129.3 MiB🥈          | 1140.0 MiB🥉            |
| webpack 5.111.0  | 2173.8 MiB            | 2809.8 MiB          | 2351.3 MiB              | 2496.9 MiB            | 2095.0 MiB            | 1550.6 MiB              |

---

### ui-components

A React app that imports UI components from several popular UI libraries.

Including [@mui/material](https://npmjs.com/package/@mui/material), [@radix-ui/themes](https://npmjs.com/package/@radix-ui/themes), [antd](https://npmjs.com/package/antd), [antd-mobile](https://npmjs.com/package/antd-mobile), [@chakra-ui/react](https://npmjs.com/package/@chakra-ui/react), [@fluentui/react](https://npmjs.com/package/@fluentui/react), [@headlessui/react](https://npmjs.com/package/@headlessui/react), [@mantine/core](https://npmjs.com/package/@mantine/core), [react-bootstrap](https://npmjs.com/package/react-bootstrap), [primereact](https://npmjs.com/package/primereact), [rsuite](https://npmjs.com/package/rsuite), [@arco-design/web-react](https://npmjs.com/package/@arco-design/web-react), [@coreui/react](https://npmjs.com/package/@coreui/react), [element-plus](https://npmjs.com/package/element-plus), [ant-design-vue](https://npmjs.com/package/ant-design-vue), [naive-ui](https://npmjs.com/package/naive-ui), [primevue](https://npmjs.com/package/primevue), [vant](https://npmjs.com/package/vant), and [vuetify](https://npmjs.com/package/vuetify).

```bash
CASE=ui-components pnpm benchmark
```

Build metrics:

| Name                | Build (no cache) | Build (with cache) | Output size | Gzipped size |
| ------------------- | ---------------- | ------------------ | ----------- | ------------ |
| Rspack CLI 2.2.5    | 4877ms🥈         | 1894ms🥈           | 5232.8kB🥈  | 1511.0kB🥈   |
| Rsbuild 2.2.7       | 7145ms           | 2250ms🥉           | 5232.6kB🥇  | 1510.6kB🥇   |
| Vite 8.3.0          | 4159ms🥇         | 3051ms             | 5235.7kB🥉  | 1519.4kB     |
| webpack 5.111.0     | 25201ms          | 12645ms            | 5246.7kB    | 1512.5kB🥉   |
| esbuild 0.28.2      | 5796ms🥉         | 3813ms             | 6415.0kB    | 1861.9kB     |
| Farm 1.7.11         | 16389ms          | 4908ms             | 8737.6kB    | 2956.9kB     |
| Parcel 2.16.4       | 30710ms          | 2255ms             | 5502.0kB    | 1547.4kB     |
| Utoo 1.5.19-alpha.1 | 25372ms          | 1171ms🥇           | 5375.4kB    | 1555.6kB     |

Memory metrics:

| Name                | Build peak (no cache) | Build peak (with cache) |
| ------------------- | --------------------- | ----------------------- |
| Rspack CLI 2.2.5    | 1188.3 MiB🥈          | 1335.2 MiB🥉            |
| Rsbuild 2.2.7       | 1656.5 MiB            | 1364.6 MiB              |
| Vite 8.3.0          | 1704.8 MiB            | 1697.5 MiB              |
| webpack 5.111.0     | 2383.2 MiB            | 2239.5 MiB              |
| esbuild 0.28.2      | 1369.6 MiB🥉          | 1398.4 MiB              |
| Farm 1.7.11         | 1654.4 MiB            | 1372.3 MiB              |
| Parcel 2.16.4       | 3047.3 MiB            | 831.8 MiB🥈             |
| Utoo 1.5.19-alpha.1 | 1185.8 MiB🥇          | 249.1 MiB🥇             |

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

| Name                | Build (no cache) | Build (with cache) | Output size | Gzipped size |
| ------------------- | ---------------- | ------------------ | ----------- | ------------ |
| Rspack CLI 2.2.5    | 1428ms           | 556ms🥉            | 1778.0kB    | 541.5kB🥉    |
| Rsbuild 2.2.7       | 1554ms           | 498ms🥈            | 1777.1kB🥉  | 541.2kB🥈    |
| Vite 8.3.0          | 1226ms🥉         | 958ms              | 1776.5kB🥈  | 543.9kB      |
| Rollup 4.63.3       | 8785ms           | 8064ms             | 1721.4kB🥇  | 528.8kB🥇    |
| Rolldown 1.2.8      | 742ms🥇          | 730ms              | 1777.2kB    | 542.7kB      |
| webpack 5.111.0     | 6364ms           | 1524ms             | 1793.0kB    | 547.5kB      |
| esbuild 0.28.2      | 992ms🥈          | 927ms              | 2101.1kB    | 615.9kB      |
| Farm 1.7.11         | 4774ms           | 1508ms             | 2265.8kB    | 759.4kB      |
| Utoo 1.5.19-alpha.1 | 5642ms           | 398ms🥇            | 1912.7kB    | 587.7kB      |

Memory metrics:

| Name                | Build peak (no cache) | Build peak (with cache) |
| ------------------- | --------------------- | ----------------------- |
| Rspack CLI 2.2.5    | 368.8 MiB🥇           | 556.3 MiB               |
| Rsbuild 2.2.7       | 424.1 MiB🥉           | 568.2 MiB               |
| Vite 8.3.0          | 559.6 MiB             | 564.0 MiB               |
| Rollup 4.63.3       | 1253.3 MiB            | 1264.3 MiB              |
| Rolldown 1.2.8      | 515.7 MiB             | 513.8 MiB               |
| webpack 5.111.0     | 825.8 MiB             | 430.3 MiB🥉             |
| esbuild 0.28.2      | 410.8 MiB🥈           | 419.3 MiB🥈             |
| Farm 1.7.11         | 558.7 MiB             | 502.2 MiB               |
| Utoo 1.5.19-alpha.1 | 453.0 MiB             | 120.6 MiB🥇             |

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
