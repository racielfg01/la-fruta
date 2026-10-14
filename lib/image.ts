/**
 * Build a URL for our own sharp-based optimizer (app/api/img).
 * Returns the src untouched for values we should not proxy:
 * empty, inline data, blobs, SVG or already-optimized URLs.
 */
export function optimizedImageUrl(
  src: string | null | undefined,
  width: number,
  quality = 72
): string {
  if (!src) return "";
  if (
    src.startsWith("data:") ||
    src.startsWith("blob:") ||
    src.startsWith("/api/img?") ||
    src.split("?")[0].toLowerCase().endsWith(".svg")
  ) {
    return src;
  }
  return `/api/img?src=${encodeURIComponent(src)}&w=${width}&q=${quality}`;
}
