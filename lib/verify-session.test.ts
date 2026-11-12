"use strict";

// lib/verify-session.test.ts
import { describe, test, expect, vi, beforeEach } from "vitest";

vi.mock("./auth", () => ({
  decodePocketBaseToken: vi.fn(),
}));
vi.mock("./pocketbase", () => ({
  getTokenPB: vi.fn(),
}));

import { decodePocketBaseToken } from "./auth";
import { getTokenPB } from "./pocketbase";
import { verifySession } from "./verify-session";

const mockDecode = decodePocketBaseToken as unknown as ReturnType<typeof vi.fn>;
const mockTokenPB = getTokenPB as unknown as ReturnType<typeof vi.fn>;

function stubUser(record: Record<string, unknown>) {
  const getOne = vi.fn().mockResolvedValue(record);
  mockTokenPB.mockReturnValue({ collection: () => ({ getOne }) });
  return getOne;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("verifySession", () => {
  test("devuelve la identidad real del registro", async () => {
    mockDecode.mockReturnValue({ userId: "user-1", email: "a@y.cu" });
    stubUser({ id: "user-1", email: "a@y.cu", name: "Ana", role_id: "role-1" });

    const session = await verifySession("tok");
    expect(session).toEqual({
      userId: "user-1",
      email: "a@y.cu",
      name: "Ana",
      roleId: "role-1",
    });
  });

  test("devuelve el id del REGISTRO, no el que afirma el token", async () => {
    // El token dice user-1; el registro que devuelve PocketBase es user-2.
    // La identidad válida es la del registro.
    mockDecode.mockReturnValue({ userId: "user-1", email: "a@y.cu" });
    stubUser({ id: "user-2", email: "b@y.cu", name: "B", role_id: "" });

    const session = await verifySession("tok");
    expect(session.userId).toBe("user-2");
  });

  test("un token que PocketBase rechaza no abre sesión", async () => {
    // Token forjado: la firma no la valida PocketBase y el getOne falla.
    mockDecode.mockReturnValue({ userId: "user-1", email: "a@y.cu" });
    const getOne = vi.fn().mockRejectedValue(
      Object.assign(new Error("404"), { status: 404 }),
    );
    mockTokenPB.mockReturnValue({ collection: () => ({ getOne }) });

    await expect(verifySession("forjado")).rejects.toThrow(
      /Sesión inválida o expirada/,
    );
  });

  test("una caída de red NO invalida la sesión", async () => {
    // PocketBase no respondió: el token puede estar bien. Distinguir esto
    // evita cerrar la sesión por un fallo puntual (el bug que se corrigió
    // antes con refreshUserAction).
    mockDecode.mockReturnValue({ userId: "user-1", email: "a@y.cu" });
    const getOne = vi.fn().mockRejectedValue(
      Object.assign(new Error("fetch failed"), { status: 0 }),
    );
    mockTokenPB.mockReturnValue({ collection: () => ({ getOne }) });

    await expect(verifySession("tok")).rejects.toThrow(/No se pudo validar/);
    await expect(verifySession("tok")).rejects.toSatisfy(
      (error: any) => error?.code === "unavailable",
    );
  });

  test("un 5xx de PocketBase tampoco invalida la sesión", async () => {
    mockDecode.mockReturnValue({ userId: "user-1", email: "a@y.cu" });
    const getOne = vi.fn().mockRejectedValue(
      Object.assign(new Error("500"), { status: 500 }),
    );
    mockTokenPB.mockReturnValue({ collection: () => ({ getOne }) });

    await expect(verifySession("tok")).rejects.toSatisfy(
      (error: any) => error?.code === "unavailable",
    );
  });

  test("un token que no se puede decodificar no toca PocketBase", async () => {
    mockDecode.mockReturnValue(null);
    await expect(verifySession("basura")).rejects.toThrow(
      /Sesión inválida o expirada/,
    );
    expect(mockTokenPB).not.toHaveBeenCalled();
  });

  test("un token vacío no toca PocketBase", async () => {
    await expect(verifySession("")).rejects.toThrow(/Sesión inválida o expirada/);
    expect(mockTokenPB).not.toHaveBeenCalled();
  });
});
