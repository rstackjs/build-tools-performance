import { createRouter } from '@tanstack/react-router';
import { rootRoute } from './root-route';
import { routes } from '../generated/routes';

export const router = createRouter({
  routeTree: rootRoute.addChildren(routes),
  defaultPreload: false,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
