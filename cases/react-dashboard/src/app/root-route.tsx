import { createRootRoute } from '@tanstack/react-router';
import { Shell } from './Shell';
import styles from './root-route.module.css';

export const rootRoute = createRootRoute({
  component: Shell,
  notFoundComponent: () => (
    <p className={styles.notFound}>Workspace not found.</p>
  ),
});
