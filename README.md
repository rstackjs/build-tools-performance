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

> Data from [GitHub Actions](https://github.com/rstackjs/build-tools-performance/actions/runs/41386254734) (2026-11-02, benchmark commit `7e0dac32`).

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
| Rspack CLI 2.3.0 | 2036ms🥇           | 1254ms🥇             | 404ms🥉 |
| Rsbuild 2.3.0    | 2423ms🥈           | 1385ms🥈             | 523ms   |
| Vite 8.3.5       | 3940ms🥉           | 2292ms🥉             | 337ms🥈 |
| webpack 5.112.2  | 5281ms             | 3577ms               | 650ms   |
| Utoo 1.5.34      | 5517ms             | 5179ms               | 306ms🥇 |

Build metrics:

| Name             | Build (no cache) | Build (with cache) | Output size | Gzipped size | JS chunks |
| ---------------- | ---------------- | ------------------ | ----------- | ------------ | --------- |
| Rspack CLI 2.3.0 | 2289ms🥈         | 1102ms🥇           | 4151.5kB🥉  | 638.5kB🥉    | 43        |
| Rsbuild 2.3.0    | 2465ms🥉         | 1109ms🥈           | 4149.3kB🥈  | 636.4kB🥈    | 43        |
| Vite 8.3.5       | 2209ms🥇         | 2186ms🥉           | 4165.5kB    | 648.2kB      | 44        |
| webpack 5.112.2  | 14018ms          | 3924ms             | 4154.4kB    | 640.0kB      | 43        |
| Utoo 1.5.34      | 15554ms          | 2207ms             | 4132.2kB🥇  | 617.2kB🥇    | 46        |

Dev memory (MiB):

| Name             | Steady (no cache) | Steady (with cache) | Peak (no cache) | Peak (with cache) |
| ---------------- | ----------------- | ------------------- | --------------- | ----------------- |
| Rspack CLI 2.3.0 | 582.7🥈           | 850.7🥉             | 593.6🥇         | 850.7🥉           |
| Rsbuild 2.3.0    | 612.7🥉           | 934.6               | 652.0🥈         | 949.2             |
| Vite 8.3.5       | 995.2             | 351.7🥈             | 1056.9          | 358.5🥇           |
| webpack 5.112.2  | 1092.3            | 869.0               | 1121.8          | 938.1             |
| Utoo 1.5.34      | 355.4🥇           | 260.1🥇             | 743.6🥉         | 432.6🥈           |

Build memory (MiB):

| Name             | Peak (no cache) | Peak (with cache) |
| ---------------- | --------------- | ----------------- |
| Rspack CLI 2.3.0 | 748.8🥇         | 790.2🥈           |
| Rsbuild 2.3.0    | 771.9🥈         | 847.7🥉           |
| Vite 8.3.5       | 1050.3🥉        | 1040.4            |
| webpack 5.112.2  | 1567.7          | 1317.3            |
| Utoo 1.5.34      | 1250.7          | 305.2🥇           |

---

### react-1k

A React app with 1,000 components and 1,500 modules from node_modules, using dynamic imports to simulate SPA.

```bash
CASE=react-1k pnpm benchmark
```

Development metrics:

| Name             | Startup (no cache) | Startup (with cache) | HMR    |
| ---------------- | ------------------ | -------------------- | ------ |
| Rspack CLI 2.3.0 | 1865ms🥉           | 1341ms🥉             | 89ms🥈 |
| Rsbuild 2.3.0    | 1252ms🥈           | 1571ms               | 119ms  |
| Vite 8.3.5       | 9016ms             | 5097ms               | 140ms  |
| webpack 5.112.2  | 9783ms             | 7333ms               | 458ms  |
| Farm 1.7.11      | 2438ms             | 1254ms🥈             | 151ms  |
| Parcel 2.16.4    | 5769ms             | 1884ms               | 147ms  |
| Utoo 1.5.34      | 6845ms             | 6159ms               | 91ms🥉 |
| Bun 1.4.4        | 1093ms🥇           | 828ms🥇              | 7ms🥇  |

Build metrics:

| Name             | Build (no cache) | Build (with cache) | Output size | Gzipped size | JS chunks |
| ---------------- | ---------------- | ------------------ | ----------- | ------------ | --------- |
| Rspack CLI 2.3.0 | 866ms            | 376ms🥉            | 847.4kB     | 229.3kB🥉    | 6         |
| Rsbuild 2.3.0    | 822ms🥈          | 353ms🥈            | 845.2kB🥉   | 221.0kB🥇    | 9         |
| Vite 8.3.5       | 828ms🥉          | 566ms              | 825.7kB🥈   | 226.2kB🥈    | 6         |
| webpack 5.112.2  | 7093ms           | 2007ms             | 847.3kB     | 230.3kB      | 6         |
| Farm 1.7.11      | 2722ms           | 1468ms             | 1094.9kB    | 267.2kB      | 18        |
| Parcel 2.16.4    | 6183ms           | 1131ms             | 971.4kB     | 239.0kB      | 6         |
| Utoo 1.5.34      | 7506ms           | 1032ms             | 850.6kB     | 239.9kB      | 10        |
| Bun 1.4.4        | 290ms🥇          | 235ms🥇            | 822.1kB🥇   | 240.5kB      | 6         |

Dev memory (MiB):

| Name             | Steady (no cache) | Steady (with cache) | Peak (no cache) | Peak (with cache) |
| ---------------- | ----------------- | ------------------- | --------------- | ----------------- |
| Rspack CLI 2.3.0 | 248.3             | 267.8               | 267.4🥉         | 277.3             |
| Rsbuild 2.3.0    | 231.7🥉           | 234.0🥉             | 232.0🥈         | 234.0🥉           |
| Vite 8.3.5       | 422.1             | 290.8               | 422.1           | 290.8             |
| webpack 5.112.2  | 676.8             | 720.8               | 825.5           | 779.5             |
| Farm 1.7.11      | 358.2             | 290.6               | 371.6           | 303.7             |
| Parcel 2.16.4    | 1033.0            | 745.3               | 1098.1          | 828.1             |
| Utoo 1.5.34      | 141.2🥈           | 180.2🥈             | 409.8           | 180.5🥈           |
| Bun 1.4.4        | 51.5🥇            | 51.2🥇              | 139.8🥇         | 134.2🥇           |

Build memory (MiB):

| Name             | Peak (no cache) | Peak (with cache) |
| ---------------- | --------------- | ----------------- |
| Rspack CLI 2.3.0 | 185.4🥈         | 158.4🥉           |
| Rsbuild 2.3.0    | 192.7🥉         | 166.7             |
| Vite 8.3.5       | 241.6           | 239.8             |
| webpack 5.112.2  | 571.6           | 402.5             |
| Farm 1.7.11      | 284.2           | 258.4             |
| Parcel 2.16.4    | 1033.0          | 432.0             |
| Utoo 1.5.34      | 353.4           | 136.8🥈           |
| Bun 1.4.4        | 96.0🥇          | 96.7🥇            |

---

### react-5k

A React app with 5,000 components and 5,000 modules from node_modules, using dynamic imports to simulate SPA.

```bash
CASE=react-5k pnpm benchmark
```

Development metrics:

| Name             | Startup (no cache) | Startup (with cache) | HMR     |
| ---------------- | ------------------ | -------------------- | ------- |
| Rspack CLI 2.3.0 | 992ms🥇            | 832ms🥈              | 84ms🥇  |
| Rsbuild 2.3.0    | 1164ms🥈           | 902ms🥉              | 93ms🥈  |
| Vite 8.3.5       | 3850ms             | 2480ms               | 129ms🥉 |
| webpack 5.112.2  | 12468ms            | 10198ms              | 1133ms  |
| Farm 1.7.11      | 1348ms🥉           | 787ms🥇              | 146ms   |
| Parcel 2.16.4    | 11106ms            | 1633ms               | 248ms   |

Build metrics:

| Name             | Build (no cache) | Build (with cache) | Output size | Gzipped size | JS chunks |
| ---------------- | ---------------- | ------------------ | ----------- | ------------ | --------- |
| Rspack CLI 2.3.0 | 1860ms🥈         | 617ms🥇            | 2707.7kB🥉  | 682.4kB🥉    | 16        |
| Rsbuild 2.3.0    | 2029ms🥉         | 875ms🥈            | 2637.8kB🥈  | 675.6kB🥇    | 19        |
| Vite 8.3.5       | 1506ms🥇         | 1286ms🥉           | 2541.8kB🥇  | 693.7kB      | 9         |
| webpack 5.112.2  | 15447ms          | 4596ms             | 2710.7kB    | 682.1kB🥈    | 16        |
| Farm 1.7.11      | 5204ms           | 2131ms             | 3459.4kB    | 805.1kB      | 37        |
| Parcel 2.16.4    | 9797ms           | 1571ms             | 3403.9kB    | 767.7kB      | 9         |

Dev memory (MiB):

| Name             | Steady (no cache) | Steady (with cache) | Peak (no cache) | Peak (with cache) |
| ---------------- | ----------------- | ------------------- | --------------- | ----------------- |
| Rspack CLI 2.3.0 | 193.5🥈           | 212.1🥈             | 201.9🥈         | 212.1🥈           |
| Rsbuild 2.3.0    | 176.1🥇           | 189.1🥇             | 189.1🥇         | 189.1🥇           |
| Vite 8.3.5       | 656.1             | 234.8🥉             | 668.7           | 234.8🥉           |
| webpack 5.112.2  | 1244.8            | 992.9               | 1966.0          | 1759.4            |
| Farm 1.7.11      | 345.3🥉           | 316.0               | 350.0🥉         | 323.6             |
| Parcel 2.16.4    | 1458.3            | 1146.8              | 1643.7          | 1351.7            |

Build memory (MiB):

| Name             | Peak (no cache) | Peak (with cache) |
| ---------------- | --------------- | ----------------- |
| Rspack CLI 2.3.0 | 424.4🥇         | 411.5🥉           |
| Rsbuild 2.3.0    | 439.1🥉         | 376.1🥇           |
| Vite 8.3.5       | 620.0           | 617.6             |
| webpack 5.112.2  | 1112.5          | 930.0             |
| Farm 1.7.11      | 434.1🥈         | 379.7🥈           |
| Parcel 2.16.4    | 1793.9          | 545.9             |

---

### react-10k

A React app with 10,000 components and 10,000 modules from node_modules, using dynamic imports to simulate SPA.

```bash
CASE=react-10k pnpm benchmark
```

Development metrics:

| Name             | Startup (no cache) | Startup (with cache) | HMR     |
| ---------------- | ------------------ | -------------------- | ------- |
| Rspack CLI 2.3.0 | 1009ms🥇           | 784ms🥇              | 103ms🥇 |
| Rsbuild 2.3.0    | 1762ms🥈           | 858ms🥈              | 127ms🥈 |
| Vite 8.3.5       | 7633ms🥉           | 5549ms🥉             | 134ms🥉 |
| webpack 5.112.2  | 19954ms            | 15743ms              | 2525ms  |

Build metrics:

| Name             | Build (no cache) | Build (with cache) | Output size | Gzipped size | JS chunks |
| ---------------- | ---------------- | ------------------ | ----------- | ------------ | --------- |
| Rspack CLI 2.3.0 | 2194ms🥈         | 1330ms🥇           | 5630.6kB🥉  | 1361.1kB🥉   | 17        |
| Rsbuild 2.3.0    | 3458ms🥉         | 1539ms🥈           | 5452.6kB🥈  | 1337.3kB🥇   | 20        |
| Vite 8.3.5       | 2038ms🥇         | 1771ms🥉           | 5232.4kB🥇  | 1407.5kB     | 9         |
| webpack 5.112.2  | 23814ms          | 8189ms             | 5638.2kB    | 1361.0kB🥈   | 17        |

Dev memory (MiB):

| Name             | Steady (no cache) | Steady (with cache) | Peak (no cache) | Peak (with cache) |
| ---------------- | ----------------- | ------------------- | --------------- | ----------------- |
| Rspack CLI 2.3.0 | 243.1🥈           | 264.8🥈             | 254.8🥈         | 266.1🥈           |
| Rsbuild 2.3.0    | 224.5🥇           | 234.6🥇             | 225.0🥇         | 235.7🥇           |
| Vite 8.3.5       | 1041.5🥉          | 291.3🥉             | 1061.8🥉        | 293.2🥉           |
| webpack 5.112.2  | 2358.4            | 2331.7              | 2728.2          | 2399.4            |

Build memory (MiB):

| Name             | Peak (no cache) | Peak (with cache) |
| ---------------- | --------------- | ----------------- |
| Rspack CLI 2.3.0 | 783.8🥇         | 757.9🥈           |
| Rsbuild 2.3.0    | 794.7🥈         | 661.8🥇           |
| Vite 8.3.5       | 1185.8🥉        | 1174.4🥉          |
| webpack 5.112.2  | 1993.4          | 1536.4            |

---

### ui-components

A React app that imports UI components from several popular UI libraries.

Including [@mui/material](https://npmjs.com/package/@mui/material), [@radix-ui/themes](https://npmjs.com/package/@radix-ui/themes), [antd](https://npmjs.com/package/antd), [antd-mobile](https://npmjs.com/package/antd-mobile), [@chakra-ui/react](https://npmjs.com/package/@chakra-ui/react), [@fluentui/react](https://npmjs.com/package/@fluentui/react), [@headlessui/react](https://npmjs.com/package/@headlessui/react), [@mantine/core](https://npmjs.com/package/@mantine/core), [react-bootstrap](https://npmjs.com/package/react-bootstrap), [primereact](https://npmjs.com/package/primereact), [rsuite](https://npmjs.com/package/rsuite), [@arco-design/web-react](https://npmjs.com/package/@arco-design/web-react), [@coreui/react](https://npmjs.com/package/@coreui/react), [element-plus](https://npmjs.com/package/element-plus), [ant-design-vue](https://npmjs.com/package/ant-design-vue), [naive-ui](https://npmjs.com/package/naive-ui), [primevue](https://npmjs.com/package/primevue), [vant](https://npmjs.com/package/vant), and [vuetify](https://npmjs.com/package/vuetify).

```bash
CASE=ui-components pnpm benchmark
```

Build metrics:

| Name             | Build (no cache) | Build (with cache) | Output size | Gzipped size | JS chunks |
| ---------------- | ---------------- | ------------------ | ----------- | ------------ | --------- |
| Rspack CLI 2.3.0 | 6440ms🥉         | 1776ms🥇           | 4940.5kB🥈  | 1435.4kB🥈   | 1         |
| Rsbuild 2.3.0    | 5554ms🥈         | 2234ms🥈           | 4940.2kB🥇  | 1434.9kB🥇   | 1         |
| Vite 8.3.5       | 4827ms🥇         | 4937ms             | 4941.6kB🥉  | 1441.3kB     | 1         |
| webpack 5.112.2  | 20706ms          | 9169ms             | 4953.8kB    | 1436.6kB🥉   | 1         |
| esbuild 0.28.2   | 7232ms           | 6602ms             | 6155.9kB    | 1790.3kB     | 1         |
| Farm 1.7.11      | 23943ms          | 6890ms             | 8472.3kB    | 2894.8kB     | 5         |
| Parcel 2.16.4    | 34101ms          | 2660ms🥉           | 5335.1kB    | 1511.2kB     | 3         |
| Utoo 1.5.34      | 33318ms          | 2824ms             | 4984.3kB    | 1448.8kB     | 2         |

Build memory (MiB):

| Name             | Peak (no cache) | Peak (with cache) |
| ---------------- | --------------- | ----------------- |
| Rspack CLI 2.3.0 | 1064.6🥇        | 1243.2🥉          |
| Rsbuild 2.3.0    | 1188.6🥉        | 1275.9            |
| Vite 8.3.5       | 1772.0          | 1769.9            |
| webpack 5.112.2  | 1765.5          | 1463.5            |
| esbuild 0.28.2   | 1324.3          | 1329.4            |
| Farm 1.7.11      | 1653.5          | 1382.4            |
| Parcel 2.16.4    | 3236.9          | 781.8🥈           |
| Utoo 1.5.34      | 1142.1🥈        | 252.1🥇           |

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

| Name             | Build (no cache) | Build (with cache) | Output size | Gzipped size | JS chunks |
| ---------------- | ---------------- | ------------------ | ----------- | ------------ | --------- |
| Rspack CLI 2.3.0 | 1756ms           | 609ms🥈            | 1817.8kB    | 553.5kB🥉    | 1         |
| Rsbuild 2.3.0    | 1696ms           | 523ms🥇            | 1817.5kB🥉  | 553.4kB🥈    | 1         |
| Vite 8.3.5       | 1179ms🥉         | 1044ms             | 1813.6kB🥈  | 554.6kB      | 1         |
| Rollup 4.65.1    | 10090ms          | 11758ms            | 1764.4kB🥇  | 542.6kB🥇    | 1         |
| Rolldown 1.2.15  | 966ms🥇          | 972ms              | 1844.8kB    | 557.4kB      | 1         |
| webpack 5.112.2  | 6745ms           | 1307ms             | 1836.4kB    | 561.4kB      | 1         |
| esbuild 0.28.2   | 1101ms🥈         | 994ms              | 2135.2kB    | 627.8kB      | 1         |
| Farm 1.7.11      | 3993ms           | 1891ms             | 2313.2kB    | 776.1kB      | 2         |
| Utoo 1.5.34      | 6686ms           | 665ms🥉            | 1846.1kB    | 562.7kB      | 2         |

Build memory (MiB):

| Name             | Peak (no cache) | Peak (with cache) |
| ---------------- | --------------- | ----------------- |
| Rspack CLI 2.3.0 | 361.4🥇         | 529.9             |
| Rsbuild 2.3.0    | 366.3🥈         | 542.1             |
| Vite 8.3.5       | 544.8           | 544.9             |
| Rollup 4.65.1    | 1246.3          | 1099.0            |
| Rolldown 1.2.15  | 527.2           | 531.2             |
| webpack 5.112.2  | 762.4           | 413.3🥈           |
| esbuild 0.28.2   | 449.7🥉         | 436.6🥉           |
| Farm 1.7.11      | 564.5           | 508.3             |
| Utoo 1.5.34      | 455.9           | 132.0🥇           |

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
