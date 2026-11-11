import { canAccessAdmin } from "./use-permissions";
import type { AuthUser } from "./auth-context";

/**
 * Qué decide la puerta del panel admin:
 * - `wait`: el servidor todavía no validó la sesión; no se decide nada.
 * - `login`: no hay sesión → a /auth/login.
 * - `home`: hay sesión pero el rol no concede ningún permiso → a la tienda.
 * - `allow`: puede entrar al panel.
 */
export type AdminGate = "wait" | "login" | "home" | "allow";

export interface AdminGateInput {
  /** `true` mientras la sesión no ha sido validada por el servidor. */
  isLoading: boolean;
  isAuthenticated: boolean;
  user: AuthUser | null;
  /** La propia pantalla de login del panel no se redirige. */
  isLoginPage: boolean;
}

export function adminGate(input: AdminGateInput): AdminGate {
  if (input.isLoginPage) return "allow";
  // El usuario cacheado puede estar obsoleto (p. ej. a quien se le asignó un
  // rol con permisos después de iniciar sesión). Decidir antes de que el
  // servidor confirme la sesión lo expulsa del panel sin motivo.
  if (input.isLoading) return "wait";
  if (!input.isAuthenticated || !input.user) return "login";
  if (!canAccessAdmin(input.user)) return "home";
  return "allow";
}
