import {
  BadgePercent,
  Bell,
  LayoutDashboard,
  Package,
  Settings as SettingsIcon,
  ShoppingBag,
  Star,
  Tags,
  Truck,
  Users,
  Warehouse,
} from "lucide-react";
import type { RolePermissions } from "@/lib/permissions";

export interface AdminNavItem {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
  permission: keyof RolePermissions;
}

export const adminNavigation: AdminNavItem[] = [
  { name: "Panel Principal", href: "/admin", icon: LayoutDashboard, permission: "dashboard" },
  { name: "Órdenes", href: "/admin/ordenes", icon: ShoppingBag, permission: "orders" },
  { name: "Valoraciones", href: "/admin/valoraciones", icon: Star, permission: "orders" },
  { name: "Productos", href: "/admin/productos", icon: Package, permission: "products" },
  { name: "Proveedores", href: "/admin/proveedores", icon: Warehouse, permission: "suppliers" },
  { name: "Categorías", href: "/admin/categorias", icon: Tags, permission: "products" },
  { name: "Envíos", href: "/admin/envios", icon: Truck, permission: "shipping" },
  { name: "Usuarios", href: "/admin/usuarios", icon: Users, permission: "users" },
  { name: "Ofertas", href: "/admin/ofertas", icon: BadgePercent, permission: "offers" },
  { name: "Notificaciones", href: "/admin/notificaciones", icon: Bell, permission: "settings" },
  { name: "Configuración", href: "/admin/configuracion", icon: SettingsIcon, permission: "settings" },
];

/** Nombre de la sección activa; el título general solo es el respaldo. */
export function adminSectionLabel(pathname: string): string {
  const active = adminNavigation.find(
    (item) =>
      pathname === item.href ||
      (item.href !== "/admin" && pathname.startsWith(item.href))
  );
  return active?.name ?? "Panel de Administración";
}
