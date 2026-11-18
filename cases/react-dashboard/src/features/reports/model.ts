import { bin, extent, sum } from 'd3-array';
import { scaleLinear } from 'd3-scale';
import queryString from 'query-string';
import type { Account } from '../insights/data';

export function revenueDistribution(accounts: Account[]) {
  const [minimum = 0, maximum = 1] = extent(
    accounts,
    (account) => account.revenue,
  );
  const buckets = bin<Account, number>()
    .value((account) => account.revenue)
    .domain([minimum, maximum > minimum ? maximum : minimum + 1])
    .thresholds(6)(accounts);
  const width = scaleLinear()
    .domain([0, Math.max(1, ...buckets.map((bucket) => bucket.length))])
    .range([0, 100]);
  return buckets.map((bucket) => ({
    label: `${bucket.x0}–${bucket.x1}`,
    count: bucket.length,
    width: width(bucket.length),
  }));
}
export const reportTotal = (accounts: Account[]) =>
  sum(accounts, (account) => account.revenue);
export const reportLink = (minimumRevenue: number) =>
  queryString.stringifyUrl({ url: '/reports', query: { minimumRevenue } });
export function minimumFromUrl() {
  const value = Number(queryString.parse(location.search).minimumRevenue ?? 0);
  return Number.isFinite(value) ? Math.min(10000, Math.max(0, value)) : 0;
}
