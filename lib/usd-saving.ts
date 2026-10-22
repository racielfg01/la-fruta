/**
 * Ahorro por pagar en una moneda distinta de CUP.
 *
 * El margen de ganancia solo se aplica a las órdenes en CUP (ver
 * `orderItemPrice` en `lib/price-margin.ts`). Por eso el mismo carrito
 * cuesta menos en USD: la diferencia es exactamente el margen aplicado al
 * subtotal de los productos. Envío y costo operativo no llevan margen, así
 * que no forman parte del ahorro.
 *
 * Todos los importes de esta función están en CUP base.
 */

export interface SavingInput {
  /** Suma de los precios base de los productos (sin margen), en CUP. */
  itemsSubtotalCup: number;
  /** Margen efectivo en % (global o el del producto). */
  marginPct: number;
  /** Cuota de envío de la zona, en CUP. */
  deliveryFeeCup?: number;
  /** Costo operativo de la tienda, en CUP. */
  operationalCostCup?: number;
}

/** Un producto del carrito con su margen ya resuelto. */
export interface SavingItem {
  /** Precio base del producto, en CUP. */
  basePriceCup: number;
  /** Unidades en el carrito. */
  quantity: number;
  /** Margen efectivo de este producto, en %. */
  marginPct: number;
}

export interface SavingBreakdown {
  /** Total que se cobra pagando en CUP (con margen), en CUP. */
  totalWithMarginCup: number;
  /** Total que se cobra pagando en USD (sin margen), en CUP. */
  totalWithoutMarginCup: number;
  /** Cuánto se ahorra al pagar en USD, en CUP. */
  savingCup: number;
  /** El ahorro como % del total con margen (0 si no hay nada que ahorrar). */
  savingPct: number;
}

function nonNegative(value: number | undefined | null): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function cupSaving(input: SavingInput): SavingBreakdown {
  const items = nonNegative(input.itemsSubtotalCup);
  const margin = Math.max(0, Number(input.marginPct) || 0);
  return breakdown(
    [{ basePriceCup: items, quantity: 1, marginPct: margin }],
    input.deliveryFeeCup,
    input.operationalCostCup,
  );
}

/**
 * Ahorro de un carrito con sueltas: cada producto puede tener su propio
 * margen (el del producto manda sobre el global), así que el ahorro se
 * calcula producto a producto.
 */
export function cupSavingForItems(
  items: SavingItem[],
  extra?: { deliveryFeeCup?: number; operationalCostCup?: number },
): SavingBreakdown {
  return breakdown(items, extra?.deliveryFeeCup, extra?.operationalCostCup);
}

function breakdown(
  items: SavingItem[],
  deliveryFeeCup?: number,
  operationalCostCup?: number,
): SavingBreakdown {
  const delivery = nonNegative(deliveryFeeCup);
  const operational = nonNegative(operationalCostCup);

  let itemsTotal = 0;
  let itemsWithMargin = 0;
  for (const item of items) {
    const base = nonNegative(item.basePriceCup) * Math.max(0, Number(item.quantity) || 0);
    const margin = Math.max(0, Number(item.marginPct) || 0);
    itemsTotal += base;
    itemsWithMargin += base * (1 + margin / 100);
  }

  const totalWithMarginCup = Math.round((itemsWithMargin + delivery + operational) * 100) / 100;
  const totalWithoutMarginCup = Math.round((itemsTotal + delivery + operational) * 100) / 100;
  const savingCup = Math.round((totalWithMarginCup - totalWithoutMarginCup) * 100) / 100;

  return {
    totalWithMarginCup,
    totalWithoutMarginCup,
    savingCup,
    savingPct:
      totalWithMarginCup > 0
        ? Math.round((savingCup / totalWithMarginCup) * 100)
        : 0,
  };
}

/**
 * Ahorro de un solo producto (para la página de detalle): el precio con
 * margen frente al precio base.
 */
export function productSavingCup(basePriceCup: number, marginPct: number): number {
  const base = nonNegative(basePriceCup);
  const margin = Math.max(0, Number(marginPct) || 0);
  return Math.round((base * margin) / 100 * 100) / 100;
}

/** Importe en CUP con separador de miles y sin decimales: "1 250 CUP". */
export function formatCupAmount(amount: number): string {
  const n = Math.round(Number(amount) || 0);
  const sign = n < 0 ? "-" : "";
  const digits = String(Math.abs(n));
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${sign}${grouped} CUP`;
}
