import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  domains,
  domainForFeature,
  features,
  panels,
  title,
} from './workload.mjs';
import { emitPanelAnalytics } from './generate-analytics.mjs';

const root = import.meta.dirname;
const generated = path.join(root, 'src/generated');
const manifestPath = path.join(generated, 'manifest.json');
const fingerprint = createHash('sha256')
  .update(readFileSync(fileURLToPath(import.meta.url)))
  .update(readFileSync(path.join(root, 'workload.mjs')))
  .update(readFileSync(path.join(root, 'generate-analytics.mjs')))
  .digest('hex');

// The benchmark imports this before starting any timed processes. Tool configs
// also call it so a fresh checkout can be started directly. Cache hits do not
// rewrite files, which preserves HMR edits and filesystem cache timestamps.
export function ensureGenerated({ force = false } = {}) {
  if (!force && existsSync(manifestPath)) {
    const previous = JSON.parse(readFileSync(manifestPath, 'utf8'));
    if (previous.fingerprint === fingerprint) return previous;
  }
  rmSync(generated, { recursive: true, force: true });
  mkdirSync(generated, { recursive: true });
  let modules = 0;
  const emit = (file, source) => {
    const absolute = path.join(generated, file);
    mkdirSync(path.dirname(absolute), { recursive: true });
    writeFileSync(absolute, `${source.trim()}\n`);
    if (/\.tsx?$/.test(file)) modules++;
  };
  const palette = ['indigo', 'emerald', 'sky', 'amber', 'rose'];
  for (const [featureIndex, feature] of features.entries()) {
    const domain = domainForFeature(feature);
    emit(
      `${feature}/config.ts`,
      `export const profile = ${JSON.stringify(
        {
          title: title(feature),
          domain: domain.name,
          recordLabel: domain.record,
          unit: domain.unit,
          targetLabel: domain.target,
          description: `${domain.name}: manage ${feature}, review ${domain.record}s, and track ${domain.target.toLowerCase()}.`,
        },
        null,
        2,
      )};`,
    );
    for (const [panelIndex, panel] of panels.entries()) {
      const prefix = `${feature}/${panel}`;
      const seed = featureIndex * panels.length + panelIndex;
      const color = palette[seed % palette.length];
      emit(
        `${prefix}/labels.ts`,
        `
import { profile } from '../config';
export const labels = { title: '${title(panel)}', unit: profile.unit, owner: '${title(feature)} team', recordLabel: profile.recordLabel };
export const statuses = ['active', 'pending', 'archived'] as const;
export const statusLabels = { active: 'Active', pending: 'Pending', archived: 'Archived' };
`,
      );
      emit(
        `${prefix}/schema.ts`,
        `
import { z } from 'zod';
import { statuses } from './labels';
export const recordSchema = z.object({
  id: z.string().min(1), name: z.string().min(2).max(80),
  amount: z.number().nonnegative(), previous: z.number().positive(),
  status: z.enum(statuses), owner: z.string(), updatedAt: z.iso.date(),
  tags: z.array(z.string()).max(5),
});
export const recordsSchema = z.array(recordSchema).min(1);
export type RecordItem = z.infer<typeof recordSchema>;
`,
      );
      emit(
        `${prefix}/data.ts`,
        `
import { recordsSchema } from './schema';
import { labels, statuses } from './labels';
export const records = recordsSchema.parse(Array.from({ length: ${8 + (seed % 5)} }, (_, index) => ({
  id: '${feature}-${panel}-' + index,
  name: '${title(feature)} ${title(panel)} ' + labels.recordLabel + ' ' + (index + 1),
  amount: ${100 + seed * 7} + index * 29,
  previous: ${90 + seed * 5} + index * 23,
  status: statuses[index % statuses.length], owner: labels.owner,
  updatedAt: '2026-01-' + String(index + 1).padStart(2, '0'),
  tags: [index % 2 === 0 ? 'enterprise' : 'business', '${feature}'],
})));
`,
      );
      emit(
        `${prefix}/selectors.ts`,
        `
import type { RecordItem } from './schema';
export function selectRecords(records: RecordItem[], query: string, activeOnly: boolean, sort: 'name' | 'amount' | 'updatedAt') {
  const normalized = query.trim().toLowerCase();
  return records.filter(record => (!activeOnly || record.status === 'active') &&
    (record.name.toLowerCase().includes(normalized) || record.tags.some(tag => tag.includes(normalized))))
    .sort((a, b) => sort === 'amount' ? b.amount - a.amount : a[sort].localeCompare(b[sort]));
}
export const totalAmount = (records: RecordItem[]) => records.reduce((sum, record) => sum + record.amount, 0);
`,
      );
      emit(
        `${prefix}/format.ts`,
        `
import { labels } from './labels';
const formatter = new Intl.NumberFormat('en-US', labels.unit === 'USD'
  ? { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }
  : labels.unit === 'hours' ? { style: 'unit', unit: 'hour', maximumFractionDigits: 0 }
  : { maximumFractionDigits: 0 });
export const formatAmount = (value: number) => formatter.format(value);
export const formatDate = (value: string) => value.slice(5).replace('-', '/');
`,
      );
      emit(
        `${prefix}/trend.ts`,
        `
import type { RecordItem } from './schema';
export function trend(records: RecordItem[]) {
  const before = records.reduce((sum, record) => sum + record.previous, 0);
  const after = records.reduce((sum, record) => sum + record.amount, 0);
  return before ? Math.round((after - before) / before * 100) : 0;
}
export const progress = (amount: number, maximum: number) => Math.max(2, Math.min(100, amount / Math.max(1, maximum) * 100));
`,
      );
      emit(
        `${prefix}/PanelHeader.tsx`,
        `
import { labels } from './labels';
import styles from '../../../shared/Panel.module.css';
export function PanelHeader({ count }: { count: number }) {
  return <header className={styles.header}>
    <h2 className={styles.title}>{labels.title}</h2>
    <span className={styles.badge}>{count} {labels.recordLabel}s</span>
  </header>;
}
`,
      );
      emit(
        `${prefix}/Metric.tsx`,
        `
import type { RecordItem } from './schema';
import { totalAmount } from './selectors';
import { formatAmount } from './format';
import { trend } from './trend';
import styles from '../../../shared/Panel.module.css';
export function Metric({ records }: { records: RecordItem[] }) {
  const change = trend(records);
  return <div className={styles.metric}>
    <strong className={styles.amount}>{formatAmount(totalAmount(records))}</strong>
    <span className={change >= 0 ? styles.positive : styles.negative}>{change >= 0 ? '+' : ''}{change}%</span>
  </div>;
}
`,
      );
      const content =
        panelIndex % 3 === 0
          ? `
<table className={styles.table}><thead><tr className={styles.muted}><th className={styles.cell}>Record</th><th>Status</th><th className={styles.numeric}>Value</th></tr></thead>
<tbody>{records.slice((page - 1) * 4, page * 4).map(record => <tr key={record.id} className={styles.tableRow}><td className={styles.recordName} title={record.name}>{record.name}</td><td>{statusLabels[record.status]}</td><td className={styles.numeric}>{formatAmount(record.amount)}</td></tr>)}</tbody></table>`
          : panelIndex % 3 === 1
            ? `
<ul className={styles.list}>{records.slice((page - 1) * 4, page * 4).map(record => <li key={record.id}>
<div className={styles.progressLabel}><span className={styles.truncate}>{record.name}</span><span>{formatAmount(record.amount)}</span></div>
<div className={styles.track}><div className={styles.progress} style={{ width: progress(record.amount, maximum) + '%' }} /></div></li>)}</ul>`
            : `
<ul className={styles.list}>{records.slice((page - 1) * 4, page * 4).map(record => <li key={record.id} className={styles.activity}>
<span className={styles.dot} /><div className={styles.activityContent}><p className={styles.truncate}>{record.name}</p><p className={styles.muted}>{statusLabels[record.status]} · {formatDate(record.updatedAt)}</p></div><span>{formatAmount(record.amount)}</span></li>)}</ul>`;
      emit(
        `${prefix}/Details.tsx`,
        `
import type { RecordItem } from './schema';
import { formatAmount${panelIndex % 3 === 2 ? ', formatDate' : ''} } from './format';
${panelIndex % 3 === 1 ? "import { progress } from './trend';" : "import { statusLabels } from './labels';"}
import styles from '../../../shared/Panel.module.css';
export function Details({ records, page }: { records: RecordItem[]; page: number }) {
  ${panelIndex % 3 === 1 ? 'const maximum = Math.max(1, ...records.map(record => record.amount));' : ''}
  return (${content});
}
`,
      );
      emit(
        `${prefix}/Panel.tsx`,
        `
import { useMemo } from 'react';
import { records } from './data';
import { selectRecords } from './selectors';
import { PanelHeader } from './PanelHeader';
import { Metric } from './Metric';
import { Details } from './Details';
import { PanelSummary } from './PanelSummary';
import styles from '../../../shared/Panel.module.css';
export function Panel({ query, activeOnly, sort, page }: { query: string; activeOnly: boolean; sort: 'name' | 'amount' | 'updatedAt'; page: number }) {
  const selected = useMemo(() => selectRecords(records, query, activeOnly, sort), [query, activeOnly, sort]);
  return <section data-panel="${feature}-${panel}" data-tone="${color}" className={styles.panel}>
    <PanelHeader count={selected.length} /><Metric records={selected} /><Details records={selected} page={page} /><PanelSummary records={selected} />
  </section>;
}
`,
      );
      emitPanelAnalytics(emit, prefix, seed);
    }
    emit(
      `${feature}/page.tsx`,
      `
import { profile } from './config';
import { useWorkspaceSearch } from '../../shared/useWorkspaceSearch';
import { FeatureHeader } from '../../shared/FeatureHeader';
import styles from '../../shared/Panel.module.css';
${feature === 'overview' ? "import { Insights } from '../../features/insights/Insights';" : ''}
${['approvals', 'procurement', 'releases'].includes(feature) ? "import { ApprovalDesk } from '../../features/workflows/ApprovalDesk';" : ''}
${['reports', 'forecasts'].includes(feature) ? "import { ReportStudio } from '../../features/reports/ReportStudio';" : ''}
${['audit', 'notifications'].includes(feature) ? "import { ActivityFeed } from '../../features/activity/ActivityFeed';" : ''}
${panels.map((panel, i) => `import { Panel as Panel${i} } from './${panel}/Panel';`).join('\n')}
export default function ${title(feature)}Page() {
  const { search: { query, activeOnly, sort, page }, updateSearch } = useWorkspaceSearch();
  return <div data-benchmark-ready="true" data-feature="${feature}">
    <FeatureHeader title="${title(feature)}" description={profile.description} query={query} onQueryChange={query => updateSearch({ query, page: 1 })} activeOnly={activeOnly} onActiveOnlyChange={activeOnly => updateSearch({ activeOnly, page: 1 })} sort={sort} onSortChange={sort => updateSearch({ sort, page: 1 })} page={page} onPageChange={page => updateSearch({ page })} />
    ${feature === 'overview' ? '<Insights />' : ''}
    ${['approvals', 'procurement', 'releases'].includes(feature) ? '<ApprovalDesk workspace="' + feature + '" />' : ''}
    ${['reports', 'forecasts'].includes(feature) ? '<ReportStudio />' : ''}
    ${['audit', 'notifications'].includes(feature) ? '<ActivityFeed />' : ''}
    <div className={styles.grid}>${panels.map((_, i) => `<Panel${i} query={query} activeOnly={activeOnly} sort={sort} page={page} />`).join('\n')}</div>
  </div>;
}
`,
    );
  }
  emit(
    'navigation.ts',
    `export const navigation = ${JSON.stringify(
      features.map((name, i) => ({
        name: title(name),
        group: domainForFeature(name).name,
        path: i === 0 ? '/' : `/${name}`,
      })),
      null,
      2,
    )} as const;
export const navigationGroups = ${JSON.stringify(domains.map((domain) => domain.name))}.map(name => ({ name, items: navigation.filter(item => item.group === name) }));`,
  );
  emit(
    'routes.ts',
    `
import { createRoute, lazyRouteComponent } from '@tanstack/react-router';
import { rootRoute } from '../app/root-route';
import { searchSchema } from '../shared/search-schema';
export const routes = [
${features.map((name, i) => `  createRoute({ getParentRoute: () => rootRoute, path: '${i === 0 ? '/' : `/${name}`}', validateSearch: searchSchema, component: lazyRouteComponent(() => import('./${name}/page')) }),`).join('\n')}
];
`,
  );
  const manifest = {
    fingerprint,
    features: features.length,
    panelsPerFeature: panels.length,
    runtimeModules: modules,
  };
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  console.log(ensureGenerated({ force: process.argv.includes('--force') }));
}
