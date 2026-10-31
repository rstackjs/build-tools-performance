import { useNavigate, useSearch } from '@tanstack/react-router';
import { searchSchema, type WorkspaceSearch } from './search-schema';

export function useWorkspaceSearch() {
  const search = searchSchema.parse(useSearch({ strict: false }));
  const navigate = useNavigate();
  const updateSearch = (patch: Partial<WorkspaceSearch>) =>
    navigate({
      to: '.',
      search: (previous) => ({ ...previous, ...patch }),
      replace: true,
      resetScroll: false,
    });
  return { search, updateSearch };
}
