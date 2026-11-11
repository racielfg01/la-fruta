// lib/offers.ts
// Dominio de ofertas: tipos y helpers puros (sin E/S). Las acciones de
// servidor viven en app/actions/admin.ts (CRUD admin) y
// app/actions/public-offers.ts (portada).

export type OfferType = "combo" | "product";

/** Una oferta tal cual vive en la base de datos. `product_id` es "" si es combo. */
export interface AdminOffer {
  id: string;
  name: string;
  description: string;
  price: number;
  type: OfferType;
  product_id: string;
  image: string;
  /** Fecha de vencimiento ISO 8601. */
  end_date: string;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

/** Versión pública para la portada: sin campos internos. */
export interface PublicOffer {
  id: string;
  name: string;
  description: string;
  price: number;
  type: OfferType;
  /** Producto subyacente (rebaja) o "" (combo). */
  productId: string;
  image: string;
  endDate: string;
  active: boolean;
}

/** Datos que recibe el server action para crear/editar una oferta. */
export interface OfferInput {
  name: string;
  description: string;
  price: number;
  type: OfferType;
  productId: string;
  image: string;
  endDate: string;
  active: boolean;
}

/** Normaliza un registro crudo de PocketBase a AdminOffer. */
export function toAdminOffer(rec: Record<string, any>): AdminOffer {
  return {
    id: rec.id,
    name: rec.name ?? "",
    description: rec.description ?? "",
    price: Number(rec.price ?? 0),
    type: rec.type === "product" ? "product" : "combo",
    product_id: String(rec.product_id ?? ""),
    image: rec.image ?? "",
    end_date: rec.end_date ?? "",
    active: rec.active !== false,
    created_at: rec.created_at ?? undefined,
    updated_at: rec.updated_at ?? undefined,
  };
}

/**
 * ¿La oferta está vigente? Debe estar activa y con fecha límite por delante.
 * Sin fecha (o fecha inútil) cuenta como vigente «infinita».
 */
export function isOfferActive(
  o: {
    active?: boolean | null;
    end_date?: string | null;
  },
  now: number = Date.now()
): boolean {
  if (o.active === false) return false;
  const raw = String(o.end_date ?? "").trim();
  if (!raw) return true;
  const t = new Date(raw.replace(" ", "T")).getTime();
  // NaN o época negativa (p. ej. "0000-01-01…"): sin límite real.
  if (Number.isNaN(t) || t <= 0) return true;
  return now < t;
}

export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

/**
 * Descompone el tiempo restante hasta el vencimiento para el contador
 * descendente de la portada. Acepta ISO y el formato de PocketBase
 * (espacio en vez de T). Devuelve null si la fecha no es utilizable
 * (oferta sin límite: no hay nada que contar).
 */
export function countdownParts(
  endDate: string,
  now: number = Date.now()
): CountdownParts | null {
  const raw = String(endDate ?? "").trim();
  const t = raw ? new Date(raw.replace(" ", "T")).getTime() : NaN;
  if (Number.isNaN(t) || t <= 0) return null;
  const total = Math.max(0, Math.floor((t - now) / 1000));
  return {
    days: Math.floor(total / 86_400),
    hours: Math.floor((total % 86_400) / 3_600),
    minutes: Math.floor((total % 3_600) / 60),
    seconds: total % 60,
  };
}

/** Filtra una lista de ofertas dejando solo las vigentes. */
export function filterActiveOffers(list: AdminOffer[]): AdminOffer[] {
  return list.filter(isOfferActive);
}

/** Convierte una AdminOffer en su versión pública. */
export function toPublicOffer(o: AdminOffer): PublicOffer {
  return {
    id: o.id,
    name: o.name,
    description: o.description,
    price: o.price,
    type: o.type,
    productId: o.product_id,
    image: o.image,
    endDate: o.end_date,
    active: o.active !== false,
  };
}

/**
 * Convierte el valor de un `datetime-local` (o la fecha ISO/PU — PB devuelve
 * "YYYY-MM-DD HH:MM:SS" con espacio) a ISO 8601 UTC. Si no se puede parsear,
 * devuelve «ahora».
 */
export function toIsoOfferDate(v: string): string {
  if (v?.trim()) {
    const direct = new Date(v).getTime();
    const spaced = new Date(v.replace(" ", "T")).getTime();
    const t = Number.isNaN(direct) ? spaced : direct;
    if (!Number.isNaN(t)) return new Date(t).toISOString();
  }
  return new Date().toISOString();
}

/** ¿Es una fecha límite utilizable (datetime-local, ISO o formato PB)? */
export function isValidOfferEndDate(v: string): boolean {
  if (!v?.trim()) return false;
  return !Number.isNaN(new Date(v.replace(" ", "T")).getTime());
}

/** Valida los campos de una oferta antes de crearla/editarla. */
export function validateOfferInput(
  f: {
    name: string;
    description: string;
    price: string | number;
    type: string;
    productId: string;
    image: string;
    endDate: string;
    active: boolean;
  }
): boolean {
  if (!f.name?.trim()) return false;
  if (!f.description?.trim()) return false;
  const price = Number(f.price);
  if (!Number.isFinite(price) || price <= 0) return false;
  if (!isValidOfferEndDate(f.endDate)) return false;
  // Una rebaja necesita el producto que la respalda.
  if (f.type === "product" && !f.productId) return false;
  return true;
}

/** Convierte un importe CUP a otra moneda según la tasa (CUP por unidad). */
export function toUsdAmount(cupAmount: number, exchangeRate: number): number {
  const factor = exchangeRate || 1;
  return cupAmount / factor;
}

/** Ids de productos que aparecen en las ofertas (rebajas y combos). */
export function offerLineTargets(
  offers: Array<{ type: OfferType | string; product_id: string }>
): string[] {
  const ids: string[] = [];
  for (const o of offers) {
    if (o.product_id) ids.push(o.product_id);
  }
  return Array.from(new Set(ids));
}
