
"use client";

import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCartStore } from "@/lib/store";
import { useCurrency } from "@/lib/currency";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Truck, Shield } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function CartPage() {
  const { items, updateQuantity, removeItem, getTotalPrice } = useCartStore();
  const { currencies, defaultCurrency, formatPrice, convertPrice } = useCurrency();
  const cupCurrency = currencies.find(c => c.code === 'CUP');

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <Header />
        <main className="container mx-auto px-4 py-12 md:py-16 lg:py-20">
          <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto">
            <div className="mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-muted to-muted/50 shadow-inner">
              <ShoppingBag className="h-14 w-14 text-muted-foreground" />
            </div>
            <h1 className="mb-3 text-2xl md:text-3xl font-bold text-foreground">
              Tu carrito está vacío
            </h1>
            <p className="mb-8 text-muted-foreground text-sm md:text-base">
              Parece que aún no has agregado ningún producto. 
              ¡Explora nuestra selección de frutas frescas!
            </p>
            <Link href="/#products" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto gap-2">
                Explorar productos
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const totalWithDelivery = getTotalPrice();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Header />
      
      <main className="container mx-auto px-4 py-6 md:py-8 lg:py-10">
        {/* Header con contador móvil */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 md:mb-8">
          <h1 className="font-[family-name:var(--font-playfair)] text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">
            Mi Carrito
            <span className="ml-2 text-base md:text-lg font-normal text-muted-foreground">
              ({items.length} {items.length === 1 ? 'producto' : 'productos'})
            </span>
          </h1>
          
          {/* Badge de envío gratis - visible en móvil */}
          {getTotalPrice() < 50 && (
            <div className="flex items-center justify-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-xs md:text-sm text-amber-700 w-full sm:w-auto">
              <Truck className="h-3.5 w-3.5" />
              <span>Faltan {formatPrice(50 - getTotalPrice(), defaultCurrency)} para envío gratis</span>
            </div>
          )}
        </div>

        {/* Layout de una sola columna - Resumen siempre abajo */}
        <div className="flex flex-col gap-6 lg:gap-8">
          {/* Productos - Siempre arriba */}
          <div>
            <Card className="border-0 shadow-sm lg:shadow-md">
              <CardHeader className="border-b  px-4 py-3 md:px-6 md:py-4">
                <CardTitle className="text-base md:text-lg font-semibold">
                  Productos
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-border p-0">
                {items.map((item) => (
                  <div 
                    key={item.product.id} 
                    className="flex gap-3 md:gap-4 p-4 md:p-6 hover:bg-muted/20 transition-colors"
                  >
                    {/* Imagen del producto - responsive */}
                    <div className="relative h-20 w-20 md:h-24 md:w-24 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                      <Image
                        src={item.product.image}
                        alt={item.product.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 80px, 96px"
                      />
                    </div>
                    
                    {/* Detalles del producto */}
                    <div className="flex flex-1 flex-col justify-between gap-2">
                      <div>
                        <Link
                          href={`/product/${item.product.id}`}
                          className="font-semibold text-sm md:text-base text-foreground hover:text-primary transition-colors line-clamp-2"
                        >
                          {item.product.name}
                        </Link>
                        <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                          {item.product.origin}
                        </p>
                        <p className="text-sm md:text-base font-medium text-primary mt-1">
                          {formatPrice(item.product.price, defaultCurrency)} <span className="text-xs text-muted-foreground">/ {item.product.unit}</span>
                        </p>
                      </div>
                      
                      {/* Controles de cantidad y precio */}
                      <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 md:h-9 md:w-9 rounded-full"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            aria-label="Disminuir cantidad"
                          >
                            <Minus className="h-3 w-3 md:h-3.5 md:w-3.5" />
                          </Button>
                          <span className="w-8 text-center font-medium text-sm md:text-base">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 md:h-9 md:w-9 rounded-full"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            aria-label="Aumentar cantidad"
                          >
                            <Plus className="h-3 w-3 md:h-3.5 md:w-3.5" />
                          </Button>
                        </div>
                        
                        <div className="flex items-center justify-between w-full xs:w-auto gap-4">
                          <span className="font-bold text-base md:text-lg text-foreground">
                            {formatPrice(item.product.price * item.quantity, defaultCurrency)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 md:h-9 md:w-9 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => removeItem(item.product.id)}
                            aria-label="Eliminar producto"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Resumen del pedido - Siempre abajo (sin sticky) */}
          <div>
            <Card className="border-0 shadow-sm lg:shadow-md">
              <CardHeader className="border-b  px-4 py-3 md:px-6 md:py-4">
                <CardTitle className="text-base md:text-lg font-semibold">
                  Resumen del pedido
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 space-y-4">
                {/* Detalles de precios */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm md:text-base">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">{formatPrice(getTotalPrice(), defaultCurrency)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm md:text-base">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Truck className="h-3.5 w-3.5" />
                      Envío
                    </span>
                    <span className="text-muted-foreground text-xs italic">
                      Se calculará según la zona
                    </span>
                  </div>
                </div>

                {/* Total */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="font-semibold text-base md:text-lg">Total</span>
                    <span className="font-bold text-xl md:text-2xl text-primary">
                      {formatPrice(totalWithDelivery, defaultCurrency)}
                    </span>
                  </div>
                  {cupCurrency && cupCurrency.id !== defaultCurrency?.id && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total en CUP</span>
                      <span className="font-medium">{formatPrice(totalWithDelivery, cupCurrency)}</span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground text-right">
                    Incluye impuestos y tarifas
                  </p>
                </div>

                {/* Botones de acción */}
                <div className="space-y-3 pt-2">
                  <Link href="/checkout" className="block">
                    <Button className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white shadow-md" size="lg">
                      Proceder al pago
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  
                  <Link href="/#products" className="block">
                    <Button variant="outline" className="w-full gap-2" size="default">
                      Seguir comprando
                    </Button>
                  </Link>
                </div>

                {/* Sellos de confianza */}
                <div className="flex justify-center gap-4 pt-4 border-t">
                  <div className="flex items-center gap-1.5 text-[11px] md:text-xs text-muted-foreground">
                    <Shield className="h-3.5 w-3.5" />
                    <span>Pago seguro</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] md:text-xs text-muted-foreground">
                    <Truck className="h-3.5 w-3.5" />
                    <span>Envío garantizado</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}