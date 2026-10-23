"use client";

import Image from "next/image";
import Link from "next/link";
import { Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Product, useCartStore } from "@/lib/store";
import { useState } from "react";
import { useCurrency } from "@/lib/currency";
import { optimizedImageUrl } from "@/lib/image";
import { effectiveCupPrice } from "@/lib/price-margin";
import { useMarginConfig } from "@/lib/use-price-margin";

interface ProductCardProps {
  product: Product;
  /** Tarjeta estrecha para carruseles horizontales. */
  compact?: boolean;
}

export function ProductCard({ product, compact = false }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [added, setAdded] = useState(false);
  const { defaultCurrency, currencies, formatPrice, convertPrice } = useCurrency();
  const cupCurrency = currencies.find(c => c.code === 'CUP');
  const marginCfg = useMarginConfig(product);
  const marginedCup = effectiveCupPrice(product.price, marginCfg);

  const handleAddToCart = () => {
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const price = cupCurrency && defaultCurrency
    ? formatPrice(defaultCurrency.code === "CUP" ? marginedCup : convertPrice(product.price, cupCurrency, defaultCurrency), defaultCurrency)
    : formatPrice(marginedCup, defaultCurrency);

  return (
    <Card
      className={cn(
        "group overflow-hidden transition-all hover:shadow-lg",
        compact
          ? "w-36 shrink-0 snap-start gap-0 py-0 hover:shadow-md sm:w-40 lg:w-44"
          : undefined,
      )}
    >
      <Link href={`/product/${product.id}`}>
        <div className="relative aspect-square overflow-hidden">
          <Image
            src={optimizedImageUrl(product.image || '/placeholder.svg', compact ? 320 : 640)}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes={
              compact
                ? "(max-width: 640px) 144px, 176px"
                : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            }
          />
          {!product.inStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <Badge variant="secondary" className={compact ? "text-xs" : "text-sm"}>
                Agotado
              </Badge>
            </div>
          )}
          <Badge
            className={cn(
              "absolute bg-primary/90",
              compact
                ? "left-1.5 top-1.5 px-1.5 py-0 text-[10px] font-medium"
                : "left-3 top-3",
            )}
          >
            {product.category}
          </Badge>
        </div>
      </Link>
      <CardContent className={compact ? "flex flex-1 flex-col p-2.5" : "p-4"}>
        <Link href={`/product/${product.id}`}>
          <h3
            className={cn(
              "font-semibold text-foreground transition-colors hover:text-primary",
              compact && "line-clamp-2 text-xs leading-snug sm:text-[13px]",
            )}
          >
            {product.name}
          </h3>
        </Link>
        {!compact && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
        )}
        <div className={cn("flex items-center justify-between", compact ? "mt-auto pt-1.5" : "mt-3")}>
          <div className="min-w-0">
            <span className={cn("font-bold text-foreground", compact ? "text-sm" : "text-lg")}>
              {price}
            </span>
            <span
              className={cn(
                "ml-1 text-muted-foreground",
                compact && "hidden text-[10px] sm:inline",
                !compact && "text-sm",
              )}
            >
              {product.unit}
            </span>
          </div>
          <Button
            size="sm"
            onClick={handleAddToCart}
            disabled={!product.inStock || added}
            aria-label={`Añadir ${product.name} al carrito`}
            className={cn("gap-1", compact && "h-9 w-9 shrink-0 p-0")}
          >
            {added ? (
              <>
                <Check className="h-4 w-4" />
                {!compact && "Añadido"}
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                {!compact && "Añadir"}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
