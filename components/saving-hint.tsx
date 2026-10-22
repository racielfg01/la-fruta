'use client';

import { TrendingDown } from 'lucide-react';
import { formatCupAmount } from '@/lib/usd-saving';

interface SavingHintProps {
  /** Código de la moneda en la que se comparte (USD). */
  currencyCode: string;
  /** Símbolo de esa moneda ($). */
  currencySymbol: string;
  /** Importe que se pagaría en esa moneda. */
  amount: number;
  /** Ahorro en CUP al pagar en esa moneda. */
  savingCup: number;
  /** Porcentaje de ahorro sobre el total; se omite si es 0. */
  savingPct?: number;
  /** Etiqueta de la acción opcional (un clic). */
  actionLabel?: string;
  onAction?: () => void;
  /** Muestra el importe en la otra moneda; si es false, solo el ahorro. */
  showAmount?: boolean;
  className?: string;
}

/**
 * Aviso discreto pero explícito: cuánto cuesta en otra moneda y cuánto se
 * ahorra respecto a pagar en CUP. El número va en su propia cifra para que se
 * lea de un vistazo, sin gritar.
 */
export default function SavingHint({
  currencyCode,
  currencySymbol,
  amount,
  savingCup,
  savingPct,
  actionLabel,
  onAction,
  showAmount = true,
  className,
}: SavingHintProps) {
  if (savingCup <= 0) return null;

  return (
    <div
      className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground ${className || ''}`}
    >
      <span className="inline-flex items-center gap-1.5">
        <TrendingDown className="h-3.5 w-3.5 shrink-0 text-green-600" />
        {showAmount ? (
          <span>
            En {currencyCode}:{' '}
            <span className="font-medium text-foreground">
              {currencySymbol}
              {amount.toFixed(2)}
            </span>
          </span>
        ) : (
          <span>
            Pagando en {currencyCode} ahorras{' '}
            <span className="font-medium text-green-600">{formatCupAmount(savingCup)}</span>
            {savingPct ? ` (${savingPct}%)` : ''}
          </span>
        )}
      </span>
      {showAmount && (
        <span>
          ahorras{' '}
          <span className="font-medium text-green-600">{formatCupAmount(savingCup)}</span>
          {savingPct ? ` (${savingPct}%)` : ''}
        </span>
      )}
      {onAction && actionLabel && (
        <button
          type="button"
          onClick={onAction}
          className="font-medium text-primary underline-offset-2 hover:underline"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
