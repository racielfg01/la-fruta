"use client";

import { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useCartStore, availableStock } from "@/lib/store";
import { ProductCard } from "@/components/product-card";
import { Product } from "@/lib/store";
import { useCurrency } from "@/lib/currency";
import { displayProductCupPrice, effectiveMargin } from "@/lib/price-margin";
import { productSavingCup } from "@/lib/usd-saving";
import { useMarginConfig } from "@/lib/use-price-margin";
import SavingHint from "@/components/saving-hint";
import { ProductImage } from "@/components/product-image";
import {
  ArrowLeft,
  Minus,
  Plus,
  ShoppingCart,
  Check,
  MapPin,
  Truck,
  Leaf,
} from "lucide-react";

interface ProductDetailProps {
  product: Product;
  related: Product[];
}

/**
 * Cuerpo interactivo de la ficha. El producto y los relacionados llegan
 * resueltos del servidor; aquí solo viven cantidad, carrito y moneda.
 */
export function ProductDetail({ product, related }: ProductDetailProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const { defaultCurrency, currencies, formatPrice, convertPrice } = useCurrency();
  const cupCurrency = currencies.find((c) => c.code === "CUP");
  const usdCurrency = currencies.find((c) => c.code === "USD");
  const marginCfg = useMarginConfig(product);
  const shownCup = displayProductCupPrice(
    product.price,
    marginCfg,
    defaultCurrency?.code
  );
  const userLocation = useCartStore((state) => state.userLocation);

  // Stock efectivo en la ubicación del cliente (coherente con el filtrado de /).
  const stock = availableStock(userLocation, product);
  const inStock = product.inStock && stock > 0;

  const handleAddToCart = () => {
    if (!inStock || stock <= 0) return;
    for (let i = 0; i < Math.min(quantity, stock); i++) {
      addItem(product);
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pb-28 pt-8 sm:pb-8">
        <Link
          href="/#products"
          className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a productos
        </Link>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="relative aspect-square overflow-hidden rounded-2xl">
            <ProductImage
              image={product.image}
              alt={product.name}
              width={1000}
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
            {!inStock && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                <Badge variant="secondary" className="text-lg">
                  Agotado
                </Badge>
              </div>
            )}
            <Badge className="absolute left-4 top-4 bg-primary/90 text-sm">
              {product.category}
            </Badge>
          </div>

          <div className="flex flex-col">
            <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold text-foreground md:text-4xl">
              {product.name}
            </h1>

            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-foreground">
                {cupCurrency && defaultCurrency
                  ? formatPrice(convertPrice(shownCup, cupCurrency, defaultCurrency), defaultCurrency)
                  : formatPrice(shownCup, defaultCurrency)}
              </span>
              <span className="text-muted-foreground"> / {product.unit}</span>
            </div>

            {defaultCurrency?.code === "CUP" &&
              productSavingCup(product.price, effectiveMargin(marginCfg)) > 0 &&
              cupCurrency &&
              usdCurrency && (
                <SavingHint
                  className="mt-2"
                  currencyCode="USD"
                  currencySymbol={usdCurrency.symbol}
                  amount={convertPrice(product.price, cupCurrency, usdCurrency)}
                  savingCup={productSavingCup(product.price, effectiveMargin(marginCfg))}
                />
              )}

            <p className="mt-6 text-muted-foreground leading-relaxed">{product.description}</p>

            <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 text-primary" />
              <span>Origen: {product.origin}</span>
            </div>

            {inStock && (
              <div className="mt-4 flex items-center gap-2 text-sm">
                {stock <= 20 ? (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
                    Solo quedan {stock}
                  </span>
                ) : (
                  <span className="rounded-full bg-muted px-3 py-1 text-muted-foreground">
                    Disponible · {stock} en stock
                  </span>
                )}
              </div>
            )}

            <Card className="mt-6">
              <CardContent className="grid gap-4 p-4 sm:grid-cols-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Truck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Entrega rápida</p>
                    <p className="text-xs text-muted-foreground">Disponible el mismo día</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Leaf className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Fresco de la granja</p>
                    <p className="text-xs text-muted-foreground">Calidad garantizada</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Check className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Satisfacción</p>
                    <p className="text-xs text-muted-foreground">100% garantizado</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex items-center justify-between gap-3 sm:justify-start">
                <span className="text-sm font-medium text-foreground">Cantidad:</span>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    aria-label="Disminuir cantidad"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-10 text-center text-base font-medium">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => setQuantity(Math.min(stock, quantity + 1))}
                    disabled={quantity >= stock}
                    aria-label="Aumentar cantidad"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button
                size="lg"
                className="hidden h-11 w-full gap-2 sm:flex sm:w-auto sm:flex-none"
                onClick={handleAddToCart}
                disabled={!inStock || quantity > stock || added}
              >
                {added ? (
                  <>
                    <Check className="h-5 w-5" />
                    Añadido al carrito
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-5 w-5" />
                    Añadir al carrito · {cupCurrency && defaultCurrency
                      ? formatPrice(convertPrice(shownCup * quantity, cupCurrency, defaultCurrency), defaultCurrency)
                      : formatPrice(shownCup * quantity, defaultCurrency)}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="mb-4 font-[family-name:var(--font-playfair)] text-2xl font-bold text-foreground">
              También te puede interesar
            </h2>
            <div
              className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto overscroll-x-contain px-4 pb-2 [scrollbar-width:none] sm:gap-4 [&::-webkit-scrollbar]:hidden"
              role="region"
              aria-label="Productos relacionados"
              tabIndex={0}
            >
              {related.map((p) => (
                <ProductCard key={p.id} product={p} compact />
              ))}
            </div>
          </section>
        )}
      </main>

      {inStock && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:hidden">
          <div className="mx-auto flex max-w-lg items-center gap-3 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="truncate text-base font-bold text-foreground">
                {cupCurrency && defaultCurrency
                  ? formatPrice(convertPrice(shownCup * quantity, cupCurrency, defaultCurrency), defaultCurrency)
                  : formatPrice(shownCup * quantity, defaultCurrency)}
              </p>
            </div>
            <Button
              size="lg"
              className="h-11 shrink-0 gap-2"
              onClick={handleAddToCart}
              disabled={quantity > stock || added}
            >
              {added ? (
                <>
                  <Check className="h-5 w-5" />
                  Añadido
                </>
              ) : (
                <>
                  <ShoppingCart className="h-5 w-5" />
                  Añadir al carrito
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
