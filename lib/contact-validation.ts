// Validación compartida de campos de contacto.
// ponytail: heurística por longitud en dígitos, no por país. Si algún día se
// necesita validación por operadora (p. ej. móviles cubanos +53 5xxxxxxx),
// este es el único sitio a tocar.

export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}
