import { describe, it, expect } from "vitest";
import { roundCashUp } from "./cash-rounding";

describe("roundCashUp", () => {
  it("redondea USD hacia arriba al dólar entero (billetes de 1)", () => {
    expect(roundCashUp(12.4, "USD")).toBe(13);
    expect(roundCashUp(12, "USD")).toBe(12);
    expect(roundCashUp(0.01, "USD")).toBe(1);
  });

  it("redondea CUP hacia arriba a la centena (billetes de 100)", () => {
    expect(roundCashUp(7823, "CUP")).toBe(7900);
    expect(roundCashUp(7800, "CUP")).toBe(7800);
    expect(roundCashUp(7801, "CUP")).toBe(7900);
    expect(roundCashUp(0.5, "CUP")).toBe(100);
  });

  it("no sube cuando el importe ya es exacto (ruido de coma flotante)", () => {
    expect(roundCashUp(12.0000000001, "USD")).toBe(12);
    expect(roundCashUp(7800.0000000001, "CUP")).toBe(7800);
  });

  it("en monedas sin regla solo deja dos decimales", () => {
    expect(roundCashUp(12.345, "EUR")).toBe(12.35);
    expect(roundCashUp(12.3, "EUR")).toBe(12.3);
  });

  it("trata importes inválidos como cero", () => {
    expect(roundCashUp(Number.NaN, "USD")).toBe(0);
    expect(roundCashUp(-5, "USD")).toBe(0);
  });
});
