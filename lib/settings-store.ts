import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getPublicSettings } from '@/app/actions/public';

export interface StoreSettings {
  storeName: string;
  storeDescription: string;
  logo: string;
  theme: 'light' | 'dark' | 'system';
  font: string;
}

const EMPTY: StoreSettings = { storeName: '', storeDescription: '', logo: '', theme: 'system', font: 'poppins' };

interface SettingsState {
  settings: StoreSettings;
  loading: boolean;
  initialized: boolean;
  init: () => Promise<void>;
  setSettings: (s: StoreSettings) => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: EMPTY,
  loading: true,
  initialized: false,
  init: async () => {
    if (get().initialized) return;
    const data = await getPublicSettings();
    set({
      settings: {
        storeName: data.storeName || 'MercaToma',
        storeDescription: data.storeDescription || 'Del campo a tu mesa',
        logo: data.logo || '',
        theme: (data.theme as StoreSettings['theme']) || 'system',
        font: data.font || 'poppins',
      },
      loading: false,
      initialized: true,
    });
  },
  setSettings: (settings) => set({ settings }),
}));