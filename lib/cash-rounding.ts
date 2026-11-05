/**
 * Redondeo de efectivo hacia arriba a la unidad pagable con billetes.
 *
 * - USD: billetes de 1, 5, 10, 20, 50 y 100 → cualquier entero se paga exacto.
 * - CUP: billetes de 100 a 20 000 → cualquier múltiplo de 100 se paga exacto.
 *
 * Redondear al máximo común divisor de los billetes evita dar vuelto: no hace
 * falta que el importe coincida con un billete, basta con que sea combinable.
 */
const CASH_ROUNDING_UNITS: Record<string, number> = {
  USD: 1,
  CUP: 100,
};

export function roundCashUp(amount: number, currencyCode: string): number {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) return 0;

  const unit = CASH_ROUNDING_UNITS[currencyCode];
  if (!unit) return Math.round(value * 100) / 100;

  // El epsilon evita subir un escalón por ruido de coma flotante (12.0000000001).
  return Math.ceil(value / unit - 1e-9) * unit;
}
