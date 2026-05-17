"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Package, Truck, Home, ArrowRight } from "lucide-react";
import { Suspense } from "react";

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") || "UNKNOWN";

  const steps = [
    { icon: CheckCircle, label: "Order Confirmed", status: "complete" },
    { icon: Package, label: "Preparing", status: "current" },
    { icon: Truck, label: "On the Way", status: "pending" },
    { icon: Home, label: "Delivered", status: "pending" },
  ];

  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
        <CheckCircle className="h-12 w-12 text-primary" />
      </div>

      <h1 className="mb-2 font-[family-name:var(--font-playfair)] text-3xl font-bold text-foreground md:text-4xl">
        Order Confirmed!
      </h1>
      <p className="mb-2 text-lg text-muted-foreground">Thank you for shopping with La Fruta</p>
      <p className="mb-8 text-sm text-muted-foreground">
        Order ID: <span className="font-mono font-semibold text-foreground">{orderId}</span>
      </p>

      <Card className="mb-8 w-full max-w-2xl">
        <CardContent className="p-6">
          <h2 className="mb-6 text-lg font-semibold text-foreground">Order Progress</h2>
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
          <h2 className="mb-4 text-lg font-semibold text-foreground">What happens next?</h2>
          <ul className="space-y-3 text-left text-sm text-muted-foreground">
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                1
              </span>
              <span>
                You will receive an email confirmation with your order details shortly.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                2
              </span>
              <span>
                Our team will carefully select and pack your fresh produce from local farms.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                3
              </span>
              <span>
                Your order will be delivered to your specified location within the estimated
                time.
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4 sm:flex-row">
        <Link href="/">
          <Button size="lg">
            Continue Shopping
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
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
