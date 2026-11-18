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

const pb = { collection: vi.fn(() => ({ create: mockCreate })) };

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
  mockGetAll.mockResolvedValue([]);
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
});
