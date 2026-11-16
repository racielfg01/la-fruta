import { describe, it, expect } from "vitest";
import {
  isCashSupported,
  methodHasCapacity,
  requiresReceiptError,
  validatePaymentMethod,
  METHOD_UNAVAILABLE,
  type PaymentMethodRecord,
} from "./payment-methods";

const method = (over: Partial<PaymentMethodRecord> = {}): PaymentMethodRecord => ({
  active: true,
  type: "transfer",
  currency: "USD",
  requires_receipt: true,
  transfer_limit: 0,
  transfer_count: 0,
  ...over,
});

describe("isCashSupported", () => {
  it("solo CUP y USD se pueden pagar en efectivo", () => {
    expect(isCashSupported("CUP")).toBe(true);
    expect(isCashSupported("USD")).toBe(true);
    expect(isCashSupported("EUR")).toBe(false);
    expect(isCashSupported(undefined)).toBe(false);
  });
});

describe("methodHasCapacity", () => {
  it("límite 0 significa sin límite", () => {
    expect(methodHasCapacity({ transferLimit: 0, transferCount: 99 })).toBe(true);
  });

  it("sin cupo cuando el contador alcanza el límite", () => {
    expect(methodHasCapacity({ transferLimit: 5, transferCount: 5 })).toBe(false);
    expect(methodHasCapacity({ transferLimit: 5, transferCount: 4 })).toBe(true);
  });
});

describe("validatePaymentMethod", () => {
  it("acepta una transferencia activa con la moneda correcta", () => {
    expect(
      validatePaymentMethod({ method: method(), currencyCode: "USD" })
    ).toBeNull();
  });

  it("rechaza un método inexistente o desactivado", () => {
    expect(
      validatePaymentMethod({ method: null, currencyCode: "USD" })
    ).toBe(METHOD_UNAVAILABLE);
    expect(
      validatePaymentMethod({ method: method({ active: false }), currencyCode: "USD" })
    ).toBe(METHOD_UNAVAILABLE);
  });

  it("rechaza una moneda que no es la del método", () => {
    expect(
      validatePaymentMethod({ method: method(), currencyCode: "CUP" })
    ).toBe(METHOD_UNAVAILABLE);
  });

  it("rechaza si el tipo no coincide con el que trae el pedido", () => {
    expect(
      validatePaymentMethod({
        method: method({ type: "cash" }),
        currencyCode: "USD",
        expectedType: "transfer",
      })
    ).toBe(METHOD_UNAVAILABLE);
  });

  it("rechaza efectivo en una moneda sin billetes soportados", () => {
    expect(
      validatePaymentMethod({
        method: method({ type: "cash", currency: "EUR" }),
        currencyCode: "EUR",
      })
    ).toBe(METHOD_UNAVAILABLE);
  });

  it("rechaza una transferencia sin cupo", () => {
    expect(
      validatePaymentMethod({
        method: method({ transfer_limit: 5, transfer_count: 5 }),
        currencyCode: "USD",
      })
    ).toBe(METHOD_UNAVAILABLE);
  });

  it("un método sin moneda definida cae en USD", () => {
    expect(
      validatePaymentMethod({
        method: method({ currency: "" }),
        currencyCode: "USD",
      })
    ).toBeNull();
  });
});

describe("requiresReceiptError", () => {
  it("exige comprobante en transferencia marcada", () => {
    expect(
      requiresReceiptError({ method: method(), receiptUrl: "" })
    ).not.toBeNull();
    expect(
      requiresReceiptError({ method: method(), receiptUrl: "https://x/y.pdf" })
    ).toBeNull();
  });

  it("no exige comprobante si el método no lo pide o es efectivo", () => {
    expect(
      requiresReceiptError({
        method: method({ requires_receipt: false }),
        receiptUrl: "",
      })
    ).toBeNull();
    expect(
      requiresReceiptError({
        method: method({ type: "cash" }),
        receiptUrl: "",
      })
    ).toBeNull();
  });
});
