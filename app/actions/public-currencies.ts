// app/actions/public-currencies.ts
'use server';

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function getPublicCurrencies() {
  try {
    const currencies = await sql`
      SELECT id, code, name, symbol, exchange_rate as "exchangeRate", is_default as "isDefault"
      FROM currencies
      WHERE is_active = true
      ORDER BY is_default DESC, code ASC
    `;
    // Convertir exchange_rate a número
    return currencies.map(c => ({
      ...c,
      exchangeRate: Number(c.exchangeRate),
    }));
  } catch (error) {
    console.error('Error fetching currencies:', error);
    return [];
  }
}