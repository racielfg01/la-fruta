"use strict";

// lib/offers.test.ts
import { describe, test, expect } from "vitest";
import { readFileSync } from "node:fs";
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
/**
 * Cableado de las ofertas públicas. El repo no tiene DOM en los tests, así
 * que se comprueba el cableado leyendo el fuente: si alguien vuelve a la
 * rejilla o quita el enlace «Ver más», estas pruebas lo detectan.
 */
describe("cableado de las ofertas públicas", () => {
  const section = readFileSync(
    new URL("../components/offers-section.tsx", import.meta.url),
    "utf8"
  );
  const card = readFileSync(
    new URL("../components/offer-card.tsx", import.meta.url),
    "utf8"
  );
  const pagina = readFileSync(
    new URL("../app/ofertas/page.tsx", import.meta.url),
    "utf8"
  );
  const sitemap = readFileSync(
    new URL("../app/sitemap.ts", import.meta.url),
    "utf8"
  );

  test("la sección de la portada es un carrusel horizontal", () => {
    expect(section).toContain("<Carousel");
    expect(section).toContain("<CarouselContent");
    expect(section).toContain("<CarouselItem");
    // Sin carrusel, la rejilla se cuela de nuevo.
    expect(section).not.toContain("lg:grid-cols-3");
  });

  test("cada oferta tiene su enlace «Ver más» al listado completo", () => {
    expect(card).toContain('href="/ofertas"');
    expect(card).toContain("Ver más");
    // La tarjeta es la que se pinta en el carrusel de la portada.
    expect(section).toContain("<OfferCard");
  });

  test("la página de ofertas existe con metadatos y listado", () => {
    expect(pagina).toContain("export const metadata");
    expect(pagina).toContain("getPublicOffers");
    expect(pagina).toContain('alternates: { canonical: "/ofertas" }');
  });

  test("la página de ofertas está en el sitemap", () => {
    expect(sitemap).toContain("/ofertas");
  });
});
