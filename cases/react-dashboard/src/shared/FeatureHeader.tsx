import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import type { WorkspaceSearch } from './search-schema';

const savedViewSchema = z.object({ name: z.string().trim().min(3).max(40) });

export function FeatureHeader({
  title,
  description,
  query,
  onQueryChange,
  activeOnly,
  onActiveOnlyChange,
  sort,
  onSortChange,
  page,
  onPageChange,
}: {
  title: string;
  description: string;
  query: string;
  onQueryChange: (value: string) => void;
  activeOnly: boolean;
  onActiveOnlyChange: (value: boolean) => void;
  sort: WorkspaceSearch['sort'];
  onSortChange: (value: WorkspaceSearch['sort']) => void;
  page: number;
  onPageChange: (value: number) => void;
}) {
  const { register, handleSubmit } = useForm<z.infer<typeof savedViewSchema>>({
    resolver: zodResolver(savedViewSchema),
    defaultValues: { name: '' },
  });
  const [message, setMessage] = useState('');
  return (
    <header className="mb-6 space-y-5">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">
          {title}
        </h1>
        <p className="mt-2 text-sm text-slate-500">{description}</p>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <input
          aria-label="Filter records"
          placeholder="Filter records…"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(event) => onActiveOnlyChange(event.target.checked)}
          />
          Active only
        </label>
        <select
          aria-label="Sort records"
          value={sort}
          onChange={(event) =>
            onSortChange(event.target.value as WorkspaceSearch['sort'])
          }
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="name">Name</option>
          <option value="amount">Highest value</option>
          <option value="updatedAt">Updated date</option>
        </select>
        <div className="flex items-center gap-2 text-sm">
          <button
            aria-label="Previous page"
            disabled={page === 1}
            onClick={() => onPageChange(page - 1)}
            className="rounded border border-slate-300 px-2 py-1 disabled:opacity-40"
          >
            Previous
          </button>
          <span data-testid="page-number">Page {page}</span>
          <button
            aria-label="Next page"
            disabled={page === 3}
            onClick={() => onPageChange(page + 1)}
            className="rounded border border-slate-300 px-2 py-1 disabled:opacity-40"
          >
            Next
          </button>
        </div>
        <form
          className="ml-auto flex items-center gap-2"
          onSubmit={handleSubmit(
            ({ name }) => {
              setMessage(`Saved view: ${name}`);
              toast.success(`Saved view: ${name}`);
            },
            () => setMessage('Use 3–40 characters for the view name.'),
          )}
        >
          <input
            aria-label="View name"
            placeholder="View name"
            {...register('name')}
            className="w-36 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          />
          <button className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Save view
          </button>
        </form>
      </div>
      <p role="status" className="text-sm text-indigo-700">
        {message}
      </p>
    </header>
  );
}
