import { create } from 'zustand';
import { produce } from 'immer';

type Preferences = { pinned: string[]; togglePin: (name: string) => void };
export const usePreferences = create<Preferences>((set) => ({
  pinned: [],
  togglePin: (name) =>
    set(
      produce((state: Preferences) => {
        const index = state.pinned.indexOf(name);
        if (index < 0) state.pinned.push(name);
        else state.pinned.splice(index, 1);
      }),
    ),
}));
