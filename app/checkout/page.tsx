"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCartStore, DeliveryLocation } from "@/lib/store";
import { ShoppingBag, ArrowRight, CreditCard, User, Mail, Phone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const DeliveryMap = dynamic(
  () => import("@/components/delivery-map").then((mod) => mod.DeliveryMap),
  { ssr: false, loading: () => <div className="h-[400px] animate-pulse rounded-lg bg-muted" /> }
);

export default function CheckoutPage() {
  const router = useRouter();
  const { items, deliveryLocation, getTotalPrice, clearCart } = useCartStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [locationConfirmed, setLocationConfirmed] = useState(!!deliveryLocation);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
  });

  const deliveryFee = deliveryLocation ? 4.99 : 0;
  const total = getTotalPrice() + deliveryFee;

  const handleLocationConfirm = (location: DeliveryLocation) => {
    setLocationConfirmed(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationConfirmed || !deliveryLocation) {
      alert("Please confirm your delivery location first.");
      return;
    }
    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const orderId = Math.random().toString(36).substring(2, 10).toUpperCase();
    clearCart();
    router.push(`/order-confirmation?orderId=${orderId}`);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-muted">
              <ShoppingBag className="h-12 w-12 text-muted-foreground" />
            </div>
            <h1 className="mb-2 text-2xl font-bold text-foreground">Your cart is empty</h1>
            <p className="mb-6 text-muted-foreground">Add some products before checking out.</p>
            <Link href="/#products">
              <Button size="lg">
                Browse Products
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="mb-8 font-[family-name:var(--font-playfair)] text-3xl font-bold text-foreground">
          Checkout
        </h1>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <DeliveryMap onLocationConfirm={handleLocationConfirm} />

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="name"
                          placeholder="John Doe"
                          className="pl-10"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="(555) 123-4567"
                          className="pl-10"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        className="pl-10"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <Input
                      id="cardNumber"
                      placeholder="4242 4242 4242 4242"
                      value={formData.cardNumber}
                      onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="expiry">Expiry Date</Label>
                      <Input
                        id="expiry"
                        placeholder="MM/YY"
                        value={formData.expiry}
                        onChange={(e) => setFormData({ ...formData, expiry: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cvv">CVV</Label>
                      <Input
                        id="cvv"
                        placeholder="123"
                        value={formData.cvv}
                        onChange={(e) => setFormData({ ...formData, cvv: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="max-h-64 space-y-3 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.product.id} className="flex gap-3">
                      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md">
                        <Image
                          src={item.product.image}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                        <p className="text-sm font-medium text-foreground">
                          ${(item.product.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 border-t pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">${getTotalPrice().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Delivery</span>
                    <span className="font-medium">
                      {locationConfirmed ? `$${deliveryFee.toFixed(2)}` : "Set location"}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold">Total</span>
                    <span className="text-lg font-bold">${total.toFixed(2)}</span>
                  </div>
                </div>

                {deliveryLocation && (
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-xs font-medium text-muted-foreground">Delivering to:</p>
                    <p className="mt-1 text-sm text-foreground line-clamp-2">
                      {deliveryLocation.address}
                    </p>
                  </div>
                )}

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleSubmit}
                  disabled={!locationConfirmed || isProcessing}
                >
                  {isProcessing ? (
                    "Processing..."
                  ) : (
                    <>
                      Place Order
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
