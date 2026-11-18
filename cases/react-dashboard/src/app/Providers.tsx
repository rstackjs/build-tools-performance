import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';
import { Toaster } from 'sonner';
import { I18nextProvider } from 'react-i18next';
import { i18n } from '../shared/i18n';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary fallback={<p role="alert">Unable to load workspace.</p>}>
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={queryClient}>
          {children}
          <Toaster />
        </QueryClientProvider>
      </I18nextProvider>
    </ErrorBoundary>
  );
}
