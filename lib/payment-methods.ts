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

export const TRANSFER_ACCOUNT_UNAVAILABLE =
  "La cuenta de pago ya no está disponible. Intenta con otra.";

interface TransferAccountRecord {
  active?: boolean;
  currency?: string;
  transfer_limit?: number;
  transfer_count?: number;
}

/**
 * Valida la cuenta de transferencia en el servidor antes de crear el pedido.
 * El cliente ya la filtra, pero entre la carga y el envío puede desactivarse,
 * cambiar de moneda o alcanzar su límite.
 */
export function validateTransferAccount(input: {
  account: TransferAccountRecord | null;
  bank: { active?: boolean } | null;
  currencyCode: string;
}): string | null {
  const { account, bank, currencyCode } = input;
  if (!account || account.active === false) return TRANSFER_ACCOUNT_UNAVAILABLE;
  if (!bank || bank.active === false) return TRANSFER_ACCOUNT_UNAVAILABLE;
  if ((account.currency || "CUP") !== currencyCode) {
    return TRANSFER_ACCOUNT_UNAVAILABLE;
  }
  const limit = Number(account.transfer_limit) || 0;
  const count = Number(account.transfer_count) || 0;
  if (limit > 0 && count >= limit) return TRANSFER_ACCOUNT_UNAVAILABLE;
  return null;
}

/**
 * Los métodos de pago se pueden auditar para generar avisos.
 *
 * La lógica:
 * - Si la transferencia está activada y no hay ninguna cuenta utilizable,
 *   el cliente no podrá pagar por transferencia.
 * - Si hay cuentas configuradas pero la transferencia está apagada,
 *   están ocultas para el cliente.
 * - Si el efectivo está activado y no hay CUP ni USD activadas,
 *   el checkout no mostrará efectivo.
 *
 * @param input
 * @returns warning codes that the UI maps to human-readable messages.
 */
export type PaymentMethodWarningCode =
  | "transfer_without_accounts"
  | "accounts_hidden"
  | "cash_without_currency";

export interface PaymentMethodAudit {
  cashEnabled: boolean;
  transferEnabled: boolean;
  usableAccounts: number;
  configuredAccounts: number;
  cashCurrencyAvailable: boolean;
}

/**
 * Genera los códigos de advertencia que el admin debe mostrar.
 * Se basa en los datos reales de la configuración.
 *
 * @param audit
 * @returns array de códigos de advertencia (vacío si todo está bien).
 */
export function paymentMethodWarnings(audit: PaymentMethodAudit): PaymentMethodWarningCode[] {
  const warnings: PaymentMethodWarningCode[] = [];

  // Transferencia activa pero sin cuentas utilizables
  if (audit.transferEnabled && audit.usableAccounts === 0) {
    warnings.push("transfer_without_accounts");
  }

  // Hay cuentas configuradas pero la transferencia está oculta (no se usa)
  if (!audit.transferEnabled && audit.configuredAccounts > 0) {
    warnings.push("accounts_hidden");
  }

  // Efectivo activado pero no hay CUP ni USD
  if (audit.cashEnabled && !audit.cashCurrencyAvailable) {
    warnings.push("cash_without_currency");
  }

  return warnings;
}

/** Texto humano legible para cada código de advertencia. */
export function paymentMethodWarningText(code: PaymentMethodWarningCode): string {
  switch (code) {
    case "transfer_without_accounts":
      return "La transferencia está activa pero no hay ninguna cuenta utilizable: el cliente no podrá pagar por ese método.";
    case "accounts_hidden":
      return "Hay cuentas configuradas, pero la transferencia está oculta: el cliente no las verá.";
    case "cash_without_currency":
      return "El efectivo está activado, pero no hay monedas CUP ni USD activas: el checkout no mostrará efectivo.";
    default:
      return "";
  }
}