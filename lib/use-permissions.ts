import { AuthUser } from "./auth-context";
import { RolePermissions, NO_PERMISSIONS, ALL_PERMISSIONS } from "./permissions";

function resolvePermissions(user: AuthUser): RolePermissions {
  if (user.permissions) return user.permissions;
  // Rol sin permisos configurados: el admin (role_id 2) ve todo, igual que
  // roles-tab.tsx trata un rol vacío como ALL_PERMISSIONS. Cualquier otro
  // rol sin configurar queda en denegado total, no en acceso total.
  if (user.role_id === 2) return { ...ALL_PERMISSIONS };
  return { ...NO_PERMISSIONS };
}

export function hasPermission(
  user: AuthUser | null | undefined,
  key: keyof RolePermissions,
): boolean {
  if (!user) return false;
  return resolvePermissions(user)[key] === true;
}

export function hasAnyPermission(
  user: AuthUser | null | undefined,
  keys: (keyof RolePermissions)[],
): boolean {
  return keys.some((k) => hasPermission(user, k));
}

export function getUserPermissions(
  user: AuthUser | null | undefined,
): RolePermissions {
  if (!user) return { ...NO_PERMISSIONS };
  return resolvePermissions(user);
}
