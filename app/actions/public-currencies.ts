'use server';

import { getPB, getAllRecords } from '@/lib/pocketbase';

export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  exchangeRate: number;
  isDefault: boolean;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
}

export async function getPublicCurrencies() {
  try {
    const pb = getPB();
    const currencies = await withTimeout(getAllRecords(pb, 'currencies', {
      filter: 'is_active = true',
      sort: '-is_default,code',
    }), 10000);
    if (currencies.length === 0) {
      return [{
        id: 'default-cup',
        code: 'CUP',
        name: 'Peso Cubano',
        symbol: '$',
        exchangeRate: 1,
        isDefault: true,
      }];
    }
    return currencies.map((c: any) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      symbol: c.symbol || '$',
      exchangeRate: Number(c.exchange_rate) || 1,
      isDefault: c.is_default || false,
    }));
  } catch (error) {
    console.error('Error fetching currencies:', error);
    return [{
      id: 'default-cup',
      code: 'CUP',
      name: 'Peso Cubano',
      symbol: '$',
      exchangeRate: 1,
      isDefault: true,
    }];
  }
}
