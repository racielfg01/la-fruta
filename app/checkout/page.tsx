"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCartStore, DeliveryLocation, Product } from "@/lib/store";
import { displayProductCupPrice } from "@/lib/price-margin";
import { useMarginConfig } from "@/lib/use-price-margin";
import { useSettingsStore } from "@/lib/settings-store";
import {
  resolveVisiblePaymentMethodIds,
  clampSelectedPaymentMethod,
} from "@/lib/payment-methods";
import { useAuthStore } from "@/lib/auth-context";
import { getPublicDeliveryZones } from "@/app/actions/public";
import type { DeliveryZone } from "@/lib/admin-store";
import {
  ShoppingBag,
  ArrowRight,
  CreditCard,
  User,
  IdCard,
  Phone,
  MapPin,
  Truck,
  Banknote,
  Shield,
  Loader2,
  Building2,
  BadgeCheck,
  AlertCircle,
  Copy,
  UploadCloud,
  X,
  CheckCircle2,
  Bookmark,
  Plus,
} from "lucide-react";
import { useMemo } from "react";
import Link from "next/link";
import { getPublicCurrencies } from "@/app/actions/public-currencies";
import { createOrderAction } from "@/app/actions/orders";
import {
  getBeneficiariesAction,
  createBeneficiaryAction,
  deleteBeneficiaryAction,
  getUserAddressesAction,
  createUserAddressAction,
  updateUserAddressAction,
  deleteUserAddressAction,
  type Beneficiary,
  type UserAddress,
} from "@/app/actions/saved";
import { getPublicTransferData } from "@/app/actions/public";
import { isValidPhone } from "@/lib/contact-validation";
import { useCurrencyStore } from "@/lib/currency-store";
import { effectiveMargin } from "@/lib/price-margin";
import { cupSavingForItems } from "@/lib/usd-saving";
import { planSaveAddress } from "@/lib/saved-addresses";
import { ProductImage } from "@/components/product-image";
import SavingHint from "@/components/saving-hint";
import { toast } from "sonner";

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
}

const paymentMethodsConfig: PaymentMethodConfig[] = [
  {
    id: "cash",
    name: "Efectivo",
    description: "Paga al recibir tu pedido",
    icon: Banknote,
    type: "cash",
  },
  {
    id: "transfer",
    name: "Transferencia bancaria",
    description: "Sube tu comprobante",
    icon: Building2,
    type: "transfer",
    disabled: false,
  },
];

interface TransferAccount {
  id: string;
  bank: string;
  accountNumber: string;
  accountType: string;
  owner: string;
  ci: string;
  currency: string;
  transferLimit: number;
  transferCount: number;
}

interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  exchangeRate: number;
  isDefault: boolean;
}

// -------------------------------
// Componente de sección con paso
// -------------------------------
function Section({
  step,
  title,
  description,
  children,
}: {
  step: number;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border bg-card">
      <header className="flex items-start gap-3 border-b px-4 py-3 sm:px-5 sm:py-4">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
          {step}
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold sm:text-base">{title}</h2>
          {description && (
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </header>
      <div className="px-4 py-4 sm:px-5 sm:py-5">{children}</div>
    </section>
  );
}

// -------------------------------
// Chip seleccionable reutilizable
// -------------------------------
function SavedChip({
  label,
  sublabel,
  onUse,
  onDelete,
  active,
}: {
  label: string;
  sublabel?: string;
  onUse: () => void;
  onDelete?: () => void;
  active?: boolean;
}) {
  return (
    <div
      className={`group inline-flex max-w-full items-center gap-1.5 rounded-full border py-1 pl-3 pr-1 text-xs transition-colors hover:border-primary/40 hover:bg-primary/5 ${
        active ? "border-primary bg-primary/5" : "bg-background"
      }`}
    >
      <button
        type="button"
        onClick={onUse}
        className="min-w-0 truncate text-left"
        title={sublabel ? `${label} · ${sublabel}` : label}
      >
        <span className="font-medium">{label}</span>
        {sublabel && (
          <span className="text-muted-foreground"> · {sublabel}</span>
        )}
      </button>
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Eliminar ${label}`}
          className="rounded-full p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart, setDeliveryLocation, userLocation } =
    useCartStore();
  const {
    user,
    isAuthenticated,
    isLoading: authLoading,
    token,
  } = useAuthStore();
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [zonesLoading, setZonesLoading] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const processingRef = useRef(false);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(
    null,
  );
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const cupCurrency = useMemo(
    () => currencies.find((c) => c.code === "CUP") || null,
    [currencies],
  );
  const marginState = useMarginConfig();
  const operationalCostCup = useSettingsStore((s) => s.settings.operationalCost) || 0;
  const showPaymentCash = useSettingsStore((s) => s.settings.showPaymentCash !== false);
  const showPaymentTransfer = useSettingsStore((s) => s.settings.showPaymentTransfer !== false);
  const freeShippingMin = useSettingsStore((s) => s.settings.freeShippingMin) || 0;
  // Métodos de pago visibles según configuración admin (el fallback fuerza
  // a mostrar todos si el admin oculta todos).
  const visibleMethodIds = useMemo(
    () =>
      resolveVisiblePaymentMethodIds({
        showCash: showPaymentCash,
        showTransfer: showPaymentTransfer,
      }),
    [showPaymentCash, showPaymentTransfer]
  );
  const visiblePaymentMethods = useMemo(
    () => paymentMethodsConfig.filter((m) => visibleMethodIds.includes(m.id)),
    [visibleMethodIds]
  );
  const itemDisplayCup = (p: Product) =>
    displayProductCupPrice(
      p.price,
      { globalMargin: marginState.globalMargin, productMargin: p.priceMargin ?? null },
      selectedCurrency?.code,
    );
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>(
    paymentMethodsConfig[0].id,
  );

  // Si el admin oculta el método ya seleccionado, pasa al primero visible.
  useEffect(() => {
    setSelectedPaymentMethod((prev) => clampSelectedPaymentMethod(prev, visibleMethodIds));
  }, [visibleMethodIds]);

  // Transferencia
  const [transferData, setTransferData] = useState<{
    banks: { id: string; name: string }[];
    accounts: TransferAccount[];
  }>({ banks: [], accounts: [] });
  const [transferBank, setTransferBank] = useState("");
  const [transferAccountId, setTransferAccountId] = useState("");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [receiptName, setReceiptName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [reference, setReference] = useState("");

  // Validación
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>(
    {},
  );
  const zoneRef = useRef<HTMLButtonElement>(null);
  const addressRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const carnetRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  const scrollToField = (ref: React.RefObject<HTMLElement | null>) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    (ref.current as HTMLElement | null)?.focus?.();
  };

  const markTouched = (field: string) =>
    setTouchedFields((prev) => ({ ...prev, [field]: true }));

  const clearFieldError = (field: string) =>
    setFieldErrors((prev) => {
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });

  const validateField = (field: string, value: string) => {
    let message = "";
    if (field === "address" && !value.trim())
      message = "La dirección de entrega es obligatoria";
    if (field === "name" && !value.trim())
      message = "El nombre completo es obligatorio";
    if (field === "phone") {
      if (!value.trim()) message = "El teléfono del receptor es obligatorio";
      else if (!isValidPhone(value))
        message = "Ingresa un teléfono válido, por ejemplo +53 5123 4567";
    }
    if (field === "carnet") {
      if (!value.trim()) message = "El carnet de identidad es obligatorio";
      else if (!/^\d{11}$/.test(value))
        message = "El carnet de identidad debe tener 11 dígitos";
    }
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (message) next[field] = message;
      else delete next[field];
      return next;
    });
  };

  useEffect(() => {
    getPublicTransferData().then(setTransferData).catch(() => {});
  }, []);

  const accountsForBank = transferData.accounts.filter((a) => {
    const full = a.transferLimit > 0 && a.transferCount >= a.transferLimit;
    return !full && a.bank === transferBank;
  });
  const selectedTransferAccount = transferData.accounts.find(
    (a) => a.id === transferAccountId,
  );

  const handleBankChange = (bank: string) => {
    setTransferBank(bank);
    setTransferAccountId("");
    const pool = transferData.accounts.filter((a) => {
      const full = a.transferLimit > 0 && a.transferCount >= a.transferLimit;
      return !full && a.bank === bank;
    });
    const preferred =
      pool.find((a) => a.currency === selectedCurrency?.code) || pool[0];
    if (preferred) setTransferAccountId(preferred.id);
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: fd,
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setReceiptUrl(json.url);
        setReceiptName(file.name);
        clearFieldError("receipt");
        toast.success("Comprobante subido correctamente");
      } else {
        toast.error(json.error || "Error al subir el comprobante");
      }
    } catch {
      toast.error("Error al subir el comprobante");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const copyAccount = async (num: string) => {
    try {
      await navigator.clipboard.writeText(num);
      toast.success("Número de cuenta copiado");
    } catch {
      toast.error("No se pudo copiar, cópialo manualmente");
    }
  };

  // Envío
  const [selectedZoneId, setSelectedZoneId] = useState<string>("");
  const [address, setAddress] = useState("");
  const [saveAddress, setSaveAddress] = useState(false);
  const [alias, setAlias] = useState("");
  const [zone, setZone] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");

  // Contacto
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    carnet: "",
    phone: "",
  });
  const [saveContact, setSaveContact] = useState(false);

  const [beneficiarios, setBeneficiarios] = useState<Beneficiary[]>([]);
  const [savingBeneficiary, setSavingBeneficiary] = useState(false);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [savingAddress, setSavingAddress] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    getBeneficiariesAction(token).then(setBeneficiarios).catch(() => {});
    getUserAddressesAction(token).then(setAddresses).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, token]);

  const handleSaveBeneficiary = async () => {
    if (!token) return;
    const errors: Record<string, string> = {};
    if (!formData.name.trim())
      errors.name = "El nombre completo es obligatorio";
    if (!formData.phone.trim()) {
      errors.phone = "El teléfono del receptor es obligatorio";
    } else if (!isValidPhone(formData.phone)) {
      errors.phone = "Ingresa un teléfono válido, por ejemplo +53 5123 4567";
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors((prev) => ({ ...prev, ...errors }));
      setTouchedFields((prev) => ({ ...prev, name: true, phone: true }));
      scrollToField(errors.name ? nameRef : phoneRef);
      return;
    }
    setSavingBeneficiary(true);
    try {
      await createBeneficiaryAction(
        {
          fullName: formData.name,
          phone: formData.phone,
          carnet: formData.carnet,
        },
        token,
      );
      setBeneficiarios(await getBeneficiariesAction(token));
      setSaveContact(false);
      toast.success("Contacto guardado");
    } catch (error: any) {
      toast.error(error?.message || "No se pudo guardar el contacto");
    } finally {
      setSavingBeneficiary(false);
    }
  };

  const handleDeleteBeneficiary = async (id: string) => {
    if (!token) return;
    try {
      await deleteBeneficiaryAction(id, token);
      setBeneficiarios(await getBeneficiariesAction(token));
      toast.success("Contacto eliminado");
    } catch (error: any) {
      toast.error(error?.message || "No se pudo eliminar el contacto");
    }
  };

  const handleSaveAddress = async () => {
    if (!token) return;
    if (!address.trim()) {
      markTouched("address");
      validateField("address", address);
      scrollToField(addressRef);
      return;
    }
    const finalZone = zone.trim() || selectedZone?.name || "";
    const plan = planSaveAddress(addresses, {
      address,
      zone: finalZone,
      alias,
      notes: deliveryNotes,
    });
    if (plan.kind === "update") {
      // La dirección ya existe: en vez de rechazarla y perder las
      // instrucciones, actualizamos alias y notas de esa misma dirección.
      setSavingAddress(true);
      try {
        await updateUserAddressAction(
          plan.id,
          { alias: plan.alias, notes: plan.notes },
          token,
        );
        setAddresses(await getUserAddressesAction(token));
        setSaveAddress(false);
        toast.success("Dirección actualizada");
      } catch (error: any) {
        toast.error(error?.message || "No se pudo actualizar la dirección");
      } finally {
        setSavingAddress(false);
      }
      return;
    }
    setSavingAddress(true);
    try {
      await createUserAddressAction(
        {
          alias: alias.trim() || "Mi dirección",
          address: address.trim(),
          zone: finalZone,
          notes: deliveryNotes.trim(),
        },
        token,
      );
      setAddresses(await getUserAddressesAction(token));
      setAlias("");
      setSaveAddress(false);
      toast.success("Dirección guardada");
    } catch (error: any) {
      toast.error(error?.message || "No se pudo guardar la dirección");
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!token) return;
    try {
      await deleteUserAddressAction(id, token);
      setAddresses(await getUserAddressesAction(token));
      if (selectedAddressId === id) setSelectedAddressId("");
      toast.success("Dirección eliminada");
    } catch (error: any) {
      toast.error(error?.message || "No se pudo eliminar la dirección");
    }
  };

  const handleUseAddress = (d: UserAddress) => {
    setAddress(d.address);
    setZone(d.zone || "");
    setAlias(d.alias);
    setDeliveryNotes(d.notes || "");
    setSelectedAddressId(d.id);
    // Si la zona guardada coincide con una zona activa, seleccionarla para no
    // forzar al usuario a elegirla de nuevo (y calcular el envío).
    const match = activeZones.find((z) => z.name === d.zone);
    if (match) {
      setSelectedZoneId(match.id);
      clearFieldError("zone");
    }
    clearFieldError("address");
    toast.success(`Dirección "${d.alias}" aplicada`);
  };

  // Cargar monedas
  useEffect(() => {
    const loadCurrencies = async () => {
      setIsLoadingCurrencies(true);
      const data = await getPublicCurrencies();
      setCurrencies(data);
      const globalId = useCurrencyStore.getState().currencyId;
      const preferred =
        data.find((c) => c.id === globalId) ||
        data.find((c) => c.isDefault) ||
        data[0];
      setSelectedCurrency(preferred || null);
      setIsLoadingCurrencies(false);
    };
    loadCurrencies();
  }, []);

  // Inicializar zonas (colección pública; el checkout no carga datos admin)
  useEffect(() => {
    if (!token || zonesLoading || deliveryZones.length > 0) return;
    setZonesLoading(true);
    getPublicDeliveryZones()
      .then(setDeliveryZones)
      .catch(console.error)
      .finally(() => setZonesLoading(false));
  }, [token, zonesLoading, deliveryZones.length]);

  // Auth
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

  // Datos usuario
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

  // Zonas activas filtradas por la ubicación del cliente. Las zonas sin
  // provincia/municipio asignados (legacy) valen en cualquier ubicación; si
  // ninguna coincide (p. ej. ninguna zona ubicada), se muestran todas.
  const activeZones = useMemo(() => {
    const actives = deliveryZones.filter((z) => z.active);
    if (!userLocation?.province) return actives;
    const matches = actives.filter(
      (z) =>
        (!z.province || z.province === userLocation.province) &&
        (!z.municipality || z.municipality === userLocation.municipality)
    );
    return matches.length > 0 ? matches : actives;
  }, [deliveryZones, userLocation]);
  const selectedZone = activeZones.find((z) => z.id === selectedZoneId);

  // Totales — en CUP se muestra/cobra el precio con margen; resto base.
  // El costo operativo (CUP) se suma a TODAS las órdenes.
  const operationalCostBase = operationalCostCup;
  const subtotalBase = items.reduce(
    (sum, it) => sum + itemDisplayCup(it.product) * it.quantity,
    0,
  );
  const isFreeShipping = freeShippingMin > 0 && subtotalBase >= freeShippingMin;
  const deliveryFeeBase = selectedZone ? (isFreeShipping ? 0 : selectedZone.price) : 0;
  const totalBase = subtotalBase + deliveryFeeBase + operationalCostBase;

  // Ahorro por pagar en USD: el margen solo se aplica a las órdenes en CUP
  // (ver orderItemPrice), así que en otra moneda la orden sale más barata.
  const usdCurrency = useMemo(
    () => currencies.find((c) => c.code === "USD") || null,
    [currencies],
  );
  const saving = useMemo(
    () =>
      cupSavingForItems(
        items.map((it) => ({
          basePriceCup: it.product.price,
          quantity: it.quantity,
          marginPct: effectiveMargin({
            globalMargin: marginState.globalMargin,
            productMargin: it.product.priceMargin ?? null,
          }),
        })),
        {
          deliveryFeeCup: deliveryFeeBase,
          operationalCostCup: operationalCostBase,
        },
      ),
    [items, marginState.globalMargin, deliveryFeeBase, operationalCostBase],
  );

  const convertAmount = (amountInCUP: number): number => {
    if (!selectedCurrency || !cupCurrency) return amountInCUP;
    return (
      Math.round(
        (amountInCUP / cupCurrency.exchangeRate) *
          selectedCurrency.exchangeRate *
          100,
      ) / 100
    );
  };

  // Tasa de cambio bien orientada: "1 USD = 610 CUP" o "1 CUP = 0.0016 USD".
  const rateLine = useMemo(() => {
    if (!selectedCurrency || !cupCurrency) return null;
    if (selectedCurrency.code === "CUP") {
      const other = currencies.find((c) => c.code !== "CUP");
      if (!other) return null;
      const perCup = (1 / cupCurrency.exchangeRate) * other.exchangeRate;
      return `1 ${cupCurrency.code} = ${perCup.toFixed(4)} ${other.code}`;
    }
    const perUnit = cupCurrency.exchangeRate / selectedCurrency.exchangeRate;
    return `1 ${selectedCurrency.code} = ${perUnit.toFixed(4)} ${cupCurrency.code}`;
  }, [selectedCurrency, cupCurrency, currencies]);

  // Importe en una moneda concreta (no la seleccionada).
  const convertTo = (amountInCUP: number, target: Currency | null): number => {
    if (!target || !cupCurrency) return amountInCUP;
    return (
      Math.round(
        (amountInCUP / cupCurrency.exchangeRate) * target.exchangeRate * 100,
      ) / 100
    );
  };

  // Lo que se pagaría realmente en USD (sin el margen de las órdenes en CUP).
  const usdTotal = usdCurrency
    ? convertTo(saving.totalWithoutMarginCup, usdCurrency)
    : 0;

  const switchToUsd = () => {
    if (!usdCurrency) return;
    setSelectedCurrency(usdCurrency);
    useCurrencyStore.getState().setCurrency(usdCurrency.id);
  };

  const subtotalConverted = convertAmount(subtotalBase);
  const deliveryFeeConverted = convertAmount(deliveryFeeBase);
  const operationalCostConverted = convertAmount(operationalCostBase);
  const totalConverted = convertAmount(totalBase);

  // Ubicación global
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

  // Prellenar zona del bloque guardar
  useEffect(() => {
    if (selectedZone?.name && zone.trim() === "") setZone(selectedZone.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedZone?.name]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (processingRef.current || isProcessing) return;

    const errors: Record<string, string> = {};
    if (!selectedZoneId) errors.zone = "Selecciona una zona de envío";
    if (!address.trim())
      errors.address = "La dirección de entrega es obligatoria";
    if (!formData.name.trim())
      errors.name = "El nombre completo es obligatorio";
    if (!formData.phone.trim())
      errors.phone = "El teléfono del receptor es obligatorio";
    else if (!isValidPhone(formData.phone))
      errors.phone = "Ingresa un teléfono válido, por ejemplo +53 5123 4567";
    if (!formData.carnet.trim())
      errors.carnet = "El carnet de identidad es obligatorio";
    else if (!/^\d{11}$/.test(formData.carnet))
      errors.carnet = "El carnet de identidad debe tener 11 dígitos";
    if (!selectedCurrency) errors.currency = "Selecciona una moneda de pago";
    if (selectedPaymentMethod === "transfer" && !transferAccountId)
      errors.bank = "Selecciona la cuenta a la que harás la transferencia";
    if (selectedPaymentMethod === "transfer" && !receiptUrl)
      errors.receipt = "Adjunta el comprobante de la transferencia";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setTouchedFields({
        zone: true,
        address: true,
        name: true,
        phone: true,
        carnet: true,
        receipt: true,
      });
      const refMap: Record<string, React.RefObject<HTMLElement | null>> = {
        zone: zoneRef,
        address: addressRef,
        name: nameRef,
        phone: phoneRef,
        carnet: carnetRef,
        receipt: receiptRef,
      };
      const firstError = Object.keys(errors).find((k) => refMap[k]);
      if (firstError) scrollToField(refMap[firstError]);
      else toast.error(Object.values(errors)[0]);
      return;
    }

    setFieldErrors({});
    if (!selectedCurrency || !selectedZone) return;
    processingRef.current = true;
    setIsProcessing(true);

    try {
      const orderItems = items.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
      }));

      const deliveryAddress =
        zone.trim() && !address.includes(zone.trim())
          ? `${address.trim()}, ${zone.trim()}`
          : address.trim();

      const orderData = {
        userId: user!.id,
        userName: formData.name,
        userEmail: formData.email,
        contactPhone: formData.phone,
        contactCarnet: formData.carnet,
        items: orderItems,
        subtotal: subtotalBase,
        deliveryFee: deliveryFeeBase,
        total: totalBase,
        paymentMethod: selectedPaymentMethod,
        deliveryAddress,
        deliveryNotes: deliveryNotes.trim(),
        currencyCode: selectedCurrency.code,
        zoneId: selectedZone.id,
        municipalityId: userLocation?.municipality,
        provinceId: userLocation?.province,
        ...(selectedPaymentMethod === "transfer"
          ? {
              bankAccountId: transferAccountId,
              bankName: selectedTransferAccount?.bank || "",
              accountNumber: selectedTransferAccount?.accountNumber || "",
              receipt: receiptUrl,
              reference: reference.trim() || `Pedido ${Date.now()}`,
              transferAmount: totalConverted,
            }
          : {}),
      };

      const result = await createOrderAction(orderData, token!);
      if (result.success) {
        clearCart();
        router.push(
          `/order-confirmation?orderId=${result.orderId}&paymentMethod=${selectedPaymentMethod}&currency=${selectedCurrency.code}&amount=${totalConverted}`,
        );
      } else {
        toast.error(result.error || "Error al crear la orden.");
        setIsProcessing(false);
        processingRef.current = false;
      }
    } catch (error) {
      console.error(error);
      toast.error("Ocurrió un error al procesar tu orden.");
      setIsProcessing(false);
      processingRef.current = false;
    }
  };

  const isLoading =
    authLoading || isLoadingCurrencies || isCheckingAuth || zonesLoading;
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Cargando…</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto max-w-md px-4 py-16">
          <div className="flex flex-col items-center text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <ShoppingBag className="h-8 w-8 text-muted-foreground" />
            </div>
            <h1 className="mb-2 text-xl font-semibold">Tu carrito está vacío</h1>
            <p className="mb-6 text-sm text-muted-foreground">
              Agrega productos antes de finalizar la compra.
            </p>
            <Button asChild>
              <Link href="/#products">
                Explorar productos <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (activeZones.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto max-w-md px-4 py-16">
          <Card className="text-center">
            <CardContent className="pt-6">
              <AlertCircle className="mx-auto mb-3 h-10 w-10 text-amber-500" />
              <h2 className="mb-2 text-lg font-semibold">
                No hay zonas de envío disponibles
              </h2>
              <p className="mb-5 text-sm text-muted-foreground">
                En este momento no tenemos cobertura. Contacta con atención al
                cliente.
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

  const selectedMethod = visiblePaymentMethods.find(
    (m) => m.id === selectedPaymentMethod,
  );

  const availableTransferAccounts = transferData.accounts.filter((a) => {
    const full = a.transferLimit > 0 && a.transferCount >= a.transferLimit;
    return !full;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto max-w-6xl px-4 pb-28 pt-6 sm:pt-8 lg:pb-12">
        {/* Título */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Finalizar compra
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Completa los datos para recibir tus productos.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:gap-8">
          {/* Columna izquierda — formulario */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 1. Entrega */}
            <Section
              step={1}
              title="Entrega"
              description="Indica dónde quieres recibir tu pedido"
            >
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="deliveryZone">
                    Zona de envío <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={selectedZoneId}
                    onValueChange={(v) => {
                      setSelectedZoneId(v);
                      clearFieldError("zone");
                    }}
                  >
                    <SelectTrigger
                      id="deliveryZone"
                      ref={zoneRef}
                      className={`h-11 ${
                        fieldErrors.zone
                          ? "border-destructive focus:ring-destructive"
                          : ""
                      }`}
                    >
                      <SelectValue placeholder="Selecciona una zona" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeZones.map((z) => (
                        <SelectItem key={z.id} value={z.id}>
                          {z.name} 
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldErrors.zone ? (
                    <p className="flex items-center gap-1 text-xs text-destructive">
                      <AlertCircle className="h-3 w-3" /> {fieldErrors.zone}
                    </p>
                  ) : selectedZone ? (
                    <p className="text-xs text-muted-foreground">
                      Tiempo estimado: {selectedZone.estimatedTime}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Incorporamos nuevas zonas constantemente.
                    </p>
                  )}
                </div>

                {addresses.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      Direcciones guardadas
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {addresses.map((d) => (
                        <SavedChip
                          key={d.id}
                          label={d.alias}
                          sublabel={d.zone || undefined}
                          active={d.id === selectedAddressId}
                          onUse={() => handleUseAddress(d)}
                          onDelete={() => handleDeleteAddress(d.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="address">
                    Dirección <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="address"
                      ref={addressRef}
                      placeholder="Calle, número, entre calles, reparto"
                      className={`h-11 pl-10 ${
                        touchedFields.address && fieldErrors.address
                          ? "border-destructive focus-visible:ring-destructive"
                          : ""
                      }`}
                      value={address}
                      onChange={(e) => {
                        setAddress(e.target.value);
                        if (fieldErrors.address) clearFieldError("address");
                      }}
                      onBlur={() => {
                        markTouched("address");
                        validateField("address", address);
                      }}
                      required
                    />
                  </div>
                  {touchedFields.address && fieldErrors.address && (
                    <p className="flex items-center gap-1 text-xs text-destructive">
                      <AlertCircle className="h-3 w-3" /> {fieldErrors.address}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deliveryNotes">Notas para la entrega</Label>
                  <Textarea
                    id="deliveryNotes"
                    placeholder="Instrucciones, referencias, horario preferido…"
                    className="min-h-[72px]"
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                  />
                </div>

                {/* Guardar dirección (con su propio campo dirección, sincronizado) */}
                <div className="rounded-lg border border-dashed bg-muted/30 p-3">
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <Checkbox
                      checked={saveAddress}
                      onCheckedChange={(v) => setSaveAddress(v === true)}
                    />
                    <Bookmark className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Guardar esta dirección para futuros pedidos</span>
                  </label>

                  {saveAddress && (
                    <div className="mt-3 space-y-3">
                      {/* Campo dirección dentro del sub-formulario */}
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="saveAddressInput"
                          className="text-xs font-normal text-muted-foreground"
                        >
                          Dirección
                        </Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="saveAddressInput"
                            placeholder="Calle, número, entre calles, reparto"
                            className="h-10 pl-10"
                            value={address}
                            onChange={(e) => {
                              setAddress(e.target.value);
                              if (fieldErrors.address)
                                clearFieldError("address");
                            }}
                          />
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label
                            htmlFor="addressAlias"
                            className="text-xs font-normal text-muted-foreground"
                          >
                            Alias
                          </Label>
                          <Input
                            id="addressAlias"
                            placeholder="Ej: casa"
                            value={alias}
                            onChange={(e) => setAlias(e.target.value)}
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label
                            htmlFor="addressZone"
                            className="text-xs font-normal text-muted-foreground"
                          >
                            Zona
                          </Label>
                          <Input
                            id="addressZone"
                            placeholder="Ej: Distrito"
                            value={zone}
                            onChange={(e) => setZone(e.target.value)}
                            className="h-10"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label
                          htmlFor="saveAddressNotes"
                          className="text-xs font-normal text-muted-foreground"
                        >
                          Notas para la entrega
                        </Label>
                        <Textarea
                          id="saveAddressNotes"
                          placeholder="Instrucciones, referencias, horario preferido…"
                          className="min-h-[60px]"
                          value={deliveryNotes}
                          onChange={(e) => setDeliveryNotes(e.target.value)}
                        />
                      </div>

                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="w-full"
                        onClick={handleSaveAddress}
                        disabled={savingAddress || !address.trim()}
                      >
                        {savingAddress ? (
                          <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                        ) : (
                          <Bookmark className="mr-1 h-4 w-4" />
                        )}
                        {savingAddress ? "Guardando…" : "Guardar dirección"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Section>

            {/* 2. Contacto */}
            <Section
              step={2}
              title="Contacto"
              description="Datos de quien recibe el pedido"
            >
              <div className="space-y-5">
                {beneficiarios.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      Contactos guardados
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {beneficiarios.map((b) => (
                        <SavedChip
                          key={b.id}
                          label={b.fullName}
                          sublabel={
                            b.carnet ? `${b.phone} · ${b.carnet}` : b.phone
                          }
                          onUse={() => {
                            setFormData({
                              ...formData,
                              name: b.fullName,
                              phone: b.phone,
                              carnet: b.carnet || "",
                            });
                            clearFieldError("name");
                            clearFieldError("phone");
                            clearFieldError("carnet");
                          }}
                          onDelete={() => handleDeleteBeneficiary(b.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contactName">
                      Nombre completo{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="contactName"
                        ref={nameRef}
                        className={`h-11 pl-10 ${
                          touchedFields.name && fieldErrors.name
                            ? "border-destructive focus-visible:ring-destructive"
                            : ""
                        }`}
                        value={formData.name}
                        onChange={(e) => {
                          setFormData({ ...formData, name: e.target.value });
                          if (fieldErrors.name) clearFieldError("name");
                        }}
                        onBlur={() => {
                          markTouched("name");
                          validateField("name", formData.name);
                        }}
                      />
                    </div>
                    {touchedFields.name && fieldErrors.name && (
                      <p className="flex items-center gap-1 text-xs text-destructive">
                        <AlertCircle className="h-3 w-3" /> {fieldErrors.name}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">
                      Teléfono <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="contactPhone"
                        ref={phoneRef}
                        type="tel"
                        className={`h-11 pl-10 ${
                          touchedFields.phone && fieldErrors.phone
                            ? "border-destructive focus-visible:ring-destructive"
                            : ""
                        }`}
                        value={formData.phone}
                        onChange={(e) => {
                          setFormData({ ...formData, phone: e.target.value });
                          if (fieldErrors.phone) clearFieldError("phone");
                        }}
                        onBlur={() => {
                          markTouched("phone");
                          validateField("phone", formData.phone);
                        }}
                      />
                    </div>
                    {touchedFields.phone && fieldErrors.phone && (
                      <p className="flex items-center gap-1 text-xs text-destructive">
                        <AlertCircle className="h-3 w-3" /> {fieldErrors.phone}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactCarnet">
                    Carnet de identidad{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <IdCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="contactCarnet"
                      ref={carnetRef}
                      inputMode="numeric"
                      placeholder="11 dígitos"
                      className={`h-11 pl-10 ${
                        touchedFields.carnet && fieldErrors.carnet
                          ? "border-destructive focus-visible:ring-destructive"
                          : ""
                      }`}
                      value={formData.carnet}
                      onChange={(e) => {
                        const digits = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 11);
                        setFormData({ ...formData, carnet: digits });
                        if (fieldErrors.carnet) clearFieldError("carnet");
                      }}
                      onBlur={() => {
                        markTouched("carnet");
                        validateField("carnet", formData.carnet);
                      }}
                    />
                  </div>
                  {touchedFields.carnet && fieldErrors.carnet && (
                    <p className="flex items-center gap-1 text-xs text-destructive">
                      <AlertCircle className="h-3 w-3" /> {fieldErrors.carnet}
                    </p>
                  )}
                </div>

                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox
                    checked={saveContact}
                    onCheckedChange={(v) => {
                      const checked = v === true;
                      setSaveContact(checked);
                      if (checked) handleSaveBeneficiary();
                    }}
                    disabled={
                      savingBeneficiary || !formData.name || !formData.phone
                    }
                  />
                  <span className="text-muted-foreground">
                    Guardar este contacto para futuros pedidos
                  </span>
                  {savingBeneficiary && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                  )}
                </label>
              </div>
            </Section>

            {/* 3. Pago */}
            <Section
              step={3}
              title="Pago"
              description="Elige cómo quieres pagar"
            >
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label>Moneda de pago</Label>
                  <Select
                    value={selectedCurrency?.id}
                    onValueChange={(val) => {
                      setSelectedCurrency(
                        currencies.find((c) => c.id === val) || null,
                      );
                      useCurrencyStore.getState().setCurrency(val);
                    }}
                  >
                    <SelectTrigger className="h-11 w-full sm:w-64">
                      <SelectValue placeholder="Seleccionar moneda" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.symbol} {c.code}
                           {/* — {c.name} */}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {/* {rateLine && (
                    <p className="text-xs text-muted-foreground">{rateLine}</p>
                  )} */}
                  {selectedCurrency?.code === "CUP" &&
                    saving.savingCup > 0 &&
                    usdCurrency && (
                      <SavingHint
                        className="mt-1"
                        currencyCode="USD"
                        currencySymbol={usdCurrency.symbol}
                        amount={usdTotal}
                        savingCup={saving.savingCup}
                        savingPct={saving.savingPct}
                        actionLabel="Ver en USD"
                        onAction={switchToUsd}
                      />
                    )}
                </div>

                <div className="space-y-3">
                  <Label>Método de pago</Label>
                  <RadioGroup
                    value={selectedPaymentMethod}
                    onValueChange={setSelectedPaymentMethod}
                    className="grid gap-3 sm:grid-cols-2"
                  >
                    {visiblePaymentMethods.map((method) => {
                      const Icon = method.icon;
                      const isSelected = selectedPaymentMethod === method.id;
                      const isDisabled = method.disabled === true;
                      return (
                        <label
                          key={method.id}
                          htmlFor={method.id}
                          className={`relative flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 transition-all ${
                            isSelected
                              ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                              : "border-border hover:border-primary/40 hover:bg-muted/30"
                          } ${
                            isDisabled
                              ? "cursor-not-allowed opacity-60 hover:border-border hover:bg-transparent"
                              : ""
                          }`}
                        >
                          <RadioGroupItem
                            value={method.id}
                            id={method.id}
                            disabled={isDisabled}
                            className="mt-0.5"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-primary" />
                              <span className="text-sm font-medium">
                                {method.name}
                              </span>
                            </div>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {method.description}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </RadioGroup>

              
                </div>

                {selectedMethod && !selectedMethod.disabled && (
                  <div className="rounded-lg border bg-muted/30 p-4">
                    {selectedMethod.type === "cash" && (
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Total a pagar en efectivo
                        </p>
                        <p className="mt-1 text-2xl font-bold text-primary">
                          {selectedCurrency?.symbol}{" "}
                          {totalConverted.toFixed(2)}{" "}
                          <span className="text-base font-medium">
                            {selectedCurrency?.code}
                          </span>
                        </p>
                      </div>
                    )}

                    {selectedMethod.type === "transfer" && (
                      <div className="space-y-4">
                        {availableTransferAccounts.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            No hay cuentas disponibles para transferencia.
                          </p>
                        ) : (
                          <>
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div className="space-y-2">
                                <Label className="text-xs">Banco</Label>
                                <Select
                                  value={transferBank}
                                  onValueChange={handleBankChange}
                                >
                                  <SelectTrigger className="h-10">
                                    <SelectValue placeholder="Selecciona un banco" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {transferData.banks.map((b) => (
                                      <SelectItem key={b.id} value={b.name}>
                                        {b.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs">Cuenta</Label>
                                <Select
                                  value={transferAccountId}
                                  onValueChange={(v) => {
                                    setTransferAccountId(v);
                                    clearFieldError("bank");
                                  }}
                                  disabled={
                                    !transferBank ||
                                    accountsForBank.length === 0
                                  }
                                >
                                  <SelectTrigger
                                    className={`h-10 ${
                                      fieldErrors.bank
                                        ? "border-destructive focus:ring-destructive"
                                        : ""
                                    }`}
                                  >
                                    <SelectValue
                                      placeholder={
                                        accountsForBank.length
                                          ? "Selecciona la cuenta"
                                          : "Sin cuentas"
                                      }
                                    />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {accountsForBank.map((a) => (
                                      <SelectItem key={a.id} value={a.id}>
                                        {a.accountNumber} ({a.currency})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {fieldErrors.bank && (
                                  <p className="flex items-center gap-1 text-xs text-destructive">
                                    <AlertCircle className="h-3 w-3" />{" "}
                                    {fieldErrors.bank}
                                  </p>
                                )}
                              </div>
                            </div>

                            {selectedTransferAccount && (
                              <div className="rounded-lg border bg-background p-3.5 text-sm">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-muted-foreground">
                                    Nº de cuenta
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs sm:text-sm">
                                      {selectedTransferAccount.accountNumber}
                                    </span>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 px-2"
                                      onClick={() =>
                                        copyAccount(
                                          selectedTransferAccount.accountNumber,
                                        )
                                      }
                                    >
                                      <Copy className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                                {selectedTransferAccount.accountType && (
                                  <div className="mt-1.5 flex justify-between">
                                    <span className="text-muted-foreground">
                                      Tipo
                                    </span>
                                    <span>
                                      {selectedTransferAccount.accountType}
                                    </span>
                                  </div>
                                )}
                                <div className="mt-1.5 flex justify-between">
                                  <span className="text-muted-foreground">
                                    Titular
                                  </span>
                                  <span>{selectedTransferAccount.owner}</span>
                                </div>
                                {selectedTransferAccount.ci && (
                                  <div className="mt-1.5 flex justify-between">
                                    <span className="text-muted-foreground">
                                      CI / RUC
                                    </span>
                                    <span className="font-mono text-xs">
                                      {selectedTransferAccount.ci}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                              <p className="text-xs text-muted-foreground">
                                Monto a transferir
                              </p>
                              <p className="text-xl font-bold text-primary">
                                {selectedCurrency?.symbol}{" "}
                                {totalConverted.toFixed(2)}{" "}
                                <span className="text-sm font-medium">
                                  {selectedCurrency?.code}
                                </span>
                              </p>
                            </div>

                            <div
                              ref={receiptRef}
                              tabIndex={-1}
                              className="space-y-2 outline-none"
                            >
                              <Label className="text-xs">
                                Comprobante{" "}
                                <span className="text-destructive">*</span>
                              </Label>
                              {receiptUrl ? (
                                <div className="flex items-center justify-between gap-2 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-500/30 dark:bg-green-500/10">
                                  <div className="flex min-w-0 items-center gap-2 text-green-700 dark:text-green-400">
                                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                                    <span className="truncate text-sm">
                                      {receiptName || "Comprobante subido"}
                                    </span>
                                  </div>
                                  <div className="flex shrink-0 items-center gap-2">
                                    <a
                                      href={receiptUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-primary underline"
                                    >
                                      Ver
                                    </a>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setReceiptUrl("");
                                        setReceiptName("");
                                      }}
                                      className="text-muted-foreground hover:text-destructive"
                                      aria-label="Quitar comprobante"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed bg-background p-5 text-center transition-colors hover:border-primary/40 hover:bg-muted/30">
                                  <UploadCloud className="h-5 w-5 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">
                                    {uploading
                                      ? "Subiendo…"
                                      : "Imagen o PDF · máx. 5MB"}
                                  </span>
                                  <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    className="hidden"
                                    onChange={handleReceiptUpload}
                                    disabled={uploading}
                                  />
                                </label>
                              )}
                              {fieldErrors.receipt && (
                                <p className="flex items-center gap-1 text-xs text-destructive">
                                  <AlertCircle className="h-3 w-3" />{" "}
                                  {fieldErrors.receipt}
                                </p>
                              )}
                            </div>

                            <div className="space-y-2">
                              <Label className="text-xs">
                                Referencia (opcional)
                              </Label>
                              <Input
                                placeholder="Ej: Pedido de tu carrito"
                                value={reference}
                                onChange={(e) => setReference(e.target.value)}
                                className="h-10"
                              />
                            </div>

                            <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                              <BadgeCheck className="mt-0.5 h-3 w-3 shrink-0 text-green-600" />
                              Transfiere el monto exacto. Tu pedido se confirma
                              al validar el comprobante.
                            </p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {currencies.length > 1 && totalBase > 0 && (
                  <div className="rounded-lg border bg-muted/20 p-3">
                    <p className="mb-2 text-xs text-muted-foreground">
                      Precio en otras monedas
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {currencies
                        .filter((c) => c.id !== selectedCurrency?.id)
                        .map((c) => {
                          // Importe real de esa moneda: en CUP se cobra con
                          // margen, en el resto de monedas sin margen.
                          const base =
                            c.code === "CUP"
                              ? saving.totalWithMarginCup
                              : saving.totalWithoutMarginCup;
                          const converted = cupCurrency
                            ? Math.round(
                                (base / cupCurrency.exchangeRate) *
                                  c.exchangeRate *
                                  100,
                              ) / 100
                            : base;
                          return (
                            <div
                              key={c.id}
                              className="rounded-md bg-background px-2.5 py-1 text-xs"
                            >
                              <span className="text-muted-foreground">
                                {c.code}:{" "}
                              </span>
                              <span className="font-semibold">
                                {c.symbol}
                                {converted.toFixed(2)}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                    {selectedCurrency?.code === "CUP" && saving.savingCup > 0 && (
                      <SavingHint
                        className="mt-2"
                        currencyCode="USD"
                        currencySymbol={usdCurrency?.symbol || "$"}
                        amount={usdTotal}
                        savingCup={saving.savingCup}
                        savingPct={saving.savingPct}
                        showAmount={false}
                      />
                    )}
                  </div>
                )}
              </div>
            </Section>
          </form>

          {/* Columna derecha — resumen */}
          <aside className="lg:sticky lg:top-20 lg:h-fit">
            <div className="rounded-xl border bg-card">
              <div className="border-b px-4 py-3 sm:px-5">
                <h2 className="flex items-center gap-2 text-sm font-semibold">
                  <ShoppingBag className="h-4 w-4 text-primary" />
                  Resumen del pedido
                </h2>
              </div>

              <div className="max-h-64 space-y-3 overflow-y-auto px-4 py-4 sm:px-5">
                {items.map((item) => {
                  const priceConv = convertAmount(itemDisplayCup(item.product));
                  const totalConv = priceConv * item.quantity;
                  return (
                    <div key={item.product.id} className="flex gap-3">
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
                        <ProductImage
                          image={item.product.image}
                          alt={item.product.name}
                          width={128}
                          sizes="56px"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 text-sm font-medium">
                          {item.product.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          × {item.quantity}
                        </p>
                        <p className="mt-0.5 text-sm font-semibold">
                          {selectedCurrency?.symbol}
                          {totalConv.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2.5 border-t px-4 py-4 sm:px-5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>
                    {selectedCurrency?.symbol}
                    {subtotalConverted.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Truck className="h-3.5 w-3.5" /> Envío
                  </span>
                  {isFreeShipping ? (
                    <span className="font-semibold text-emerald-600">Gratis</span>
                  ) : (
                    <span>
                      {selectedZone
                        ? `${selectedCurrency?.symbol}${deliveryFeeConverted.toFixed(2)}`
                        : "—"}
                    </span>
                  )}
                </div>
                {freeShippingMin > 0 && !isFreeShipping && (
                  <p className="text-sm text-muted-foreground">
                    Envío gratis a partir de{" "}
                    <span className="font-semibold">
                      {selectedCurrency?.symbol}
                      {convertAmount(freeShippingMin).toFixed(2)}
                    </span>{" "}
                    {selectedCurrency?.code}
                  </p>
                )}
                {freeShippingMin > 0 && isFreeShipping && (
                  <p className="text-sm font-semibold text-emerald-600">¡Tienes envío gratis!</p>
                )}

                {operationalCostBase > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Gestión del pedido</span>
                    <span>
                      {selectedCurrency?.symbol}
                      {operationalCostConverted.toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="flex items-baseline justify-between border-t pt-3">
                  <span className="text-sm font-semibold">Total</span>
                  <span className="text-xl font-bold text-primary">
                    {selectedCurrency?.symbol}
                    {totalConverted.toFixed(2)}{" "}
                    <span className="text-sm font-medium">
                      {selectedCurrency?.code}
                    </span>
                  </span>
                </div>

                {cupCurrency && selectedCurrency?.code !== "CUP" && (
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>En {cupCurrency.code} serían</span>
                    <span>
                      {cupCurrency.symbol}
                      {saving.totalWithMarginCup.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              {address && (
                <div className="border-t px-4 py-3 sm:px-5">
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" /> Entregar en
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-sm">{address}</p>
                </div>
              )}

              <div className="hidden border-t px-4 py-4 sm:px-5 lg:block">
                <Button
                  className="min-h-[44px] w-full gap-2"
                  size="lg"
                  onClick={() => handleSubmit()}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Procesando…
                    </>
                  ) : (
                    <>
                      Confirmar pedido <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>

                <div className="mt-3 flex justify-center gap-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Shield className="h-3 w-3" /> Pago seguro
                  </span>
                  <span className="flex items-center gap-1">
                    <Truck className="h-3 w-3" /> Entregas máx. en 48h
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Barra inferior fija en móvil */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur lg:hidden">
        <div className="container mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="truncate text-lg font-bold text-primary">
              {selectedCurrency?.symbol}
              {totalConverted.toFixed(2)}{" "}
              <span className="text-xs font-medium">
                {selectedCurrency?.code}
              </span>
            </p>
          </div>
          <Button
            className="min-h-[44px] shrink-0 gap-2"
            size="lg"
            onClick={() => handleSubmit()}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Procesando…
              </>
            ) : (
              <>
                Confirmar <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}