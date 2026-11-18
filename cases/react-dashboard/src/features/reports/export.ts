import type { Account } from '../insights/data';

const csvCell = (value: string | number) =>
  `"${String(value).replaceAll('"', '""')}"`;
export function accountsCsv(accounts: Account[]) {
  return [
    ['Account', 'Revenue', 'Updated'],
    ...accounts.map((account) => [
      account.name,
      account.revenue,
      account.updatedAt,
    ]),
  ]
    .map((row) => row.map(csvCell).join(','))
    .join('\r\n');
}
export function downloadAccounts(accounts: Account[]) {
  const blob = new Blob([accountsCsv(accounts)], {
    type: 'text/csv;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'accounts.csv';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
