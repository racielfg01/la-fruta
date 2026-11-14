"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/lib/auth-context";
import { useAdminStore } from "@/lib/admin-store";
import { getSettingsAction, updateSettingsAction, getBankAccountsAction } from "@/app/actions/admin-extras";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useSettingsStore, type StoreSettings } from "@/lib/settings-store";
import {
  paymentMethodWarnings,
  isCashSupported,
  paymentMethodWarningText,
  type PaymentMethodAudit,
} from "@/lib/payment-methods";

import BancosTab from "./bancos-tab";

const DEFAULTS: StoreSettings = {
  storeName: "",
  storeDescription: "",
  logo: "",
  theme: "system",
  font: "poppins",
  background_color: "",
  primary_color: "",
  accent_color: "",
  success_color: "",
  warning_color: "",
  light_background_color: "",
  light_primary_color: "",
  light_accent_color: "",
  light_success_color: "",
  light_warning_color: "",
  font_family: "",
  priceMargin: 0,
  operationalCost: 0,
  showPaymentCash: true,
  showPaymentTransfer: true,
  whatsappPhone: "",
  freeShippingMin: 0,
  storeSchedule: "",
};

export default function MetodosPagoTab() {
  const token = useAuthStore((s) => s.token);
  const currencies = useAdminStore((s) => s.currencies);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<"cash" | "transfer" | null>(null);
  const [form, setForm] = useState<StoreSettings>(DEFAULTS);
  const [accounts, setAccounts] = useState<any[]>([]);

  const setSettings = useSettingsStore((s) => s.setSettings);

  const load = useCallback(async () => {
    if (!token) return;
    const [s, accs] = await Promise.all([
      getSettingsAction(token),
      getBankAccountsAction(token).catch(() => [] as any[]),
    ]);
    const merged = { ...DEFAULTS, ...s };
    setForm(merged);
    setSettings(merged);
    setAccounts(accs);
    setLoading(false);
  }, [token, setSettings]);

  useEffect(() => {
    if (token) load();
  }, [token, load]);

  const savePayment = useCallback(
    async (partial: Partial<StoreSettings>, methodId: "cash" | "transfer") => {
      if (!token) return;
      const next = { ...form, ...partial };
      setForm(next);
      setSavingId(methodId);
      try {
        await updateSettingsAction(next, token);
        setSettings(next);
        toast.success("Métodos de pago actualizados");
      } catch {
        setForm((prev) => ({ ...prev, ...partial }));
        toast.error("Error al actualizar los métodos de pago");
      } finally {
        setSavingId(null);
      }
    },
    [token, form, setSettings],
  );

  const audit: PaymentMethodAudit = {
    cashEnabled: form.showPaymentCash ?? false,
    transferEnabled: form.showPaymentTransfer ?? false,
    usableAccounts: accounts.filter(
      (a) => a.active && (a.transferLimit === 0 || a.transferCount < a.transferLimit)
    ).length,
    configuredAccounts: accounts.length,
    cashCurrencyAvailable:
      !!form.showPaymentCash &&
      currencies.some((c) => c.isActive && isCashSupported(c.code)),
  };

  const warnings = paymentMethodWarnings(audit);

  if (loading) {
    return <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />;
  }

  return (
    <div className="space-y-6">
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
              checked={form.showPaymentCash ?? false}
              disabled={savingId === "cash"}
              onCheckedChange={(v) => void savePayment({ showPaymentCash: v as boolean }, "cash")}
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-sm">
                Transferencias y pagos digitales
              </p>
              <p className="text-xs text-muted-foreground">
                Zelle, USDT y cuentas bancarias; sube comprobante
              </p>
            </div>
            <Switch
              checked={form.showPaymentTransfer ?? false}
              disabled={savingId === "transfer"}
              onCheckedChange={(v) => void savePayment({ showPaymentTransfer: v as boolean }, "transfer")}
            />
          </div>

          {warnings.length > 0 && (
            <div className="space-y-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm dark:bg-amber-950/30 dark:border-amber-800">
              <p className="font-medium text-amber-800 dark:text-amber-200">
                Hay un problema con los métodos de pago
              </p>
              <ul className="space-y-1 text-amber-700 dark:text-amber-300">
                {warnings.map((w) => (
                  <li key={w}>{paymentMethodWarningText(w)}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <BancosTab onChanged={load} />
    </div>
  );
}
