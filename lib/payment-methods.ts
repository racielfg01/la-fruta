/**
 * Métodos de pago configurables: el admin decide cuáles se muestran en el
 * /checkout. Regla de seguridad: si el admin oculta TODOS, el checkout
 * muestra los dos (nunca se queda sin método de pago).
 */

export type PaymentMethodId = "cash" | "transfer";

export function resolveVisiblePaymentMethodIds(opts: {
  showCash: boolean;
  showTransfer: boolean;
}): string[] {
  const ids: string[] = [];
  if (opts.showCash) ids.push("cash");
  if (opts.showTransfer) ids.push("transfer");
  return ids.length > 0 ? ids : ["cash", "transfer"];
}

/** Si el método seleccionado dejó de estar visible, pasa al primero visible. */
export function clampSelectedPaymentMethod(selected: string, visible: string[]): string {
  return visible.includes(selected) ? selected : visible[0];
}
