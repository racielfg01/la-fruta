import { describe, it, expect } from "vitest";
import {
  buildPaymentOptions,
  type OptionAccount,
  type OptionBank,
  type OptionCurrency,
} from "./payment-options";

const usd: OptionCurrency = { id: "c1", code: "USD", symbol: "$" };
const cup: OptionCurrency = { id: "c2", code: "CUP", symbol: "$" };
const eur: OptionCurrency = { id: "c3", code: "EUR", symbol: "€" };

const zelle: OptionBank = {
  id: "b1",
  name: "Zelle",
  logo: "zelle.png",
  currency: "USD",
};
const usdt: OptionBank = {
  id: "b2",
  name: "USDT",
  logo: "usdt.png",
  currency: "USD",
};

const account = (over: Partial<OptionAccount> = {}): OptionAccount => ({
  id: "a-zelle",
  bankId: "b1",
  currency: "USD",
  accountType: "",
  transferLimit: 0,
  transferCount: 0,
  ...over,
});

const base = {
  currencies: [usd, cup],
  banks: [zelle, usdt],
  accounts: [account()],
  showCash: true,
  showBanks: true,
};

describe("buildPaymentOptions", () => {
  it("arma efectivo primero y luego bancos por nombre", () => {
    const options = buildPaymentOptions(base);
    expect(options.map((o) => o.id)).toEqual([
      "cash:USD",
      "cash:CUP",
      "bank:b2",
      "bank:b1",
    ]);
    expect(options[0]).toMatchObject({
      kind: "cash",
      label: "USD",
      subtitle: "Efectivo",
      available: true,
    });
  });

  it("usa el tipo de la cuenta como subtítulo y cae a la moneda", () => {
    const options = buildPaymentOptions({
      ...base,
      accounts: [
        account(),
        account({ id: "a-usdt", bankId: "b2", accountType: "BEP-20" }),
      ],
    });
    expect(options.find((o) => o.id === "bank:b2")?.subtitle).toBe("BEP-20");
    expect(options.find((o) => o.id === "bank:b1")?.subtitle).toBe("USD");
  });

  it("deshabilita el banco sin cuentas con el motivo", () => {
    const options = buildPaymentOptions({
      ...base,
      accounts: [account({ id: "a-usdt", bankId: "b2" })],
    });
    expect(options.find((o) => o.id === "bank:b1")).toMatchObject({
      available: false,
      reason: "No hay cuentas activas en USD.",
    });
  });

  it("excluye cuentas de otra moneda y con el límite alcanzado", () => {
    const options = buildPaymentOptions({
      ...base,
      banks: [zelle],
      accounts: [
        account({ id: "ok" }),
        account({ id: "cup", currency: "CUP" }),
        account({ id: "full", transferLimit: 3, transferCount: 3 }),
      ],
    });
    expect(options.find((o) => o.id === "bank:b1")?.accountIds).toEqual([
      "ok",
    ]);
  });

  it("sin moneda en el banco usa la de su primera cuenta usable", () => {
    const options = buildPaymentOptions({
      ...base,
      banks: [{ id: "b3", name: "Transfer", currency: "" }],
      accounts: [account({ id: "a3", bankId: "b3" })],
    });
    expect(options.find((o) => o.id === "bank:b3")?.currencyCode).toBe("USD");
  });

  it("oculta el banco cuya moneda no está activa", () => {
    const options = buildPaymentOptions({
      ...base,
      banks: [{ id: "b4", name: "Euro", currency: "EUR" }],
      accounts: [account({ id: "a4", bankId: "b4", currency: "EUR" })],
    });
    expect(options.some((o) => o.kind === "bank")).toBe(false);
  });

  it("respeta los switches y muestra todo si ambos están apagados", () => {
    const sinEfectivo = buildPaymentOptions({ ...base, showCash: false });
    expect(sinEfectivo.every((o) => o.kind === "bank")).toBe(true);

    const sinBancos = buildPaymentOptions({ ...base, showBanks: false });
    expect(sinBancos.every((o) => o.kind === "cash")).toBe(true);

    const ambosApagados = buildPaymentOptions({
      ...base,
      showCash: false,
      showBanks: false,
    });
    expect(ambosApagados.map((o) => o.id)).toEqual([
      "cash:USD",
      "cash:CUP",
      "bank:b2",
      "bank:b1",
    ]);
  });

  it("no genera tile para un banco sin moneda ni cuentas", () => {
    const options = buildPaymentOptions({
      ...base,
      banks: [{ id: "b5", name: "Vacío", currency: "" }],
      accounts: [],
    });
    expect(options.some((o) => o.id === "bank:b5")).toBe(false);
  });

  it("no genera efectivo para una moneda que no lo admite", () => {
    const options = buildPaymentOptions({
      ...base,
      currencies: [usd, cup, eur],
    });
    expect(options.filter((o) => o.kind === "cash").map((o) => o.id)).toEqual([
      "cash:USD",
      "cash:CUP",
    ]);
  });

  it("deshabilita un banco sin moneda cuyas cuentas agotaron el cupo", () => {
    const options = buildPaymentOptions({
      ...base,
      banks: [{ id: "b6", name: "Sin moneda", currency: "" }],
      accounts: [
        account({
          id: "a6",
          bankId: "b6",
          transferLimit: 1,
          transferCount: 1,
        }),
      ],
    });
    expect(options.find((o) => o.id === "bank:b6")).toMatchObject({
      currencyCode: "USD",
      available: false,
      reason: "No hay cuentas activas en USD.",
    });
  });

  it("con moneda vacía usa la primera cuenta de una moneda activa", () => {
    const options = buildPaymentOptions({
      ...base,
      banks: [{ id: "b7", name: "Mixto", currency: "" }],
      accounts: [
        account({ id: "eur", bankId: "b7", currency: "EUR" }),
        account({
          id: "usd",
          bankId: "b7",
          currency: "USD",
          accountType: "BEP-20",
        }),
      ],
    });
    expect(options.find((o) => o.id === "bank:b7")).toMatchObject({
      currencyCode: "USD",
      available: true,
      accountIds: ["usd"],
      subtitle: "BEP-20",
    });
  });
});
