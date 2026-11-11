"use strict";

// lib/offers.test.ts
import { describe, test, expect } from "vitest";
import {
  countdownParts,
  isOfferActive,
  offerLineTargets,
  toPublicOffer,
  toUsdAmount,
  type OfferType,
} from "./offers";

describe("isOfferActive", () => {
  test("activa y vigente", () => {
    const now = Date.now();
    const future = now + 86400000; // 24h
    const offer = {
      active: true,
      end_date: new Date(future).toISOString(),
    } as const;
    expect(isOfferActive(offer)).toBe(true);
  });

  test("activa pero vencida", () => {
    const now = Date.now();
    const past = now - 86400000; // 24h atrás
    const offer = {
      active: true,
      end_date: new Date(past).toISOString(),
    } as const;
    expect(isOfferActive(offer)).toBe(false);
  });

  test("inactiva", () => {
    const offer = {
      active: false,
      end_date: new Date().toISOString(),
    } as const;
    expect(isOfferActive(offer)).toBe(false);
  });

  test("activa sin fecha límite (infinita)", () => {
    const offer = {
      active: true,
      end_date: "0000-01-01T00:00:00Z",
    } as const;
    expect(isOfferActive(offer)).toBe(true);
  });
});

describe("isOfferActive con instante fijo", () => {
  const NOW = Date.UTC(2026, 10, 10, 12, 0, 0); // 2026-11-10 12:00 UTC

  test("vigente respecto al instante dado", () => {
    const offer = {
      active: true,
      end_date: new Date(NOW + 60_000).toISOString(),
    } as const;
    expect(isOfferActive(offer, NOW)).toBe(true);
  });

  test("vencida respecto al instante dado", () => {
    const offer = {
      active: true,
      end_date: new Date(NOW - 60_000).toISOString(),
    } as const;
    expect(isOfferActive(offer, NOW)).toBe(false);
  });
});

describe("countdownParts", () => {
  const NOW = Date.UTC(2026, 10, 10, 12, 0, 0); // 2026-11-10 12:00 UTC

  function inMs(ms: number): string {
    return new Date(NOW + ms).toISOString();
  }

  test("descompone días, horas, minutos y segundos", () => {
    const restante =
      2 * 86_400_000 + 3 * 3_600_000 + 4 * 60_000 + 5_000;
    expect(countdownParts(inMs(restante), NOW)).toEqual({
      days: 2,
      hours: 3,
      minutes: 4,
      seconds: 5,
    });
  });

  test("vencida muestra ceros", () => {
    expect(countdownParts(inMs(-5_000), NOW)).toEqual({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    });
  });

  test("fecha no utilizable devuelve null (oferta sin límite)", () => {
    expect(countdownParts("", NOW)).toBeNull();
    expect(countdownParts("no-es-fecha", NOW)).toBeNull();
    expect(countdownParts("0000-01-01T00:00:00Z", NOW)).toBeNull();
  });

  test("acepta el formato de fecha de PocketBase (espacio en vez de T)", () => {
    expect(countdownParts("2026-11-10 12:01:05.000Z", NOW)).toEqual({
      days: 0,
      hours: 0,
      minutes: 1,
      seconds: 5,
    });
  });
});

describe("offerLineTargets", () => {
  test("identifica productos en combos", () => {
    const offers: { type: OfferType; product_id: string }[] = [
      { type: "combo", product_id: "p1" },
      { type: "combo", product_id: "p2" },
      { type: "product", product_id: "p3" },
    ];
    const ids = offerLineTargets(offers);
    expect(ids).toEqual(["p1", "p2", "p3"]);
  });

  test("ignora productos vacíos", () => {
    const offers: { type: OfferType; product_id: string }[] = [
      { type: "combo", product_id: "" },
      { type: "product", product_id: "p1" },
    ];
    const ids = offerLineTargets(offers);
    expect(ids).toEqual(["p1"]);
  });
});

describe("toPublicOffer", () => {
  test("convierte AdminOffer a PublicOffer", () => {
    const o = {
      id: "o1",
      name: "Combo",
      description: "Desc",
      price: 1000,
      type: "combo",
      product_id: "p1",
      image: "img.jpg",
      end_date: "2026-11-11T00:00:00Z",
      active: true,
    } as const;
    const p = toPublicOffer(o);
    expect(p).toEqual({
      id: "o1",
      name: "Combo",
      description: "Desc",
      price: 1000,
      type: "combo",
      productId: "p1",
      image: "img.jpg",
      endDate: "2026-11-11T00:00:00Z",
      active: true,
    });
  });
});

describe("toUsdAmount", () => {
  test("convierte CUP a USD con rate 1", () => {
    expect(toUsdAmount(1000, 1)).toBe(1000);
  });

  test("convierte CUP a USD con rate 2", () => {
    expect(toUsdAmount(1000, 2)).toBe(500);
  });
});