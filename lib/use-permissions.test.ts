import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { canAccessAdmin, hasPermission } from "./use-permissions";
import type { AuthUser } from "./auth-context";

/**
 * Puerta del panel admin vista desde el cliente.
 *
 * El navegador recibe role_id colapsado a 1/2 (app/actions/auth.ts), así que
 * un rol con permisos como «operador cobre» llega con role_id 1 y su
 * autorización real viaja en user.permissions. La pestaña «Admin» del header
 * debe decidir por permisos, igual que la puerta de app/admin/layout.tsx.
 */

const operadorCobre: AuthUser = {
  id: "u1",
  name: "Jenny",
  email: "jenny@lafruta.com",
  role_id: 1,
  permissions: {
    dashboard: false,
    orders: true,
    products: false,
    shipping: false,
    users: false,
    settings: false,
    offers: false,
  },
} as AuthUser;

const cliente: AuthUser = {
  id: "u2",
  name: "Cliente",
  email: "cliente@ejemplo.com",
  role_id: 1,
} as AuthUser;

const adminSinPermisos: AuthUser = {
  id: "u3",
  name: "Admin",
  email: "admin@lafruta.com",
  role_id: 2,
} as AuthUser;

describe("canAccessAdmin (cliente)", () => {
  it("«operador cobre» con permiso orders → sí entra al panel", () => {
    expect(canAccessAdmin(operadorCobre)).toBe(true);
  });

  it("«operador cobre» solo tiene orders: users y settings no", () => {
    expect(hasPermission(operadorCobre, "orders")).toBe(true);
    expect(hasPermission(operadorCobre, "users")).toBe(false);
    expect(hasPermission(operadorCobre, "settings")).toBe(false);
  });

  it("cliente sin permisos → no entra al panel", () => {
    expect(canAccessAdmin(cliente)).toBe(false);
  });

  it("admin sin campo permissions → entra (compatibilidad por rol)", () => {
    expect(canAccessAdmin(adminSinPermisos)).toBe(true);
  });

  it("sin usuario → no entra", () => {
    expect(canAccessAdmin(null)).toBe(false);
    expect(canAccessAdmin(undefined)).toBe(false);
  });
});

describe("cableado de la puerta (sin DOM en el repo)", () => {
  const header = readFileSync(
    new URL("../components/header.tsx", import.meta.url),
    "utf8"
  );
  const adminLayout = readFileSync(
    new URL("../app/admin/layout.tsx", import.meta.url),
    "utf8"
  );

  it("el header decide la pestaña Admin por permisos, no por role_id === 2", () => {
    expect(header).toContain("canAccessAdmin");
    expect(header).not.toMatch(/role_id\s*===\s*2/);
  });

  it("la puerta de app/admin/layout.tsx usa la misma función", () => {
    expect(adminLayout).toContain("canAccessAdmin");
    expect(adminLayout).not.toMatch(/hasAnyPermission\(user,\s*PERMISSION_KEYS\)/);
  });
});
