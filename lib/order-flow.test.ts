import { describe, expect, it } from "vitest";
import {
  ORDER_FLOW,
  ORDER_STATUS_LABELS,
  canCancelOrder,
  nextOrderStatus,
  paymentMethodLabel,
} from "./order-flow";

describe("nextOrderStatus", () => {
  it("avanza de uno en uno por el flujo", () => {
    expect(nextOrderStatus("pending")).toBe("confirmed");
    expect(nextOrderStatus("preparing")).toBe("shipped");
  });

  it("no avanza desde el último paso ni desde una orden cancelada", () => {
    expect(nextOrderStatus("delivered")).toBeNull();
    expect(nextOrderStatus("cancelled")).toBeNull();
  });
});

describe("canCancelOrder", () => {
  it("permite cancelar antes de enviar", () => {
    expect(canCancelOrder("pending")).toBe(true);
    expect(canCancelOrder("confirmed")).toBe(true);
    expect(canCancelOrder("preparing")).toBe(true);
  });

  it("no permite cancelar una orden enviada, entregada o ya cancelada", () => {
    expect(canCancelOrder("shipped")).toBe(false);
    expect(canCancelOrder("delivered")).toBe(false);
    expect(canCancelOrder("cancelled")).toBe(false);
  });
});

describe("etiquetas", () => {
  it("todos los pasos del flujo tienen etiqueta en español", () => {
    for (const status of ORDER_FLOW) {
      expect(ORDER_STATUS_LABELS[status]).toBeTruthy();
    }
  });

  it("traduce los métodos de pago conocidos", () => {
    expect(paymentMethodLabel("cash")).toBe("Efectivo");
    expect(paymentMethodLabel("transfer_cup")).toBe("Transferencia CUP");
    expect(paymentMethodLabel("")).toBe("No especificado");
  });
});
