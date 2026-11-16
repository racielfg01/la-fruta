/**
 * Opciones de pago del checkout construidas desde los métodos de pago
 * configurados en /admin/configuracion?tab=metodos: un tile por método.
 */
import { isCashSupported, methodHasCapacity } from "./payment-methods";

export interface PaymentMethodOption {
  id: string;
  name: string;
  type: "cash" | "transfer";
  image?: string;
  currency: string;
  accountNumber?: string;
  accountType?: string;
  owner?: string;
  requiresReceipt: boolean;
  instructions?: string;
  transferLimit: number;
  transferCount: number;
  active: boolean;
  sort: number;
}

export interface PaymentOption {
  id: string;
  methodId: string;
  kind: "cash" | "transfer";
  currencyCode: string;
  label: string;
  subtitle: string;
  logo?: string;
  accountNumber?: string;
  accountType?: string;
  owner?: string;
  instructions?: string;
  requiresReceipt: boolean;
  available: boolean;
  reason?: string;
}

export function buildPaymentOptions(input: {
  methods: PaymentMethodOption[];
  activeCurrencyCodes: string[];
}): PaymentOption[] {
  const activeCurrencies = new Set(input.activeCurrencyCodes);

  return [...input.methods]
    .filter((m) => m.active)
    .sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name, "es"))
    .flatMap((method): PaymentOption[] => {
      const currencyCode = method.currency;
      // Sin moneda activa no hay tasa con la que cobrar: el tile no se muestra.
      if (!activeCurrencies.has(currencyCode)) return [];

      if (method.type === "cash") {
        if (!isCashSupported(currencyCode)) return [];
        return [
          {
            id: method.id,
            methodId: method.id,
            kind: "cash",
            currencyCode,
            label: method.name,
            subtitle: "Efectivo",
            logo: method.image || undefined,
            requiresReceipt: false,
            available: true,
          },
        ];
      }

      const available = methodHasCapacity(method);
      return [
        {
          id: method.id,
          methodId: method.id,
          kind: "transfer",
          currencyCode,
          label: method.name,
          subtitle: method.accountType?.trim() || "Transferencia",
          logo: method.image || undefined,
          accountNumber: method.accountNumber,
          accountType: method.accountType,
          owner: method.owner,
          instructions: method.instructions,
          requiresReceipt: method.requiresReceipt,
          available,
          reason: available
            ? undefined
            : "No hay cupo disponible para este método.",
        },
      ];
    });
}
