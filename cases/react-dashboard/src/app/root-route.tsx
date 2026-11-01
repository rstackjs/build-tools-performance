import { createRootRoute } from '@tanstack/react-router';
import { Shell } from './Shell';

export const rootRoute = createRootRoute({
  component: Shell,
  notFoundComponent: () => <p className="p-8">Workspace not found.</p>,
});
