"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import PocketBase from "pocketbase";
import {
  ChevronRight,
  Menu,
  X,
  LogOut,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/brand-mark";
import { useAdminStore } from "@/lib/admin-store";
import { useAuthStore } from "@/lib/auth-context";
import { hasPermission, canAccessAdmin } from "@/lib/use-permissions";
import { adminGate } from "@/lib/admin-gate";
import { adminNavigation, adminSectionLabel } from "@/lib/admin-navigation";
import { useSettingsStore } from "@/lib/settings-store";

const ADMIN_REALTIME_COLLECTIONS = [
  "orders",
  "products",
  "categories",
  "delivery_zones",
  "users",
  "currencies",
  "roles",
  "offers",
];

function AdminStoreInitializer() {
  const initialize = useAdminStore((s) => s.initialize);
  useEffect(() => {
    initialize();
  }, [initialize]);
  return null;
}

function AdminRealtimeSync() {
  const token = useAuthStore((s) => s.token);
  const refresh = useAdminStore((s) => s.refresh);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!token) return;

    const POLL_MS = 10_000;

    const pb = new PocketBase(
      process.env.NEXT_PUBLIC_POCKETBASE_URL ||
        "https://everything-hay-mercatoma.pockethost.io"
    );
    pb.autoCancellation(false);
    pb.authStore.save(token);

    let cancelled = false;
    const unsubscribers: Array<() => void | Promise<void>> = [];

    const scheduleRefresh = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        void refresh();
      }, 400);
    };

    const stopPolling = () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };

    const startPolling = () => {
      stopPolling();
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        pollRef.current = setInterval(() => {
          void refresh();
        }, POLL_MS);
      }
    };

    const refreshAndResumePolling = () => {
      if (cancelled) return;
      void refresh();
      startPolling();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshAndResumePolling();
      } else {
        stopPolling();
      }
    };

    const handleOnline = () => {
      refreshAndResumePolling();
    };

    for (const collection of ADMIN_REALTIME_COLLECTIONS) {
      pb.collection(collection)
        .subscribe("*", () => {
          if (!cancelled) scheduleRefresh();
        })
        .then((unsub) => {
          if (cancelled) {
            void unsub();
          } else {
            unsubscribers.push(unsub);
          }
        })
        .catch(() => {
          // Si la suscripción falla (permisos/conexión), el panel sigue
          // funcionando con los datos actuales; un recarga manual los actualiza.
        });
    }

    startPolling();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("online", handleOnline);
    window.addEventListener("focus", handleVisibilityChange);

    return () => {
      cancelled = true;
      stopPolling();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("focus", handleVisibilityChange);
      for (const unsub of unsubscribers) {
        void unsub();
      }
      try {
        pb.realtime.unsubscribe();
      } catch {
        // noop
      }
    };
  }, [token, refresh]);

  return null;
}

const navigation = adminNavigation;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const isLoginPage = pathname === "/admin/login";

  const { isAuthenticated, user, logout, sessionValidated } = useAuthStore();
  const pendingOrders = useAdminStore(
    (state) => state.orders.filter((order) => order.status === "pending").length
  );
  const settings = useSettingsStore((s) => s.settings);
  const initSettings = useSettingsStore((s) => s.init);

  useEffect(() => {
    initSettings();
  }, [initSettings]);

  // La puerta espera a que el servidor confirme la sesión: el usuario cacheado
  // puede estar obsoleto (p. ej. a quien se le asignó un rol con permisos
  // después de iniciar sesión) y decidir con eso lo expulsaba del panel.
  const gate = adminGate({
    isLoading: !sessionValidated,
    isAuthenticated,
    user,
    isLoginPage,
  });

  // Esperar a que zustand termine de hidratar desde localStorage
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
    if (gate === "login") {
      router.push("/auth/login");
    } else if (gate === "home") {
      router.push("/");
    }
  }, [hydrated, gate, router]);

  // Sección actual del menú según la ruta
  const activeItem = navigation.find(
    (item) =>
      pathname === item.href ||
      (item.href !== "/admin" && pathname.startsWith(item.href))
  );

  // Sección sin permiso → primera sección permitida del menú
  useEffect(() => {
    if (!hydrated || !sessionValidated || !user || isLoginPage) return;
    if (!canAccessAdmin(user)) return; // ya redirige el efecto anterior
    if (activeItem && !hasPermission(user, activeItem.permission)) {
      const first = navigation.find((item) => hasPermission(user, item.permission));
      router.replace(first ? first.href : "/");
    }
  }, [hydrated, sessionValidated, user, isLoginPage, activeItem, router]);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!hydrated || gate !== "allow" || !user) {
    // Mientras el servidor valida la sesión no se decide nada: se muestra
    // una espera en vez de una pantalla en blanco.
    if (!hydrated || gate === "wait") {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      );
    }
    return null;
  }

  const handleLogout = () => {
    logout();               // cierra sesión global
    router.push("/");       // redirige al home
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <AdminStoreInitializer />
      <AdminRealtimeSync />
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
          "fixed inset-y-0 left-0 z-50 flex w-[min(18rem,85vw)] flex-col overflow-hidden border-r border-border bg-card transition-transform duration-200 lg:w-64 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full invisible lg:visible"
        )}
      >
        <div className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4 sm:h-16 sm:px-6">
          <BrandMark
            storeName={settings.storeName}
            logo={settings.logo}
            compact
            className="min-w-0"
          />
          <span className="shrink-0 text-xs text-muted-foreground">Admin</span>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto h-11 w-11 lg:hidden"
            onClick={(e) => { e.stopPropagation(); closeSidebar(); }}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3 sm:p-4">
          {navigation
            .filter((item) => hasPermission(user, item.permission))
            .map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={closeSidebar}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
                <span className="ml-auto flex items-center gap-2">
                  {item.href === "/admin/ordenes" && pendingOrders > 0 && (
                    <>
                      <span className="sr-only">
                        {pendingOrders} pedidos pendientes
                      </span>
                      <span
                        aria-hidden="true"
                        className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[11px] font-semibold leading-none text-white"
                      >
                        {pendingOrders > 99 ? "99+" : pendingOrders}
                      </span>
                    </>
                  )}
                  {isActive && <ChevronRight className="h-4 w-4" />}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="shrink-0 space-y-1 border-t border-border p-3 sm:p-4">
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
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-card px-3 sm:h-16 sm:gap-4 sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold sm:text-lg">
              {adminSectionLabel(pathname)}
            </h1>
          </div>
          {pendingOrders > 0 && (
            <Link
              href="/admin/ordenes"
              aria-label={`${pendingOrders} pedidos pendientes`}
              className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary lg:hidden"
            >
              {pendingOrders > 99 ? "99+" : pendingOrders} pendientes
            </Link>
          )}
        </header>
        <main className="admin-main p-3 sm:p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}