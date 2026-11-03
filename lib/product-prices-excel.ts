/**
 * Lógica pura del intercambio de precios de productos en Excel.
 * Sin dependencias: solo transforma filas ya leídas.
 */

import { normalizeTextKey, parsePriceValue } from "./sheet-values";

export interface ProductTemplateRow {
  product: string;
  category: string;
  price: number;
}

export interface ProductRowInput {
  /** Número de fila en el archivo, para los mensajes de error. */
  row: number;
  product: string;
  category: string;
  price: string | number;
}

export interface ExistingProductRef {
  id: string;
  name: string;
  price: number;
  category?: string;
}

export interface ProductPriceUpdate {
  id: string;
  product: string;
  category: string;
  price: number;
}

export interface ProductRowError {
  row: number;
  message: string;
}

export interface ProductImportPlan {
  /** Solo precios: la plantilla nunca crea productos. */
  updates: ProductPriceUpdate[];
  errors: ProductRowError[];
}

/** Filas de la plantilla: categoría y nombre, ordenadas para revisarlas fácil. */
export function buildProductTemplateRows(
  products: Pick<ExistingProductRef, "name" | "price" | "category">[]
): ProductTemplateRow[] {
  return products
    .map((product) => ({
      product: product.name,
      category: product.category ?? "",
      price: product.price,
    }))
    .sort((a, b) => {
      // Los productos sin categoría van al final.
      const emptyA = a.category ? 0 : 1;
      const emptyB = b.category ? 0 : 1;
      return (
        emptyA - emptyB ||
        a.category.localeCompare(b.category, "es") ||
        a.product.localeCompare(b.product, "es")
      );
    });
}

/**
 * Decide qué precios actualizar y qué filas rechazar, sin tocar la base de datos.
 * Empareja por nombre de producto, ignorando mayúsculas y tildes.
 * La categoría es solo informativa: no se escribe.
 */
export function planProductPriceImport(
  rows: ProductRowInput[],
  existingProducts: ExistingProductRef[]
): ProductImportPlan {
  const plan: ProductImportPlan = { updates: [], errors: [] };
  const seen = new Set<string>();

  const productsByKey = new Map<string, ExistingProductRef>();
  for (const product of existingProducts) {
    const key = normalizeTextKey(product.name);
    if (key && !productsByKey.has(key)) productsByKey.set(key, product);
  }

  for (const row of rows) {
    const key = normalizeTextKey(row.product);
    if (!key) {
      plan.errors.push({ row: row.row, message: "Falta el nombre del producto" });
      continue;
    }

    const price = parsePriceValue(row.price);
    if (price === null) {
      plan.errors.push({
        row: row.row,
        message: `Precio inválido para "${row.product}": "${row.price}"`,
      });
      continue;
    }

    if (seen.has(key)) {
      plan.errors.push({
        row: row.row,
        message: `Fila repetida: "${row.product}" ya apareció antes en este archivo`,
      });
      continue;
    }
    seen.add(key);

    const match = productsByKey.get(key);
    if (!match) {
      plan.errors.push({
        row: row.row,
        message: `Producto no encontrado: "${row.product}"`,
      });
      continue;
    }

    plan.updates.push({
      id: match.id,
      product: match.name,
      category: match.category ?? "",
      price,
    });
  }

  return plan;
}

/** Cuerpo mínimo para actualizar un producto: solo cambia el precio. */
export function buildProductPriceUpdate(price: number): { price: number } {
  return { price };
}
