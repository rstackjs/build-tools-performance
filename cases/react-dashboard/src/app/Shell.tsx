import { useState } from 'react';
import { Link, Outlet } from '@tanstack/react-router';
import { navigationGroups } from '../generated/navigation';
import { useTranslation } from 'react-i18next';
import { LocaleSwitcher } from '../shared/LocaleSwitcher';
import { WorkspaceTools } from './WorkspaceTools';
import logo from '../assets/logo.svg';
import styles from './Shell.module.css';

export function Shell() {
  const { t } = useTranslation();
  const [compact, setCompact] = useState(false);
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <img src={logo} alt="" className={styles.logo} />
          <span className={styles.brandName}>{t('workspace')}</span>
        </div>
        <nav aria-label="Workspaces" className={styles.navigation}>
          {navigationGroups.map((group) => (
            <section key={group.name} className={styles.navGroup}>
              <h2 className={styles.navHeading}>{group.name}</h2>
              {group.items.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  search={{
                    query: '',
                    activeOnly: false,
                    page: 1,
                    sort: 'name',
                  }}
                  preload={false}
                  activeOptions={{ exact: true }}
                  className={styles.link}
                  activeProps={{
                    className: styles.activeLink,
                  }}
                >
                  {item.name}
                </Link>
              ))}
            </section>
          ))}
        </nav>
        <p className={styles.organization}>{t('organization')}</p>
      </aside>
      <div className={styles.content}>
        <header className={styles.toolbar}>
          <span className={styles.breadcrumb}>{t('operations')}</span>
          <WorkspaceTools />
          <LocaleSwitcher />
          <button
            data-testid="density"
            aria-pressed={compact}
            className={styles.density}
            onClick={() => setCompact(!compact)}
          >
            {t(compact ? 'comfortable' : 'compact')}
          </button>
        </header>
        <main className={compact ? styles.compact : styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
