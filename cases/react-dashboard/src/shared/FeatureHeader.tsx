import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import type { WorkspaceSearch } from './search-schema';
import { cn } from './ui';
import styles from './FeatureHeader.module.css';

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
    <header className={styles.header}>
      <div>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.description}>{description}</p>
      </div>
      <div className={styles.filters}>
        <input
          aria-label="Filter records"
          placeholder="Filter records…"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          className={cn(styles.control, styles.filter)}
        />
        <label className={styles.option}>
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
          className={styles.control}
        >
          <option value="name">Name</option>
          <option value="amount">Highest value</option>
          <option value="updatedAt">Updated date</option>
        </select>
        <div className={styles.pagination}>
          <button
            aria-label="Previous page"
            disabled={page === 1}
            onClick={() => onPageChange(page - 1)}
            className={styles.pageButton}
          >
            Previous
          </button>
          <span data-testid="page-number">Page {page}</span>
          <button
            aria-label="Next page"
            disabled={page === 3}
            onClick={() => onPageChange(page + 1)}
            className={styles.pageButton}
          >
            Next
          </button>
        </div>
        <form
          className={styles.saveForm}
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
            className={cn(styles.control, styles.viewName)}
          />
          <button className={styles.saveButton}>Save view</button>
        </form>
      </div>
      <p role="status" className={styles.status}>
        {message}
      </p>
    </header>
  );
}
