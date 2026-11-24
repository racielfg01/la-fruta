/**
 * Tipos permitidos para la imagen de categoría.
 *
 * El alias `image` cubre los formatos raster y `image/svg+xml` se declara
 * aparte para que SVG quede explícito en la configuración del endpoint y en
 * el `accept` que UploadThing genera para el selector de archivos.
 */
export const CATEGORY_IMAGE_FILE_TYPES = {
  image: { maxFileSize: "2MB" },
  "image/svg+xml": { maxFileSize: "2MB" },
} as const;
