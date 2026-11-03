"use client";

import { useCurrency } from "./currency";

/**
 * Formatea importes de orden. Los montos se guardan en CUP y se muestran en la
 * moneda con la que pagó el cliente, con la base CUP como dato secundario.
 */
export function useOrderMoney() {
  const { currencies, formatPrice, convertPrice } = useCurrency();
  const cupCurrency = currencies.find((c) => c.code === "CUP") ?? null;

  const formatOrderMoney = (cupAmount: number, code: string) => {
    const target = currencies.find((c) => c.code === code) ?? null;
    if (cupCurrency && target && target.code !== cupCurrency.code) {
      return formatPrice(convertPrice(cupAmount, cupCurrency, target), target);
    }
    return formatPrice(cupAmount, target ?? cupCurrency);
  };

  const hasCupBase = (code: string) =>
    !!cupCurrency && code !== cupCurrency.code;

  return { formatOrderMoney, hasCupBase, cupCurrency };
}
