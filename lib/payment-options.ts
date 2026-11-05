/**
 * Opciones de pago del checkout: efectivo por moneda y un tile por banco
 * activo, armados desde Configuración → Bancos y cuentas. Sin React ni
 * PocketBase para poder probarlo con vitest.
 */
import {
  isCashSupported,
  resolveVisiblePaymentMethodIds,
} from "./payment-methods";

export interface OptionCurrency {
  id: string;
  code: string;
  symbol: string;
}

export interface OptionBank {
  id: string;
  name: string;
  logo?: string;
  currency?: string;
}

export interface OptionAccount {
  id: string;
  bankId: string;
  currency: string;
  accountType?: string;
  transferLimit: number;
  transferCount: number;
}

export interface PaymentOption {
  id: string;
  kind: "cash" | "bank";
  currencyCode: string;
  label: string;
  subtitle: string;
  logo?: string;
  bankId?: string;
  accountIds: string[];
  available: boolean;
  reason?: string;
}

const CASH_ORDER: Record<string, number> = { USD: 0, CUP: 1 };

function cashRank(code: string): number {
  return CASH_ORDER[code] ?? 2;
}

function hasCapacity(account: OptionAccount): boolean {
  return !(
    account.transferLimit > 0 &&
    account.transferCount >= account.transferLimit
  );
}

export function buildPaymentOptions(input: {
  currencies: OptionCurrency[];
  banks: OptionBank[];
  accounts: OptionAccount[];
  showCash: boolean;
  showBanks: boolean;
}): PaymentOption[] {
  const visible = resolveVisiblePaymentMethodIds({
    showCash: input.showCash,
    showTransfer: input.showBanks,
  });

  const cashOptions: PaymentOption[] = visible.includes("cash")
    ? input.currencies
        .filter((currency) => isCashSupported(currency.code))
        .sort(
          (a, b) =>
            cashRank(a.code) - cashRank(b.code) ||
            a.code.localeCompare(b.code),
        )
        .map((currency) => ({
          id: `cash:${currency.code}`,
          kind: "cash",
          currencyCode: currency.code,
          label: currency.code,
          subtitle: "Efectivo",
          accountIds: [],
          available: true,
        }))
    : [];

  const bankOptions: PaymentOption[] = visible.includes("transfer")
    ? [...input.banks]
        .sort((a, b) => a.name.localeCompare(b.name, "es"))
        .flatMap((bank) => {
          const usableAccounts = input.accounts.filter(
            (account) => account.bankId === bank.id && hasCapacity(account),
          );
          const currencyCode =
            bank.currency?.trim() ||
            usableAccounts[0]?.currency ||
            "";

          // Sin moneda no hay tasa con la que cobrar; sin moneda activa
          // tampoco: el tile no se muestra.
          if (
            !currencyCode ||
            !input.currencies.some((c) => c.code === currencyCode)
          ) {
            return [];
          }

          const accounts = usableAccounts.filter(
            (account) => account.currency === currencyCode,
          );
          const available = accounts.length > 0;

          return [
            {
              id: `bank:${bank.id}`,
              kind: "bank" as const,
              currencyCode,
              label: bank.name,
              subtitle: accounts[0]?.accountType?.trim() || currencyCode,
              logo: bank.logo || undefined,
              bankId: bank.id,
              accountIds: accounts.map((account) => account.id),
              available,
              reason: available
                ? undefined
                : `No hay cuentas activas en ${currencyCode}.`,
            },
          ];
        })
    : [];

  return [...cashOptions, ...bankOptions];
}
