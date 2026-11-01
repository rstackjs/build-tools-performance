import { useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  Root as Dialog,
  Portal,
  Overlay,
  Content,
  Title,
  Description,
  Close,
  Trigger,
} from '@radix-ui/react-dialog';
import {
  Root as Menu,
  Trigger as MenuTrigger,
  Portal as MenuPortal,
  Content as MenuContent,
  Item,
} from '@radix-ui/react-dropdown-menu';
import {
  Provider as TooltipProvider,
  Root as Tooltip,
  Trigger as TooltipTrigger,
  Portal as TooltipPortal,
  Content as TooltipContent,
} from '@radix-ui/react-tooltip';
import { Command } from 'cmdk';
import { Search, Pin, Download, X } from 'lucide-react';
import Fuse from 'fuse.js';
import { toast } from 'sonner';
import { navigation } from '../generated/navigation';
import { usePreferences } from '../shared/preferences';
import { button, cn } from '../shared/ui';

const searchIndex = new Fuse([...navigation], {
  keys: ['name'],
  threshold: 0.35,
});
export function WorkspaceTools() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const pinned = usePreferences((state) => state.pinned);
  const togglePin = usePreferences((state) => state.togglePin);
  const matches = useMemo(
    () =>
      query ? searchIndex.search(query).map(({ item }) => item) : navigation,
    [query],
  );
  return (
    <div className="flex items-center gap-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <Trigger className={button()}>
          <Search className="mr-2 inline size-4" />
          Find workspace
        </Trigger>
        <Portal>
          <Overlay className="fixed inset-0 z-20 bg-slate-950/30" />
          <Content className="fixed left-1/2 top-24 z-30 w-96 -translate-x-1/2 rounded-xl bg-white p-5 shadow-xl">
            <Title className="font-semibold">Find a workspace</Title>
            <Description className="my-2 text-sm text-slate-500">
              Search business areas and navigate directly.
            </Description>
            <Command shouldFilter={false}>
              <Command.Input
                aria-label="Search workspaces"
                value={query}
                onValueChange={setQuery}
                className="w-full rounded border p-2"
              />
              <Command.List className="mt-2 max-h-72 overflow-auto">
                <Command.Empty>No workspaces found.</Command.Empty>
                {matches.map((item) => (
                  <Command.Item
                    key={item.path}
                    value={item.name}
                    className="cursor-pointer rounded p-2 data-[selected=true]:bg-indigo-50"
                    onSelect={() => {
                      void navigate({
                        to: item.path,
                        search: {
                          query: '',
                          activeOnly: false,
                          page: 1,
                          sort: 'name',
                        },
                      });
                      setOpen(false);
                    }}
                  >
                    {item.name}
                  </Command.Item>
                ))}
              </Command.List>
            </Command>
            <Close
              aria-label="Close workspace search"
              className="absolute right-4 top-4"
            >
              <X className="size-4" />
            </Close>
          </Content>
        </Portal>
      </Dialog>
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              aria-label="Pin overview"
              aria-pressed={pinned.includes('overview')}
              className={cn(
                button(),
                pinned.includes('overview') && 'bg-indigo-100',
              )}
              onClick={() => togglePin('overview')}
            >
              <Pin className="size-4" />
            </button>
          </TooltipTrigger>
          <TooltipPortal>
            <TooltipContent className="z-40 rounded bg-slate-900 p-2 text-xs text-white">
              Pin overview
            </TooltipContent>
          </TooltipPortal>
        </Tooltip>
      </TooltipProvider>
      <Menu>
        <MenuTrigger className={button()}>Actions</MenuTrigger>
        <MenuPortal>
          <MenuContent className="z-30 rounded-lg border bg-white p-2 shadow-lg">
            <Item
              className="cursor-pointer rounded p-2 text-sm outline-none focus:bg-indigo-50"
              onSelect={() => toast.success('Report queued for export')}
            >
              <Download className="mr-2 inline size-4" />
              Export report
            </Item>
          </MenuContent>
        </MenuPortal>
      </Menu>
    </div>
  );
}
