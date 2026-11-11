"use strict";

// lib/admin-auth.test.ts
import { describe, test, expect, vi, beforeEach } from "vitest";

vi.mock("./auth", () => ({
  decodePocketBaseToken: vi.fn(),
  getRoleIds: vi.fn(),
}));
vi.mock("./pocketbase", () => ({
  getTokenPB: vi.fn(),
}));

import { decodePocketBaseToken, getRoleIds } from "./auth";
import { getTokenPB } from "./pocketbase";
import { requirePermission } from "./admin-auth";

const mockDecode = decodePocketBaseToken as unknown as ReturnType<typeof vi.fn>;
const mockRoleIds = getRoleIds as unknown as ReturnType<typeof vi.fn>;
const mockTokenPB = getTokenPB as unknown as ReturnType<typeof vi.fn>;

/** Usuario de PocketBase con su rol expandido (como lo devuelve getOne). */
function stubUser(user: { expandRole?: unknown; roleId?: string }) {
  const getOne = vi.fn().mockResolvedValue({
    id: "user-1",
    role_id: user.roleId ?? "",
    expand: user.expandRole ? { role_id: user.expandRole } : undefined,
  });
  mockTokenPB.mockReturnValue({ collection: () => ({ getOne }) });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRoleIds.mockResolvedValue({ admin: "role-admin", client: "role-client" });
});

describe("requirePermission", () => {
  test("token inválido lanza sin llegar a PocketBase", async () => {
    mockDecode.mockReturnValue(null);
    await expect(requirePermission("malo", "orders")).rejects.toThrow(
      /No autorizado/
    );
    expect(mockTokenPB).not.toHaveBeenCalled();
  });

  test("operador con orders pasa en orders y falla en users", async () => {
    mockDecode.mockReturnValue({ userId: "user-1", email: "o@y.cu" });
    stubUser({
      expandRole: { name: "operador", permissions: JSON.stringify({ orders: true }) },
    });
    const ok = await requirePermission("tok", "orders");
    expect(ok.userId).toBe("user-1");
    expect(ok.permissions.orders).toBe(true);
    await expect(requirePermission("tok", "users")).rejects.toThrow(
      /permisos insuficientes/
    );
  });

  test("un array de permisos pasa si cualquiera se concede", async () => {
    mockDecode.mockReturnValue({ userId: "user-1", email: "o@y.cu" });
    stubUser({
      expandRole: { name: "operador", permissions: JSON.stringify({ offers: true }) },
    });
    await expect(
      requirePermission("tok", ["orders", "offers"])
    ).resolves.toBeTruthy();
    await expect(
      requirePermission("tok", ["orders", "users"])
    ).rejects.toThrow(/permisos insuficientes/);
  });

  test("el rol admin pasa cualquier permiso aunque no traiga JSON", async () => {
    mockDecode.mockReturnValue({ userId: "user-1", email: "a@y.cu" });
    stubUser({ expandRole: { name: "admin" } });
    await expect(requirePermission("tok", "users")).resolves.toBeTruthy();
  });

  test("sin rol expandido, el espejo por role_id admin da acceso total", async () => {
    mockDecode.mockReturnValue({ userId: "user-1", email: "a@y.cu" });
    stubUser({ roleId: "role-admin" });
    const ok = await requirePermission("tok", "settings");
    expect(ok.permissions.settings).toBe(true);
  });

  test("sin rol expandido y sin rol admin queda denegado", async () => {
    mockDecode.mockReturnValue({ userId: "user-1", email: "c@y.cu" });
    stubUser({ roleId: "role-client" });
    await expect(requirePermission("tok", "orders")).rejects.toThrow(
      /permisos insuficientes/
    );
  });
});
