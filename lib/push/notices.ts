/**
 * Avisos contextuales de la página de notificaciones del admin.
 *
 * El aviso de "sin dispositivos" solo tiene sentido cuando el resto está
 * listo: si falta PocketBase, VAPID o soporte push, ya hay un aviso más
 * concreto en pantalla y este solo añadiría ruido.
 */
export function shouldShowNoAdminNotice(input: {
  setupNeeded?: boolean;
  configured?: boolean;
  supported: boolean;
  adminCount: number;
}): boolean {
  return (
    input.setupNeeded !== true &&
    input.configured === true &&
    input.supported &&
    input.adminCount === 0
  );
}
