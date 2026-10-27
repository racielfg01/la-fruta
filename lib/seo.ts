/**
 * Datos y ayudas de SEO compartidos.
 *
 * El dominio sale de `NEXT_PUBLIC_SITE_URL` para poder probar en local sin
 * romper los canónicos; en producción cae al dominio real de la tienda.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://mercatoma.vercel.app"
).replace(/\/$/, "");

export const SITE_NAME = "MercaToma";

export const HOME_TITLE =
  "Verduras y viandas a domicilio en Santiago de Cuba";

export const SITE_DESCRIPTION =
  "Compra verduras, viandas y frutas frescas del campo y recíbelas en tu casa en Santiago de Cuba. Pago en efectivo y pedidos por WhatsApp.";

export const WHATSAPP_PHONE = "5352013998";
export const WHATSAPP_DISPLAY = "+53 5201 3998";

/** Convierte una ruta o URL relativa en absoluta para canónicos y JSON-LD. */
export function absoluteUrl(path: string): string {
  try {
    return new URL(path, `${SITE_URL}/`).toString();
  } catch {
    return SITE_URL;
  }
}

/** Recorta a `max` sin partir palabras, para descripciones de buscador. */
export function truncate(text: string, max = 158): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

/** Descripción de buscador de una ficha de producto. */
export function productSeoDescription(product: {
  name: string;
  description?: string;
  unit?: string;
}): string {
  const unit = product.unit?.trim();
  const unitText = unit
    ? unit.toLowerCase().startsWith("por ")
      ? ` ${unit}`
      : ` por ${unit}`
    : "";
  const extra = product.description
    ? ` ${product.description.trim().replace(/\.$/, "")}.`
    : "";
  return truncate(
    `${product.name}${unitText} a domicilio en Santiago de Cuba.${extra} Pide por WhatsApp y paga en efectivo.`,
    158
  );
}

/**
 * Serializa JSON-LD escapando `<` para que ninguna descripción pueda cerrar
 * el `<script>` que lo contiene.
 */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
