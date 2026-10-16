import type PocketBase from 'pocketbase';
import { getAllRecords, sanitize } from '@/lib/pocketbase';

export interface StoredLocation {
  municipality?: string;
  province?: string;
  stock?: number;
}

export function parseLocations(raw: unknown): StoredLocation[] {
  if (Array.isArray(raw)) return raw as StoredLocation[];
  if (typeof raw === 'string' && raw) {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as StoredLocation[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

// Índice de la ubicación que aplica: municipio exacto primero, si no la
// entrada a nivel provincia. -1 si no hay coincidencia.
export function matchLocationIndex(
  locs: StoredLocation[],
  municipalityId?: string,
  provinceId?: string
): number {
  if (!municipalityId && !provinceId) return -1;
  const mun = locs.findIndex((l) => l.municipality && l.municipality === municipalityId);
  if (mun >= 0) return mun;
  return locs.findIndex((l) => !l.municipality && l.province === provinceId);
}

// Repone el stock (global + ubicación de entrega de la orden) de todos los
// ítems. Debe correr bajo el mismo lock que la creación para no competir.
export async function restoreOrderStock(pb: PocketBase, order: any): Promise<void> {
  const items = await getAllRecords(pb, 'order_items', {
    filter: `order_id = "${sanitize(order.id)}"`,
  });
  for (const item of items) {
    try {
      const product = await pb.collection('products').getOne(item.product_id);
      const newStock = (Number(product.stock) || 0) + item.quantity;
      const update: any = { stock: newStock, in_stock: true };

      const locs = parseLocations(product.product_locations);
      const idx = matchLocationIndex(locs, order.delivery_municipality, order.delivery_province);
      if (idx >= 0) {
        locs[idx] = {
          ...locs[idx],
          stock: (Number(locs[idx].stock) || 0) + item.quantity,
        };
        update.product_locations = JSON.stringify(locs);
      }
      await pb.collection('products').update(item.product_id, update);
    } catch {
      // producto eliminado, ignorar
    }
  }
}
