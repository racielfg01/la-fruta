export interface ProductLike {
  id?: string;
  name?: string;
  is_visible?: boolean;
  created_at?: string;
}

function createdMs(product: ProductLike): number {
  if (!product.created_at) return NaN;
  const ms = Date.parse(String(product.created_at).replace(" ", "T"));
  return Number.isFinite(ms) ? ms : NaN;
}

export function isNewVisibleProduct(product: ProductLike, sinceMs: number): boolean {
  if (product.is_visible !== true) return false;
  const ms = createdMs(product);
  return Number.isFinite(ms) && ms > sinceMs;
}

/**
 * Productos visibles creados después de la marca. Los productos anteriores al
 * campo created_at no tienen fecha y no cuentan como nuevos.
 */
export function selectNewProducts(
  products: ProductLike[],
  sinceMs: number,
  maxNames = 3
): { total: number; names: string[] } {
  const fresh = products
    .filter((product) => isNewVisibleProduct(product, sinceMs))
    .sort((a, b) => createdMs(b) - createdMs(a));

  return {
    total: fresh.length,
    names: fresh
      .slice(0, maxNames)
      .map((product) => String(product.name || "").trim())
      .filter(Boolean),
  };
}
