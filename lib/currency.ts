import { getPublicCurrencies } from '@/app/actions/public-currencies';
import { useEffect } from 'react';
import { useCurrencyStore, useSelectedCurrency } from './currency-store';

export interface CurrencyInfo {
  id: string;
  code: string;
  name: string;
  symbol: string;
  exchangeRate: number;
  isDefault: boolean;
}

let cached: CurrencyInfo[] | null = null;
let fetchPromise: Promise<CurrencyInfo[]> | null = null;

export async function fetchCurrencies(): Promise<CurrencyInfo[]> {
  if (cached) return cached;
  if (!fetchPromise) {
    fetchPromise = getPublicCurrencies().then((data) => {
      cached = data;
      return data;
    });
  }
  return fetchPromise;
}

export function convertPrice(amount: number, from: CurrencyInfo, to: CurrencyInfo): number {
  return Math.round((amount / from.exchangeRate) * to.exchangeRate * 100) / 100;
}

export function formatPrice(amount: number, currency?: CurrencyInfo | null): string {
  if (!currency) return `$${amount.toFixed(2)}`;
  return `${currency.symbol}${amount.toFixed(2)} ${currency.code}`;
}

export function useCurrency() {
  const { currencies, loading, init } = useCurrencyStore();
  const defaultCurrency = useSelectedCurrency();

  useEffect(() => {
    init();
  }, [init]);

  return { currencies, defaultCurrency, loading, formatPrice, convertPrice };
}
