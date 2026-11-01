# React dashboard

A synthetic enterprise operations SPA covering customers, orders, finance, and
team management. It has 40 lazy business routes and over 10,000 application
modules, with dashboards, virtualized tables, charts, URL-driven filters,
validated forms, command search, and Markdown reports.

| Area                | Libraries                                                          |
| ------------------- | ------------------------------------------------------------------ |
| Application         | React, React DOM, TanStack Router, Tailwind CSS, Zod               |
| Data and tables     | TanStack Query, TanStack Table, TanStack Virtual, Axios            |
| Forms and state     | React Hook Form, Hook Form Resolvers, Zustand, Immer               |
| UI and commands     | Radix Dialog / Dropdown Menu / Tooltip, cmdk, Sonner, Lucide React |
| Styling             | clsx, tailwind-merge, Class Variance Authority                     |
| Reports and content | Recharts, react-markdown, remark-gfm                               |
| Utilities           | date-fns, lodash-es, Fuse.js, react-error-boundary                 |

Libraries are used by working features, with selective imports to exercise tree
shaking. All five tools build the same application with the same browser target,
CSS pipeline, and development/production policies.

```bash
CASE=react-dashboard pnpm benchmark
pnpm --filter react-dashboard start:vite
pnpm --filter react-dashboard verify:all
```

See [methodology](./METHODOLOGY.md) for generation, configuration parity,
verification, and limitations, and the [results](../../README.md#react-dashboard).
