/**
 * Iconos SVG de categorías.
 *
 * Los nombres llegan desde PocketBase (los pone el admin), así que solo se
 * aceptan claves de una lista cerrada: nunca se renderiza SVG arbitrario.
 * Una categoría sin icono se muestra sin él; no se inventa uno.
 */

const LABELS: Record<string, string> = {
  huevos: "Huevos",
  frutas: "Frutas",
  vegetales: "Vegetales",
  citricos: "Cítricos",
  bayas: "Bayas",
  tropicales: "Tropicales",
  melones: "Melones",
  tuberculos: "Tubérculos",
  hortalizas: "Hortalizas",
  hierbas: "Hierbas",
};

const PATHS: Record<string, string> = Object.fromEntries(
  Object.keys(LABELS).map((key) => [key, `/categorias/${key}.svg`])
);

/** Alias permitidos: nombres en español, ingleses y variantes del catálogo. */
const ALIASES: Record<string, string> = {
  huevos: "huevos",
  huevo: "huevos",
  eggs: "huevos",
  frutas: "frutas",
  fruta: "frutas",
  fruits: "frutas",
  vegetales: "vegetales",
  verduras: "vegetales",
  vegetables: "vegetales",
  citricos: "citricos",
  citrus: "citricos",
  bayas: "bayas",
  berries: "bayas",
  tropicales: "tropicales",
  tropical: "tropicales",
  melones: "melones",
  melons: "melones",
  tuberculos: "tuberculos",
  roots: "tuberculos",
  hortalizas: "hortalizas",
  greens: "hortalizas",
  hierbas: "hierbas",
  herbs: "hierbas",
};

export const CATEGORY_ICON_OPTIONS = Object.entries(LABELS).map(([key, label]) => ({
  key,
  label,
  src: PATHS[key],
}));

export function isValidCategoryIcon(key: string | null | undefined): key is string {
  return !!key && Object.prototype.hasOwnProperty.call(LABELS, key);
}

export function normalizeCategoryKey(value: string): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function categoryIcon(
  name: string,
  overrides?: Record<string, string> | null
): string | null {
  const chosen =
    overrides?.[name] ?? overrides?.[normalizeCategoryKey(name)] ?? null;
  if (isValidCategoryIcon(chosen)) return PATHS[chosen];
  const key = ALIASES[normalizeCategoryKey(name)];
  return key ? PATHS[key] : null;
}
