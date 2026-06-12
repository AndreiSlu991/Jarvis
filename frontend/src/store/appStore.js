import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAppStore = create(persist(
  (set) => ({
    user: null,
    token: null,
    tweaks: { accent: '#ffa047', motion: 0.7, density: 'normal' },
    setAuth: (user, token) => set({ user, token }),
    logout: () => set({ user: null, token: null }),
    setTweaks: (tweaks) => set(s => ({ tweaks: { ...s.tweaks, ...tweaks } })),
  }),
  { name: 'jarvis-store', partialize: s => ({ user: s.user, token: s.token, tweaks: s.tweaks }) }
));
