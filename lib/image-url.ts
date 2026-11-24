/** Detecta URLs de imagen SVG, incluso con query string o fragmento. */
export function isSvgImageUrl(url: string): boolean {
  return /\.svg(?:[?#]|$)/i.test(url);
}
