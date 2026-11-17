import { describe, expect, it } from "vitest";
import {
  canRateDelivery,
  deliveryRatingHoursLeft,
  validateDeliveryRating,
  type DeliveryRatingRecord,
} from "@/lib/order-ratings";

const NOW = new Date("2026-11-17T12:00:00.000Z");
const hoursAgo = (hours: number) =>
  new Date(NOW.getTime() - hours * 60 * 60 * 1000).toISOString();

function delivered(overrides: Partial<DeliveryRatingRecord> = {}): DeliveryRatingRecord {
  return { status: "delivered", deliveredAt: hoursAgo(2), ...overrides };
}

describe("ventana para valorar la entrega", () => {
  it("permite valorar durante las 72 horas posteriores a la entrega", () => {
    expect(canRateDelivery(delivered(), NOW)).toBe(true);
  });

  it("permite valorar hasta el último minuto", () => {
    expect(canRateDelivery(delivered({ deliveredAt: hoursAgo(71.9) }), NOW)).toBe(true);
  });

  it("cierra la ventana a las 72 horas exactas", () => {
    expect(canRateDelivery(delivered({ deliveredAt: hoursAgo(72) }), NOW)).toBe(false);
  });

  it("no permite valorar si no hay fecha de entrega real", () => {
    expect(canRateDelivery(delivered({ deliveredAt: undefined }), NOW)).toBe(false);
    expect(canRateDelivery(delivered({ deliveredAt: "no-es-fecha" }), NOW)).toBe(false);
  });

  it("no permite valorar antes de la entrega ni una orden aún no entregada", () => {
    expect(canRateDelivery(delivered({ deliveredAt: hoursAgo(-1) }), NOW)).toBe(false);
    expect(canRateDelivery(delivered({ status: "shipped" }), NOW)).toBe(false);
  });

  it("no permite una segunda valoración de la misma orden", () => {
    expect(canRateDelivery(delivered({ deliveryRating: 4 }), NOW)).toBe(false);
  });

  it("informa de las horas restantes redondeadas hacia abajo", () => {
    expect(deliveryRatingHoursLeft(delivered({ deliveredAt: hoursAgo(2.5) }), NOW)).toBe(69);
    expect(deliveryRatingHoursLeft(delivered({ deliveredAt: hoursAgo(80) }), NOW)).toBe(0);
  });
});

describe("validación de la valoración", () => {
  it("acepta de 1 a 5 estrellas y recorta el texto", () => {
    expect(validateDeliveryRating({ stars: 5, comment: "  Llegó frío y a tiempo.  " })).toEqual({
      ok: true,
      value: { stars: 5, comment: "Llegó frío y a tiempo." },
    });
  });

  it("rechaza estrellas fuera de rango o fraccionarias", () => {
    for (const stars of [0, 6, 2.5, Number.NaN]) {
      expect(validateDeliveryRating({ stars, comment: "Bien" }).ok).toBe(false);
    }
  });

  it("exige una descripción no vacía y limitada a 500 caracteres", () => {
    expect(validateDeliveryRating({ stars: 4, comment: "   " }).ok).toBe(false);
    expect(validateDeliveryRating({ stars: 4, comment: "x".repeat(501) }).ok).toBe(false);
  });
});
