/**
 * URL de imagen lista para `next/image`.
 *
 * Antes construía una URL de nuestro optimizador (`/api/img`), pero ese
 * servicio dependía de `sharp` y en producción acababa redirigiendo al archivo
 * original: las fotos viajaban a tamaño completo. Ahora la optimización la hace
 * Next (`/_next/image`), que sí está disponible en todos los despliegues y
 * además genera `srcset` responsive.
 *
 * Se mantiene la función (y su firma) para no tocar todas las llamadas; el
 * ancho y la calidad ya no se usan aquí: los decide el `sizes` de cada imagen.
 */
export function optimizedImageUrl(
  src: string | null | undefined,
  _width?: number,
  _quality?: number
): string {
  return src || "";
}
