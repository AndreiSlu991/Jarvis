import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAppStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      viewMode: 'minimal', // 'minimal' | 'dense'
      sidebarOpen: false,
      setAuth: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
      toggleViewMode: () =>
        set((s) => ({ viewMode: s.viewMode === 'minimal' ? 'dense' : 'minimal' })),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen })
    }),
    { name: 'jarvis-store' }
  )
);
