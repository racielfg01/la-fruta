export interface RolePermissions {
  dashboard: boolean;
  orders: boolean;
  products: boolean;
  shipping: boolean;
  users: boolean;
  settings: boolean;
  offers: boolean;
}

export const ALL_PERMISSIONS: RolePermissions = {
  dashboard: true,
  orders: true,
  products: true,
  shipping: true,
  users: true,
  settings: true,
  offers: true,
};

export const NO_PERMISSIONS: RolePermissions = {
  dashboard: false,
  orders: false,
  products: false,
  shipping: false,
  users: false,
  settings: false,
  offers: false,
};

export type PermissionKey = keyof RolePermissions;

export const PERMISSION_KEYS: PermissionKey[] = [
  "dashboard",
  "orders",
  "products",
  "shipping",
  "users",
  "settings",
  "offers",
];

function parseRolePermissions(raw: unknown): RolePermissions | null {
  if (!raw) return null;
  try {
    const obj: unknown = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!obj || typeof obj !== "object") return null;
    const record = obj as Record<string, unknown>;
    const merged = { ...NO_PERMISSIONS };
    for (const key of PERMISSION_KEYS) {
      if (record[key] === true) merged[key] = true;
    }
    return merged;
  } catch {
    return null;
  }
}

/**
 * Permisos efectivos de un rol de PocketBase (campo `permissions` como JSON
 * string, como lo guardan las server actions de roles). El rol "admin" tiene
 * todo siempre — compatibilidad con roles creados antes de que existiera el
 * campo y espejo del fallback legado de role_id 2. Cualquier otro rol usa su
 * JSON; si falta o no parsea, denegado total. Las claves ausentes del JSON
 * quedan en false para que un rol guardado a medias no otorgue nada.
 */
export function permissionsForRole(
  role: { name?: string | null; permissions?: unknown } | null | undefined,
): RolePermissions {
  if (role?.name === "admin") return { ...ALL_PERMISSIONS };
  return parseRolePermissions(role?.permissions) ?? { ...NO_PERMISSIONS };
}

/**
 * Qué colecciones de getAdminData corresponden a cada permiso: products
 * cubre productos y categorías; settings cubre monedas y roles. Es el mapa
 * único entre permisos y datos, usado por el servidor para acotar la carga.
 */
export function sectionsForPermissions(perms: RolePermissions) {
  return {
    products: perms.products === true,
    categories: perms.products === true,
    deliveryZones: perms.shipping === true,
    users: perms.users === true,
    orders: perms.orders === true,
    currencies: perms.settings === true,
    roles: perms.settings === true || perms.users === true,
    offers: perms.offers === true,
  };
}
