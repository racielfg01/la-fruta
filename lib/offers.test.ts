"use strict";

// lib/offers.test.ts
import { describe, test, expect } from "vitest";
import {
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