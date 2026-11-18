import { describe, expect, test, vi, beforeEach } from "vitest";

vi.mock("next/server", () => ({ after: vi.fn() }));
vi.mock("@/lib/push/notify", () => ({
  notifyNewOrder: vi.fn(),
  notifyNewRating: vi.fn(),
}));
vi.mock("@/lib/verify-session", () => ({
  verifySession: vi.fn(),
  isUnavailableSession: (error: unknown) =>
    (error as { code?: string } | undefined)?.code === "unavailable",
}));
vi.mock("@/lib/pocketbase", () => ({
  getAdminPB: vi.fn(),
  getAllRecords: vi.fn(),
  sanitize: (value: string) => value,
}));

import { getUserOrders } from "./orders";
import { verifySession } from "@/lib/verify-session";
import { getAdminPB, getAllRecords } from "@/lib/pocketbase";

const mockVerify = vi.mocked(verifySession);
const mockAdmin = vi.mocked(getAdminPB);
const mockAll = vi.mocked(getAllRecords);

function unavailableError() {
  return Object.assign(new Error("No se pudo validar la sesión"), {
    code: "unavailable",
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getUserOrders con sesión no verificable", () => {
  test("devuelve un resultado manejable en vez de lanzar", async () => {
    mockVerify.mockRejectedValue(unavailableError());

    await expect(getUserOrders("tok")).resolves.toEqual({
      ok: false,
      reason: "unavailable",
    });
    expect(mockAdmin).not.toHaveBeenCalled();
  });

  test("una sesión inválida sí se propaga", async () => {
    const invalid = Object.assign(new Error("Sesión inválida o expirada"), {
      code: "invalid_session",
    });
    mockVerify.mockRejectedValue(invalid);

    await expect(getUserOrders("tok")).rejects.toThrow(/Sesión inválida/);
  });

  test("con sesión válida devuelve los pedidos", async () => {
    mockVerify.mockResolvedValue({
      userId: "user-1",
      email: "a@y.cu",
      name: "Ana",
      roleId: "role-1",
    });
    mockAdmin.mockResolvedValue({} as any);
    mockAll.mockResolvedValueOnce([]);

    await expect(getUserOrders("tok")).resolves.toEqual({
      ok: true,
      orders: [],
    });
  });
});
