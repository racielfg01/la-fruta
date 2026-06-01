'use server';

import { getPB, getAllRecords } from '@/lib/pocketbase';

function mapProduct(p: any) {
  return {
    id: p.id,
    name: p.name,
    description: p.description || '',
    price: Number(p.price),
    unit: p.unit || '',
    image: p.image || '',
    category: p.expand?.category?.name || p.category || '',
    origin: p.origin || '',
    inStock: p.in_stock ?? true,
    visible: p.is_visible ?? true,
  };
}

async function loadWithRetry(fn: () => Promise<any>, retries = 4, delayMs = 3000): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      const isConnectionError =
        error?.message?.includes?.('fetch failed') ||
        error?.message?.includes?.('ETIMEDOUT') ||
        error?.message?.includes?.('EAI_AGAIN') ||
        error?.message?.includes?.('failed to fetch') ||
        error?.code === 'ETIMEDOUT' ||
        error?.code === 'UND_ERR_CONNECT_TIMEOUT';
      if (isConnectionError && i < retries - 1) {
        console.log(`PB connection attempt ${i + 1} failed, retrying in ${delayMs}ms...`);
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
    const pb = getPB();
    let products: any[];
    try {
      products = await loadWithRetry(() =>
        getAllRecords(pb, 'products', {
          filter: 'is_visible = true',
          sort: 'name',
          expand: 'category',
        })
      );
    } catch {
      products = await loadWithRetry(() =>
        getAllRecords(pb, 'products', {
          sort: 'name',
          expand: 'category',
        })
      );
    }
    const categories = await loadWithRetry(() =>
      getAllRecords(pb, 'categories', { sort: 'name' })
    );
    return {
      products: products.map(mapProduct),
      categories: categories.map((c: any) => c.name),
    };
  } catch (error) {
    console.error('Error fetching public products:', error);
    return { products: [], categories: [] };
  }
}
