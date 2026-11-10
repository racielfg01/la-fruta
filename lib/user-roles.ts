import { Role, User } from "./admin-store";

/**
 * Qué rol real (id de la relación en PocketBase) debe preseleccionar el
 * diálogo de edición de /admin/usuarios.
 *
 * 1. El rol real del usuario si sigue existiendo entre los roles configurados.
 * 2. Si no, el que corresponda por nombre al rol legado (admin/client según
 *    el role_id numérico 1/2 que devuelve getAdminData).
 * 3. Si tampoco, el primer rol configurado.
 * 4. '' si no hay roles (el Select muestra su placeholder).
 */
export function roleSelectionFor(
  user: Partial<Pick<User, "role_id" | "roleId">>,
  roles: Role[],
): string {
  if (user.roleId && roles.some((r) => r.id === user.roleId)) {
    return user.roleId;
  }
  const legacyName = user.role_id === 2 ? "admin" : "client";
  const byName = roles.find((r) => r.name === legacyName);
  if (byName) return byName.id;
  return roles[0]?.id || "";
}

/**
 * Espejo numérico legado (User.role_id): 2 solo si el rol seleccionado es el
 * rol "admin", 1 para cualquier otro. Mantiene compatibles stats, badges y
 * addUserAction, que siguen leyendo el numérico.
 */
export function deriveNumericRoleId(roleId: string, roles: Role[]): number {
  return roles.find((r) => r.id === roleId)?.name === "admin" ? 2 : 1;
}

/**
 * Qué valor guardar en users.role_id (relación de PocketBase) al crear o
 * editar un usuario: el rol real elegido si viene, y si no el mapeo legado
 * admin/client. Devuelve '' cuando no se puede resolver; el llamador no debe
 * enviarlo (borraría la relación).
 */
export function resolveRoleForSave(
  data: Partial<Pick<User, "role_id" | "roleId">>,
  roleIds: { admin: string; client: string },
): string {
  if (data.roleId) return data.roleId;
  return data.role_id === 2 ? roleIds.admin : roleIds.client;
}
