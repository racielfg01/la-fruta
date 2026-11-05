import { describe, it, expect } from "vitest";
import {
  resolveVisiblePaymentMethodIds,
  clampSelectedPaymentMethod,
  isCashSupported,
  usableAccountsForCurrency,
} from "./payment-methods";

describe("resolveVisiblePaymentMethodIds", () => {
  it("muestra los dos cuando ambos están habilitados", () => {
    expect(resolveVisiblePaymentMethodIds({ showCash: true, showTransfer: true })).toEqual([
      "cash",
      "transfer",
    ]);
  });

  it("oculta el método deshabilitado", () => {
    expect(resolveVisiblePaymentMethodIds({ showCash: true, showTransfer: false })).toEqual(["cash"]);
    expect(resolveVisiblePaymentMethodIds({ showCash: false, showTransfer: true })).toEqual(["transfer"]);
  });

  it("con ambos deshabilitados hace fallback: se muestran los dos", () => {
    expect(resolveVisiblePaymentMethodIds({ showCash: false, showTransfer: false })).toEqual([
      "cash",
      "transfer",
    ]);
  });
});

describe("clampSelectedPaymentMethod", () => {
  it("conserva la selección si sigue visible", () => {
    expect(clampSelectedPaymentMethod("transfer", ["cash", "transfer"])).toBe("transfer");
  });

  it("se mueve al primer método visible si el elegido se ocultó", () => {
    expect(clampSelectedPaymentMethod("transfer", ["cash"])).toBe("cash");
    expect(clampSelectedPaymentMethod("cash", ["transfer"])).toBe("transfer");
  });
});

describe("isCashSupported", () => {
  it("permite efectivo en CUP y USD, las monedas con billetes", () => {
    expect(isCashSupported("CUP")).toBe(true);
    expect(isCashSupported("USD")).toBe(true);
  });

  it("lo rechaza en otras monedas o sin moneda", () => {
    expect(isCashSupported("EUR")).toBe(false);
    expect(isCashSupported(undefined)).toBe(false);
  });
});

describe("usableAccountsForCurrency", () => {
  const account = (currency: string, limit = 0, count = 0) => ({
    currency,
    transferLimit: limit,
    transferCount: count,
  });

  it("deja solo las cuentas de la moneda elegida", () => {
    const rows = [account("CUP"), account("USD"), account("EUR")];
    expect(usableAccountsForCurrency(rows, "USD")).toEqual([account("USD")]);
  });

  it("excluye las cuentas con el límite alcanzado", () => {
    const rows = [account("USD", 3, 3), account("USD", 3, 2), account("USD")];
    expect(usableAccountsForCurrency(rows, "USD")).toEqual([
      account("USD", 3, 2),
      account("USD"),
    ]);
  });

  it("sin moneda elegida no devuelve ninguna", () => {
    expect(usableAccountsForCurrency([account("CUP")], undefined)).toEqual([]);
  });
});
