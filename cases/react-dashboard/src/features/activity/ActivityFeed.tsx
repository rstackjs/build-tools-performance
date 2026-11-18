import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useActivity } from './events';
import styles from '../../shared/Workspace.module.css';

export function ActivityFeed() {
  const { t } = useTranslation();
  const entries = useActivity();
  const [filter, setFilter] = useState('all');
  const visible = entries.filter(
    (event) => filter === 'all' || event.area === filter,
  );
  return (
    <section className={styles.workspace} data-testid="activity-feed">
      <header className={styles.heading}>
        <div>
          <h2>{t('activity')}</h2>
          <p>Changes from approvals, reports, and workspace operations.</p>
        </div>
        <select
          aria-label="Filter activity"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          className={styles.input}
        >
          <option value="all">All activity</option>
          <option value="reports">Reports</option>
          <option value="approvals">Approvals</option>
          <option value="system">System</option>
        </select>
      </header>
      <ol className={styles.activityList}>
        {visible.map((event) => (
          <li key={event.id}>
            <span className={styles.badge}>{event.area}</span>
            <span>{event.message}</span>
          </li>
        ))}
      </ol>
      {visible.length === 0 && <p>No matching activity.</p>}
    </section>
  );
}
