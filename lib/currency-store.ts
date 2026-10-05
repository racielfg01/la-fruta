import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { fetchCurrencies, CurrencyInfo, convertPrice } from './currency';

interface CurrencyState {
  currencies: CurrencyInfo[];
  currencyId: string | null;
  loading: boolean;
  initialized: boolean;
  init: () => Promise<void>;
  setCurrency: (id: string) => void;
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set, get) => ({
      currencies: [],
      currencyId: null,
      loading: true,
      initialized: false,

      init: async () => {
        if (get().initialized) return;
        const data = await fetchCurrencies();
        set((state) => {
          const current = state.currencies;
          const id =
            state.currencyId ||
            (current.length ? state.currencyId : (data.find((c) => c.isDefault) || data[0])?.id) ||
            null;
          return {
            currencies: data,
            currencyId: id || null,
            loading: false,
            initialized: true,
          };
        });
      },

      setCurrency: (id) => set({ currencyId: id }),
    }),
    {
      name: 'currency-storage',
      partialize: (state) => ({ currencyId: state.currencyId }),
    }
  )
);

export function useSelectedCurrency() {
  const { currencies, currencyId } = useCurrencyStore();
  return currencies.find((c) => c.id === currencyId) || currencies.find((c) => c.isDefault) || currencies[0] || null;
}

export { convertPrice };