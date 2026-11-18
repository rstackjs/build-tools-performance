import { useEffect, useMemo, useState } from 'react';
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { loadAccounts } from '../insights/data';
import { ActivityFeed } from '../activity/ActivityFeed';
import { recordActivity } from '../activity/events';
import {
  listPresets,
  removePreset,
  savePreset,
  type ReportPreset,
} from './storage';
import {
  minimumFromUrl,
  reportLink,
  reportTotal,
  revenueDistribution,
} from './model';
import { accountsCsv, downloadAccounts } from './export';
import { button } from '../../shared/ui';
import styles from '../../shared/Workspace.module.css';

export function ReportStudio() {
  const { t } = useTranslation();
  const { data = [], isSuccess } = useQuery({
    queryKey: ['accounts'],
    queryFn: loadAccounts,
  });
  const [minimum, setMinimum] = useState(minimumFromUrl);
  const [name, setName] = useState('January accounts');
  const [presets, setPresets] = useState<ReportPreset[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => {
    let active = true;
    listPresets()
      .then((value) => {
        if (active) {
          setPresets(value);
          setLoaded(true);
        }
      })
      .catch(() => {
        if (active) {
          setMessage('Unable to read saved reports.');
          setLoaded(true);
        }
      });
    return () => {
      active = false;
    };
  }, []);
  const accounts = useMemo(
    () => data.filter((account) => account.revenue >= minimum),
    [data, minimum],
  );
  const distribution = useMemo(() => revenueDistribution(accounts), [accounts]);
  const refreshPresets = async () => setPresets(await listPresets());
  return (
    <section
      className={styles.workspace}
      data-report-ready={loaded && isSuccess ? 'true' : 'false'}
    >
      <header className={styles.heading}>
        <div>
          <h2>{t('reports')}</h2>
          <p>{t('reportDescription')}</p>
        </div>
      </header>
      <TabGroup>
        <TabList aria-label="Report sections" className={styles.tabs}>
          <Tab>Summary</Tab>
          <Tab>Saved reports</Tab>
          <Tab>Activity</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <div className={styles.reportControls}>
              <label>
                Minimum revenue{' '}
                <input
                  aria-label="Minimum revenue"
                  className={styles.input}
                  type="number"
                  min="0"
                  max="10000"
                  value={minimum}
                  onChange={(event) =>
                    setMinimum(
                      Math.max(0, Math.min(10000, Number(event.target.value))),
                    )
                  }
                />
              </label>
              <button
                className={button()}
                onClick={() => {
                  downloadAccounts(accounts);
                  recordActivity(
                    'reports',
                    `Exported ${accounts.length} accounts`,
                  );
                  setMessage(`Exported ${accounts.length} accounts`);
                }}
              >
                Download CSV
              </button>
              <a href={reportLink(minimum)} data-testid="report-link">
                Open report link
              </a>
            </div>
            <p data-testid="report-total">
              {accounts.length} accounts · $
              {reportTotal(accounts).toLocaleString('en-US')}
            </p>
            <div
              className={styles.distribution}
              aria-label="Revenue distribution"
            >
              {distribution.map((bucket) => (
                <div key={bucket.label} className={styles.bucket}>
                  <span>${bucket.label}</span>
                  <div className={styles.track}>
                    <div
                      className={styles.bar}
                      style={{ width: `${bucket.width}%` }}
                    />
                  </div>
                  <span>{bucket.count}</span>
                </div>
              ))}
            </div>
            <form
              className={styles.reportControls}
              onSubmit={(event) => {
                event.preventDefault();
                if (!name.trim()) return;
                void savePreset(name.trim(), minimum)
                  .then(async () => {
                    await refreshPresets();
                    recordActivity('reports', `Saved report: ${name.trim()}`);
                    setMessage(`Saved report: ${name.trim()}`);
                  })
                  .catch(() => setMessage('Unable to save report.'));
              }}
            >
              <input
                aria-label="Report name"
                className={styles.input}
                value={name}
                maxLength={80}
                onChange={(event) => setName(event.target.value)}
              />
              <button className={button()}>Save report</button>
            </form>
            <details className={styles.csvPreview}>
              <summary>CSV preview</summary>
              <pre data-testid="csv-preview">
                {accountsCsv(accounts.slice(0, 5))}
              </pre>
            </details>
          </TabPanel>
          <TabPanel>
            <ul className={styles.savedReports}>
              {presets.map((preset) => (
                <li key={preset.id}>
                  <span>
                    {preset.name} · Minimum ${preset.minimumRevenue}
                  </span>
                  <button
                    className={button()}
                    aria-label={`Load ${preset.name}`}
                    onClick={() => {
                      setMinimum(preset.minimumRevenue);
                      setName(preset.name);
                      setMessage(`Loaded report: ${preset.name}`);
                    }}
                  >
                    Load
                  </button>
                  <button
                    className={button()}
                    aria-label={`Delete ${preset.name}`}
                    onClick={() => {
                      void removePreset(preset.id)
                        .then(refreshPresets)
                        .catch(() => setMessage('Unable to delete report.'));
                    }}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
            {presets.length === 0 && <p>No saved reports yet.</p>}
          </TabPanel>
          <TabPanel>
            <ActivityFeed />
          </TabPanel>
        </TabPanels>
      </TabGroup>
      <p role="status" data-testid="report-status">
        {message}
      </p>
    </section>
  );
}
