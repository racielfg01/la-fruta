/**
 * Ayudantes sin dependencias para leer celdas de una plantilla de precios.
 * Los comparten las plantillas de zonas de envío y de productos.
 */

/** Minúsculas, sin tildes y con espacios colapsados, para comparar nombres. */
export function normalizeTextKey(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Convierte el valor de precio de una celda a número.
 * Acepta 1234.5, "1234,5", "1.234,50", " 350 " y "$ 350".
 * Devuelve null si no es un precio válido (vacío, texto o negativo).
 */
export function parsePriceValue(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;

  let raw: string;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return null;
    return value < 0 ? null : value;
  }

  raw = value.replace(/[^\d.,-]/g, "").trim();
  if (!raw) return null;

  const hasComma = raw.includes(",");
  const hasDot = raw.includes(".");

  if (hasComma && hasDot) {
    // El separador que aparece más a la derecha es el decimal.
    const decimal = raw.lastIndexOf(",") > raw.lastIndexOf(".") ? "," : ".";
    const thousands = decimal === "," ? "." : ",";
    raw = raw.split(thousands).join("").replace(decimal, ".");
  } else if (hasComma) {
    raw = raw.replace(",", ".");
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}
