// Per-panel business logic is emitted as separate, reachable application modules.
export function emitPanelAnalytics(emit, prefix, seed) {
  emit(
    `${prefix}/policy.ts`,
    `
import { profile } from '../config';
export const policy = {
  target: ${Math.round((100 + seed * 7) * (9 + (seed % 4)))},
  reviewThreshold: ${Math.round((100 + seed * 7) * 1.5)},
  reviewBefore: '2026-01-10',
  targetLabel: profile.targetLabel,
  owner: profile.title + ' operations',
};
`,
  );
  emit(
    `${prefix}/statistics.ts`,
    `
import { mean, median, sum } from 'd3-array';
import type { RecordItem } from './schema';
export function summarize(records: RecordItem[]) {
  return {
    total: sum(records, record => record.amount),
    average: mean(records, record => record.amount) ?? 0,
    median: median(records, record => record.amount) ?? 0,
    active: records.filter(record => record.status === 'active').length,
    pending: records.filter(record => record.status === 'pending').length,
  };
}
`,
  );
  emit(
    `${prefix}/budget.ts`,
    `
import { policy } from './policy';
export function budgetFor(total: number) {
  return {
    target: policy.target,
    remaining: policy.target - total,
    utilization: Math.round(total / policy.target * 100),
    overBudget: total > policy.target,
  };
}
`,
  );
  emit(
    `${prefix}/alerts.ts`,
    `
import type { RecordItem } from './schema';
import { policy } from './policy';
export function alertsFor(records: RecordItem[]) {
  return records.flatMap(record => {
    if (record.status === 'archived') return [];
    const alerts: { id: string; severity: 'warning' | 'info'; message: string }[] = [];
    if (record.amount > policy.reviewThreshold)
      alerts.push({ id: record.id + '-amount', severity: 'warning', message: record.name + ' exceeds the review threshold' });
    if (record.status === 'pending' && record.updatedAt < policy.reviewBefore)
      alerts.push({ id: record.id + '-pending', severity: 'info', message: record.name + ' is awaiting an owner review' });
    return alerts;
  });
}
`,
  );
  emit(
    `${prefix}/activity.ts`,
    `
import type { RecordItem } from './schema';
import { statusLabels } from './labels';
export function recentActivity(records: RecordItem[]) {
  return [...records].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id))
    .slice(0, 3).map(record => ({ id: record.id, date: record.updatedAt, message: record.name + ': ' + statusLabels[record.status] }));
}
`,
  );
  emit(
    `${prefix}/PanelSummary.tsx`,
    `
import type { RecordItem } from './schema';
import { summarize } from './statistics';
import { budgetFor } from './budget';
import { alertsFor } from './alerts';
import { recentActivity } from './activity';
import { policy } from './policy';
import { formatAmount, formatDate } from './format';
import styles from '../../../shared/Panel.module.css';
export function PanelSummary({ records }: { records: RecordItem[] }) {
  const summary = summarize(records);
  const budget = budgetFor(summary.total);
  const alerts = alertsFor(records);
  const activity = recentActivity(records);
  return <footer className={styles.summary}>
    <dl className={styles.statistics}>
      <div><dt>Average</dt><dd>{formatAmount(summary.average)}</dd></div>
      <div><dt>Median</dt><dd>{formatAmount(summary.median)}</dd></div>
      <div><dt>Active / pending</dt><dd>{summary.active} / {summary.pending}</dd></div>
    </dl>
    <p className={budget.overBudget ? styles.negative : styles.muted}>{policy.targetLabel}: {budget.utilization}% of {formatAmount(budget.target)} · {formatAmount(budget.remaining)} remaining</p>
    <details className={styles.review}>
      <summary>{alerts.length} alerts · Recent activity</summary>
      <p>Owner: {policy.owner}</p>
      <ul>{alerts.map(alert => <li key={alert.id} data-severity={alert.severity}>{alert.message}</li>)}</ul>
      <ol>{activity.map(event => <li key={event.id}><time>{formatDate(event.date)}</time> {event.message}</li>)}</ol>
    </details>
  </footer>;
}
`,
  );
}
