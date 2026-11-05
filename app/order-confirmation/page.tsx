"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Package, Truck, Home, ArrowRight } from "lucide-react";
import { Suspense } from "react";
import { useCurrency } from "@/lib/currency";

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") || "DESCONOCIDO";
  const currencyCode = searchParams.get("currency") || "";
  const amount = Number(searchParams.get("amount")) || 0;
  const paymentMethod = searchParams.get("paymentMethod") || "";
  const { currencies, formatPrice } = useCurrency();
  const currency = currencies.find((c) => c.code === currencyCode) ?? null;
  const totalLabel =
    paymentMethod === "transfer"
      ? "Total transferido"
      : paymentMethod === "cash"
        ? "Total en efectivo"
        : "Total";

  const steps = [
    { icon: CheckCircle, label: "Pedido Confirmado", status: "complete" },
    { icon: Package, label: "Preparando", status: "current" },
    { icon: Truck, label: "En camino", status: "pending" },
    { icon: Home, label: "Entregado", status: "pending" },
  ];

  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
        <CheckCircle className="h-12 w-12 text-primary" />
      </div>

      <h1 className="mb-2 font-[family-name:var(--font-playfair)] text-3xl font-bold text-foreground md:text-4xl">
        ¡Pedido creado!
      </h1>
      <p className="mb-2 text-lg text-muted-foreground">
        Gracias por comprar en MercaToma
      </p>
      <p className="mb-6 max-w-md text-sm text-muted-foreground">
        Tu pedido quedó registrado. Puedes seguirlo en tu historial de órdenes.
      </p>

      <div className="mb-7 flex w-full max-w-md flex-col items-center gap-2 rounded-lg border bg-muted/30 px-4 py-3 text-sm">
        <p className="min-w-0 text-muted-foreground">
          Pedido{" "}
          <span className="break-all font-mono font-semibold text-foreground">
            {orderId}
          </span>
        </p>
        {currencyCode && amount > 0 && (
          <p className="text-base font-bold text-primary">
            {totalLabel}:{" "}
            {currency ? formatPrice(amount, currency) : `${amount} ${currencyCode}`}
          </p>
        )}
      </div>

      <div className="mb-10 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
        <Button asChild size="lg" className="w-full sm:w-auto">
          <Link href="/perfil">
            Ver mis pedidos
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
          <Link href="/">Seguir comprando</Link>
        </Button>
      </div>

      {paymentMethod === "transfer" && (
        <div className="mb-8 w-full max-w-md rounded-lg bg-muted/50 p-4 text-center text-sm text-muted-foreground">
          Recibimos tu comprobante de transferencia. Tu pedido será confirmado
          en cuanto validemos el pago.
        </div>
      )}

      <Card className="mb-8 w-full max-w-2xl">
        <CardContent className="p-6">
          <h2 className="mb-6 text-lg font-semibold text-foreground">
            Progreso del pedido
          </h2>
          <div className="relative">
            <div className="absolute left-0 top-5 h-0.5 w-full bg-border" />
            <div className="absolute left-0 top-5 h-0.5 w-1/4 bg-primary transition-all duration-500" />
            <div className="relative flex justify-between">
              {steps.map((step, index) => (
                <div key={step.label} className="flex flex-col items-center">
                  <div
                    className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                      step.status === "complete"
                        ? "border-primary bg-primary text-primary-foreground"
                        : step.status === "current"
                          ? "border-primary bg-background text-primary"
                          : "border-border bg-background text-muted-foreground"
                    }`}
                  >
                    <step.icon className="h-5 w-5" />
                  </div>
                  <span
                    className={`mt-2 text-xs font-medium ${
                      step.status === "pending" ? "text-muted-foreground" : "text-foreground"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8 w-full max-w-2xl">
        <CardContent className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            ¿Qué sucede a continuación?
          </h2>
          <ul className="space-y-3 text-left text-sm text-muted-foreground">
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                1
              </span>
              <span>
                Tu pedido ya está registrado; puedes seguirlo desde tu perfil.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                2
              </span>
              <span>
                Nuestro equipo seleccionará y empaquetará cuidadosamente tus productos frescos
                de granjas locales.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                3
              </span>
              <span>
                Tu pedido será entregado en la ubicación especificada dentro del tiempo estimado.
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-16">
        <Suspense
          fallback={
            <div className="flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          }
        >
          <OrderConfirmationContent />
        </Suspense>
      </main>
    </div>
  );
}