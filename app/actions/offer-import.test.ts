import { describe, test, expect, vi, beforeEach } from "vitest";
import type { OfferCreation } from "@/lib/offer-excel";

vi.mock("@/lib/admin-auth", () => ({
  requirePermission: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/pocketbase", () => ({
  getAdminPB: vi.fn().mockRejectedValue(new Error("sin admin")),
  getTokenPB: vi.fn(),
  getAllRecords: vi.fn(),
}));

import { getTokenPB, getAllRecords } from "@/lib/pocketbase";
import { applyOfferImportAction } from "./admin";

const mockGetToken = getTokenPB as unknown as ReturnType<typeof vi.fn>;
const mockGetAll = getAllRecords as unknown as ReturnType<typeof vi.fn>;
const mockCreate = vi.fn();
const mockDelete = vi.fn();

const pb = { collection: vi.fn(() => ({ create: mockCreate, delete: mockDelete })) };

function creation(over: Partial<OfferCreation> = {}): OfferCreation {
  return {
    row: 2,
    name: "Combo familiar",
    description: "Verduras surtidas",
    price: 1500,
    currencyCode: "CUP",
    type: "combo",
    productId: "",
    endDate: "2027-01-01T12:00",
    active: true,
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetToken.mockReturnValue(pb);
  mockGetAll.mockImplementation(async (_client: unknown, collection: string) =>
    collection === "products" ? [{ id: "p1", name: "Ajo" }] : []
  );
  mockDelete.mockResolvedValue(undefined);
  mockCreate.mockImplementation(async (record: Record<string, unknown>) => ({
    id: "nueva",
    ...record,
  }));
});

describe("applyOfferImportAction", () => {
  test("crea la oferta con CUP y sin producto en los combos", async () => {
    const res = await applyOfferImportAction([creation()], "token");

    expect(res.created).toHaveLength(1);
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockCreate.mock.calls[0][0]).toMatchObject({
      name: "Combo familiar",
      currency_code: "CUP",
      type: "combo",
    });
    expect(mockCreate.mock.calls[0][0]).not.toHaveProperty("product_id");
  });

  test("no sobrescribe una oferta que ya existe por el nombre", async () => {
    mockGetAll.mockResolvedValue([{ id: "vieja", name: "Combo familiar" }]);

    await expect(applyOfferImportAction([creation()], "token")).rejects.toThrow(/ya existe/i);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  test("valida todo el lote antes de crear nada", async () => {
    await expect(
      applyOfferImportAction(
        [creation(), creation({ row: 3, name: "Otra", price: 0 })],
        "token"
      )
    ).rejects.toThrow(/fila 3/i);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  test("crea las rebajas con la relación al producto real", async () => {
    await applyOfferImportAction(
      [creation({ name: "Rebaja de ajo", type: "product", productId: "p1" })],
      "token"
    );

    expect(mockCreate.mock.calls[0][0]).toMatchObject({
      type: "product",
      product_id: "p1",
    });
  });

  test("rechaza un tipo fuera del dominio antes de crear", async () => {
    await expect(
      applyOfferImportAction(
        [creation({ type: "2x1" as unknown as OfferCreation["type"] })],
        "token"
      )
    ).rejects.toThrow(/fila 2/i);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  test("rechaza un Activa que no sea booleano", async () => {
    await expect(
      applyOfferImportAction(
        [creation({ active: "quizá" as unknown as boolean })],
        "token"
      )
    ).rejects.toThrow(/fila 2/i);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  test("rechaza una rebaja cuyo producto no existe en PocketBase", async () => {
    mockGetAll.mockResolvedValue([]);

    await expect(
      applyOfferImportAction(
        [creation({ name: "Rebaja de ajo", type: "product", productId: "inexistente" })],
        "token"
      )
    ).rejects.toThrow(/producto/i);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  test("rechaza un lote mayor al máximo de filas", async () => {
    const many = Array.from({ length: 501 }, (_, i) =>
      creation({ row: i + 2, name: `Oferta ${i + 2}` })
    );

    await expect(applyOfferImportAction(many, "token")).rejects.toThrow(/máximo/i);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  test("deshace las ofertas creadas si una fila falla en PocketBase", async () => {
    mockCreate
      .mockResolvedValueOnce({ id: "creada-1", name: "Combo familiar" })
      .mockRejectedValueOnce(new Error("PB caído"));

    await expect(
      applyOfferImportAction([creation(), creation({ row: 3, name: "Otra oferta" })], "token")
    ).rejects.toThrow(/PB caído/);
    expect(mockDelete).toHaveBeenCalledWith("creada-1");
  });
});
