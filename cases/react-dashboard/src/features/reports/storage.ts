import Dexie from 'dexie';
import { nanoid } from 'nanoid';

export type ReportPreset = { id: string; name: string; minimumRevenue: number };
const database = new Dexie('dashboard-report-presets');
database.version(1).stores({ presets: 'id,name' });
const presets = database.table<ReportPreset, string>('presets');
export const listPresets = () => presets.orderBy('name').toArray();
export const removePreset = (id: string) => presets.delete(id);
export async function savePreset(name: string, minimumRevenue: number) {
  const preset = { id: nanoid(), name, minimumRevenue };
  await presets.put(preset);
  return preset;
}
