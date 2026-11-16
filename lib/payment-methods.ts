/**
 * Reglas de los métodos de pago configurables.
 *
 * Un método de pago es la única entidad: nombre, tipo (efectivo o
 * transferencia), moneda y —si es transferencia— los datos de la cuenta van
 * dentro del propio método. El admin los crea, edita y activa desde
 * /admin/configuracion?tab=metodos.
 *
 * Sin React ni PocketBase para poder probarlo con vitest.
 */

/** Monedas cuyo efectivo se puede pagar con billetes exactos (ver cash-rounding). */
const CASH_CURRENCIES = new Set(["CUP", "USD"]);

export function isCashSupported(currencyCode: string | undefined): boolean {
  return !!currencyCode && CASH_CURRENCIES.has(currencyCode);
}

export type PaymentType = "cash" | "transfer";

export const METHOD_UNAVAILABLE =
  "El método de pago ya no está disponible. Elige otro.";

const RECEIPT_REQUIRED = "Adjunta el comprobante de la transferencia.";

export interface PaymentMethodRecord {
  active?: boolean;
  type?: string;
  currency?: string;
  requires_receipt?: boolean;
  transfer_limit?: number;
  transfer_count?: number;
}

export function methodHasCapacity(method: {
  transferLimit: number;
  transferCount: number;
}): boolean {
  return !(
    method.transferLimit > 0 && method.transferCount >= method.transferLimit
  );
}

/**
 * Valida el método de pago en el servidor antes de crear el pedido.
 *
 * El cliente ya filtra, pero entre la carga del checkout y el envío el admin
 * pudo desactivar el método, cambiarle la moneda o agotarle el cupo. El tipo
 * del pedido se deriva del registro, nunca de lo que afirme el cliente.
 */
export function validatePaymentMethod(input: {
  method: PaymentMethodRecord | null;
  currencyCode: string;
  /** Tipo que el cliente cree estar usando; debe coincidir con el registro. */
  expectedType?: PaymentType;
}): string | null {
  const { method, currencyCode, expectedType } = input;
  if (!method || method.active === false) return METHOD_UNAVAILABLE;

  const type: PaymentType = method.type === "transfer" ? "transfer" : "cash";

  if (expectedType && type !== expectedType) return METHOD_UNAVAILABLE;
  if ((method.currency || "USD") !== currencyCode) return METHOD_UNAVAILABLE;
  if (type === "cash" && !isCashSupported(currencyCode)) {
    return METHOD_UNAVAILABLE;
  }
  if (type === "transfer") {
    const limit = Number(method.transfer_limit) || 0;
    const count = Number(method.transfer_count) || 0;
    if (limit > 0 && count >= limit) return METHOD_UNAVAILABLE;
  }
  return null;
}

/**
 * Un método de transferencia puede exigir comprobante y el cliente no haberlo
 * subido. La comprobación vive aquí para que el servidor no confíe en el
 * cliente y el checkout muestre el mismo mensaje.
 */
export function requiresReceiptError(input: {
  method: PaymentMethodRecord | null;
  receiptUrl: string | undefined;
}): string | null {
  const { method, receiptUrl } = input;
  if (!method || method.type !== "transfer") return null;
  if (method.requires_receipt === true && !receiptUrl) return RECEIPT_REQUIRED;
  return null;
}
