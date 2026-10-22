/**
 * Total de una orden en CUP base: subtotal (con margen si la orden es en CUP)
 * + cuota de envío (de la zona) + costo operativo de la tienda.
 *
 * El costo operativo se suma a TODAS las órdenes; en USD y demás monedas se
 * muestra convertido con la tasa de cambio normal (la conversión es visual y
 * vive en el cliente).
 */

function nonNegativeNumber(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

export function orderTotalCup(
  subtotalCup: number,
  deliveryFeeCup: number,
  operationalCostCup: number | null | undefined
): number {
  const subtotal = Number(subtotalCup) || 0;
  const delivery = nonNegativeNumber(deliveryFeeCup);
  const operational = nonNegativeNumber(operationalCostCup);
  return Math.round((subtotal + delivery + operational) * 100) / 100;
}
