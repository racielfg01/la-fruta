/**
 * Margen de ganancia sobre precios en CUP.
 *
 * El margen se define en porcentaje (20 = +20%) y se aplica SOLO cuando el
 * cliente ve (o paga) en CUP. USD y las demás monedas muestran el precio base
 * convertido con la tasa de cambio normal, sin margen.
 */

export interface MarginConfig {
  /** Margen global definido en la configuración de la tienda (%). */
  globalMargin?: number | null;
  /** Margen opcional del producto; si existe, sobrescribe el global. */
  productMargin?: number | null;
}

function finiteOr(value: number | null | undefined): number | null {
  return Number.isFinite(value as number) ? Number(value) : null;
}

/** Margen efectivo en %: el del producto manda, si no, el global; nunca negativo. */
export function effectiveMargin(cfg: MarginConfig = {}): number {
  const product = finiteOr(cfg.productMargin);
  if (product !== null) return Math.max(0, product);
  const global = finiteOr(cfg.globalMargin);
  return global !== null ? Math.max(0, global) : 0;
}

/**
 * Precio CUP con margen aplicado y redondeo a 2 decimales.
 */
export function effectiveCupPrice(cupBase: number, cfg: MarginConfig = {}): number {
  const base = Number(cupBase) || 0;
  const margin = effectiveMargin(cfg);
  const adjusted = margin === 0 ? base : base * (1 + margin / 100);
  return Math.round(adjusted * 100) / 100;
}

/**
 * Precio que se MUESTRA del producto en CUP base: con margen si la moneda
 * de visualización es CUP, precio base para el resto de las monedas.
 */
export function displayProductCupPrice(
  cupBase: number,
  cfg: MarginConfig,
  displayCurrencyCode: string | undefined
): number {
  if (displayCurrencyCode === "CUP") return effectiveCupPrice(cupBase, cfg);
  return Number(cupBase) || 0;
}

/**
 * Precio con el que se cobra un ítem de orden: CUP lleva margen,
 * el resto de las monedas queda al precio base.
 */
export function orderItemPrice(
  cupBase: number,
  cfg: MarginConfig,
  orderCurrencyCode: string
): number {
  if (orderCurrencyCode === "CUP") return effectiveCupPrice(cupBase, cfg);
  return Number(cupBase) || 0;
}
