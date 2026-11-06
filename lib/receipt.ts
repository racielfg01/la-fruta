export const RECEIPT_MAX_BYTES = 5 * 1024 * 1024;

const RECEIPT_ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

const RECEIPT_SIZE_ERROR =
  "El archivo supera los 5 MB. Elige una imagen más ligera o un PDF más pequeño.";
const RECEIPT_TYPE_ERROR =
  "Ese formato no es compatible. Sube una imagen (JPG, PNG, WEBP o GIF) o un PDF.";
const RECEIPT_AUTH_ERROR =
  "Tu sesión venció. Vuelve a iniciar sesión y sube el comprobante de nuevo.";
const RECEIPT_NETWORK_ERROR = "Revisa tu conexión e inténtalo de nuevo.";
const RECEIPT_GENERIC_ERROR =
  "Inténtalo de nuevo en un momento. Si el problema continúa, prueba con otro archivo.";

export function isReceiptImage(mimeType: string): boolean {
  return mimeType.toLowerCase().startsWith("image/");
}

export function receiptFileError(file: {
  type: string;
  size: number;
}): string | null {
  if (!RECEIPT_ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
    return RECEIPT_TYPE_ERROR;
  }
  if (file.size > RECEIPT_MAX_BYTES) {
    return RECEIPT_SIZE_ERROR;
  }
  return null;
}

function errorCode(error: unknown): string {
  if (!error || typeof error !== "object" || !("code" in error)) return "";
  return String((error as { code?: unknown }).code ?? "").toUpperCase();
}

function errorMessage(error: unknown): string {
  if (typeof error === "string") return error.toLowerCase();
  if (!error || typeof error !== "object" || !("message" in error)) return "";
  return String((error as { message?: unknown }).message ?? "").toLowerCase();
}

export function receiptUploadErrorMessage(error: unknown): string {
  const code = errorCode(error);
  const message = errorMessage(error);

  if (
    code === "TOO_LARGE" ||
    /too large|file size|max file size|supera|excede/.test(message)
  ) {
    return RECEIPT_SIZE_ERROR;
  }

  if (
    code === "FORBIDDEN" ||
    /unauthorized|no autorizado|not authorized|sesión/.test(message)
  ) {
    return RECEIPT_AUTH_ERROR;
  }

  if (
    /file type|filetype|invalid type|unknown file type|unsupported|not allowed|formato|tipo de archivo/.test(
      message,
    )
  ) {
    return RECEIPT_TYPE_ERROR;
  }

  if (/failed to fetch|network|conexión|connection/.test(message)) {
    return RECEIPT_NETWORK_ERROR;
  }

  return RECEIPT_GENERIC_ERROR;
}
