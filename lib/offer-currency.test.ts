import { describe, expect, it } from "vitest";
import {
  convertOfferPrice,
  offerCurrencyCode,
  type OfferCurrencyInfo,
} from "@/lib/offer-currency";

const currencies: OfferCurrencyInfo[] = [
  { id: "usd", code: "USD", exchangeRate: 1, isDefault: true },
  { id: "cup", code: "CUP", exchangeRate: 24, isDefault: false },
];

describe("moneda guardada de la oferta", () => {
  it("usa CUP para las ofertas creadas antes de guardar la moneda", () => {
    expect(offerCurrencyCode({})).toBe("CUP");
    expect(offerCurrencyCode({ currency_code: null })).toBe("CUP");
  });

  it("normaliza el código guardado", () => {
    expect(offerCurrencyCode({ currency_code: " usd " })).toBe("USD");
    expect(offerCurrencyCode({ currencyCode: "cup" })).toBe("CUP");
  });
});

describe("conversión del precio de la oferta", () => {
  it("convierte desde la moneda guardada hasta la elegida", () => {
    expect(convertOfferPrice(10, currencies, "USD", "CUP")).toBe(240);
    expect(convertOfferPrice(240, currencies, "CUP", "USD")).toBe(10);
  });

  it("respeta la tasa de la moneda predeterminada si no es USD", () => {
    const rates: OfferCurrencyInfo[] = [
      { id: "eur", code: "EUR", exchangeRate: 1, isDefault: true },
      { id: "cup", code: "CUP", exchangeRate: 30, isDefault: false },
    ];
    expect(convertOfferPrice(100, rates, "EUR", "CUP")).toBe(3000);
  });

  it("no inventa un precio si falta la moneda de destino", () => {
    expect(convertOfferPrice(10, currencies, "USD", "XXX")).toBe(10);
  });

  it("cae a CUP cuando el código guardado ya no existe", () => {
    expect(convertOfferPrice(240, currencies, "XXX", "USD")).toBe(10);
  });
});
