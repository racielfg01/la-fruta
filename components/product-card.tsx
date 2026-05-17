"use client";

import Image from "next/image";
import Link from "next/link";
import { Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Product, useCartStore } from "@/lib/store";
import { useState } from "react";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [added, setAdded] = useState(false);

  const handleAddToCart = () => {
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-lg">
      <Link href={`/product/${product.id}`}>
        <div className="relative aspect-square overflow-hidden">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
          {!product.inStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <Badge variant="secondary" className="text-sm">
                Out of Stock
              </Badge>
            </div>
          )}
          <Badge className="absolute left-3 top-3 bg-primary/90">{product.category}</Badge>
        </div>
      </Link>
      <CardContent className="p-4">
        <Link href={`/product/${product.id}`}>
          <h3 className="font-semibold text-foreground transition-colors hover:text-primary">
            {product.name}
          </h3>
        </Link>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
        <div className="mt-3 flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-foreground">${product.price.toFixed(2)}</span>
            <span className="ml-1 text-sm text-muted-foreground">{product.unit}</span>
          </div>
          <Button
            size="sm"
            onClick={handleAddToCart}
            disabled={!product.inStock || added}
            className="gap-1"
          >
            {added ? (
              <>
                <Check className="h-4 w-4" />
                Added
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Add
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
