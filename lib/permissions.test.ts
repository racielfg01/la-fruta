"use strict";

// lib/permissions.test.ts
import { describe, test, expect } from "vitest";
import {
  ALL_PERMISSIONS,
  NO_PERMISSIONS,
  PERMISSION_KEYS,
  permissionsForRole,
  sectionsForPermissions,
} from "./permissions";

describe("permissionsForRole", () => {
  test("el rol admin tiene todo, aunque no traiga JSON de permisos", () => {
    expect(permissionsForRole({ name: "admin" })).toEqual(ALL_PERMISSIONS);
    expect(permissionsForRole({ name: "admin", permissions: "" })).toEqual(
      ALL_PERMISSIONS
    );
  });

  test("un rol con JSON completo recibe exactamente esos permisos", () => {
    const operador = { name: "operador", permissions: JSON.stringify({ orders: true, offers: true }) };
    const perms = permissionsForRole(operador);
    expect(perms.orders).toBe(true);
    expect(perms.offers).toBe(true);
    expect(perms.users).toBe(false);
    expect(perms.settings).toBe(false);
  });

  test("un JSON parcial completa en false las claves ausentes", () => {
    const perms = permissionsForRole({
      name: "moderador",
      permissions: JSON.stringify({ orders: true }),
    });
    expect(perms).toEqual({ ...NO_PERMISSIONS, orders: true });
  });

  test("un rol sin campo permissions queda en denegado total", () => {
    expect(permissionsForRole({ name: "cliente-vip" })).toEqual(NO_PERMISSIONS);
  });

  test("un JSON corrupto queda en denegado total, sin lanzar", () => {
    expect(permissionsForRole({ name: "x", permissions: "{no-json" })).toEqual(
      NO_PERMISSIONS
    );
  });

  test("un rol inexistente queda en denegado total", () => {
    expect(permissionsForRole(null)).toEqual(NO_PERMISSIONS);
    expect(permissionsForRole(undefined)).toEqual(NO_PERMISSIONS);
  });

  test("un objeto de permisos ya parseado también se acepta", () => {
    const perms = permissionsForRole({ name: "x", permissions: { products: true } });
    expect(perms.products).toBe(true);
    expect(perms.orders).toBe(false);
  });
});

describe("sectionsForPermissions", () => {
  test("products cubre productos y categorías", () => {
    const sections = sectionsForPermissions({ ...NO_PERMISSIONS, products: true });
    expect(sections.products).toBe(true);
    expect(sections.categories).toBe(true);
    expect(sections.users).toBe(false);
  });

  test("settings cubre monedas y roles", () => {
    const sections = sectionsForPermissions({ ...NO_PERMISSIONS, settings: true });
    expect(sections.currencies).toBe(true);
    expect(sections.roles).toBe(true);
    expect(sections.products).toBe(false);
  });

  test("users también carga roles para el selector de /admin/usuarios", () => {
    const sections = sectionsForPermissions({ ...NO_PERMISSIONS, users: true });
    expect(sections.users).toBe(true);
    expect(sections.roles).toBe(true);
    expect(sections.currencies).toBe(false);
  });

  test("un operador de órdenes solo ve órdenes", () => {
    const sections = sectionsForPermissions({ ...NO_PERMISSIONS, orders: true });
    expect(sections.orders).toBe(true);
    expect(
      Object.entries(sections).filter(([key, allowed]) => key !== "orders" && allowed)
    ).toEqual([]);
  });

  test("sin permisos no ve ninguna sección", () => {
    const sections = sectionsForPermissions(NO_PERMISSIONS);
    expect(Object.values(sections).every((allowed) => allowed === false)).toBe(true);
  });
});

describe("PERMISSION_KEYS", () => {
  test("cubre las siete secciones del panel", () => {
    expect([...PERMISSION_KEYS].sort()).toEqual(
      ["dashboard", "offers", "orders", "products", "settings", "shipping", "users"].sort()
    );
  });
});
