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

export async function getPublicCurrencies() {
  try {
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
    
    // Mapear y convertir exchange_rate a número
    return currencies.map((c: any) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      symbol: c.symbol,
      exchangeRate: parseFloat(c.exchange_rate), // ← conversión clave
      isDefault: c.is_default,
    }));
  } catch (error) {
    console.error('Error fetching currencies:', error);
    // Moneda por defecto con número
    return [{
      id: 'default-cup',
      code: 'CUP',
      name: 'Peso Cubano',
      symbol: '$',
      exchangeRate: 1, // número
      isDefault: true,
    }];
  }
}