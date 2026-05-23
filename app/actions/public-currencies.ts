// app/actions/public-currencies.ts
'use server';

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  exchangeRate: number;
  isDefault: boolean;
}

export async function getPublicCurrencies(): Promise<Currency[]> {
  const currencies = await sql`
    SELECT 
      id, 
      code, 
      name, 
      symbol, 
      exchange_rate, 
      is_default 
    FROM currencies 
    WHERE is_active = true
    ORDER BY is_default DESC, code ASC
  `;

  // Mapear snake_case a camelCase y convertir tipos
  return currencies.map((c: any) => ({
    id: c.id,
    code: c.code,
    name: c.name,
    symbol: c.symbol,
    exchangeRate: Number(c.exchange_rate),
    isDefault: c.is_default === true,
  }));
}