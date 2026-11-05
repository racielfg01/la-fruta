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

/** Monedas cuyo efectivo se puede pagar con billetes exactos (ver cash-rounding). */
const CASH_CURRENCIES = new Set(["CUP", "USD"]);

export function isCashSupported(currencyCode: string | undefined): boolean {
  return !!currencyCode && CASH_CURRENCIES.has(currencyCode);
}

export interface TransferAccountLike {
  currency: string;
  transferLimit: number;
  transferCount: number;
}

/**
 * Cuentas utilizables para una moneda: del mismo tipo y sin límite alcanzado.
 * Evita ofrecer una cuenta CUP cuando el pedido se paga en USD.
 */
export function usableAccountsForCurrency<T extends TransferAccountLike>(
  accounts: T[],
  currencyCode: string | undefined
): T[] {
  if (!currencyCode) return [];
  return accounts.filter(
    (a) =>
      a.currency === currencyCode &&
      !(a.transferLimit > 0 && a.transferCount >= a.transferLimit)
  );
}
