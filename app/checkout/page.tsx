"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCartStore, DeliveryLocation } from "@/lib/store";
import { useAuthStore } from "@/lib/auth-context";
import { ShoppingBag, ArrowRight, CreditCard, User, Mail, Phone, MapPin, Truck, Banknote, Shield, Loader2, Building2, FileText, BadgeCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getPublicCurrencies } from "@/app/actions/public-currencies";

const DeliveryMap = dynamic(
  () => import("@/components/delivery-map").then((mod) => mod.DeliveryMap),
  { ssr: false, loading: () => <div className="h-[300px] sm:h-[350px] md:h-[400px] animate-pulse rounded-lg bg-muted" /> }
);

// -------------------------------
// Configuración de métodos de pago
// -------------------------------
interface PaymentMethodConfig {
  id: string;
  name: string;
  description: string;
  icon: any;
  type: "cash" | "transfer";
  disabled?: boolean;
  currency?: string;
  bankDetails?: {
    bank: string;
    accountNumber: string;
    accountType?: string;
    owner: string;
    ci: string;
  };
}

const paymentMethodsConfig: PaymentMethodConfig[] = [
  {
    id: "cash",
    name: "Efectivo",
    description: "Paga al recibir tu pedido en la moneda que elijas",
    icon: Banknote,
    type: "cash",
  },
  {
    id: "transfer_cup",
    name: "Transferencia bancaria (CUP)",
    description: "Paga mediante transferencia en pesos cubanos",
    icon: Building2,
    type: "transfer",
    currency: "CUP",
    bankDetails: {
      bank: "Banco de Crédito y Comercio (BANDEC)",
      accountNumber: "1234567890",
      accountType: "Cuenta Corriente",
      owner: "La Fruta S.A.",
      ci: "123456789",
    },
  },
  {
    id: "transfer_visa",
    name: "Transferencia Visa",
    description: "Próximamente disponible",
    icon: CreditCard,
    type: "transfer",
    disabled: true,
  },
];

// -------------------------------
// Tipos
// -------------------------------
interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  exchangeRate: number;
  isDefault: boolean;
}

// -------------------------------
// Componente principal
// -------------------------------
export default function CheckoutPage() {
  const router = useRouter();
  const { items, deliveryLocation, getTotalPrice, clearCart } = useCartStore();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [locationConfirmed, setLocationConfirmed] = useState(!!deliveryLocation);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null);
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>(paymentMethodsConfig[0].id);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
  });

  // Cargar monedas
  useEffect(() => {
    const loadCurrencies = async () => {
      setIsLoadingCurrencies(true);
      const data = await getPublicCurrencies();
      setCurrencies(data);
      const defaultCurr = data.find(c => c.isDefault) || data[0];
      setSelectedCurrency(defaultCurr || null);
      setIsLoadingCurrencies(false);
    };
    loadCurrencies();
  }, []);

  // Verificar autenticación
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        sessionStorage.setItem("redirectAfterLogin", window.location.pathname);
        router.push("/auth/login");
      } else {
        setIsCheckingAuth(false);
      }
    }
  }, [isAuthenticated, authLoading, router]);

  // Cargar datos del usuario
  useEffect(() => {
    if (isAuthenticated && user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      }));
    }
  }, [isAuthenticated, user]);

  // Totales en moneda base (CUP)
  const subtotalBase = getTotalPrice();
  const deliveryFeeBase = deliveryLocation ? 4.99 : 0;
  const totalBase = subtotalBase + deliveryFeeBase;

  // Convertir a moneda seleccionada
  const convertAmount = (amountInCUP: number): number => {
    if (!selectedCurrency || selectedCurrency.isDefault) return amountInCUP;
    return amountInCUP * selectedCurrency.exchangeRate;
  };

  const subtotalConverted = convertAmount(subtotalBase);
  const deliveryFeeConverted = convertAmount(deliveryFeeBase);
  const totalConverted = convertAmount(totalBase);

  const handleLocationConfirm = (location: DeliveryLocation) => {
    setLocationConfirmed(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationConfirmed || !deliveryLocation) {
      alert("Por favor, confirma tu ubicación de entrega primero.");
      return;
    }
    if (!formData.name || !formData.phone) {
      alert("Por favor, completa tus datos de contacto.");
      return;
    }
    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const orderId = Math.random().toString(36).substring(2, 10).toUpperCase();
    clearCart();
    router.push(
      `/order-confirmation?orderId=${orderId}&paymentMethod=${selectedPaymentMethod}&currency=${selectedCurrency?.code}&amount=${totalConverted}`
    );
  };

  // Estados de carga
  if (authLoading || isLoadingCurrencies || isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Cargando...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <Header />
        <main className="container mx-auto px-4 py-12 md:py-16 lg:py-20">
          <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-muted to-muted/50 shadow-inner">
              <ShoppingBag className="h-12 w-12 text-muted-foreground" />
            </div>
            <h1 className="mb-3 text-2xl md:text-3xl font-bold text-foreground">Tu carrito está vacío</h1>
            <p className="mb-8 text-muted-foreground">Agrega algunos productos antes de finalizar la compra.</p>
            <Link href="/#products">
              <Button size="lg" className="gap-2">
                Explorar productos <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const selectedMethod = paymentMethodsConfig.find(m => m.id === selectedPaymentMethod);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Header />
      <main className="container mx-auto px-4 py-6 md:py-8 lg:py-10">
        <div className="mb-6 md:mb-8">
          <h1 className="font-playfair text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">Finalizar Compra</h1>
          <p className="text-muted-foreground mt-1">Completa los datos para recibir tus productos frescos</p>
        </div>

        <div className="flex flex-col gap-6 lg:gap-8">
          {/* Sección izquierda - Formularios */}
          <div className="space-y-6">
            {/* Mapa de entrega */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3 md:pb-4">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <MapPin className="h-5 w-5 text-primary" />
                  Ubicación de entrega
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DeliveryMap onLocationConfirm={handleLocationConfirm} />
                {!locationConfirmed && (
                  <p className="text-xs text-muted-foreground mt-3 text-center">
                    Selecciona tu ubicación en el mapa para continuar
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Datos de contacto */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3 md:pb-4">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <User className="h-5 w-5 text-primary" />
                  Información de contacto
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <p className="text-xs text-green-600">Datos automáticos de tu cuenta</p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Nombre completo *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Juan Pérez"
                          className="pl-10 h-11"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Teléfono *</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="tel"
                          placeholder="5 123 4567"
                          className="pl-10 h-11"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Correo electrónico</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="juan@ejemplo.com"
                        className="pl-10 h-11"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Método de pago y moneda */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3 md:pb-4">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Método de pago y moneda
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Selector de moneda */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Moneda de pago</Label>
                  <Select
                    value={selectedCurrency?.id}
                    onValueChange={(val) => setSelectedCurrency(currencies.find((c) => c.id === val) || null)}
                  >
                    <SelectTrigger className="w-full sm:w-64">
                      <SelectValue placeholder="Seleccionar moneda" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.symbol} {c.code} - {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Todos los precios se mostrarán en {selectedCurrency?.code}. El tipo de cambio aplicado es 1 CUP ={" "}
                    {selectedCurrency?.exchangeRate.toFixed(4)} {selectedCurrency?.code}.
                  </p>
                </div>

                {/* Métodos de pago (configurables) */}
<div className="space-y-3">
  <Label className="text-sm font-medium">Selecciona cómo deseas pagar</Label>
  <RadioGroup
    value={selectedPaymentMethod}
    onValueChange={setSelectedPaymentMethod}
    className="grid gap-3 sm:grid-cols-2"
  >
    {paymentMethodsConfig.map((method) => {
      const Icon = method.icon;
      const isSelected = selectedPaymentMethod === method.id;
      const isDisabled = method.disabled === true;
      return (
        <div
          key={method.id}
          className={`
            relative rounded-xl border-2 p-4 cursor-pointer transition-all
            ${isSelected ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card hover:border-primary/50"}
            ${isDisabled ? "opacity-60 cursor-not-allowed filter grayscale" : ""}
          `}
          onClick={() => !isDisabled && setSelectedPaymentMethod(method.id)}
        >
          <div className="flex items-start gap-3">
            <RadioGroupItem
              value={method.id}
              id={method.id}
              disabled={isDisabled}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Icon className="h-5 w-5 text-primary" />
                <span className="font-medium text-foreground">{method.name}</span>
                {isDisabled && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    Próximamente
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{method.description}</p>
            </div>
          </div>
        </div>
      );
    })}
  </RadioGroup>
</div>

                {/* Detalles adicionales según el método seleccionado */}
                {selectedMethod && !selectedMethod.disabled && (
                  <div className="mt-4 pt-4 border-t">
                    {selectedMethod.type === "cash" && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                          <Banknote className="h-4 w-4 text-primary" />
                          Pagarás en efectivo al recibir el pedido
                        </div>
                        <div className="rounded-lg bg-muted/50 p-3">
                          <p className="text-sm font-medium">Total a pagar en efectivo:</p>
                          <p className="text-2xl font-bold text-primary mt-1">
                            {selectedCurrency?.symbol} {totalConverted.toFixed(2)} {selectedCurrency?.code}
                          </p>
                          {!selectedCurrency?.isDefault && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Tipo de cambio: 1 CUP = {selectedCurrency?.exchangeRate.toFixed(4)} {selectedCurrency?.code}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {selectedMethod.type === "transfer" && selectedMethod.bankDetails && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                          <Building2 className="h-4 w-4 text-primary" />
                          Datos para la transferencia bancaria
                        </div>
                        <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                          <div className="grid gap-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Banco:</span>
                              <span className="font-medium">{selectedMethod.bankDetails.bank}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Número de cuenta:</span>
                              <span className="font-medium font-mono">{selectedMethod.bankDetails.accountNumber}</span>
                            </div>
                            {selectedMethod.bankDetails.accountType && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Tipo de cuenta:</span>
                                <span className="font-medium">{selectedMethod.bankDetails.accountType}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Titular:</span>
                              <span className="font-medium">{selectedMethod.bankDetails.owner}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">CI / RUC:</span>
                              <span className="font-medium font-mono">{selectedMethod.bankDetails.ci}</span>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground mt-2 pt-2 border-t flex items-center gap-1">
                            <BadgeCheck className="h-3 w-3 text-green-600" />
                            <span>Transfiere el monto exacto y coloca tu número de pedido como referencia.</span>
                          </div>
                          <div className="rounded-lg bg-primary/5 p-3 mt-2">
                            <p className="text-sm font-medium">Monto a transferir:</p>
                            <p className="text-xl font-bold text-primary">
                              {selectedCurrency?.symbol} {totalConverted.toFixed(2)} {selectedCurrency?.code}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Resumen del pedido - siempre al final */}
          <div>
            <Card className="border-0 shadow-sm">
              <CardHeader className="border-b bg-muted/30 px-4 py-3">
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                  Resumen del pedido ({selectedCurrency?.code})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 space-y-4">
                {/* Productos */}
                <div className="max-h-64 space-y-3 overflow-y-auto">
                  {items.map((item) => {
                    const priceConv = convertAmount(item.product.price);
                    const totalConv = priceConv * item.quantity;
                    return (
                      <div key={item.product.id} className="flex gap-3 pb-3 border-b last:border-0">
                        <div className="relative h-16 w-16 rounded-lg bg-muted overflow-hidden">
                          <Image
                            src={item.product.image}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-1">{item.product.name}</p>
                          <p className="text-xs text-muted-foreground">Cantidad: {item.quantity}</p>
                          <p className="text-sm font-semibold text-primary mt-1">
                            {selectedCurrency?.symbol}
                            {totalConv.toFixed(2)} {selectedCurrency?.code}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Totales */}
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>
                      {selectedCurrency?.symbol}
                      {subtotalConverted.toFixed(2)} {selectedCurrency?.code}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Truck className="h-3.5 w-3.5" /> Envío
                    </span>
                    <span>
                      {locationConfirmed
                        ? `${selectedCurrency?.symbol}${deliveryFeeConverted.toFixed(2)} ${selectedCurrency?.code}`
                        : "Por confirmar"}
                    </span>
                  </div>
                  {subtotalBase < 50 && (
                    <div className="rounded-lg bg-amber-50 p-2.5 text-xs text-amber-700">
                      🚚 Agrega {(50 - subtotalBase).toFixed(2)} CUP más para envío gratis
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-3">
                    <span className="font-semibold text-base">Total a pagar</span>
                    <span className="text-xl md:text-2xl font-bold text-primary">
                      {selectedCurrency?.symbol}
                      {totalConverted.toFixed(2)} {selectedCurrency?.code}
                    </span>
                  </div>
                  {!selectedCurrency?.isDefault && (
                    <p className="text-xs text-muted-foreground text-right">
                      Tipo de cambio: 1 CUP = {selectedCurrency?.exchangeRate.toFixed(4)} {selectedCurrency?.code}
                    </p>
                  )}
                </div>

                {/* Dirección de entrega */}
                {deliveryLocation && (
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> Entregar en:
                    </p>
                    <p className="mt-1 text-sm">{deliveryLocation.address}</p>
                  </div>
                )}

                {/* Método de pago seleccionado (resumen) */}
                <div className="rounded-lg bg-muted/50 p-3 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <CreditCard className="h-3 w-3" /> Método de pago:
                  </p>
                  <p className="text-sm font-medium">{selectedMethod?.name}</p>
                  <p className="text-xs text-muted-foreground">Moneda: {selectedCurrency?.code} ({selectedCurrency?.symbol})</p>
                </div>

                {/* Botón de confirmación */}
                <Button
                  className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white shadow-md"
                  size="lg"
                  onClick={handleSubmit}
                  disabled={!locationConfirmed || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Procesando...
                    </>
                  ) : (
                    <>
                      Confirmar pedido <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>

                {/* Sellos de confianza */}
                <div className="flex justify-center gap-4 pt-2 text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5" /> Pago seguro
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Truck className="h-3.5 w-3.5" /> Envío garantizado
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5" /> Protección al comprador
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