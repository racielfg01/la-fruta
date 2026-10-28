"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/lib/auth-context";
import { useSettingsStore, applyBrandCSS } from "@/lib/settings-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageUpload } from "@/components/upload-button";
import { Switch } from "@/components/ui/switch";
import { getSettingsAction, updateSettingsAction } from "@/app/actions/admin-extras";
import { Save, Palette, RotateCcw, Loader2, Moon, Sun, MessageCircle } from "lucide-react";
import { normalizeWhatsAppPhone } from "@/lib/whatsapp";
import { toast } from "sonner";
import type { StoreSettings } from "@/lib/settings-store";

const DEFAULTS: StoreSettings = {
  storeName: "MercaToma",
  storeDescription: "Productos frescos de la granja entregados en la puerta de su casa.",
  logo: "/android/launchericon-96x96.png",
  theme: "system",
  font: "poppins",
  background_color: "#0D1b2a",
  primary_color: "#1e3a8a",
  accent_color: "#0ea5a5",
  success_color: "#22c55e",
  warning_color: "#Facc15",
  light_background_color: "#f4f7fb",
  light_primary_color: "#1e3a8a",
  light_accent_color: "#0ea5a5",
  light_success_color: "#16a34a",
  light_warning_color: "#d97706",
  font_family: "Manrope, sans-serif",
  priceMargin: 0,
  operationalCost: 0,
  showPaymentCash: true,
  showPaymentTransfer: true,
  whatsappPhone: "",
  freeShippingMin: 0,
};

export default function ConfiguracionPage() {
  const token = useAuthStore((s) => s.token);
  const setSettings = useSettingsStore((s) => s.setSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<StoreSettings>(DEFAULTS);

  useEffect(() => {
    if (!token) return;
    getSettingsAction(token)
      .then((s) => {
        const merged = { ...DEFAULTS, ...s };
        setForm(merged);
        applyBrandCSS(merged);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const update = useCallback((partial: Partial<StoreSettings>) =>
    setForm((prev) => ({ ...prev, ...partial })), []);

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    try {
      await updateSettingsAction(form, token);
      setSettings(form);
      applyBrandCSS(form);
      toast.success("Configuración guardada correctamente");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      toast.error("Error al guardar la configuración");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setForm(DEFAULTS);
    applyBrandCSS(DEFAULTS);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Ajustes Generales</h2>
        <p className="text-muted-foreground">Personaliza la apariencia de la plataforma</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Vista previa */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Vista previa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="flex flex-col items-start gap-4 rounded-lg border p-4 sm:flex-row sm:items-center"
                style={{ fontFamily: form.font_family || DEFAULTS.font_family }}
              >
                <div
                  className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: form.primary_color || DEFAULTS.primary_color }}
                >
                  {form.logo ? (
                    <img src={form.logo} alt="Logo" className="max-h-10 max-w-10 rounded object-contain" />
                  ) : (
                    <span className="text-lg font-bold text-white">M</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{form.storeName}</span>
                  <p className="text-xs" style={{ color: form.accent_color || DEFAULTS.accent_color }}>
                    {form.storeDescription}
                  </p>
                </div>
                <div className="ml-auto flex flex-shrink-0 gap-2">
                  <div className="h-6 w-6 rounded-full border" style={{ backgroundColor: form.primary_color || DEFAULTS.primary_color }} />
                  <div className="h-6 w-6 rounded-full border" style={{ backgroundColor: form.accent_color || DEFAULTS.accent_color }} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Nombre y logo */}
          <Card>
            <CardHeader>
              <CardTitle>Nombre de la tienda</CardTitle>
              <CardDescription>El nombre se muestra en el encabezado y en la PWA</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field>
                <FieldLabel>Nombre</FieldLabel>
                <Input
                  value={form.storeName}
                  onChange={(e) => update({ storeName: e.target.value })}
                  placeholder="Ej: MercaToma"
                />
              </Field>
              <Field>
                <FieldLabel>Descripción</FieldLabel>
                <Input
                  value={form.storeDescription}
                  onChange={(e) => update({ storeDescription: e.target.value })}
                  placeholder="Descripción corta de la tienda"
                />
              </Field>
              <Field>
                <FieldLabel>Logo</FieldLabel>
                <div className="flex items-center gap-3">
                  {form.logo && (
                    <img src={form.logo} alt="Logo" className="h-12 w-12 rounded-full object-cover border" />
                  )}
                  <div className="flex-1 flex gap-2">
                    <Input
                      value={form.logo}
                      onChange={(e) => update({ logo: e.target.value })}
                      placeholder="URL del logo"
                      className="flex-1"
                    />
                    <ImageUpload
                      endpoint="categoryImage"
                      onUploadComplete={(url) => update({ logo: url })}
                    />
                  </div>
                </div>
              </Field>
            </CardContent>
          </Card>

          {/* Contacto y soporte */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Contacto y soporte
              </CardTitle>
              <CardDescription>
                Botón de WhatsApp en la tienda para que los clientes te
                escriban directamente.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field>
                <FieldLabel>Número de WhatsApp</FieldLabel>
                <Input
                  value={form.whatsappPhone ?? ""}
                  onChange={(e) => update({ whatsappPhone: e.target.value })}
                  placeholder="Ej: +53 5555 1234"
                  inputMode="tel"
                />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Incluye el código de país. El enlace usa solo los dígitos. Si
                  lo dejas vacío, el botón no aparece en la tienda.
                </p>
              </Field>
              {normalizeWhatsAppPhone(form.whatsappPhone).length >= 8 && (
                <p className="text-xs text-muted-foreground">
                  Se abrirá{" "}
                  <span className="font-mono text-foreground">
                    wa.me/{normalizeWhatsAppPhone(form.whatsappPhone)}
                  </span>
                </p>
              )}
            </CardContent>
          </Card>

          {/* Precios y márgenes */}
          <Card>
            <CardHeader>
              <CardTitle>Precios y márgenes</CardTitle>
              <CardDescription>
                Margen de ganancia (%) sobre el precio base en CUP. Se aplica
                solo al precio en CUP y a las órdenes pagadas en CUP; USD y
                demás monedas muestran el precio base.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>Margen global (%)</FieldLabel>
                <Input
                  type="number"
                  min={0}
                  step="0.1"
                  value={form.priceMargin ?? 0}
                  onChange={(e) => update({ priceMargin: Math.max(0, Number(e.target.value) || 0) })}
                  placeholder="0"
                />
              </Field>
              <Field>
                <FieldLabel>Costos operativos (CUP, por orden)</FieldLabel>
                <Input
                  type="number"
                  min={0}
                  step="1"
                  value={form.operationalCost ?? 0}
                  onChange={(e) => update({ operationalCost: Math.max(0, Math.round(Number(e.target.value) || 0)) })}
                  placeholder="0"
                />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Número entero en CUP que se suma a cada orden; en USD se
                  muestra convertido con la tasa de cambio.
                </p>
              </Field>
              <Field className="sm:col-span-2">
                <FieldLabel>Envío gratis a partir de (CUP)</FieldLabel>
                <Input
                  type="number"
                  min={0}
                  step="1"
                  value={form.freeShippingMin ?? 0}
                  onChange={(e) => update({ freeShippingMin: Math.max(0, Math.round(Number(e.target.value) || 0)) })}
                  placeholder="0"
                />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Si el subtotal en CUP supera o iguala este monto, el envío es gratis. Deja en 0 para desactivarlo.
                </p>
              </Field>
            </CardContent>
          </Card>

          {/* Métodos de pago del checkout */}
          <Card>
            <CardHeader>
              <CardTitle>Métodos de pago del checkout</CardTitle>
              <CardDescription>
                Elige qué métodos ve el cliente al pagar. Si desactivas todos,
                se muestran ambos para no bloquear el checkout.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-sm">Efectivo</p>
                  <p className="text-xs text-muted-foreground">
                    Paga al recibir el pedido
                  </p>
                </div>
                <Switch
                  checked={form.showPaymentCash !== false}
                  onCheckedChange={(v) => update({ showPaymentCash: v })}
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-sm">Transferencia bancaria</p>
                  <p className="text-xs text-muted-foreground">
                    Sube comprobante de pago
                  </p>
                </div>
                <Switch
                  checked={form.showPaymentTransfer !== false}
                  onCheckedChange={(v) => update({ showPaymentTransfer: v })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Colores */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Colores
              </CardTitle>
              <CardDescription>Personaliza la paleta para cada modo</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="dark" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="dark" className="gap-2">
                    <Moon className="h-4 w-4" />
                    Modo oscuro
                  </TabsTrigger>
                  <TabsTrigger value="light" className="gap-2">
                    <Sun className="h-4 w-4" />
                    Modo claro
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="dark" className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {([
                      ["background_color", "Fondo", "#0D1b2a"],
                      ["primary_color", "Primario", "#1e3a8a"],
                      ["accent_color", "Acento", "#0ea5a5"],
                      ["success_color", "Éxito", "#22c55e"],
                      ["warning_color", "Alerta", "#Facc15"],
                    ] as const).map(([key, label, placeholder]) => (
                      <Field key={key}>
                        <FieldLabel>{label}</FieldLabel>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={form[key] || placeholder}
                            onChange={(e) => update({ [key]: e.target.value })}
                            className="h-9 w-9 cursor-pointer rounded border p-0.5"
                          />
                          <Input
                            value={form[key] || ""}
                            onChange={(e) => update({ [key]: e.target.value })}
                            placeholder={placeholder}
                          />
                        </div>
                      </Field>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="light" className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {([
                      ["light_background_color", "Fondo", "#f4f7fb"],
                      ["light_primary_color", "Primario", "#1e3a8a"],
                      ["light_accent_color", "Acento", "#0ea5a5"],
                      ["light_success_color", "Éxito", "#16a34a"],
                      ["light_warning_color", "Alerta", "#d97706"],
                    ] as const).map(([key, label, placeholder]) => (
                      <Field key={key}>
                        <FieldLabel>{label}</FieldLabel>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={form[key] || placeholder}
                            onChange={(e) => update({ [key]: e.target.value })}
                            className="h-9 w-9 cursor-pointer rounded border p-0.5"
                          />
                          <Input
                            value={form[key] || ""}
                            onChange={(e) => update({ [key]: e.target.value })}
                            placeholder={placeholder}
                          />
                        </div>
                      </Field>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Tipografía */}
          <Card>
            <CardHeader>
              <CardTitle>Tipografía</CardTitle>
              <CardDescription>Fuente principal de la plataforma</CardDescription>
            </CardHeader>
            <CardContent>
              <Field>
                <FieldLabel>Fuente</FieldLabel>
                <select
                  value={form.font_family || DEFAULTS.font_family}
                  onChange={(e) => update({ font_family: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="Manrope, sans-serif">Manrope</option>
                  <option value="Poppins, sans-serif">Poppins</option>
                  <option value="Inter, sans-serif">Inter</option>
                </select>
              </Field>
            </CardContent>
          </Card>

          {/* Botones */}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
            <Button onClick={handleSave} disabled={saving || saved} className="w-full sm:w-auto">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {saved ? "Guardado" : "Guardar cambios"}
            </Button>
            <Button variant="outline" onClick={handleReset} className="w-full sm:w-auto sm:flex-1">
              <RotateCcw className="mr-2 h-4 w-4" />
              Restaurar valores por defecto
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
