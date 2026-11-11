import { describe, expect, it } from "vitest";
import { adminGate } from "./admin-gate";
import type { AuthUser } from "./auth-context";

const operador: AuthUser = {
  id: "u1",
  name: "Jenny",
  email: "jenny@lafruta.com",
  phone: "",
  address: "",
  gender: "",
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
};

const admin: AuthUser = {
  ...operador,
  id: "u2",
  email: "admin@lafruta.com",
  role_id: 2,
};

describe("adminGate", () => {
  it("espera a que el servidor valide la sesión", () => {
    expect(
      adminGate({
        isLoading: true,
        isAuthenticated: true,
        user: operador,
        isLoginPage: false,
      }),
    ).toBe("wait");
  });

  it("no expulsa a un rol con permisos que aún no tiene en la caché", () => {
    // Usuario cacheado sin permissions (asignadas después del login) y
    // sesión a medio validar: no debe mandarse a la tienda.
    expect(
      adminGate({
        isLoading: true,
        isAuthenticated: true,
        user: { ...operador, permissions: undefined },
        isLoginPage: false,
      }),
    ).toBe("wait");
  });

  it("manda a /auth/login sin sesión", () => {
    expect(
      adminGate({
        isLoading: false,
        isAuthenticated: false,
        user: null,
        isLoginPage: false,
      }),
    ).toBe("login");
  });

  it("manda a la tienda a un rol sin ningún permiso", () => {
    expect(
      adminGate({
        isLoading: false,
        isAuthenticated: true,
        user: { ...operador, permissions: undefined },
        isLoginPage: false,
      }),
    ).toBe("home");
  });

  it("deja entrar a un rol con algún permiso y al admin", () => {
    expect(
      adminGate({
        isLoading: false,
        isAuthenticated: true,
        user: operador,
        isLoginPage: false,
      }),
    ).toBe("allow");
    expect(
      adminGate({
        isLoading: false,
        isAuthenticated: true,
        user: admin,
        isLoginPage: false,
      }),
    ).toBe("allow");
  });

  it("no redirige la propia pantalla de login del panel", () => {
    expect(
      adminGate({
        isLoading: false,
        isAuthenticated: false,
        user: null,
        isLoginPage: true,
      }),
    ).toBe("allow");
  });
});
