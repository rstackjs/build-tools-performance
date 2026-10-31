import { useState } from 'react';
import { Link, Outlet } from '@tanstack/react-router';
import { navigation } from '../generated/navigation';
import logo from '../assets/logo.svg';

export function Shell() {
  const [compact, setCompact] = useState(false);
  return (
    <div className="min-h-screen bg-slate-50 text-slate-700">
      <aside className="fixed inset-y-0 left-0 z-10 flex w-56 flex-col border-r border-slate-200 bg-white">
        <div className="flex items-center gap-3 border-b border-slate-100 p-5">
          <img src={logo} alt="" className="size-8" />
          <span className="text-lg font-bold text-slate-950">Workspace</span>
        </div>
        <nav
          aria-label="Workspaces"
          className="flex-1 space-y-1 overflow-y-auto p-3"
        >
          {navigation.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              search={{ query: '', activeOnly: false, page: 1, sort: 'name' }}
              preload={false}
              activeOptions={{ exact: true }}
              className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-100"
              activeProps={{
                className: 'bg-indigo-50 font-semibold text-indigo-700',
              }}
            >
              {item.name}
            </Link>
          ))}
        </nav>
        <p className="border-t border-slate-100 p-4 text-xs text-slate-500">
          Operations · Demo organization
        </p>
      </aside>
      <div className="ml-56">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-4">
          <span className="text-sm">Acme / Operations</span>
          <button
            data-testid="density"
            aria-pressed={compact}
            className="rounded-md border border-slate-300 px-3 py-1 text-sm hover:bg-slate-50"
            onClick={() => setCompact(!compact)}
          >
            {compact ? 'Comfortable view' : 'Compact view'}
          </button>
        </header>
        <main className={compact ? 'p-4' : 'p-8'}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
