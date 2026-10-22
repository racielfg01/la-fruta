import { describe, it, expect } from "vitest";
import {
  resolveVisiblePaymentMethodIds,
  clampSelectedPaymentMethod,
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
