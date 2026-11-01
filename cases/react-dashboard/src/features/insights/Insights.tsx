import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  useTable,
  tableFeatures,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { accountDate, loadAccounts, revenueTotal, type Account } from './data';

const features = tableFeatures({});
const columns: ColumnDef<typeof features, Account>[] = [
  { accessorKey: 'name', header: 'Account' },
  {
    accessorKey: 'revenue',
    header: 'Revenue',
    cell: (context) => `$${context.getValue()}`,
  },
  {
    accessorKey: 'updatedAt',
    header: 'Updated',
    cell: (context) => accountDate(String(context.getValue())),
  },
];
const empty: Account[] = [];
const notes =
  '### Weekly review\n\nRevenue is **on track**. Review the highest-value accounts before Friday.\n\n| Team | Status |\n| --- | --- |\n| Sales | On track |\n| Support | Reviewing |\n\n- [x] Reconcile invoices\n- [ ] Review renewals';
export function Insights() {
  const { data = empty, isSuccess } = useQuery({
    queryKey: ['accounts'],
    queryFn: loadAccounts,
  });
  const table = useTable({ data, columns, features });
  const scroll = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => scroll.current,
    estimateSize: () => 36,
    overscan: 5,
  });
  const rows = table.getRowModel().rows;
  return (
    <section
      data-insights-ready={isSuccess ? 'true' : 'false'}
      className="mb-6 grid gap-5 rounded-xl border border-slate-200 bg-white p-5 xl:grid-cols-2"
    >
      <div>
        <h2 className="font-semibold">Account revenue</h2>
        <p data-testid="revenue-total">
          ${revenueTotal(data)} across {data.length} accounts
        </p>
        <AreaChart width={420} height={180} data={data.slice(0, 12)}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="id" />
          <YAxis />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#4f46e5"
            fill="#e0e7ff"
            isAnimationActive={false}
          />
        </AreaChart>
      </div>
      <div>
        <h2 className="mb-2 font-semibold">Top accounts</h2>
        <div role="table" aria-label="Account revenue" className="text-sm">
          <div role="row" className="grid grid-cols-3 font-medium">
            {table.getFlatHeaders().map((header) => (
              <div role="columnheader" key={header.id}>
                {flexRender(
                  header.column.columnDef.header,
                  header.getContext(),
                )}
              </div>
            ))}
          </div>
          <div
            ref={scroll}
            data-testid="account-scroll"
            className="h-48 overflow-auto"
          >
            <div
              className="relative"
              style={{ height: virtualizer.getTotalSize() }}
            >
              {virtualizer.getVirtualItems().map((item) => (
                <div
                  role="row"
                  key={rows[item.index].id}
                  className="absolute left-0 top-0 grid w-full grid-cols-3 items-center"
                  style={{
                    height: item.size,
                    transform: `translateY(${item.start}px)`,
                  }}
                >
                  {rows[item.index].getAllCells().map((cell) => (
                    <div role="cell" key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-2 text-sm">
        <Markdown remarkPlugins={[remarkGfm]}>{notes}</Markdown>
      </div>
    </section>
  );
}
