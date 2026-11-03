import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { fetchCurrencies, CurrencyInfo, convertPrice } from './currency';
import { chooseCurrency } from './currency-selection';

interface CurrencyState {
  currencies: CurrencyInfo[];
  currencyId: string | null;
  /** true solo si la persona eligió una moneda; el default no cuenta. */
  userSelected: boolean;
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
      userSelected: false,
      loading: true,
      initialized: false,

      init: async () => {
        if (get().initialized) return;
        const data = await fetchCurrencies();
        set((state) => ({
          currencies: data,
          // Sin elección explícita se usa CUP, no la moneda marcada en la base.
          currencyId: chooseCurrency(data, state.userSelected ? state.currencyId : null)?.id ?? null,
          loading: false,
          initialized: true,
        }));
      },

      setCurrency: (id) => set({ currencyId: id, userSelected: true }),
    }),
    {
      name: 'currency-storage',
      partialize: (state) => ({
        currencyId: state.currencyId,
        userSelected: state.userSelected,
      }),
    }
  )
);

export function useSelectedCurrency() {
  const { currencies, currencyId } = useCurrencyStore();
  return chooseCurrency(currencies, currencyId);
}

export { convertPrice };