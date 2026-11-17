/**
 * Moneda del precio de una oferta.
 *
 * Antes no se guardaba y todo se interpretaba como CUP. Las ofertas nuevas
 * guardan el código de la moneda predeterminada vigente al crearlas, para que
 * un cambio posterior de moneda predeterminada no altere su precio real.
 */

export const LEGACY_OFFER_CURRENCY = "CUP";

export interface OfferCurrencyInfo {
  id?: string;
  code: string;
  exchangeRate: number;
  isDefault?: boolean;
}

export function offerCurrencyCode(
  record: { currency_code?: string | null; currencyCode?: string | null } | null | undefined
): string {
  const raw = String(record?.currency_code ?? record?.currencyCode ?? "").trim();
  return raw ? raw.toUpperCase() : LEGACY_OFFER_CURRENCY;
}

export function findOfferCurrency(
  currencies: OfferCurrencyInfo[],
  code: string
): OfferCurrencyInfo | undefined {
  const wanted = code.toUpperCase();
  return (
    currencies.find((c) => String(c.code).toUpperCase() === wanted) ??
    currencies.find(
      (c) => String(c.code).toUpperCase() === LEGACY_OFFER_CURRENCY
    )
  );
}

/** Convierte un importe entre monedas usando las tasas de la tienda. */
export function convertOfferPrice(
  price: number,
  currencies: OfferCurrencyInfo[],
  fromCode: string,
  toCode: string
): number {
  const from = findOfferCurrency(currencies, fromCode);
  const to = currencies.find(
    (c) => String(c.code).toUpperCase() === toCode.toUpperCase()
  );
  if (!from || !to) return price;
  const rate = Number(from.exchangeRate) || 1;
  const targetRate = Number(to.exchangeRate) || 1;
  return Math.round((price / rate) * targetRate * 100) / 100;
}
