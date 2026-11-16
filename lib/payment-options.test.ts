import { describe, it, expect } from "vitest";
import { buildPaymentOptions, type PaymentMethodOption } from "./payment-options";

const method = (over: Partial<PaymentMethodOption> = {}): PaymentMethodOption => ({
  id: "m1",
  name: "Efectivo USD",
  type: "cash",
  currency: "USD",
  requiresReceipt: false,
  transferLimit: 0,
  transferCount: 0,
  active: true,
  sort: 1,
  ...over,
});

describe("buildPaymentOptions", () => {
  it("devuelve métodos activos ordenados por sort y nombre", () => {
    const options = buildPaymentOptions({
      methods: [
        method({ id: "m2", name: "Zelle", type: "transfer", sort: 3, requiresReceipt: true }),
        method({ id: "m1", name: "Efectivo USD", type: "cash", sort: 1 }),
        method({ id: "m3", name: "Efectivo CUP", currency: "CUP", sort: 2 }),
      ],
      activeCurrencyCodes: ["USD", "CUP"],
    });
    expect(options.map((o) => o.id)).toEqual(["m1", "m3", "m2"]);
  });

  it("oculta métodos inactivos", () => {
    const options = buildPaymentOptions({
      methods: [method({ id: "m1", active: false })],
      activeCurrencyCodes: ["USD"],
    });
    expect(options).toEqual([]);
  });

  it("oculta efectivo si la moneda no lo admite", () => {
    const options = buildPaymentOptions({
      methods: [method({ id: "m1", currency: "EUR" })],
      activeCurrencyCodes: ["EUR"],
    });
    expect(options).toEqual([]);
  });

  it("oculta métodos cuya moneda no está activa en la tienda", () => {
    const options = buildPaymentOptions({
      methods: [method({ id: "m1", currency: "USD" })],
      activeCurrencyCodes: ["CUP"],
    });
    expect(options).toEqual([]);
  });

  it("marca transferencia sin cupo como no disponible", () => {
    const options = buildPaymentOptions({
      methods: [
        method({
          id: "t1",
          name: "Zelle",
          type: "transfer",
          requiresReceipt: true,
          transferLimit: 5,
          transferCount: 5,
          accountNumber: "123",
          owner: "Juan",
        }),
      ],
      activeCurrencyCodes: ["USD"],
    });
    expect(options[0]).toMatchObject({
      available: false,
      reason: "No hay cupo disponible para este método.",
    });
  });

  it("incluye datos de cuenta e instrucciones en transferencias", () => {
    const options = buildPaymentOptions({
      methods: [
        method({
          id: "t1",
          name: "Zelle",
          type: "transfer",
          requiresReceipt: true,
          accountNumber: "+1 786 704 5331",
          accountType: "Zelle",
          owner: "Orlando",
          instructions: "Enviar a nombre de Orlando",
          image: "logo.png",
        }),
      ],
      activeCurrencyCodes: ["USD"],
    });
    expect(options[0]).toMatchObject({
      kind: "transfer",
      label: "Zelle",
      accountNumber: "+1 786 704 5331",
      owner: "Orlando",
      instructions: "Enviar a nombre de Orlando",
      requiresReceipt: true,
      logo: "logo.png",
      available: true,
    });
  });

  it("efectivo siempre disponible y sin comprobante", () => {
    const options = buildPaymentOptions({
      methods: [method({ id: "c1", type: "cash", currency: "CUP", name: "Efectivo CUP" })],
      activeCurrencyCodes: ["CUP"],
    });
    expect(options[0]).toMatchObject({
      kind: "cash",
      available: true,
      requiresReceipt: false,
      subtitle: "Efectivo",
    });
  });

  it("transferencia con límite 0 es ilimitada", () => {
    const options = buildPaymentOptions({
      methods: [
        method({
          id: "t1",
          type: "transfer",
          requiresReceipt: true,
          transferLimit: 0,
          transferCount: 99,
        }),
      ],
      activeCurrencyCodes: ["USD"],
    });
    expect(options[0].available).toBe(true);
  });
});
