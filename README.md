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

- The `react-dashboard` case targets `Chrome >= 111` for every included tool,
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

> Data from [GitHub Actions](https://github.com/rstackjs/build-tools-performance/actions/runs/41259504730) (2026-11-01, benchmark commit `2c3f960d`). Values are medians of three measured runs; timing includes two warmups, while memory skips warmups. Memory is process-tree physical footprint in MiB. See [memory methodology](#memory-methodology). The `react-dashboard` results were recorded under the former case name `react-workspace`; the workload is unchanged. One Farm dev-memory attempt in `react-5k` exited early and succeeded on retry; the failed attempt is excluded.

---

### react-dashboard

A synthetic enterprise operations SPA with customer, order, finance, and team workspaces:
40 lazy routes, 10,000+ application modules, dashboards, virtualized tables,
charts, forms, command search, and Markdown reports.

| Area                | Libraries                                                          |
| ------------------- | ------------------------------------------------------------------ |
| Application         | React, React DOM, TanStack Router, Tailwind CSS, Zod               |
| Data and tables     | TanStack Query, TanStack Table, TanStack Virtual, Axios            |
| Forms and state     | React Hook Form, Hook Form Resolvers, Zustand, Immer               |
| UI and commands     | Radix Dialog / Dropdown Menu / Tooltip, cmdk, Sonner, Lucide React |
| Styling             | clsx, tailwind-merge, Class Variance Authority                     |
| Reports and content | Recharts, react-markdown, remark-gfm                               |
| Utilities           | date-fns, lodash-es, Fuse.js, react-error-boundary                 |

See [case details](cases/react-dashboard/README.md) and
[benchmark methodology](cases/react-dashboard/METHODOLOGY.md).

```bash
CASE=react-dashboard pnpm benchmark
```

The figures below use the earlier PostCSS integration (commit `2c3f960d`).
The current configuration uses dedicated Tailwind integrations; its CI results are pending.

Development metrics:

| Name             | Startup (no cache) | Startup (with cache) | HMR     |
| ---------------- | ------------------ | -------------------- | ------- |
| Rspack CLI 2.3.0 | 2577ms🥈           | 1284ms🥈             | 516ms   |
| Rsbuild 2.3.0    | 2407ms🥇           | 1268ms🥇             | 495ms🥉 |
| Vite 8.3.5       | 4550ms🥉           | 2181ms🥉             | 418ms🥈 |
| webpack 5.112.2  | 7639ms             | 4663ms               | 727ms   |
| Utoo 1.5.34      | 7509ms             | 6910ms               | 377ms🥇 |

Build metrics:

| Name             | Build (no cache) | Build (with cache) | Output size | Gzipped size |
| ---------------- | ---------------- | ------------------ | ----------- | ------------ |
| Rspack CLI 2.3.0 | 2514ms🥈         | 1012ms🥇           | 4150.6kB🥉  | 638.0kB🥉    |
| Rsbuild 2.3.0    | 2681ms🥉         | 1147ms🥈           | 4148.4kB🥈  | 635.9kB🥈    |
| Vite 8.3.5       | 1958ms🥇         | 1773ms🥉           | 4160.2kB    | 646.7kB      |
| webpack 5.112.2  | 16777ms          | 5098ms             | 4154.3kB    | 639.9kB      |
| Utoo 1.5.34      | 22326ms          | 2749ms             | 4131.3kB🥇  | 616.8kB🥇    |

Dev memory (MiB):

| Name             | Steady (no cache) | Steady (with cache) | Peak (no cache) | Peak (with cache) |
| ---------------- | ----------------- | ------------------- | --------------- | ----------------- |
| Rspack CLI 2.3.0 | 607.9🥉           | 896.2               | 607.9🥇         | 896.2🥉           |
| Rsbuild 2.3.0    | 392.9🥈           | 680.0🥉             | 681.3🥈         | 954.3             |
| Vite 8.3.5       | 1050.2            | 382.2🥈             | 1078.6          | 382.2🥇           |
| webpack 5.112.2  | 993.9             | 839.4               | 1010.6          | 903.2             |
| Utoo 1.5.34      | 384.1🥇           | 302.6🥇             | 743.4🥉         | 461.2🥈           |

Build memory (MiB):

| Name             | Peak (no cache) | Peak (with cache) |
| ---------------- | --------------- | ----------------- |
| Rspack CLI 2.3.0 | 729.4🥇         | 800.4🥈           |
| Rsbuild 2.3.0    | 781.4🥈         | 867.9🥉           |
| Vite 8.3.5       | 1093.3🥉        | 1092.0            |
| webpack 5.112.2  | 1631.5          | 1226.5            |
| Utoo 1.5.34      | 1233.7          | 284.6🥇           |

---

### react-1k

A React app with 1,000 components and 1,500 modules from node_modules, using dynamic imports to simulate SPA.

```bash
CASE=react-1k pnpm benchmark
```

Development metrics:

| Name             | Startup (no cache) | Startup (with cache) | HMR     |
| ---------------- | ------------------ | -------------------- | ------- |
| Rspack CLI 2.3.0 | 1888ms🥉           | 1006ms🥉             | 101ms🥉 |
| Rsbuild 2.3.0    | 1376ms🥈           | 900ms🥈              | 126ms   |
| Vite 8.3.5       | 4960ms             | 5115ms               | 144ms   |
| webpack 5.112.2  | 6647ms             | 5776ms               | 385ms   |
| Farm 1.7.11      | 2186ms             | 1174ms               | 146ms   |
| Parcel 2.16.4    | 4962ms             | 1510ms               | 132ms   |
| Utoo 1.5.34      | 5030ms             | 1102ms               | 86ms🥈  |
| Bun 1.4.4        | 893ms🥇            | 892ms🥇              | 8ms🥇   |

Build metrics:

| Name             | Build (no cache) | Build (with cache) | Output size | Gzipped size |
| ---------------- | ---------------- | ------------------ | ----------- | ------------ |
| Rspack CLI 2.3.0 | 789ms            | 396ms🥈            | 847.4kB     | 229.3kB🥉    |
| Rsbuild 2.3.0    | 690ms🥉          | 440ms🥉            | 845.2kB🥉   | 221.0kB🥇    |
| Vite 8.3.5       | 676ms🥈          | 603ms              | 825.7kB🥈   | 226.2kB🥈    |
| webpack 5.112.2  | 4690ms           | 1474ms             | 847.3kB     | 230.3kB      |
| Farm 1.7.11      | 1987ms           | 1000ms             | 1094.9kB    | 267.2kB      |
| Parcel 2.16.4    | 4688ms           | 891ms              | 971.4kB     | 239.0kB      |
| Utoo 1.5.34      | 4167ms           | 662ms              | 850.6kB     | 239.9kB      |
| Bun 1.4.4        | 225ms🥇          | 209ms🥇            | 822.1kB🥇   | 240.5kB      |

Dev memory (MiB):

| Name             | Steady (no cache) | Steady (with cache) | Peak (no cache) | Peak (with cache) |
| ---------------- | ----------------- | ------------------- | --------------- | ----------------- |
| Rspack CLI 2.3.0 | 244.1             | 262.4               | 252.7🥉         | 265.4             |
| Rsbuild 2.3.0    | 235.6🥉           | 234.0🥉             | 235.6🥈         | 234.2🥉           |
| Vite 8.3.5       | 416.9             | 287.0               | 416.9           | 288.4             |
| webpack 5.112.2  | 696.7             | 695.5               | 843.6           | 807.9             |
| Farm 1.7.11      | 350.9             | 302.6               | 366.6           | 306.5             |
| Parcel 2.16.4    | 966.2             | 706.6               | 1049.2          | 780.2             |
| Utoo 1.5.34      | 138.1🥈           | 179.8🥈             | 411.8           | 180.8🥈           |
| Bun 1.4.4        | 51.2🥇            | 51.2🥇              | 139.8🥇         | 140.5🥇           |

Build memory (MiB):

| Name             | Peak (no cache) | Peak (with cache) |
| ---------------- | --------------- | ----------------- |
| Rspack CLI 2.3.0 | 189.6🥈         | 155.6🥉           |
| Rsbuild 2.3.0    | 198.3🥉         | 168.5             |
| Vite 8.3.5       | 240.6           | 241.5             |
| webpack 5.112.2  | 558.5           | 443.7             |
| Farm 1.7.11      | 286.6           | 256.7             |
| Parcel 2.16.4    | 1009.7          | 414.5             |
| Utoo 1.5.34      | 349.8           | 139.0🥈           |
| Bun 1.4.4        | 96.3🥇          | 97.1🥇            |

---

### react-5k

A React app with 5,000 components and 5,000 modules from node_modules, using dynamic imports to simulate SPA.

```bash
CASE=react-5k pnpm benchmark
```

Development metrics:

| Name             | Startup (no cache) | Startup (with cache) | HMR     |
| ---------------- | ------------------ | -------------------- | ------- |
| Rspack CLI 2.3.0 | 1545ms🥉           | 823ms🥈              | 84ms🥇  |
| Rsbuild 2.3.0    | 1226ms🥇           | 673ms🥇              | 87ms🥈  |
| Vite 8.3.5       | 3759ms             | 2374ms               | 129ms🥉 |
| webpack 5.112.2  | 13295ms            | 8716ms               | 1055ms  |
| Farm 1.7.11      | 1435ms🥈           | 929ms🥉              | 130ms   |
| Parcel 2.16.4    | 10971ms            | 1509ms               | 240ms   |

Build metrics:

| Name             | Build (no cache) | Build (with cache) | Output size | Gzipped size |
| ---------------- | ---------------- | ------------------ | ----------- | ------------ |
| Rspack CLI 2.3.0 | 1800ms🥈         | 725ms🥈            | 2707.7kB🥉  | 682.4kB🥉    |
| Rsbuild 2.3.0    | 1984ms🥉         | 710ms🥇            | 2637.8kB🥈  | 675.6kB🥇    |
| Vite 8.3.5       | 1065ms🥇         | 985ms🥉            | 2541.8kB🥇  | 693.7kB      |
| webpack 5.112.2  | 12674ms          | 3500ms             | 2710.7kB    | 682.1kB🥈    |
| Farm 1.7.11      | 4751ms           | 1942ms             | 3459.4kB    | 805.1kB      |
| Parcel 2.16.4    | 11857ms          | 1620ms             | 3403.9kB    | 767.7kB      |

Dev memory (MiB):

| Name             | Steady (no cache) | Steady (with cache) | Peak (no cache) | Peak (with cache) |
| ---------------- | ----------------- | ------------------- | --------------- | ----------------- |
| Rspack CLI 2.3.0 | 195.7🥈           | 205.1🥈             | 203.9🥈         | 214.2🥈           |
| Rsbuild 2.3.0    | 177.2🥇           | 183.9🥇             | 178.5🥇         | 186.3🥇           |
| Vite 8.3.5       | 650.5             | 231.8🥉             | 657.3           | 232.9🥉           |
| webpack 5.112.2  | 1881.3            | 1833.0              | 1989.9          | 1957.4            |
| Farm 1.7.11      | 342.2🥉           | 322.3               | 359.2🥉         | 322.3             |
| Parcel 2.16.4    | 1388.0            | 1020.5              | 1593.5          | 1163.5            |

Build memory (MiB):

| Name             | Peak (no cache) | Peak (with cache) |
| ---------------- | --------------- | ----------------- |
| Rspack CLI 2.3.0 | 425.2🥇         | 407.9🥉           |
| Rsbuild 2.3.0    | 439.8🥉         | 378.2🥇           |
| Vite 8.3.5       | 613.1           | 613.8             |
| webpack 5.112.2  | 1117.0          | 928.0             |
| Farm 1.7.11      | 432.7🥈         | 379.3🥈           |
| Parcel 2.16.4    | 1751.2          | 579.9             |

---

### react-10k

A React app with 10,000 components and 10,000 modules from node_modules, using dynamic imports to simulate SPA.

```bash
CASE=react-10k pnpm benchmark
```

Development metrics:

| Name             | Startup (no cache) | Startup (with cache) | HMR     |
| ---------------- | ------------------ | -------------------- | ------- |
| Rspack CLI 2.3.0 | 1923ms🥈           | 1435ms🥈             | 109ms🥇 |
| Rsbuild 2.3.0    | 1687ms🥇           | 1178ms🥇             | 127ms🥈 |
| Vite 8.3.5       | 8417ms🥉           | 7110ms🥉             | 142ms🥉 |
| webpack 5.112.2  | 23220ms            | 26933ms              | 2529ms  |

Build metrics:

| Name             | Build (no cache) | Build (with cache) | Output size | Gzipped size |
| ---------------- | ---------------- | ------------------ | ----------- | ------------ |
| Rspack CLI 2.3.0 | 4609ms🥉         | 1976ms🥈           | 5630.6kB🥉  | 1361.1kB🥉   |
| Rsbuild 2.3.0    | 4237ms🥈         | 1945ms🥇           | 5452.6kB🥈  | 1337.3kB🥇   |
| Vite 8.3.5       | 2604ms🥇         | 2643ms🥉           | 5232.4kB🥇  | 1407.5kB     |
| webpack 5.112.2  | 28390ms          | 6387ms             | 5638.2kB    | 1361.0kB🥈   |

Dev memory (MiB):

| Name             | Steady (no cache) | Steady (with cache) | Peak (no cache) | Peak (with cache) |
| ---------------- | ----------------- | ------------------- | --------------- | ----------------- |
| Rspack CLI 2.3.0 | 240.9🥈           | 266.4🥈             | 261.2🥈         | 273.8🥈           |
| Rsbuild 2.3.0    | 215.1🥇           | 241.9🥇             | 223.4🥇         | 242.9🥇           |
| Vite 8.3.5       | 679.7🥉           | 295.4🥉             | 1027.9🥉        | 299.5🥉           |
| webpack 5.112.2  | 2423.4            | 2291.5              | 2580.0          | 2413.1            |

Build memory (MiB):

| Name             | Peak (no cache) | Peak (with cache) |
| ---------------- | --------------- | ----------------- |
| Rspack CLI 2.3.0 | 784.9🥇         | 749.7🥈           |
| Rsbuild 2.3.0    | 792.0🥈         | 658.0🥇           |
| Vite 8.3.5       | 1151.4🥉        | 1152.6🥉          |
| webpack 5.112.2  | 1936.6          | 1509.1            |

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
| Rspack CLI 2.3.0 | 5757ms🥈         | 2472ms🥈           | 4940.5kB🥉  | 1435.4kB🥈   |
| Rsbuild 2.3.0    | 7069ms🥉         | 2126ms🥇           | 4940.2kB🥈  | 1434.9kB🥇   |
| Vite 8.3.5       | 5342ms🥇         | 4410ms             | 4936.6kB🥇  | 1440.4kB     |
| webpack 5.112.2  | 21851ms          | 9089ms             | 4953.8kB    | 1436.6kB🥉   |
| esbuild 0.28.2   | 7306ms           | 7092ms             | 6151.4kB    | 1790.0kB     |
| Farm 1.7.11      | 22686ms          | 6022ms             | 8574.1kB    | 2901.0kB     |
| Parcel 2.16.4    | 36237ms          | 3102ms             | 5335.1kB    | 1511.2kB     |
| Utoo 1.5.34      | 29659ms          | 3088ms🥉           | 4984.3kB    | 1448.8kB     |

Build memory (MiB):

| Name             | Peak (no cache) | Peak (with cache) |
| ---------------- | --------------- | ----------------- |
| Rspack CLI 2.3.0 | 1070.9🥇        | 1251.6🥉          |
| Rsbuild 2.3.0    | 1176.8🥉        | 1277.6            |
| Vite 8.3.5       | 1773.8          | 1779.4            |
| webpack 5.112.2  | 1825.7          | 1465.2            |
| esbuild 0.28.2   | 1301.9          | 1288.6            |
| Farm 1.7.11      | 1681.7          | 1386.8            |
| Parcel 2.16.4    | 3124.1          | 791.0🥈           |
| Utoo 1.5.34      | 1075.6🥈        | 253.0🥇           |

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
| Rspack CLI 2.3.0 | 1536ms           | 397ms🥇            | 1817.8kB    | 553.5kB🥉    |
| Rsbuild 2.3.0    | 1926ms           | 987ms              | 1817.5kB🥉  | 553.4kB🥈    |
| Vite 8.3.5       | 1452ms🥉         | 1030ms             | 1813.6kB🥈  | 554.6kB      |
| Rollup 4.65.1    | 11072ms          | 10216ms            | 1764.2kB🥇  | 542.6kB🥇    |
| Rolldown 1.2.15  | 1067ms🥇         | 1130ms             | 1835.9kB    | 555.8kB      |
| webpack 5.112.2  | 7736ms           | 1313ms             | 1836.4kB    | 561.4kB      |
| esbuild 0.28.2   | 1347ms🥈         | 734ms🥉            | 2135.2kB    | 627.8kB      |
| Farm 1.7.11      | 5618ms           | 1794ms             | 2313.2kB    | 776.1kB      |
| Utoo 1.5.34      | 6638ms           | 627ms🥈            | 1846.1kB    | 562.7kB      |

Build memory (MiB):

| Name             | Peak (no cache) | Peak (with cache) |
| ---------------- | --------------- | ----------------- |
| Rspack CLI 2.3.0 | 359.2🥇         | 505.8             |
| Rsbuild 2.3.0    | 365.3🥈         | 532.8             |
| Vite 8.3.5       | 543.2           | 546.1             |
| Rollup 4.65.1    | 1239.7          | 1126.8            |
| Rolldown 1.2.15  | 525.6           | 523.3             |
| webpack 5.112.2  | 752.5           | 411.8🥈           |
| esbuild 0.28.2   | 423.4🥉         | 434.8🥉           |
| Farm 1.7.11      | 574.4           | 505.8             |
| Utoo 1.5.34      | 463.7           | 132.5🥇           |

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
