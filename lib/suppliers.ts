export interface Supplier { id: string; name: string; phone: string }
export interface SupplierPage {
  items: Supplier[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}
export interface ProductOption { id: string; name: string; unit: string }
export interface PurchaseLineInput { product: string; quantity: number; unitPrice: number }
export interface PurchaseItem extends PurchaseLineInput { id: string; productName: string }
export interface Purchase {
  id: string; supplier: string; purchasedAt: string; notes: string
  stockAppliedAt: string | null; total: number; items: PurchaseItem[]
}
export interface SupplierPrice {
  product: string; productName: string; unit: string; unitPrice: number; purchasedAt: string
}
export interface PurchaseInput {
  supplier: string; purchasedAt: string; notes: string; items: PurchaseLineInput[]
}

const supplierMoneyFormatter = new Intl.NumberFormat("es-ES", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatSupplierMoney(value: number): string {
  return supplierMoneyFormatter.format(value);
}

function text(value: unknown): string {
  return value === undefined || value === null ? "" : String(value);
}

function numeric(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export function toSupplier(rec: Record<string, any>): Supplier {
  return { id: text(rec.id), name: text(rec.name), phone: text(rec.phone) };
}

export function paginateSuppliers(suppliers: Supplier[], page: number): SupplierPage {
  const pageSize = 10;
  const total = suppliers.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(Math.trunc(page) || 1, 1), totalPages);
  const start = (current - 1) * pageSize;
  return {
    items: suppliers.slice(start, start + pageSize),
    page: current,
    pageSize,
    total,
    totalPages,
    hasPrevious: current > 1,
    hasNext: current < totalPages,
  };
}

export function toProductOption(rec: Record<string, any>): ProductOption {
  return { id: text(rec.id), name: text(rec.name), unit: text(rec.unit) };
}

export function toPurchaseItem(rec: Record<string, any>): PurchaseItem {
  return {
    id: text(rec.id),
    product: text(rec.product ?? rec.productId),
    productName: text(rec.product_name ?? rec.productName),
    quantity: numeric(rec.quantity),
    unitPrice: numeric(rec.unit_price ?? rec.unitPrice),
  };
}

export function toPurchase(rec: Record<string, any>, items: PurchaseItem[]): Purchase {
  const rawStockAppliedAt = rec.stock_applied_at ?? rec.stockAppliedAt;
  return {
    id: text(rec.id),
    supplier: text(rec.supplier ?? rec.supplierId),
    purchasedAt: text(rec.purchased_at ?? rec.purchasedAt),
    notes: text(rec.notes),
    stockAppliedAt: rawStockAppliedAt ? String(rawStockAppliedAt) : null,
    total: purchaseTotal(items),
    items,
  };
}

export function validateSupplierInput(input: { name?: string; phone?: string }): { name: string; phone: string } {
  const name = text(input.name).trim();
  if (!name) throw new Error("El nombre del proveedor es requerido");
  const phone = text(input.phone).trim();
  if (!phone) throw new Error("El teléfono del proveedor es requerido");
  return { name, phone };
}

export function validatePurchaseInput(input: PurchaseInput): PurchaseInput {
  if (!input.items || input.items.length === 0) {
    throw new Error("La compra debe tener al menos un item");
  }
  for (const line of input.items) {
    if (!text(line.product).trim()) {
      throw new Error("El producto de la línea es requerido");
    }
    if (text(line.unitPrice).trim() === "") {
      throw new Error("El precio unitario es requerido");
    }
    if (!(numeric(line.quantity) > 0)) {
      throw new Error("La cantidad debe ser mayor a 0");
    }
    if (!(numeric(line.unitPrice) >= 0)) {
      throw new Error("El precio unitario no puede ser negativo");
    }
  }
  return input;
}

export function purchaseTotal(lines: PurchaseLineInput[]): number {
  return lines.reduce(
    (total, line) => total + numeric(line.quantity) * numeric(line.unitPrice),
    0
  );
}

export function latestPrices(purchases: Purchase[], products: ProductOption[]): SupplierPrice[] {
  const catalog = new Map(products.map((product) => [product.id, product]));
  const prices = new Map<string, SupplierPrice>();
  for (const purchase of purchases) {
    for (const item of purchase.items) {
      const current = prices.get(item.product);
      // Fecha PB "YYYY-MM-DD HH:mm:ss" compara como texto; empatado gana la línea posterior.
      if (current && current.purchasedAt > purchase.purchasedAt) continue;
      const product = catalog.get(item.product);
      prices.set(item.product, {
        product: item.product,
        productName: product?.name ?? item.productName,
        unit: product?.unit ?? "",
        unitPrice: item.unitPrice,
        purchasedAt: purchase.purchasedAt,
      });
    }
  }
  return Array.from(prices.values());
}

export function canApplyStock(purchase: Purchase): boolean {
  return !purchase.stockAppliedAt;
}

export function stockDeltas(
  purchase: Purchase,
  productIds: string[]
): { updates: Array<{ product: string; quantity: number }>; missing: string[] } {
  const existing = new Set(productIds);
  const updates: Array<{ product: string; quantity: number }> = [];
  const missing: string[] = [];
  for (const item of purchase.items) {
    if (!existing.has(item.product)) {
      if (!missing.includes(item.product)) missing.push(item.product);
      continue;
    }
    updates.push({ product: item.product, quantity: numeric(item.quantity) });
  }
  return { updates, missing };
}

export function canDeleteSupplier(purchases: Purchase[]): boolean {
  return purchases.length === 0;
}

export function canDeletePurchase(purchase: Purchase): boolean {
  return !purchase.stockAppliedAt;
}

export function isSuppliersSetupError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const status = (error as { status?: unknown }).status;
  if (status === 404) return true;
  const message = text((error as { message?: unknown }).message).toLowerCase();
  return message.includes("collection") || message.includes("not found");
}
