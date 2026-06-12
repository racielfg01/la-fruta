"use client";

import { use, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getProductById, products } from "@/lib/products";
import { useCartStore } from "@/lib/store";
import { ProductCard } from "@/components/product-card";
import { getPublicProductById } from "@/app/actions/public-products";
import { Product } from "@/lib/store";
import { useCurrency } from "@/lib/currency";
import {
  ArrowLeft,
  Minus,
  Plus,
  ShoppingCart,
  Check,
  MapPin,
  Truck,
  Leaf,
  Loader2,
} from "lucide-react";

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [product, setProduct] = useState<Product | undefined>(getProductById(id));
  const [loading, setLoading] = useState(!product);
  const addItem = useCartStore((state) => state.addItem);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const { defaultCurrency, currencies, formatPrice, convertPrice } = useCurrency();
  const cupCurrency = currencies.find(c => c.code === 'CUP');

  useEffect(() => {
    if (!product) {
      getPublicProductById(id).then((p) => {
        if (p) setProduct(p);
        setLoading(false);
      });
    }
  }, [id, product]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16 text-center">
          <h1 className="mb-4 text-2xl font-bold text-foreground">Producto no encontrado</h1>
          <p className="mb-6 text-muted-foreground">
            El producto que buscas no existe.
          </p>
          <Link href="/">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al inicio
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
          Volver a productos
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
                  ? formatPrice(convertPrice(product.price, cupCurrency, defaultCurrency), defaultCurrency)
                  : formatPrice(product.price, defaultCurrency)}
              </span>
              <span className="text-muted-foreground"> / {product.unit}</span>
            </div>

            <p className="mt-6 text-muted-foreground leading-relaxed">{product.description}</p>

            <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 text-primary" />
              <span>Origen: {product.origin}</span>
            </div>

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
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-foreground">Cantidad:</span>
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
                    Añadido al carrito
                  </>
                ) : (
                  <>
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Añadir al carrito - {cupCurrency && defaultCurrency
                      ? formatPrice(convertPrice(product.price * quantity, cupCurrency, defaultCurrency), defaultCurrency)
                      : formatPrice(product.price * quantity, defaultCurrency)}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <section className="mt-16">
            <h2 className="mb-6 font-[family-name:var(--font-playfair)] text-2xl font-bold text-foreground">
              También te puede interesar
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
