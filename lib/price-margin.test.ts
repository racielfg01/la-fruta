import { describe, expect, it } from "vitest";
import {
  displayProductCupPrice,
  effectiveCupPrice,
  effectiveMargin,
  orderItemPrice,
} from "./price-margin";

describe("effectiveMargin", () => {
  it("devuelve 0 cuando no hay margen global ni de producto", () => {
    expect(effectiveMargin({ globalMargin: null, productMargin: null })).toBe(0);
    expect(effectiveMargin({})).toBe(0);
  });

  it("usa el margen global cuando el producto no define uno", () => {
    expect(effectiveMargin({ globalMargin: 20, productMargin: null })).toBe(20);
  });

  it("el margen del producto sobrescribe el global", () => {
    expect(effectiveMargin({ globalMargin: 20, productMargin: 25 })).toBe(25);
    expect(effectiveMargin({ globalMargin: 20, productMargin: 0 })).toBe(0);
  });

  it("ignora valores no finitos (NaN, texto, undefined)", () => {
    expect(
      effectiveMargin({ globalMargin: NaN, productMargin: undefined })
    ).toBe(0);
    expect(
      effectiveMargin({ globalMargin: 20, productMargin: NaN })
    ).toBe(20);
  });

  it("no permite márgenes negativos (los lleva a 0)", () => {
    expect(effectiveMargin({ globalMargin: -5, productMargin: null })).toBe(0);
    expect(effectiveMargin({ globalMargin: 20, productMargin: -10 })).toBe(0);
  });
});

describe("effectiveCupPrice", () => {
  it("suma el margen porcentual al precio base en CUP", () => {
    expect(effectiveCupPrice(100, { globalMargin: 20 })).toBe(120);
    expect(effectiveCupPrice(100, { productMargin: 25, globalMargin: 10 })).toBe(
      125
    );
  });

  it("redondea a 2 decimales", () => {
    expect(effectiveCupPrice(99.99, { globalMargin: 33.333 })).toBe(133.32);
  });

  it("sin margen devuelve el precio base", () => {
    expect(effectiveCupPrice(100, { globalMargin: null })).toBe(100);
  });
});

describe("orderItemPrice", () => {
  it("aplica el margen solo cuando la orden se paga en CUP", () => {
    const cfg = { globalMargin: 20 };
    expect(orderItemPrice(100, cfg, "CUP")).toBe(120);
    expect(orderItemPrice(100, cfg, "USD")).toBe(100);
    expect(orderItemPrice(100, cfg, "EUR")).toBe(100);
  });
});

describe("displayProductCupPrice", () => {
  it("devuelve el precio con margen cuando se muestra en CUP", () => {
    expect(displayProductCupPrice(100, { globalMargin: 20 }, "CUP")).toBe(120);
  });

  it("devuelve el precio base en cualquier otra moneda", () => {
    expect(displayProductCupPrice(100, { globalMargin: 20 }, "USD")).toBe(100);
    expect(displayProductCupPrice(100, { globalMargin: 20 }, "EUR")).toBe(100);
  });
});
