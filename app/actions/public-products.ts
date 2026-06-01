// app/actions/public-products.ts
'use server';

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

// export async function getPublicProducts() {
//   try {
//     const products = await sql`
//       SELECT 
//         id, 
//         name, 
//         description, 
//         price, 
//         unit, 
//         image, 
//         category, 
//         origin, 
//         in_stock as "inStock"
//       FROM products
//       ORDER BY name ASC
//     `;
//     const categories = await sql`
//       SELECT name, id FROM categories ORDER BY name ASC
//     `;
//     return { products, categories: categories.map(c => c.name) };
//   } catch (error) {
//     console.error('Error fetching public products:', error);
//     return { products: [], categories: [] };
//   }
// }

// app/actions/public-products.ts
async function queryWithRetry(sqlQuery: () => Promise<any>, retries = 3, delayMs = 2000): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      return await sqlQuery();
    } catch (error: any) {
      const isConnectionError =
        error?.message?.includes?.('fetch failed') ||
        error?.message?.includes?.('ETIMEDOUT') ||
        error?.message?.includes?.('EAI_AGAIN') ||
        error?.code === 'ETIMEDOUT' ||
        error?.code === 'UND_ERR_CONNECT_TIMEOUT' ||
        error?.sourceError?.code === 'ETIMEDOUT';
      if (isConnectionError && i < retries - 1) {
        console.log(`DB connection attempt ${i + 1} failed, retrying in ${delayMs}ms...`);
        await new Promise(r => setTimeout(r, delayMs));
        delayMs *= 2;
        continue;
      }
      throw error;
    }
  }
}

export async function getPublicProducts() {
  try {
    let products;
    try {
      products = await queryWithRetry(() => sql`
        SELECT 
          id, 
          name, 
          description, 
          price, 
          unit, 
          image, 
          category, 
          origin, 
          in_stock as "inStock"
        FROM products
        WHERE is_visible = true
        ORDER BY name ASC
      `);
    } catch {
      // Si la columna is_visible no existe (DB sin migrar), obtener sin filtro
      products = await queryWithRetry(() => sql`
        SELECT 
          id, 
          name, 
          description, 
          price, 
          unit, 
          image, 
          category, 
          origin, 
          in_stock as "inStock"
        FROM products
        ORDER BY name ASC
      `);
    }
    const categories = await queryWithRetry(() => sql`SELECT name FROM categories ORDER BY name ASC`);
    return { 
      products: products.map(p => ({ ...p, price: Number(p.price) })),
      categories: categories.map(c => c.name) 
    };
  } catch (error) {
    console.error('Error fetching public products:', error);
    return { products: [], categories: [] };
  }
}