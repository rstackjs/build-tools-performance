import axios from 'axios';
import { format, parseISO } from 'date-fns';
import { orderBy, sumBy } from 'lodash-es';
import { z } from 'zod';

const accountSchema = z.object({
  id: z.number(),
  name: z.string(),
  revenue: z.number(),
  updatedAt: z.string(),
});
export type Account = z.infer<typeof accountSchema>;
const accounts = Array.from({ length: 200 }, (_, index) => ({
  id: index + 1,
  name: `Account ${String(index + 1).padStart(3, '0')}`,
  revenue: 800 + ((index * 137) % 9000),
  updatedAt: '2026-01-15',
}));
// A deterministic in-process API adapter exercises Axios and Query without
// introducing backend latency or network availability into measurements.
const client = axios.create({
  adapter: async (config) => ({
    data: accounts,
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
  }),
});
export async function loadAccounts() {
  const response = await client.get('/api/accounts');
  return orderBy(
    z.array(accountSchema).parse(response.data),
    ['revenue'],
    ['desc'],
  );
}
export const revenueTotal = (rows: Account[]) => sumBy(rows, 'revenue');
export const accountDate = (value: string) =>
  format(parseISO(value), 'MMM dd, yyyy');
