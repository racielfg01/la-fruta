import { decodePocketBaseToken, getRoleIds } from './auth';
import { getTokenPB } from './pocketbase';
import {
  ALL_PERMISSIONS,
  NO_PERMISSIONS,
  permissionsForRole,
  type PermissionKey,
  type RolePermissions,
} from './permissions';

/**
 * Verifica que el token pertenezca a un usuario cuyo rol conceda alguno de
 * los permisos pedidos, y devuelve su id y sus permisos efectivos para que
 * el llamador pueda acotar los datos (getAdminData).
 *
 * Sustituye a los verifyAdminAndGetUserId duplicados de admin.ts y
 * admin-extras.ts: el rol "admin" pasa siempre; cualquier otro rol según el
 * JSON de permisos guardado en /admin/configuracion?tab=roles. Pedir un
 * array de permisos significa "al menos uno".
 */
export async function requirePermission(
  token: string,
  required: PermissionKey | PermissionKey[],
): Promise<{ userId: string; permissions: RolePermissions }> {
  const payload = decodePocketBaseToken(token);
  if (!payload) throw new Error('No autorizado: token inválido o expirado');

  const pb = getTokenPB(token);
  const user = await pb.collection('users').getOne(payload.userId, {
    expand: 'role_id',
  });
  const permissions = await effectivePermissions(user);
  const keys = Array.isArray(required) ? required : [required];
  if (!keys.some((key) => permissions[key] === true)) {
    throw new Error('Acceso denegado: permisos insuficientes para esta acción');
  }
  return { userId: payload.userId, permissions };
}

async function effectivePermissions(user: any): Promise<RolePermissions> {
  const role = user?.expand?.role_id;
  if (role) return permissionsForRole(role);
  // Sin rol expandible (relación vacía o rol borrado): espejo legado por id.
  const roleIds = await getRoleIds();
  if (roleIds.admin && user?.role_id === roleIds.admin) {
    return { ...ALL_PERMISSIONS };
  }
  return { ...NO_PERMISSIONS };
}
