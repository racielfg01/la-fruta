/**
 * Normaliza un teléfono para wa.me: solo dígitos.
 * Acepta "+53 5555-1234", "(53) 5555 1234", "53.5555.1234"…
 * Devuelve "" si no queda ningún dígito.
 */
export function normalizeWhatsAppPhone(raw: string | null | undefined): string {
  return (raw || '').replace(/\D/g, '');
}

/**
 * Enlace a WhatsApp con mensaje precargado, o null si no hay número usable.
 * Sin el código de país el enlace no sirve: se valida un mínimo de 8 dígitos.
 */
export function whatsAppLink(
  raw: string | null | undefined,
  message?: string
): string | null {
  const phone = normalizeWhatsAppPhone(raw);
  if (phone.length < 8) return null;
  const text = (message || '').trim();
  return text
    ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
    : `https://wa.me/${phone}`;
}
