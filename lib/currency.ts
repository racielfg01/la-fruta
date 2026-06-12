import { getPublicCurrencies } from '@/app/actions/public-currencies';
import { useState, useEffect } from 'react';

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
  return (amount / from.exchangeRate) * to.exchangeRate;
}

export function formatPrice(amount: number, currency?: CurrencyInfo | null): string {
  if (!currency) return `$${amount.toFixed(2)}`;
  return `${currency.symbol}${amount.toFixed(2)} ${currency.code}`;
}

export function useCurrency() {
  const [currencies, setCurrencies] = useState<CurrencyInfo[]>([]);
  const [defaultCurrency, setDefaultCurrency] = useState<CurrencyInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurrencies().then((data) => {
      setCurrencies(data);
      setDefaultCurrency(data.find((c) => c.isDefault) || data[0] || null);
      setLoading(false);
    });
  }, []);

  return { currencies, defaultCurrency, loading, formatPrice, convertPrice };
}
