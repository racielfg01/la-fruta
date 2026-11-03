/**
 * La colección `orders` de PocketBase no conserva los campos de sistema
 * `created`/`updated`: tiene campos autodate propios llamados
 * `created_at`/`updated_at`. Aquí se resuelven ambos casos en un solo lugar.
 */

/**
 * PocketBase devuelve las fechas como "YYYY-MM-DD HH:mm:ss.sssZ". El espacio
 * no forma parte del formato ISO y algunos navegadores no lo parsean, así que
 * se normaliza a "YYYY-MM-DDTHH:mm:ss.sssZ".
 */
export function toIsoDate(value: unknown): string {
  if (value === null || value === undefined) return "";
  const raw = String(value).trim();
  if (!raw) return "";
  return raw.replace(" ", "T");
}

export function orderDates(record: Record<string, any> | null | undefined): {
  createdAt: string;
  updatedAt: string;
} {
  return {
    createdAt: toIsoDate(
      record?.created ?? record?.created_at ?? record?.createdAt
    ),
    updatedAt: toIsoDate(
      record?.updated ?? record?.updated_at ?? record?.updatedAt
    ),
  };
}

/** Fecha legible para la UI; nunca devuelve "Invalid Date". */
export function formatOrderDate(value: unknown): string {
  const iso = toIsoDate(value);
  if (!iso) return "Fecha no disponible";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Fecha no disponible";
  return date.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

