/**
 * Qué hacer con el resultado de revalidar la sesión contra el servidor.
 *
 * Distingue tres casos que antes se confundían en uno solo:
 * - `accept`: el servidor confirmó la sesión → se guarda el usuario.
 * - `logout`: el servidor dijo que el token ya no vale → se cierra la sesión.
 * - `keep`: no se pudo saber (red caída, 500, timeout) → se conserva la
 *   sesión cacheada. Un fallo puntual no debe expulsar al usuario del sitio.
 */
export type SessionDecision = "accept" | "logout" | "keep";

export interface SessionRefreshResult {
  success: boolean;
  user?: unknown;
  error?: string;
  /** `invalid_session` = el token expiró o fue invalidado. */
  code?: "invalid_session" | "error";
}

export function decideSessionRefresh(
  result: SessionRefreshResult | null | undefined,
): SessionDecision {
  if (!result) return "keep";
  if (result.success && result.user) return "accept";
  // Solo un veredicto explícito del servidor cierra la sesión.
  if (result.code === "invalid_session") return "logout";
  return "keep";
}
