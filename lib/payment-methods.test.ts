import { describe, it, expect } from "vitest";
import {
  resolveVisiblePaymentMethodIds,
  clampSelectedPaymentMethod,
  isCashSupported,
  usableAccountsForCurrency,
  validateTransferAccount,
  TRANSFER_ACCOUNT_UNAVAILABLE,
  paymentMethodWarnings,
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

describe("validateTransferAccount", () => {
  const record = (over: Record<string, unknown> = {}) => ({
    active: true,
    currency: "USD",
    transfer_limit: 0,
    transfer_count: 0,
    ...over,
  });
  const bank = { active: true };
  const valid = { account: record(), bank, currencyCode: "USD" };

  it("acepta una cuenta activa, del banco activo, de la moneda y con cupo", () => {
    expect(validateTransferAccount(valid)).toBeNull();
  });

  it("rechaza cuenta inexistente o inactiva", () => {
    expect(validateTransferAccount({ ...valid, account: null })).toBe(
      TRANSFER_ACCOUNT_UNAVAILABLE,
    );
    expect(
      validateTransferAccount({ ...valid, account: record({ active: false }) }),
    ).toBe(TRANSFER_ACCOUNT_UNAVAILABLE);
  });

  it("rechaza banco inexistente o inactivo", () => {
    expect(validateTransferAccount({ ...valid, bank: null })).toBe(
      TRANSFER_ACCOUNT_UNAVAILABLE,
    );
    expect(validateTransferAccount({ ...valid, bank: { active: false } })).toBe(
      TRANSFER_ACCOUNT_UNAVAILABLE,
    );
  });

  it("rechaza otra moneda", () => {
    expect(validateTransferAccount({ ...valid, currencyCode: "CUP" })).toBe(
      TRANSFER_ACCOUNT_UNAVAILABLE,
    );
  });

  it("rechaza el límite alcanzado", () => {
    expect(
      validateTransferAccount({
        ...valid,
        account: record({ transfer_limit: 2, transfer_count: 2 }),
      }),
    ).toBe(TRANSFER_ACCOUNT_UNAVAILABLE);
  });

  it("acepta límite 0 (sin tope)", () => {
    expect(
      validateTransferAccount({
        ...valid,
        account: record({ transfer_limit: 0, transfer_count: 99 }),
      }),
    ).toBeNull();
  });
});

describe("paymentMethodWarnings", () => {
  it("no emite avisos cuando todo está bien", () => {
    expect(
      paymentMethodWarnings({
        cashEnabled: true,
        transferEnabled: true,
        usableAccounts: 2,
        configuredAccounts: 2,
        cashCurrencyAvailable: true,
      }),
    ).toEqual([]);
  });

  it("avisa cuando la transferencia está activa pero no hay cuentas utilizables", () => {
    expect(
      paymentMethodWarnings({
        cashEnabled: true,
        transferEnabled: true,
        usableAccounts: 0,
        configuredAccounts: 3,
        cashCurrencyAvailable: true,
      }),
    ).toEqual(["transfer_without_accounts"]);
  });

  it("avisa cuando las cuentas existen pero la transferencia está oculta", () => {
    expect(
      paymentMethodWarnings({
        cashEnabled: true,
        transferEnabled: false,
        usableAccounts: 0,
        configuredAccounts: 2,
        cashCurrencyAvailable: true,
      }),
    ).toEqual(["accounts_hidden"]);
  });

  it("avisa cuando el efectivo está activado pero no hay moneda CUP ni USD", () => {
    expect(
      paymentMethodWarnings({
        cashEnabled: true,
        transferEnabled: true,
        usableAccounts: 1,
        configuredAccounts: 1,
        cashCurrencyAvailable: false,
      }),
    ).toEqual(["cash_without_currency"]);
  });

  it("emite solo el aviso de efectivo si la transferencia está bien y el efectivo está activo", () => {
    expect(
      paymentMethodWarnings({
        cashEnabled: true,
        transferEnabled: true,
        usableAccounts: 1,
        configuredAccounts: 1,
        cashCurrencyAvailable: false,
      }),
    ).toEqual(["cash_without_currency"]);
  });

  it("no emite aviso de efectivo si está desactivado", () => {
    expect(
      paymentMethodWarnings({
        cashEnabled: false,
        transferEnabled: true,
        usableAccounts: 1,
        configuredAccounts: 1,
        cashCurrencyAvailable: false,
      }),
    ).toEqual([]);
  });

  it("no emite aviso cuando la transferencia está desactivada y no hay cuentas", () => {
    expect(
      paymentMethodWarnings({
        cashEnabled: true,
        transferEnabled: false,
        usableAccounts: 0,
        configuredAccounts: 0,
        cashCurrencyAvailable: true,
      }),
    ).toEqual([]);
  });
});
