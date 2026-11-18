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
import { button } from '../shared/ui';
import styles from './WorkspaceTools.module.css';

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
    <div className={styles.tools}>
      <Dialog open={open} onOpenChange={setOpen}>
        <Trigger className={button()}>
          <Search className={styles.leadingIcon} />
          Find workspace
        </Trigger>
        <Portal>
          <Overlay className={styles.overlay} />
          <Content className={styles.dialog}>
            <Title className={styles.title}>Find a workspace</Title>
            <Description className={styles.description}>
              Search business areas and navigate directly.
            </Description>
            <Command shouldFilter={false}>
              <Command.Input
                aria-label="Search workspaces"
                value={query}
                onValueChange={setQuery}
                className={styles.search}
              />
              <Command.List className={styles.results}>
                <Command.Empty>No workspaces found.</Command.Empty>
                {matches.map((item) => (
                  <Command.Item
                    key={item.path}
                    value={item.name}
                    className={styles.result}
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
            <Close aria-label="Close workspace search" className={styles.close}>
              <X className={styles.icon} />
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
              className={button()}
              onClick={() => togglePin('overview')}
            >
              <Pin className={styles.icon} />
            </button>
          </TooltipTrigger>
          <TooltipPortal>
            <TooltipContent className={styles.tooltip}>
              Pin overview
            </TooltipContent>
          </TooltipPortal>
        </Tooltip>
      </TooltipProvider>
      <Menu>
        <MenuTrigger className={button()}>Actions</MenuTrigger>
        <MenuPortal>
          <MenuContent className={styles.menu}>
            <Item
              className={styles.menuItem}
              onSelect={() => toast.success('Report queued for export')}
            >
              <Download className={styles.leadingIcon} />
              Export report
            </Item>
          </MenuContent>
        </MenuPortal>
      </Menu>
    </div>
  );
}
