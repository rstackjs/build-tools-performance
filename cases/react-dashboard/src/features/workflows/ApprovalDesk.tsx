import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { advanceApproval } from './machine';
import { createRequests } from './requests';
import { recordActivity } from '../activity/events';
import { button } from '../../shared/ui';
import styles from '../../shared/Workspace.module.css';

const actions = [
  { type: 'SUBMIT', label: 'Submit' },
  { type: 'APPROVE', label: 'Approve' },
  { type: 'REJECT', label: 'Reject' },
  { type: 'REVISE', label: 'Revise' },
] as const;
export function ApprovalDesk({ workspace }: { workspace: string }) {
  const { t } = useTranslation();
  const [requests, setRequests] = useState(() => createRequests(workspace));
  return (
    <section className={styles.workspace} data-testid="approval-desk">
      <header className={styles.heading}>
        <div>
          <h2>{t('workflow')}</h2>
          <p>
            Submit a request, review ownership and cost, then approve or return
            it for revision.
          </p>
        </div>
      </header>
      <div className={styles.requestGrid}>
        {requests.map((request) => (
          <article
            key={request.id}
            className={styles.request}
            data-request={request.id}
          >
            <h3>{request.name}</h3>
            <p>
              {request.owner} · {request.amount.toLocaleString('en-US')}{' '}
              {workspace === 'releases' ? 'planned hours' : 'USD'}
            </p>
            <span className={styles.badge} data-testid="approval-state">
              {String(request.snapshot.value)}
            </span>
            <div className={styles.actions}>
              {actions.map((action) => (
                <button
                  data-action={action.type}
                  key={action.type}
                  className={button()}
                  disabled={!request.snapshot.can({ type: action.type })}
                  onClick={() => {
                    if (!request.snapshot.can({ type: action.type })) return;
                    const snapshot = advanceApproval(
                      request.snapshot,
                      action.type,
                    );
                    setRequests((previous) =>
                      previous.map((item) =>
                        item.id === request.id ? { ...item, snapshot } : item,
                      ),
                    );
                    recordActivity(
                      'approvals',
                      `${request.name}: ${snapshot.value}`,
                    );
                  }}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
