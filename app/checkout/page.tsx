"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCartStore, DeliveryLocation } from "@/lib/store";
import { useAuthStore } from "@/lib/auth-context";
import { useAdminStore } from "@/lib/admin-store";
import {
  ShoppingBag,
  ArrowRight,
  CreditCard,
  User,
  Mail,
  Phone,
  MapPin,
  Truck,
  Banknote,
  Shield,
  Loader2,
  Building2,
  BadgeCheck,
  AlertCircle,
} from "lucide-react";
import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { getPublicCurrencies } from "@/app/actions/public-currencies";
import { createOrderAction } from "@/app/actions/orders";

// -------------------------------
// Configuración de métodos de pago (igual)
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
    disabled: true,
    bankDetails: {
      bank: "Banco de Crédito y Comercio (BANDEC)",
      accountNumber: "1234567890",
      accountType: "Cuenta Corriente",
      owner: "MercaToma S.A.",
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

interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  exchangeRate: number;
  isDefault: boolean;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotalPrice, clearCart, setDeliveryLocation } =
    useCartStore();
  const {
    user,
    isAuthenticated,
    isLoading: authLoading,
    token,
  } = useAuthStore();
  const {
    deliveryZones,
    loaded: zonesLoaded,
    loading: zonesLoading,
    initialize: loadAdminData,
  } = useAdminStore();

  const [isProcessing, setIsProcessing] = useState(false);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(
    null,
  );
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const defaultCurrency = useMemo(
    () => currencies.find((c) => c.isDefault) || currencies[0] || null,
    [currencies],
  );
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>(
    paymentMethodsConfig[0].id,
  );

  // Estados para envío
  const [selectedZoneId, setSelectedZoneId] = useState<string>("");
  const [address, setAddress] = useState("");

  // Datos de contacto
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  // Cargar monedas
  useEffect(() => {
    const loadCurrencies = async () => {
      setIsLoadingCurrencies(true);
      const data = await getPublicCurrencies();
      setCurrencies(data);
      const defaultCurr = data.find((c) => c.isDefault) || data[0];
      setSelectedCurrency(defaultCurr || null);
      setIsLoadingCurrencies(false);
    };
    loadCurrencies();
  }, []);

  // Inicializar datos de admin (zonas) SÓLO si no están cargados y hay token
  useEffect(() => {
    if (token && !zonesLoaded && !zonesLoading) {
      loadAdminData().catch(console.error);
    }
  }, [token, zonesLoaded, zonesLoading, loadAdminData]);

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
      setFormData((prev) => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      }));
    }
  }, [isAuthenticated, user]);

  const activeZones = deliveryZones.filter((zone) => zone.active);
  const selectedZone = activeZones.find((zone) => zone.id === selectedZoneId);

  // Totales
  const subtotalBase = getTotalPrice();
  const deliveryFeeBase = selectedZone ? selectedZone.price : 0;
  const totalBase = subtotalBase + deliveryFeeBase;

  const cupCurrency = useMemo(
    () => currencies.find((c) => c.code === 'CUP') || null,
    [currencies],
  );

  const convertAmount = (amountInCUP: number): number => {
    if (!selectedCurrency || !cupCurrency) return amountInCUP;
    return Math.round((amountInCUP / cupCurrency.exchangeRate) * selectedCurrency.exchangeRate * 100) / 100;
  };

  const subtotalConverted = convertAmount(subtotalBase);
  const deliveryFeeConverted = convertAmount(deliveryFeeBase);
  const totalConverted = convertAmount(totalBase);

  const canCheckout = !!selectedZone && address.trim().length > 0;

  // Actualizar ubicación en el store global
  useEffect(() => {
    if (selectedZone && address) {
      const deliveryLocation: DeliveryLocation = {
        address,
        city: "",
        lat: 0,
        lng: 0,
      };
      setDeliveryLocation(deliveryLocation);
    }
  }, [selectedZone, address, setDeliveryLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCheckout) {
      alert("Selecciona una zona de envío y completa tu dirección.");
      return;
    }
    if (!formData.name || !formData.phone) {
      alert("Completa tus datos de contacto.");
      return;
    }
    if (!selectedCurrency) {
      alert("Selecciona una moneda.");
      return;
    }

    setIsProcessing(true);
    try {
      const orderItems = items.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
      }));

      const deliveryAddress = address;

      const orderData = {
        userId: user!.id,
        userName: formData.name,
        userEmail: formData.email,
        items: orderItems,
        subtotal: subtotalBase,
        deliveryFee: deliveryFeeBase,
        total: totalBase,
        paymentMethod: selectedPaymentMethod,
        deliveryAddress,
        deliveryNotes: "",
        currencyCode: selectedCurrency.code,
        zoneId: selectedZone.id,
      };

      const result = await createOrderAction(orderData, token!);
      if (result.success) {
        clearCart();
        router.push(
          `/order-confirmation?orderId=${result.orderId}&paymentMethod=${selectedPaymentMethod}&currency=${selectedCurrency.code}&amount=${totalConverted}`,
        );
      } else {
        alert(result.error || "Error al crear la orden.");
        setIsProcessing(false);
      }
    } catch (error) {
      console.error(error);
      alert("Ocurrió un error al procesar tu orden.");
      setIsProcessing(false);
    }
  };
  console.log("deliveryZones", deliveryZones);

  // Estados de carga combinados
  const isLoading =
    authLoading || isLoadingCurrencies || isCheckingAuth || zonesLoading;
  if (isLoading) {
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
        <main className="container mx-auto px-4 py-12">
          <div className="flex flex-col items-center text-center max-w-md mx-auto">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-muted">
              <ShoppingBag className="h-12 w-12 text-muted-foreground" />
            </div>
            <h1 className="mb-3 text-2xl font-bold">Tu carrito está vacío</h1>
            <p className="mb-8 text-muted-foreground">
              Agrega productos antes de finalizar la compra.
            </p>
            <Link href="/#products">
              <Button size="lg">
                Explorar productos <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Si no hay zonas activas después de cargar
  if (activeZones.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <Card className="max-w-md mx-auto text-center">
            <CardContent className="pt-6">
              <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                No hay zonas de envío disponibles
              </h2>
              <p className="text-muted-foreground mb-4">
                En este momento no tenemos cobertura de entrega. Por favor,
                contacta con atención al cliente.
              </p>
              <Button asChild variant="outline">
                <Link href="/">Volver a la tienda</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const selectedMethod = paymentMethodsConfig.find(
    (m) => m.id === selectedPaymentMethod,
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Header />
      <main className="container mx-auto px-4 py-6 md:py-8 lg:py-10">
        <div className="mb-6 md:mb-8">
          <h1 className="font-playfair text-2xl md:text-3xl lg:text-4xl font-bold">
            Finalizar Compra
          </h1>
          <p className="text-muted-foreground mt-1">
            Completa los datos para recibir tus productos frescos
          </p>
        </div>

        <div className="flex flex-col gap-6 lg:gap-8">
          {/* Sección izquierda - Formularios */}
          <div className="space-y-6">
            {/* Zona y dirección */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-primary" />
                  Zona y dirección de entrega
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                  <div className="rounded-lg bg-muted p-2.5 text-xs text-muted-foreground">
                      <Truck className="h-3.5 w-3.5 inline-block mr-1.5" />
                      Estamos incorporando nuevas zonas constantemente
                    </div>
                <div className="space-y-2">
                  <Label htmlFor="deliveryZone">Zona de envío *</Label>
                  <Select
                    value={selectedZoneId}
                    onValueChange={setSelectedZoneId}
                  >
                    <SelectTrigger id="deliveryZone" className="h-11">
                      <SelectValue placeholder="Selecciona una zona" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeZones.map((zone) => (
                        <SelectItem key={zone.id} value={zone.id}>
                          {zone.name} - {zone.minDistance}-{zone.maxDistance} km
                          / ${zone.price.toFixed(2)} {cupCurrency?.code || "CUP"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedZone && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Tiempo estimado: {selectedZone.estimatedTime}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Dirección *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="address"
                      placeholder="Calle, número, entre calles, reparto"
                      className="pl-10 h-11"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Datos de contacto (sin cambios) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Información de contacto
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <p className="text-xs text-green-600">
                    Datos automáticos de tu cuenta
                  </p>
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
                          className="pl-10 h-11"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Teléfono *</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="tel"
                          className="pl-10 h-11"
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
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
                        className="pl-10 h-11"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Método de pago y moneda (respetando el original, sin cambios) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Método de pago y moneda
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Moneda de pago</Label>
                  <Select
                    value={selectedCurrency?.id}
                    onValueChange={(val) =>
                      setSelectedCurrency(
                        currencies.find((c) => c.id === val) || null,
                      )
                    }
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
                    Tipo de cambio: 1{" "}
                    {cupCurrency?.code || "CUP"} ={" "}
                    {selectedCurrency?.exchangeRate.toFixed(4)}{" "}
                    {selectedCurrency?.code}
                  </p>
                </div>

                <div className="space-y-3">
                  <Label>Selecciona cómo deseas pagar</Label>
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
                          className={`relative rounded-xl border-2 p-4 cursor-pointer transition-all ${isSelected ? "border-primary bg-primary/5 shadow-sm" : "border-border"} ${isDisabled ? "opacity-60 cursor-not-allowed" : ""}`}
                          onClick={() =>
                            !isDisabled && setSelectedPaymentMethod(method.id)
                          }
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
                                <span className="font-medium">
                                  {method.name}
                                </span>
                                {isDisabled && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
                                    Próximamente
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {method.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </RadioGroup>
                </div>

                {selectedMethod && !selectedMethod.disabled && (
                  <div className="mt-4 pt-4 border-t">
                    {selectedMethod.type === "cash" && (
                      <div className="rounded-lg bg-muted/50 p-3">
                        <p className="text-sm font-medium">
                          Total a pagar en efectivo:
                        </p>
                        <p className="text-2xl font-bold text-primary mt-1">
                          {selectedCurrency?.symbol} {totalConverted.toFixed(2)}{" "}
                          {selectedCurrency?.code}
                        </p>
                      </div>
                    )}
                    {selectedMethod.type === "transfer" &&
                      selectedMethod.bankDetails && (
                        <div className="space-y-3">
                          <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                            <div className="grid gap-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                  Banco:
                                </span>
                                <span className="font-medium">
                                  {selectedMethod.bankDetails.bank}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                  Número de cuenta:
                                </span>
                                <span className="font-mono">
                                  {selectedMethod.bankDetails.accountNumber}
                                </span>
                              </div>
                              {selectedMethod.bankDetails.accountType && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">
                                    Tipo:
                                  </span>
                                  <span>
                                    {selectedMethod.bankDetails.accountType}
                                  </span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                  Titular:
                                </span>
                                <span>{selectedMethod.bankDetails.owner}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                  CI / RUC:
                                </span>
                                <span className="font-mono">
                                  {selectedMethod.bankDetails.ci}
                                </span>
                              </div>
                            </div>
                            <div className="rounded-lg bg-primary/5 p-3 mt-2">
                              <p className="text-sm font-medium">
                                Monto a transferir:
                              </p>
                              <p className="text-xl font-bold text-primary">
                                {selectedCurrency?.symbol}{" "}
                                {totalConverted.toFixed(2)}{" "}
                                {selectedCurrency?.code}
                              </p>
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <BadgeCheck className="h-3 w-3 text-green-600" />{" "}
                              Transfiere el monto exacto y coloca tu número de
                              pedido como referencia.
                            </div>
                          </div>
                        </div>
                      )}
                  </div>
                )}

                {currencies.length > 1 && totalBase > 0 && (
                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium mb-2">
                      Precio equivalente en otras monedas:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {currencies
                        .filter((c) => c.id !== selectedCurrency?.id)
                        .map((c) => {
                          const converted = cupCurrency
                            ? Math.round((totalBase / cupCurrency.exchangeRate) * c.exchangeRate * 100) / 100
                            : totalBase;
                          return (
                            <div
                              key={c.id}
                              className="flex items-center gap-1.5 rounded-lg bg-muted/50 px-3 py-1.5 text-sm"
                            >
                              <span className="font-medium text-muted-foreground">
                                {c.code}:
                              </span>
                              <span className="font-semibold">
                                {c.symbol}
                                {converted.toFixed(2)}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Resumen del pedido (lateral) */}
          <div>
            <Card>
              <CardHeader className="border-b ">
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                  Resumen del pedido ({selectedCurrency?.code})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="max-h-64 space-y-3 overflow-y-auto">
                  {items.map((item) => {
                    const priceConv = convertAmount(item.product.price);
                    const totalConv = priceConv * item.quantity;
                    return (
                      <div
                        key={item.product.id}
                        className="flex gap-3 pb-3 border-b last:border-0"
                      >
                        <div className="relative h-16 w-16 rounded-lg bg-muted overflow-hidden">
                          <Image
                            src={item.product.image}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium line-clamp-1">
                            {item.product.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Cantidad: {item.quantity}
                          </p>
                          <p className="text-sm font-semibold text-primary mt-1">
                            {selectedCurrency?.symbol}
                            {totalConv.toFixed(2)} {selectedCurrency?.code}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

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
                      {selectedZone
                        ? `${selectedCurrency?.symbol}${deliveryFeeConverted.toFixed(2)} ${selectedCurrency?.code}`
                        : "Selecciona zona"}
                    </span>
                  </div>
                  {/* {subtotalBase < 50 && (
                    <div className="rounded-lg bg-amber-50 p-2.5 text-xs text-amber-700">
                      🚚 Agrega {(50 - subtotalBase).toFixed(2)} CUP más para
                      envío gratis
                    </div>
                  )} */}
                  <div className="flex justify-between border-t pt-3">
                    <span className="font-semibold">Total a pagar</span>
                    <span className="text-xl font-bold text-primary">
                      {selectedCurrency?.symbol}
                      {totalConverted.toFixed(2)} {selectedCurrency?.code}
                    </span>
                  </div>
                  {cupCurrency && selectedCurrency?.code !== 'CUP' && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Equivalente en {cupCurrency.code}</span>
                      <span className="font-medium">
                        {cupCurrency.symbol}{totalBase.toFixed(2)} {cupCurrency.code}
                      </span>
                    </div>
                  )}
                </div>

                {address && (
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> Entregar en:
                    </p>
                    <p className="mt-1 text-sm">{address}</p>
                  </div>
                )}

                <Button
                  className="w-full gap-2 min-h-[44px]"
                  size="lg"
                  onClick={handleSubmit}
                  disabled={!canCheckout || isProcessing}
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
