"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { useCurrency } from "@/lib/currency";
import { useCurrencyStore } from "@/lib/currency-store";
import { optimizedImageUrl } from "@/lib/image";
import { effectiveCupPrice, displayProductCupPrice } from "@/lib/price-margin";
import { useMarginConfig } from "@/lib/use-price-margin";

export default function FavoritosPage() {
  const favorites = useCartStore((state) => state.favorites);
  const toggleFavorite = useCartStore((state) => state.toggleFavorite);
  const removeFavorite = useCartStore((state) => state.removeFavorite);
  const addItem = useCartStore((state) => state.addItem);
  const items = useCartStore((state) => state.items);
  const [mounted, setMounted] = useState(false);
  const { defaultCurrency, currencies, formatPrice, convertPrice } = useCurrency();
  const cupCurrency = currencies.find((c) => c.code === "CUP");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <h1 className="mb-6 text-2xl font-bold">Mis favoritos</h1>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <div className="aspect-[4/3] bg-muted" />
                  <CardContent className="p-4">
                    <div className="mb-2 h-4 w-3/4 rounded bg-muted" />
                    <div className="h-4 w-1/2 rounded bg-muted" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </>
    );
  }

  const isInCart = (productId: string) =>
    items.some((item) => item.product.id === productId);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background pb-24 md:pb-8">
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Mis favoritos</h1>
            <p className="text-sm text-muted-foreground">
              {favorites.length} {favorites.length === 1 ? "producto" : "productos"}
            </p>
          </div>

          {favorites.length === 0 ? (
            <Card className="mx-auto max-w-md text-center">
              <CardContent className="flex flex-col items-center py-12">
                <Heart className="mb-4 h-12 w-12 text-muted-foreground" />
                <h2 className="mb-2 text-lg font-semibold">No tienes favoritos</h2>
                <p className="mb-6 text-sm text-muted-foreground">
                  Guarda los productos que te gusten para encontrarlos aquí
                </p>
                <Button asChild>
                  <Link href="/">Ver productos</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {favorites.map((product) => {
                const marginCfg = useMarginConfig(product);
                const price = cupCurrency && defaultCurrency
                  ? defaultCurrency.code === "CUP"
                    ? effectiveCupPrice(product.price, marginCfg)
                    : convertPrice(product.price, cupCurrency, defaultCurrency)
                  : displayProductCupPrice(product.price, marginCfg, defaultCurrency?.code);

                return (
                  <Card key={product.id} className="group overflow-hidden">
                    <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                      <Link href={`/product/${product.id}`}>
                        <Image
                          src={optimizedImageUrl(product.image || "/placeholder.svg", 640)}
                          alt={product.name}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      </Link>
                      {!product.inStock && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                          <span className="rounded-full bg-destructive px-3 py-1 text-sm text-destructive-foreground">
                            Agotado
                          </span>
                        </div>
                      )}
                      <Button
                        size="icon"
                        variant="secondary"
                        className="absolute right-2 top-2 h-8 w-8 rounded-full"
                        onClick={() => removeFavorite(product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardContent className="p-4">
                      <Link href={`/product/${product.id}`}>
                        <h3 className="mb-1 line-clamp-1 font-semibold hover:text-primary">
                          {product.name}
                        </h3>
                      </Link>
                      <p className="mb-3 text-lg font-bold">
                        {formatPrice(price, defaultCurrency)} / {product.unit}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          disabled={!product.inStock || isInCart(product.id)}
                          onClick={() => addItem(product)}
                        >
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          {isInCart(product.id) ? "En carrito" : product.inStock ? "Agregar" : "Agotado"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleFavorite(product)}
                        >
                          <Heart className="h-4 w-4 fill-current" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
