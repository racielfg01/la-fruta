'use server';

import { requirePermission } from '@/lib/admin-auth';
import {
  buildOrFilter,
  getAllRecords,
  getAdminPB,
  getTokenPB,
  sanitize,
} from '@/lib/pocketbase';
import { toPocketBaseDate } from '@/lib/push/settings';
import {
  canApplyStock,
  canDeletePurchase,
  canDeleteSupplier,
  isSuppliersSetupError,
  latestPrices,
  stockDeltas,
  toProductOption,
  toPurchase,
  toPurchaseItem,
  toSupplier,
  validatePurchaseInput,
  validateSupplierInput,
  type ProductOption,
  type Purchase,
  type PurchaseInput,
  type PurchaseItem,
  type Supplier,
  type SupplierPrice,
} from '@/lib/suppliers';
import type PocketBase from 'pocketbase';

export interface SuppliersOverview {
  setupNeeded: boolean;
  suppliers: Supplier[];
  products: ProductOption[];
}

export interface SupplierDetail {
  prices: SupplierPrice[];
  purchases: Purchase[];
}

export interface ApplyStockResult {
  applied: number;
  missing: string[];
}

async function getDataPB(token: string): Promise<PocketBase> {
  try {
    return await getAdminPB();
  } catch {
    return getTokenPB(token);
  }
}

type PurchaseItemRow = Record<string, unknown>;

async function getPurchaseItems(
  pb: PocketBase,
  purchaseIds: string[]
): Promise<PurchaseItemRow[]> {
  const filter = buildOrFilter('purchase', purchaseIds);
  if (!filter) return [];
  return getAllRecords(pb, 'purchase_items', { filter });
}

export async function getSuppliersOverviewAction(
  token: string
): Promise<SuppliersOverview> {
  await requirePermission(token, 'products');
  const pb = await getDataPB(token);
  try {
    const suppliers = await getAllRecords(pb, 'suppliers', { sort: 'name' });
    const products = await getAllRecords(pb, 'products', { sort: 'name' });
    return {
      setupNeeded: false,
      suppliers: suppliers.map(toSupplier),
      products: products.map(toProductOption),
    };
  } catch (error) {
    if (isSuppliersSetupError(error)) {
      return { setupNeeded: true, suppliers: [], products: [] };
    }
    throw error;
  }
}

export async function getSupplierDetailAction(
  token: string,
  supplierId: string
): Promise<SupplierDetail> {
  await requirePermission(token, 'products');
  const pb = await getDataPB(token);
  const rows = await getAllRecords(pb, 'purchases', {
    filter: `supplier = "${sanitize(supplierId)}"`,
    sort: '-purchased_at,-created',
  });
  const itemRows = await getPurchaseItems(pb, rows.map((row) => String(row.id)));
  const itemsByPurchase = new Map<string, PurchaseItem[]>();
  for (const row of itemRows) {
    const purchase = String(row.purchase ?? '');
    const items = itemsByPurchase.get(purchase) ?? [];
    items.push(toPurchaseItem(row));
    itemsByPurchase.set(purchase, items);
  }
  const purchases: Purchase[] = rows.map((row) =>
    toPurchase(row, itemsByPurchase.get(String(row.id)) ?? [])
  );
  const products: ProductOption[] = (
    await getAllRecords(pb, 'products')
  ).map(toProductOption);
  return { prices: latestPrices(purchases, products), purchases };
}

export async function createSupplierAction(
  token: string,
  input: { name: string; phone: string }
): Promise<Supplier> {
  await requirePermission(token, 'products');
  const data = validateSupplierInput(input);
  const pb = await getDataPB(token);
  const rec = await pb.collection('suppliers').create(data);
  return toSupplier(rec);
}

export async function updateSupplierAction(
  token: string,
  id: string,
  input: { name: string; phone: string }
): Promise<void> {
  await requirePermission(token, 'products');
  const data = validateSupplierInput(input);
  const pb = await getDataPB(token);
  await pb.collection('suppliers').update(id, data);
}

export async function deleteSupplierAction(
  token: string,
  id: string
): Promise<void> {
  await requirePermission(token, 'products');
  const pb = await getDataPB(token);
  const purchases = await getAllRecords<Purchase>(pb, 'purchases', {
    filter: `supplier = "${sanitize(id)}"`,
  });
  if (!canDeleteSupplier(purchases)) {
    throw new Error('No se puede borrar un proveedor con compras');
  }
  await pb.collection('suppliers').delete(id);
}

export async function createPurchaseAction(
  token: string,
  input: PurchaseInput
): Promise<{ id: string }> {
  const auth = await requirePermission(token, 'products');
  for (const line of input.items ?? []) {
    if (!Number.isFinite(Number(line.quantity))) {
      throw new Error('La cantidad debe ser un número');
    }
    if (!Number.isFinite(Number(line.unitPrice))) {
      throw new Error('El precio unitario debe ser un número');
    }
  }
  validatePurchaseInput(input);
  const pb = await getDataPB(token);
  const products = await getAllRecords(pb, 'products');
  const catalog = new Map(products.map((product) => [String(product.id), product]));
  for (const line of input.items) {
    if (!catalog.has(line.product)) throw new Error('Producto no encontrado');
  }
  const purchasedAt = toPocketBaseDate(input.purchasedAt);
  if (!purchasedAt) throw new Error('La fecha de la compra es requerida');

  const purchase = await pb.collection('purchases').create({
    supplier: input.supplier,
    purchased_at: purchasedAt,
    notes: input.notes || '',
    created_by: auth.userId,
  });
  try {
    const batch = pb.createBatch();
    for (const line of input.items) {
      batch.collection('purchase_items').create({
        purchase: purchase.id,
        product: line.product,
        product_name: String(catalog.get(line.product)?.name ?? ''),
        quantity: Number(line.quantity),
        unit_price: Number(line.unitPrice),
      });
    }
    await batch.send();
  } catch (error) {
    await pb.collection('purchases').delete(purchase.id).catch(() => {});
    throw error;
  }
  return { id: purchase.id };
}

export async function deletePurchaseAction(
  token: string,
  id: string
): Promise<void> {
  await requirePermission(token, 'products');
  const pb = await getDataPB(token);
  const rec = await pb.collection('purchases').getOne(id);
  const itemRows = await getPurchaseItems(pb, [id]);
  const purchase = toPurchase(rec, itemRows.map(toPurchaseItem));
  if (!canDeletePurchase(purchase)) {
    throw new Error('No se puede borrar una compra con stock aplicado');
  }
  const batch = pb.createBatch();
  for (const row of itemRows) {
    batch.collection('purchase_items').delete(String(row.id));
  }
  batch.collection('purchases').delete(id);
  await batch.send();
}

export async function applyPurchaseStockAction(
  token: string,
  purchaseId: string
): Promise<ApplyStockResult> {
  await requirePermission(token, 'products');
  const pb = await getDataPB(token);
  const rec = await pb.collection('purchases').getOne(purchaseId);
  const itemRows = await getPurchaseItems(pb, [purchaseId]);
  const purchase = toPurchase(rec, itemRows.map(toPurchaseItem));
  if (!canApplyStock(purchase)) {
    throw new Error('El stock de esta compra ya fue aplicado');
  }

  const products = await getAllRecords(pb, 'products');
  const catalog = new Map(products.map((product) => [String(product.id), product]));
  const { updates: deltas, missing } = stockDeltas(
    purchase,
    products.map((product) => String(product.id))
  );
  // Dos líneas del mismo producto deben acumularse: un update por producto.
  const totals = new Map<string, number>();
  for (const delta of deltas) {
    totals.set(delta.product, (totals.get(delta.product) ?? 0) + delta.quantity);
  }
  const updates = Array.from(totals, ([product, quantity]) => ({ product, quantity }));

  const batch = pb.createBatch();
  for (const update of updates) {
    const product = catalog.get(update.product);
    batch.collection('products').update(update.product, {
      stock: (Number(product?.stock) || 0) + update.quantity,
      in_stock: true,
    });
  }
  batch.collection('purchases').update(purchaseId, {
    stock_applied_at: toPocketBaseDate(new Date()),
  });
  await batch.send();

  return { applied: updates.length, missing };
}
