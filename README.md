# Build Tools Comparison

Benchmark comparing JavaScript bundlers and build tools ([Rspack](https://github.com/web-infra-dev/rspack), [Rsbuild](https://github.com/web-infra-dev/rsbuild), [webpack](https://github.com/webpack/webpack), [Vite](https://github.com/vitejs/vite), [Rolldown](https://github.com/rolldown/rolldown), [esbuild](https://github.com/evanw/esbuild), [Rollup](https://github.com/rollup/rollup), [Parcel](https://github.com/parcel-bundler/parcel), [Farm](https://github.com/farm-fe/farm) and [Utoo](https://github.com/utooland/utoo)) for dev server startup time, build performance and bundle size for applications with different module sizes.

## Metrics

| Name                     | Description                                                                |
| ------------------------ | -------------------------------------------------------------------------- |
| **Startup (no cache)**   | Time from starting the dev server to page loaded                           |
| **Startup (with cache)** | Time from starting the dev server to page loaded with cache                |
| **HMR**                  | Time to HMR after changing a module                                        |
| **Build (no cache)**     | Time taken to build the production bundles                                 |
| **Build (with cache)**   | Time taken to build the production bundles with cache                      |
| **Memory steady**        | Dev server memory after 10 HMR updates and a fixed idle window, with and without cache |
| **Memory peak**          | Sampled peak memory during dev or a production build, with and without cache |
| **Output size**          | Total size of the output bundle, minified with the default minifier        |
| **Gzipped size**         | Gzipped size of the output bundle, represents actual network transfer size |

## Notes

- Build target is set to `es2022` (`Chrome >= 93`) for all tools.
- Minification is enabled in production for all tools.
- Source map is enabled in development and disabled in production for all tools.
- Benchmarks run on GitHub Actions with variable hardware, which may cause inconsistent results.

Tooling details:

- webpack is configured to use SWC instead of Babel / Terser.
- Vite uses Rolldown and Oxc.

## Memory methodology

- On macOS (including CI), memory means **physical footprint**, queried with `proc_pid_rusage`. On Linux, the fallback is **RSS**, which counts shared resident pages in each process; results explicitly name the metric. Do not compare these two metrics across operating systems.
- Sample the entire command process tree and process group, including launchers and child processes, approximately every **50 ms**. Browser, benchmark driver, and sampler processes are excluded. Threads are included once through their owning process.
- On macOS, a temporarily inaccessible child (such as the setuid system `ps`) triggers a bounded retry of the entire snapshot. Partial totals are discarded, persistent errors fail the run, and actual sampling gaps remain visible in the raw timestamps.
- **Dev steady:** load the fixture's `/` route (other lazy routes are not visited), wait for network idle, then perform 10 alternating root/leaf HMR updates. Keep the page connected, idle for 5 seconds, and take the median of the following 2-second observation window. Restore edited files only after measurement and server shutdown.
- **Dev peak:** the largest sampled total from process startup through that steady window. **Build peak:** the largest sampled total from command startup to exit. Sum processes at each sample before taking the peak; short-lived peaks between samples can be missed.
- Cold and warm cache scenarios are measured separately, without forced GC. Memory is reported in **MiB**, as the median **(minimum–maximum)** across measured runs. Timing also uses the median across runs; HMR averages the root and leaf medians from the five updates of each in the cold session.
- Raw per-process samples, environment details, individual runs, and summaries are saved under `results/<case>-<timestamp>/` (override with `RESULTS_DIR`). CI uploads them as artifacts and adds tables to the job summary.
- Local memory measurement supports macOS and Linux. macOS requires the Xcode Command Line Tools (`cc`); the small native helper is compiled once before timing starts.

## Results

> **Historical results:** the tables below predate the process-tree methodology above. Their memory column is a single-process RSS snapshot (after HMR for dev, just before exit for build), not a steady-window measurement or a peak. The legacy script labelled binary MiB values as MB. Timing values used arithmetic means. These numbers cannot be compared directly with new results.

> Data from GitHub Actions: https://github.com/rstackjs/build-tools-performance/actions/runs/35064814264 (2026-09-16)

---

### react-1k

A React app with 1,000 components and 1,500 modules from node_modules, using dynamic imports to simulate SPA.

```bash
CASE=react-1k pnpm benchmark
```

Development metrics:

| Name             | Startup (no cache) | Startup (with cache) | HMR     | Memory (RSS) |
| ---------------- | ------------------ | -------------------- | ------- | ------------ |
| Rspack CLI 2.2.5 | 1784ms🥇           | 1336ms🥉             | 168ms🥉 | 358MB🥇      |
| Rsbuild 2.2.7    | 1843ms🥈           | 1041ms🥈             | 201ms   | 414MB🥈      |
| Vite 8.3.0       | 6769ms             | 5669ms               | 127ms🥇 | 504MB        |
| webpack 5.111.0  | 7840ms             | 5541ms               | 867ms   | 884MB        |
| Farm 1.7.11      | 1911ms🥉           | 882ms🥇              | 164ms🥈 | 553MB        |
| Parcel 2.16.4    | 5277ms             | 1375ms               | 326ms   | 1137MB       |
| Utoo 1.5.18      | 10836ms            | 1381ms               | 204ms   | 415MB🥉      |

Build metrics:

| Name             | Build (no cache) | Build (with cache) | Memory (RSS) | Output size | Gzipped size |
| ---------------- | ---------------- | ------------------ | ------------ | ----------- | ------------ |
| Rspack CLI 2.2.5 | 1336ms🥉         | 1144ms             | 260MB🥇      | 847.6kB     | 230.8kB      |
| Rsbuild 2.2.7    | 968ms🥈          | 451ms🥇            | 346MB🥉      | 845.3kB🥈   | 221.0kB🥇    |
| Vite 8.3.0       | 858ms🥇          | 887ms🥉            | 292MB🥈      | 825.6kB🥇   | 225.8kB🥈    |
| webpack 5.111.0  | 6147ms           | 1913ms             | 677MB        | 847.4kB🥉   | 230.3kB🥉    |
| Farm 1.7.11      | 2323ms           | 1220ms             | 388MB        | 1095.0kB    | 265.9kB      |
| Parcel 2.16.4    | 5747ms           | 1242ms             | 1145MB       | 971.5kB     | 239.0kB      |
| Utoo 1.5.18      | 9412ms           | 687ms🥈            | 414MB        | 850.1kB     | 239.4kB      |

---

### react-5k

A React app with 5,000 components and 5,000 modules from node_modules, using dynamic imports to simulate SPA.

```bash
CASE=react-5k pnpm benchmark
```

Development metrics:

| Name             | Startup (no cache) | Startup (with cache) | HMR     | Memory (RSS) |
| ---------------- | ------------------ | -------------------- | ------- | ------------ |
| Rspack CLI 2.2.5 | 1144ms🥇           | 849ms🥈              | 112ms🥇 | 294MB🥇      |
| Rsbuild 2.2.7    | 1225ms🥈           | 784ms🥇              | 131ms🥉 | 322MB🥈      |
| Vite 8.3.0       | 5692ms             | 3756ms               | 117ms🥈 | 736MB        |
| webpack 5.111.0  | 13206ms            | 11843ms              | 3003ms  | 1615MB       |
| Farm 1.7.11      | 1700ms🥉           | 1099ms🥉             | 166ms   | 513MB🥉      |
| Parcel 2.16.4    | 14170ms            | 2469ms               | 649ms   | 1842MB       |

Build metrics:

| Name             | Build (no cache) | Build (with cache) | Memory (RSS) | Output size | Gzipped size |
| ---------------- | ---------------- | ------------------ | ------------ | ----------- | ------------ |
| Rspack CLI 2.2.5 | 1967ms🥈         | 1174ms🥇           | 568MB🥇      | 2707.9kB🥉  | 682.8kB🥉    |
| Rsbuild 2.2.7    | 3409ms🥉         | 1347ms🥉           | 898MB        | 2637.9kB🥈  | 675.6kB🥇    |
| Vite 8.3.0       | 1346ms🥇         | 1346ms🥈           | 666MB🥉      | 2541.6kB🥇  | 693.4kB      |
| webpack 5.111.0  | 16435ms          | 5110ms             | 1217MB       | 2710.9kB    | 682.2kB🥈    |
| Farm 1.7.11      | 6728ms           | 2880ms             | 621MB🥈      | 3459.4kB    | 801.0kB      |
| Parcel 2.16.4    | 13976ms          | 2077ms             | 1966MB       | 3403.9kB    | 767.8kB      |

---

### react-10k

A React app with 10,000 components and 10,000 modules from node_modules, using dynamic imports to simulate SPA.

```bash
CASE=react-10k pnpm benchmark
```

Development metrics:

| Name             | Startup (no cache) | Startup (with cache) | HMR     | Memory (RSS) |
| ---------------- | ------------------ | -------------------- | ------- | ------------ |
| Rspack CLI 2.2.5 | 1323ms🥈           | 803ms🥇              | 145ms🥈 | 362MB🥇      |
| Rsbuild 2.2.7    | 1246ms🥇           | 927ms🥈              | 161ms🥉 | 409MB🥈      |
| Vite 8.3.0       | 6408ms🥉           | 3742ms🥉             | 139ms🥇 | 1208MB🥉     |
| webpack 5.111.0  | 18512ms            | 15225ms              | 5490ms  | 2301MB       |

Build metrics:

| Name             | Build (no cache) | Build (with cache) | Memory (RSS) | Output size | Gzipped size |
| ---------------- | ---------------- | ------------------ | ------------ | ----------- | ------------ |
| Rspack CLI 2.2.5 | 3486ms🥈         | 1643ms🥉           | 1003MB🥇     | 5630.8kB🥉  | 1361.6kB🥉   |
| Rsbuild 2.2.7    | 4982ms🥉         | 1394ms🥇           | 1574MB🥉     | 5452.8kB🥈  | 1337.3kB🥇   |
| Vite 8.3.0       | 1913ms🥇         | 1528ms🥈           | 1180MB🥈     | 5232.3kB🥇  | 1407.1kB     |
| webpack 5.111.0  | 24030ms          | 6226ms             | 1902MB       | 5638.3kB    | 1361.1kB🥈   |

---

### ui-components

A React app that imports UI components from several popular UI libraries.

Including [@mui/material](https://npmjs.com/package/@mui/material), [@radix-ui/themes](https://npmjs.com/package/@radix-ui/themes), [antd](https://npmjs.com/package/antd), [antd-mobile](https://npmjs.com/package/antd-mobile), [@chakra-ui/react](https://npmjs.com/package/@chakra-ui/react), [@fluentui/react](https://npmjs.com/package/@fluentui/react), [@headlessui/react](https://npmjs.com/package/@headlessui/react), [@mantine/core](https://npmjs.com/package/@mantine/core), [react-bootstrap](https://npmjs.com/package/react-bootstrap), [primereact](https://npmjs.com/package/primereact), [rsuite](https://npmjs.com/package/rsuite), [@arco-design/web-react](https://npmjs.com/package/@arco-design/web-react), [@coreui/react](https://npmjs.com/package/@coreui/react), [element-plus](https://npmjs.com/package/element-plus), [ant-design-vue](https://npmjs.com/package/ant-design-vue), [naive-ui](https://npmjs.com/package/naive-ui), [primevue](https://npmjs.com/package/primevue), [vant](https://npmjs.com/package/vant), and [vuetify](https://npmjs.com/package/vuetify).

```bash
CASE=ui-components pnpm benchmark
```

Build metrics:

| Name             | Build (no cache) | Build (with cache) | Memory (RSS) | Output size | Gzipped size |
| ---------------- | ---------------- | ------------------ | ------------ | ----------- | ------------ |
| Rspack CLI 2.2.5 | 4920ms🥉         | 1440ms🥈           | 1251MB🥈     | 5232.8kB🥈  | 1511.0kB🥈   |
| Rsbuild 2.2.7    | 5727ms           | 2481ms🥉           | 1703MB🥉     | 5232.6kB🥇  | 1510.6kB🥇   |
| Vite 8.3.0       | 3336ms🥇         | 2849ms             | 1765MB       | 5235.7kB🥉  | 1519.4kB     |
| webpack 5.111.0  | 26213ms          | 14433ms            | 1824MB       | 5246.7kB    | 1512.5kB🥉   |
| esbuild 0.28.2   | 4694ms🥈         | 3418ms             | N/A          | 6415.0kB    | 1861.9kB     |
| Farm 1.7.11      | 17118ms          | 5311ms             | 2293MB       | 8737.6kB    | 2956.9kB     |
| Parcel 2.16.4    | 28197ms          | 2908ms             | 2528MB       | 5502.0kB    | 1547.4kB     |
| Utoo 1.5.18      | 21324ms          | 939ms🥇            | 1246MB🥇     | 5376.2kB    | 1555.4kB     |

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

| Name             | Build (no cache) | Build (with cache) | Memory (RSS) | Output size | Gzipped size |
| ---------------- | ---------------- | ------------------ | ------------ | ----------- | ------------ |
| Rspack CLI 2.2.5 | 1482ms           | 465ms🥈            | 422MB🥇      | 1778.0kB    | 541.5kB🥉    |
| Rsbuild 2.2.7    | 1830ms           | 586ms🥉            | 489MB🥈      | 1777.1kB🥉  | 541.2kB🥈    |
| Vite 8.3.0       | 1136ms🥉         | 1004ms             | 609MB        | 1776.5kB🥈  | 543.9kB      |
| Rollup 4.63.3    | 10535ms          | 10437ms            | 1231MB       | 1721.4kB🥇  | 528.8kB🥇    |
| Rolldown 1.2.8   | 865ms🥈          | 965ms              | 548MB        | 1777.2kB    | 542.7kB      |
| webpack 5.111.0  | 5803ms           | 1280ms             | 785MB        | 1793.0kB    | 547.5kB      |
| esbuild 0.28.2   | 796ms🥇          | 742ms              | N/A          | 2101.1kB    | 615.9kB      |
| Farm 1.7.11      | 5140ms           | 1701ms             | 810MB        | 2265.8kB    | 759.4kB      |
| Utoo 1.5.18      | 6888ms           | 454ms🥇            | 503MB🥉      | 1913.1kB    | 589.0kB      |

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
