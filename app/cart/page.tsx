"use client";

import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCartStore } from "@/lib/store";
import { useCurrency } from "@/lib/currency";
import { displayProductCupPrice, effectiveMargin } from "@/lib/price-margin";
import { cupSavingForItems } from "@/lib/usd-saving";
import { useMarginConfig } from "@/lib/use-price-margin";
import { useSettingsStore } from "@/lib/settings-store";
import type { Product } from "@/lib/store";
import { ProductImage } from "@/components/product-image";
import SavingHint from "@/components/saving-hint";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  Truck,
  Shield,
  Loader2,
} from "lucide-react";
import Link from "next/link";

export default function CartPage() {
  const { items, updateQuantity, removeItem } = useCartStore();
  const { currencies, defaultCurrency, formatPrice, convertPrice } = useCurrency();
  const cupCurrency = currencies.find((c) => c.code === "CUP");
  const marginCfg = useMarginConfig();
  const freeShippingMin = useSettingsStore((s) => s.settings.freeShippingMin) || 0;

  // Precio CUP a mostrar por producto: márgened solo si el display es CUP.
  const itemCup = (p: Product) =>
    displayProductCupPrice(
      p.price,
      { globalMargin: marginCfg.globalMargin, productMargin: p.priceMargin ?? null },
      defaultCurrency?.code
    );

  // Helper único de conversión (product.price está en CUP)
  const formatCup = (cupAmount: number) => {
    if (!cupCurrency || !defaultCurrency) {
      return formatPrice(cupAmount, defaultCurrency || cupCurrency);
    }
    const converted = convertPrice(cupAmount, cupCurrency, defaultCurrency);
    return formatPrice(converted, defaultCurrency);
  };

  const subtotal = items.reduce(
    (sum, it) => sum + itemCup(it.product) * it.quantity,
    0
  );
  const isFreeShipping = freeShippingMin > 0 && subtotal >= freeShippingMin;
  const isCupDisplay = defaultCurrency?.code === "CUP";

  // Ahorro por pagar en USD: el margen solo se aplica a las órdenes en CUP.
  const usdCurrency = currencies.find((c) => c.code === "USD");
  const saving = cupSavingForItems(
    items.map((it) => ({
      basePriceCup: it.product.price,
      quantity: it.quantity,
      marginPct: effectiveMargin({
        globalMargin: marginCfg.globalMargin,
        productMargin: it.product.priceMargin ?? null,
      }),
    }))
  );
  const itemsBaseTotal = items.reduce(
    (sum, it) => sum + it.product.price * it.quantity,
    0
  );
  const usdTotal =
    cupCurrency && usdCurrency
      ? convertPrice(itemsBaseTotal, cupCurrency, usdCurrency)
      : 0;

  // -------------------------------
  // Carrito vacío
  // -------------------------------
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto max-w-md px-4 py-16">
          <div className="flex flex-col items-center text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <ShoppingBag className="h-8 w-8 text-muted-foreground" />
            </div>
            <h1 className="mb-2 text-xl font-semibold sm:text-2xl">
              Tu carrito está vacío
            </h1>
            <p className="mb-6 text-sm text-muted-foreground">
              Aún no has agregado productos. Explora nuestra selección de frutas
              frescas.
            </p>
            <Button asChild>
              <Link href="/#products">
                Explorar productos <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto max-w-6xl px-4 pb-28 pt-6 sm:pt-8 lg:pb-12">
        {/* Título */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Mi carrito
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {items.length} {items.length === 1 ? "producto" : "productos"} en tu
            pedido
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:gap-8">
          {/* Columna izquierda — productos */}
          <section className="overflow-hidden rounded-xl border bg-card">
            <ul className="divide-y">
              {items.map((item) => {
                const lineTotal = itemCup(item.product) * item.quantity;
                return (
                  <li key={item.product.id} className="group p-4 sm:p-5">
                    <div className="flex gap-4">
                      {/* Imagen */}
                      <Link
                        href={`/product/${item.product.id}`}
                        className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted sm:h-24 sm:w-24"
                      >
                        <ProductImage
                          image={item.product.image}
                          alt={item.product.name}
                          width={192}
                          sizes="96px"
                        />
                      </Link>

                      {/* Detalles */}
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <Link
                              href={`/product/${item.product.id}`}
                              className="line-clamp-2 text-sm font-semibold text-foreground transition-colors hover:text-primary sm:text-base"
                            >
                              {item.product.name}
                            </Link>
                            {item.product.origin && (
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {item.product.origin}
                              </p>
                            )}
                          </div>

                          {/* Delete — discreto, aparece al hover en desktop */}
                          <button
                            type="button"
                            aria-label={`Eliminar ${item.product.name}`}
                            onClick={() => removeItem(item.product.id)}
                            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatCup(itemCup(item.product))} / {item.product.unit}
                        </p>

                        {/* Cantidad + total */}
                        <div className="mt-auto flex items-end justify-between gap-3 pt-3">
                          <div className="flex items-center rounded-full border">
                            <button
                              type="button"
                              aria-label="Disminuir cantidad"
                              onClick={() =>
                                updateQuantity(
                                  item.product.id,
                                  Math.max(1, item.quantity - 1),
                                )
                              }
                              disabled={item.quantity <= 1}
                              className="flex h-8 w-8 items-center justify-center rounded-l-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-8 text-center text-sm font-medium tabular-nums">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              aria-label="Aumentar cantidad"
                              onClick={() =>
                                updateQuantity(item.product.id, item.quantity + 1)
                              }
                              className="flex h-8 w-8 items-center justify-center rounded-r-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <p className="text-base font-semibold text-foreground sm:text-lg">
                            {formatCup(lineTotal)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Columna derecha — resumen sticky */}
          <aside className="lg:sticky lg:top-20 lg:h-fit">
            <div className="overflow-hidden rounded-xl border bg-card">
              <div className="border-b px-5 py-3.5">
                <h2 className="text-sm font-semibold">Resumen del pedido</h2>
              </div>

              <div className="space-y-3 px-5 py-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatCup(subtotal)}</span>
                </div>

                <div className="flex items-start justify-between gap-3 text-sm">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Truck className="h-3.5 w-3.5" /> Envío
                  </span>
                  {isFreeShipping ? (
                    <span className="text-right text-sm font-semibold text-emerald-600">
                      Gratis
                    </span>
                  ) : (
                    <span className="text-right text-xs text-muted-foreground">
                      Según zona, en el checkout
                    </span>
                  )}
                </div>
                {freeShippingMin > 0 && !isFreeShipping && (
                  <p className="text-sm text-muted-foreground">
                    Envío gratis a partir de{" "}
                    <span className="font-semibold">
                      {formatCup(freeShippingMin)}
                    </span>
                  </p>
                )}
                {freeShippingMin > 0 && isFreeShipping && (
                  <p className="text-sm font-semibold text-emerald-600">
                    ¡Tienes envío gratis!
                  </p>
                )}
              </div>

              <div className="border-t px-5 py-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-semibold">Total</span>
                  <span className="text-xl font-bold text-primary">
                    {formatCup(subtotal)}
                  </span>
                </div>
                {!isCupDisplay && cupCurrency && (
                  <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                    <span>En {cupCurrency.code} serían</span>
                    <span>
                      {cupCurrency.symbol}
                      {saving.totalWithMarginCup.toFixed(2)}
                    </span>
                  </div>
                )}
                {isCupDisplay && saving.savingCup > 0 && usdCurrency && (
                  <SavingHint
                    className="mt-2"
                    currencyCode="USD"
                    currencySymbol={usdCurrency.symbol}
                    amount={usdTotal}
                    savingCup={saving.savingCup}
                    savingPct={saving.savingPct}
                  />
                )}
              </div>

              <div className="hidden border-t px-5 py-4 lg:block">
                <Button
                  asChild
                  size="lg"
                  className="min-h-[44px] w-full gap-2"
                >
                  <Link href="/checkout">
                    Proceder al pago <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>

                <Link
                  href="/#products"
                  className="mt-3 block text-center text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Seguir comprando
                </Link>

                <div className="mt-4 flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Shield className="h-3 w-3" /> Pago seguro
                  </span>
                  <span className="flex items-center gap-1">
                    <Truck className="h-3 w-3" /> Envío garantizado
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Barra inferior fija en móvil */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur lg:hidden">
        <div className="container mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="truncate text-lg font-bold text-primary">
              {formatCup(subtotal)}
            </p>
          </div>
          <Button asChild size="lg" className="min-h-[44px] shrink-0 gap-2">
            <Link href="/checkout">
              Proceder al pago <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}