"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Package,
  Tags,
  Truck,
  LayoutDashboard,
  Leaf,
  ChevronRight,
  Menu,
  X,
  Users,
  ShoppingBag,
  Coins,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAdminStore } from "@/lib/admin-store";
import { useAuthStore } from "@/lib/auth-context";  // ✅ usar el store global

function AdminStoreInitializer() {
  const initialize = useAdminStore((s) => s.initialize);
  useEffect(() => { initialize(); }, [initialize]);
  return null;
}

const navigation = [
  { name: "Panel Principal", href: "/admin", icon: LayoutDashboard },
  { name: "Órdenes", href: "/admin/ordenes", icon: ShoppingBag },
  { name: "Productos", href: "/admin/productos", icon: Package },
  { name: "Envíos", href: "/admin/envios", icon: Truck },
  { name: "Usuarios", href: "/admin/usuarios", icon: Users },
  { name: "Categorías", href: "/admin/categorias", icon: Tags },
  { name: "Monedas", href: "/admin/monedas", icon: Coins },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const isLoginPage = pathname === "/admin/login";

  const { isAuthenticated, user, logout } = useAuthStore();

  // Esperar a que zustand persist rehidrate desde localStorage
  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
    } else {
      const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
      return unsub;
    }
  }, []);

  // Redirigir solo después de saber el estado real de autenticación
  useEffect(() => {
    if (!hydrated) return;
    if (!isLoginPage && !isAuthenticated) {
      router.push("/auth/login");
    } else if (!isLoginPage && user && user.role_id !== 2) {
      router.push("/");
    }
  }, [hydrated, isAuthenticated, user, isLoginPage, router]);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!hydrated || !isAuthenticated || !user || user.role_id !== 2) {
    return null;
  }

  const handleLogout = () => {
    logout();               // cierra sesión global
    router.push("/");       // redirige al home
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <AdminStoreInitializer />
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onPointerDown={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform bg-card border-r border-border transition-transform duration-300 lg:translate-x-0 overflow-y-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full invisible lg:visible"
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <Leaf className="h-6 w-6 text-primary" />
          <span className="font-serif text-xl font-bold"><span className="text-primary">Merca</span><span className="text-destructive">Toma</span></span>
          <span className="ml-1 text-xs text-muted-foreground">Admin</span>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto lg:hidden"
            onClick={(e) => { e.stopPropagation(); closeSidebar(); }}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex flex-col gap-1 p-4">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={closeSidebar}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
                {isActive && <ChevronRight className="ml-auto h-4 w-4" />}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-border p-4 space-y-2">
          <div className="flex items-center gap-2 px-2 py-1 text-sm text-muted-foreground">
            <span className="truncate">{user.name}</span>
            <span className="text-xs bg-primary/10 px-1.5 py-0.5 rounded">Admin</span>
          </div>
          <Link
            href="/"
            onClick={closeSidebar}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
            Volver a la tienda
          </Link>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 text-sm text-muted-foreground hover:text-destructive transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-card px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Panel de Administración</h1>
          </div>
        </header>
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}