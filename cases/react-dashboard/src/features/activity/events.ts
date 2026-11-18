import mitt from 'mitt';
import { nanoid } from 'nanoid';
import { useSyncExternalStore } from 'react';

export type Activity = {
  id: string;
  area: 'reports' | 'approvals' | 'system';
  message: string;
};
const events = mitt<{ change: undefined }>();
let entries: Activity[] = [
  { id: 'seed-1', area: 'system', message: 'Workspace inventory refreshed' },
  { id: 'seed-2', area: 'reports', message: 'January account data reconciled' },
  {
    id: 'seed-3',
    area: 'approvals',
    message: 'Procurement review queue opened',
  },
];
export function recordActivity(area: Activity['area'], message: string) {
  entries = [{ id: nanoid(), area, message }, ...entries].slice(0, 100);
  events.emit('change', undefined);
}
function subscribe(listener: () => void) {
  events.on('change', listener);
  return () => events.off('change', listener);
}
export function useActivity() {
  return useSyncExternalStore(subscribe, () => entries);
}
