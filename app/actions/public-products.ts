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
export async function getPublicProducts() {
  try {
    const products = await sql`
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
    `;
    // console.log("Productos obtenidos:", products); // ← log
    const categories = await sql`SELECT name FROM categories ORDER BY name ASC`;
    // console.log("Categorías obtenidas:", categories); // ← log
    return { 
      products: products.map(p => ({ ...p, price: Number(p.price) })), // convertir precio a número
      categories: categories.map(c => c.name) 
    };
  } catch (error) {
    console.error('Error fetching public products:', error);
    return { products: [], categories: [] };
  }
}