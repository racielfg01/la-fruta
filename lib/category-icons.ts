/**
 * Iconos SVG de categorías.
 *
 * Los nombres llegan desde PocketBase (los pone el admin), así que solo se
 * aceptan claves de una lista cerrada: nunca se renderiza SVG arbitrario.
 * Una categoría sin icono se muestra sin él; no se inventa uno.
 */

const ICONS: Record<string, string> = {
  huevos: "/categorias/huevos.svg",
  huevo: "/categorias/huevos.svg",
  eggs: "/categorias/huevos.svg",
  frutas: "/categorias/frutas.svg",
  fruta: "/categorias/frutas.svg",
  fruits: "/categorias/frutas.svg",
  vegetales: "/categorias/vegetales.svg",
  verduras: "/categorias/vegetales.svg",
  vegetables: "/categorias/vegetales.svg",
  citricos: "/categorias/citricos.svg",
  citrus: "/categorias/citricos.svg",
  bayas: "/categorias/bayas.svg",
  berries: "/categorias/bayas.svg",
  tropicales: "/categorias/tropicales.svg",
  tropical: "/categorias/tropicales.svg",
  melones: "/categorias/melones.svg",
  melons: "/categorias/melones.svg",
  tuberculos: "/categorias/tuberculos.svg",
  roots: "/categorias/tuberculos.svg",
  hortalizas: "/categorias/hortalizas.svg",
  greens: "/categorias/hortalizas.svg",
  hierbas: "/categorias/hierbas.svg",
  herbs: "/categorias/hierbas.svg",
};

export function normalizeCategoryKey(value: string): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function categoryIcon(name: string): string | null {
  return ICONS[normalizeCategoryKey(name)] ?? null;
}
