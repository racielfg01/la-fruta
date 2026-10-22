import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getPublicSettings } from '@/app/actions/public';

export interface StoreSettings {
  storeName: string;
  storeDescription: string;
  logo: string;
  theme: 'light' | 'dark' | 'system';
  font: string;
  background_color: string;
  primary_color: string;
  accent_color: string;
  success_color: string;
  warning_color: string;
  light_background_color: string;
  light_primary_color: string;
  light_accent_color: string;
  light_success_color: string;
  light_warning_color: string;
  font_family: string;
  /** Margen de ganancia (%) sobre el precio CUP. */
  priceMargin?: number;
  /** Costo operativo (CUP) agregado a cada orden. */
  operationalCost?: number;
  /** Métodos de pago visibles en el checkout. */
  showPaymentCash?: boolean;
  showPaymentTransfer?: boolean;
}

const EMPTY: StoreSettings = {
  storeName: '', storeDescription: '', logo: '', theme: 'system', font: 'poppins',
  background_color: '', primary_color: '', accent_color: '', success_color: '', warning_color: '',
  light_background_color: '', light_primary_color: '', light_accent_color: '', light_success_color: '', light_warning_color: '',
  font_family: '',
  priceMargin: 0,
  operationalCost: 0,
  showPaymentCash: true,
  showPaymentTransfer: true,
};

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
    const s: StoreSettings = {
      storeName: data.storeName || 'MercaToma',
      storeDescription: data.storeDescription || 'Del campo a tu mesa',
      logo: data.logo || '',
      theme: (data.theme as StoreSettings['theme']) || 'system',
      font: data.font || 'poppins',
      background_color: data.background_color || '',
      primary_color: data.primary_color || '',
      accent_color: data.accent_color || '',
      success_color: data.success_color || '',
      warning_color: data.warning_color || '',
      light_background_color: data.light_background_color || '',
      light_primary_color: data.light_primary_color || '',
      light_accent_color: data.light_accent_color || '',
      light_success_color: data.light_success_color || '',
      light_warning_color: data.light_warning_color || '',
      font_family: data.font_family || '',
      priceMargin: Number(data.priceMargin) || 0,
      operationalCost: Number(data.operationalCost) || 0,
      showPaymentCash: data.showPaymentCash !== false,
      showPaymentTransfer: data.showPaymentTransfer !== false,
    };
    set({ settings: s, loading: false, initialized: true });
    applyBrandCSS(s);
  },
  setSettings: (settings) => set({ settings }),
}));

export function applyBrandCSS(s: Partial<StoreSettings>) {
  const r = document.documentElement.style;
  if (s.primary_color) r.setProperty('--color-primary', s.primary_color);
  if (s.accent_color) r.setProperty('--color-accent', s.accent_color);
  if (s.success_color) r.setProperty('--color-success', s.success_color);
  if (s.warning_color) r.setProperty('--color-warning', s.warning_color);
  if (s.background_color) r.setProperty('--color-background', s.background_color);
  if (s.light_primary_color) r.setProperty('--color-light-primary', s.light_primary_color);
  if (s.light_accent_color) r.setProperty('--color-light-accent', s.light_accent_color);
  if (s.light_success_color) r.setProperty('--color-light-success', s.light_success_color);
  if (s.light_warning_color) r.setProperty('--color-light-warning', s.light_warning_color);
  if (s.light_background_color) r.setProperty('--color-light-background', s.light_background_color);
  if (s.font_family) r.setProperty('--font-family', s.font_family);
}
