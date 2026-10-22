"use client";

import { useSettingsStore } from "./settings-store";
import type { MarginConfig } from "./price-margin";

interface ProductLike {
  priceMargin?: number | null;
}

/**
 * Config de margen para mostrar/cobrar un producto:
 * el margen global de settings + el override opcional del producto.
 */
export function useMarginConfig(product?: ProductLike): MarginConfig & {
  globalMargin: number;
} {
  const globalMargin = useSettingsStore((s) => s.settings.priceMargin) || 0;
  return { globalMargin, productMargin: product?.priceMargin ?? null };
}
