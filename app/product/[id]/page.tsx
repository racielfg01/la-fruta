"use client";

import { use, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getProductById, products } from "@/lib/products";
import { useCartStore } from "@/lib/store";
import { ProductCard } from "@/components/product-card";
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

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const product = getProductById(id);
  const addItem = useCartStore((state) => state.addItem);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16 text-center">
          <h1 className="mb-4 text-2xl font-bold text-foreground">Product Not Found</h1>
          <p className="mb-6 text-muted-foreground">
            The product you are looking for does not exist.
          </p>
          <Link href="/">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </main>
      </div>
    );
  }

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem(product);
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const relatedProducts = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Link
          href="/#products"
          className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Products
        </Link>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="relative aspect-square overflow-hidden rounded-2xl">
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
            {!product.inStock && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                <Badge variant="secondary" className="text-lg">
                  Out of Stock
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
                ${product.price.toFixed(2)}
              </span>
              <span className="text-muted-foreground">{product.unit}</span>
            </div>

            <p className="mt-6 text-muted-foreground leading-relaxed">{product.description}</p>

            <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 text-primary" />
              <span>Origin: {product.origin}</span>
            </div>

            <Card className="mt-6">
              <CardContent className="grid gap-4 p-4 sm:grid-cols-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Truck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Fast Delivery</p>
                    <p className="text-xs text-muted-foreground">Same day available</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Leaf className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Farm Fresh</p>
                    <p className="text-xs text-muted-foreground">Quality guaranteed</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Check className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Satisfaction</p>
                    <p className="text-xs text-muted-foreground">100% guaranteed</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-foreground">Quantity:</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center text-lg font-medium">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button
                size="lg"
                className="flex-1 sm:flex-none"
                onClick={handleAddToCart}
                disabled={!product.inStock || added}
              >
                {added ? (
                  <>
                    <Check className="mr-2 h-5 w-5" />
                    Added to Cart
                  </>
                ) : (
                  <>
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Add to Cart - ${(product.price * quantity).toFixed(2)}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <section className="mt-16">
            <h2 className="mb-6 font-[family-name:var(--font-playfair)] text-2xl font-bold text-foreground">
              You May Also Like
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
