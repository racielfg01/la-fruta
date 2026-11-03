/**
 * Regla de selección de moneda para la tienda.
 * CUP es la moneda local y la que se usa por defecto.
 */

export interface SelectableCurrency {
  id: string;
  code: string;
  isDefault: boolean;
}

/**
 * Devuelve la moneda a mostrar.
 * Manda la elección explícita del usuario; si no hay (o ya no existe),
 * CUP, luego la marcada como predeterminada y, por último, la primera.
 */
export function chooseCurrency<T extends SelectableCurrency>(
  currencies: T[],
  preferredId?: string | null
): T | null {
  if (currencies.length === 0) return null;

  if (preferredId) {
    const preferred = currencies.find((c) => c.id === preferredId);
    if (preferred) return preferred;
  }

  return (
    currencies.find((c) => c.code.toUpperCase() === "CUP") ||
    currencies.find((c) => c.isDefault) ||
    currencies[0]
  );
}
