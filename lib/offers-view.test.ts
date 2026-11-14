import { describe, test, expect } from "vitest";
import { visibleOffers, isOfferExpired } from "./offers-view";
import type { PublicOffer } from "./offers";

function oferta(over: Partial<PublicOffer> = {}): PublicOffer {
  return {
    id: "o1",
    name: "Rebaja de prueba",
    description: "Ajo",
    price: 100,
    type: "product",
    productId: "p1",
    image: "",
    endDate: "2026-12-31T23:59:59.000Z",
    active: true,
    ...over,
  };
}

const AHORA = Date.parse("2026-11-20T12:00:00.000Z");

describe("isOfferExpired", () => {
  test("una oferta con fecha por delante no está vencida", () => {
    expect(isOfferExpired(oferta(), AHORA)).toBe(false);
  });

  test("una oferta con fecha pasada está vencida", () => {
    expect(
      isOfferExpired(oferta({ endDate: "2026-11-01T00:00:00.000Z" }), AHORA),
    ).toBe(true);
  });

  test("sin hora (el HTML sin hidratar) nadie se da por vencido", () => {
    expect(
      isOfferExpired(oferta({ endDate: "2026-11-01T00:00:00.000Z" }), null),
    ).toBe(false);
  });

  test("una oferta sin fecha límite nunca vence", () => {
    expect(isOfferExpired(oferta({ endDate: "" }), AHORA)).toBe(false);
  });

  test("una oferta desactivada está vencida", () => {
    expect(isOfferExpired(oferta({ active: false }), AHORA)).toBe(true);
  });
});

describe("visibleOffers", () => {
  test("enseña solo las activas y no vencidas", () => {
    const lista = [
      oferta({ id: "viva" }),
      oferta({ id: "vencida", endDate: "2026-11-01T00:00:00.000Z" }),
      oferta({ id: "inactiva", active: false }),
    ];
    expect(visibleOffers(lista, AHORA).map((o) => o.id)).toEqual(["viva"]);
  });

  test("sin hora enseña las activas (el servidor no descarta ninguna)", () => {
    const lista = [
      oferta({ id: "activa" }),
      oferta({ id: "vencida", endDate: "2026-11-01T00:00:00.000Z" }),
      oferta({ id: "inactiva", active: false }),
    ];
    expect(visibleOffers(lista, null).map((o) => o.id)).toEqual([
      "activa",
      "vencida",
    ]);
  });

  test("una lista vacía no da ninguna oferta", () => {
    expect(visibleOffers([], AHORA)).toEqual([]);
  });
});
