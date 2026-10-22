import { describe, expect, it } from "vitest";
import { orderTotalCup } from "./order-total";

describe("orderTotalCup", () => {
  it("suma subtotal + envío + costo operativo", () => {
    expect(orderTotalCup(1000, 200, 50)).toBe(1250);
  });

  it("trata valores ausentes/inválidos como 0 en envío y costo operativo", () => {
    expect(orderTotalCup(1000, NaN, undefined)).toBe(1000);
    expect(orderTotalCup(1000, 200, null as unknown as number)).toBe(1200);
  });

  it("usa 0 para costos operativos negativos (nunca descuenta)", () => {
    expect(orderTotalCup(1000, 200, -50)).toBe(1200);
  });

  it("redondea el total a 2 decimales", () => {
    expect(orderTotalCup(99.995, 0, 10)).toBe(110);
  });
});
