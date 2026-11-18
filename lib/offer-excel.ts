/**
 * Lógica pura de la importación de ofertas en Excel. Sin ExcelJS: solo
 * transforma filas ya leídas y decide qué se puede crear.
 */
import { isValidOfferEndDate, toIsoOfferDate, type OfferType } from "./offers";
import { LEGACY_OFFER_CURRENCY } from "./offer-currency";
import { normalizeTextKey, parsePriceValue } from "./sheet-values";

/** Columnas de la plantilla. La moneda no va: toda oferta importada es CUP. */
export const OFFER_HEADERS = [
  "Nombre",
  "Descripción",
  "Tipo",
  "Producto",
  "Precio CUP",
  "Vence",
  "Activa",
] as const;

export interface OfferRowInput {
  /** Número de fila en el archivo, para los mensajes de error. */
  row: number;
  name: string;
  description: string;
  type: string;
  /** Nombre del producto en las rebajas; vacío en los combos. */
  product: string;
  price: string | number;
  /** Texto de fecha que entiende `datetime-local`. */
  endDate: string;
  active: string | boolean;
}

export interface OfferCreation {
  row: number;
  name: string;
  description: string;
  price: number;
  currencyCode: string;
  type: OfferType;
  productId: string;
  endDate: string;
  active: boolean;
}

export interface OfferRowError {
  row: number;
  message: string;
}

export interface OfferImportPlan {
  creates: OfferCreation[];
  errors: OfferRowError[];
}

export interface OfferNameRef {
  name: string;
}

export interface OfferProductRef {
  id: string;
  name: string;
}

function parseOfferType(value: string): OfferType | null {
  const key = normalizeTextKey(value);
  if (key === "combo") return "combo";
  if (["rebaja", "rebaja de producto", "producto", "product"].includes(key)) {
    return "product";
  }
  return null;
}

function parseActiveFlag(value: string | boolean): boolean | null {
  if (typeof value === "boolean") return value;
  const key = normalizeTextKey(value);
  if (!key) return true;
  if (["si", "s", "yes", "y", "true", "1", "activa", "activo"].includes(key)) return true;
  if (["no", "n", "false", "0", "inactiva", "inactivo"].includes(key)) return false;
  return null;
}

/**
 * Decide qué ofertas se pueden crear y qué filas se rechazan, sin tocar la
 * base de datos. El emparejamiento ignora mayúsculas y tildes, pero nunca
 * actualiza una oferta existente: un nombre dudoso se reporta como error.
 */
export function planOfferImport(
  rows: OfferRowInput[],
  existingOffers: OfferNameRef[],
  products: OfferProductRef[]
): OfferImportPlan {
  const plan: OfferImportPlan = { creates: [], errors: [] };
  const seen = new Set<string>();

  const existingNames = new Set(
    existingOffers.map((o) => normalizeTextKey(o.name)).filter(Boolean)
  );
  const productsByName = new Map<string, string>();
  for (const product of products) {
    const key = normalizeTextKey(product.name);
    if (key && !productsByName.has(key)) productsByName.set(key, product.id);
  }

  for (const row of rows) {
    const name = String(row.name ?? "").trim();
    const nameKey = normalizeTextKey(name);
    if (!nameKey) {
      plan.errors.push({ row: row.row, message: "Falta el nombre de la oferta" });
      continue;
    }
    if (existingNames.has(nameKey)) {
      plan.errors.push({
        row: row.row,
        message: `Ya existe una oferta con el nombre "${name}": no se sobrescribe`,
      });
      continue;
    }
    if (seen.has(nameKey)) {
      plan.errors.push({
        row: row.row,
        message: `Fila repetida: "${name}" ya apareció antes en este archivo`,
      });
      continue;
    }

    const description = String(row.description ?? "").trim();
    if (!description) {
      plan.errors.push({
        row: row.row,
        message: `Falta la descripción de "${name}"`,
      });
      continue;
    }

    const type = parseOfferType(String(row.type ?? ""));
    if (!type) {
      plan.errors.push({
        row: row.row,
        message: `Tipo no reconocido para "${name}": "${row.type}" (usa Combo o Rebaja)`,
      });
      continue;
    }

    const price = parsePriceValue(row.price);
    if (price === null || price <= 0) {
      plan.errors.push({
        row: row.row,
        message: `Precio inválido para "${name}": "${row.price}"`,
      });
      continue;
    }

    const endDate = String(row.endDate ?? "").trim();
    if (!isValidOfferEndDate(endDate)) {
      plan.errors.push({
        row: row.row,
        message: `Vencimiento inválido para "${name}": "${endDate}"`,
      });
      continue;
    }

    const active = parseActiveFlag(row.active);
    if (active === null) {
      plan.errors.push({
        row: row.row,
        message: `Valor de "Activa" no reconocido para "${name}": "${row.active}"`,
      });
      continue;
    }

    let productId = "";
    if (type === "product") {
      const productKey = normalizeTextKey(row.product);
      if (!productKey) {
        plan.errors.push({
          row: row.row,
          message: `Falta el producto de la rebaja "${name}"`,
        });
        continue;
      }
      const found = productsByName.get(productKey);
      if (!found) {
        plan.errors.push({
          row: row.row,
          message: `Producto no encontrado para "${name}": "${row.product}"`,
        });
        continue;
      }
      productId = found;
    }

    seen.add(nameKey);
    plan.creates.push({
      row: row.row,
      name,
      description,
      price,
      currencyCode: LEGACY_OFFER_CURRENCY,
      type,
      productId,
      endDate,
      active,
    });
  }

  return plan;
}

/** Registro de PocketBase para una oferta nueva del archivo. */
export function buildOfferCreateRecord(offer: OfferCreation) {
  return {
    name: offer.name,
    description: offer.description,
    price: offer.price,
    currency_code: LEGACY_OFFER_CURRENCY,
    type: offer.type,
    ...(offer.type === "product" && offer.productId
      ? { product_id: offer.productId }
      : {}),
    image: "",
    end_date: toIsoOfferDate(offer.endDate),
    active: offer.active,
  };
}
