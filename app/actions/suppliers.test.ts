import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/lib/admin-auth", () => ({
  requirePermission: vi.fn().mockResolvedValue({
    userId: "user-1",
    permissions: {},
  }),
}));

vi.mock("@/lib/pocketbase", () => ({
  getAdminPB: vi.fn(),
  getTokenPB: vi.fn(),
  getAllRecords: vi.fn(),
  buildOrFilter: (field: string, ids: string[]) =>
    ids.length ? ids.map((id) => `${field} = "${id}"`).join(" || ") : null,
  sanitize: (value: string) => value,
}));

import { requirePermission } from "@/lib/admin-auth";
import { getAdminPB, getAllRecords } from "@/lib/pocketbase";
import {
  applyPurchaseStockAction,
  createPurchaseAction,
  createSupplierAction,
  deletePurchaseAction,
  deleteSupplierAction,
  getSupplierDetailAction,
  getSuppliersOverviewAction,
  updateSupplierAction,
} from "./suppliers";

const mockGetAdmin = vi.mocked(getAdminPB);
const mockGetAll = vi.mocked(getAllRecords);
const mockRequirePermission = vi.mocked(requirePermission);

function batchDisabledError() {
  return Object.assign(new Error("Batch requests are not allowed"), { status: 403 });
}

function createFakePb() {
  const create = vi.fn();
  const update = vi.fn().mockResolvedValue(undefined);
  const remove = vi.fn().mockResolvedValue(undefined);
  const getOne = vi.fn();
  const createBatch = vi.fn(() => {
    throw batchDisabledError();
  });

  return {
    create,
    update,
    remove,
    getOne,
    createBatch,
    collection: vi.fn(() => ({ create, update, delete: remove, getOne })),
  };
}

let pb: ReturnType<typeof createFakePb>;

beforeEach(() => {
  vi.clearAllMocks();
  pb = createFakePb();
  mockGetAdmin.mockResolvedValue(pb as never);
  mockGetAll.mockResolvedValue([]);
});

describe("acciones de compras sin API de batch", () => {
  test("crea la compra y sus líneas con escrituras individuales", async () => {
    mockGetAll.mockResolvedValueOnce([{ id: "p1", name: "Ajo", unit: "docena" }]);
    pb.create
      .mockResolvedValueOnce({ id: "buy-1" })
      .mockResolvedValue({ id: "item-1" });

    const result = await createPurchaseAction("tok", {
      supplier: "sup-1",
      purchasedAt: "2026-11-24T10:00:00Z",
      notes: "smoke",
      items: [{ product: "p1", quantity: 2, unitPrice: 100 }],
    });

    expect(result).toEqual({ id: "buy-1" });
    expect(pb.createBatch).not.toHaveBeenCalled();
    expect(pb.create).toHaveBeenCalledTimes(2);
    expect(pb.create.mock.calls[0][0]).toMatchObject({
      supplier: "sup-1",
      created_by: "user-1",
    });
    expect(pb.create.mock.calls[1][0]).toMatchObject({
      purchase: "buy-1",
      product: "p1",
      product_name: "Ajo",
      quantity: 2,
      unit_price: 100,
    });
  });

  test("borra la compra si falla alguna línea", async () => {
    mockGetAll.mockResolvedValueOnce([{ id: "p1", name: "Ajo" }]);
    pb.create.mockResolvedValueOnce({ id: "buy-1" });
    pb.create.mockRejectedValueOnce(new Error("linea invalida"));

    await expect(
      createPurchaseAction("tok", {
        supplier: "sup-1",
        purchasedAt: "2026-11-24T10:00:00Z",
        notes: "",
        items: [{ product: "p1", quantity: 1, unitPrice: 1 }],
      })
    ).rejects.toThrow("linea invalida");

    expect(pb.remove).toHaveBeenCalledWith("buy-1");
  });

  test("borra los items y luego la compra sin batch", async () => {
    pb.getOne.mockResolvedValue({ id: "buy-1", stock_applied_at: "" });
    mockGetAll.mockResolvedValueOnce([
      { id: "it1", purchase: "buy-1", product: "p1", quantity: 1, unit_price: 5 },
    ]);

    await deletePurchaseAction("tok", "buy-1");

    expect(pb.createBatch).not.toHaveBeenCalled();
    expect(pb.remove.mock.calls.map(([id]) => id)).toEqual(["it1", "buy-1"]);
  });

  test("aplica stock sin batch y marca la compra", async () => {
    pb.getOne.mockResolvedValue({ id: "buy-1", stock_applied_at: "" });
    mockGetAll
      .mockResolvedValueOnce([
        { id: "it1", purchase: "buy-1", product: "p1", quantity: 2, unit_price: 10 },
      ])
      .mockResolvedValueOnce([{ id: "p1", stock: 5 }]);

    const result = await applyPurchaseStockAction("tok", "buy-1");

    expect(result).toEqual({ applied: 1, missing: [] });
    expect(pb.createBatch).not.toHaveBeenCalled();
    expect(pb.create).toHaveBeenCalledWith({ purchase: "buy-1" });
    expect(pb.update).toHaveBeenCalledWith("p1", { "stock+": 2, in_stock: true });
    expect(pb.update).toHaveBeenCalledWith(
      "buy-1",
      expect.objectContaining({ stock_applied_at: expect.any(String) })
    );
  });

  test("revierte el stock y libera el reclamo si falla una actualización", async () => {
    pb.getOne.mockResolvedValue({ id: "buy-1", stock_applied_at: "" });
    mockGetAll
      .mockResolvedValueOnce([
        { id: "it1", purchase: "buy-1", product: "p1", quantity: 2, unit_price: 10 },
      ])
      .mockResolvedValueOnce([{ id: "p1", stock: 5 }]);
    pb.create.mockResolvedValueOnce({ id: "claim-1" });
    pb.update
      .mockResolvedValueOnce({ id: "p1" })
      .mockRejectedValueOnce(new Error("PocketBase caído"));

    await expect(applyPurchaseStockAction("tok", "buy-1")).rejects.toThrow(
      "PocketBase caído"
    );

    expect(pb.update).toHaveBeenCalledWith("p1", { "stock+": -2 });
    expect(pb.remove).toHaveBeenCalledWith("claim-1");
  });

  test("un reclamo duplicado no vuelve a sumar stock", async () => {
    pb.getOne.mockResolvedValue({ id: "buy-1", stock_applied_at: "" });
    mockGetAll
      .mockResolvedValueOnce([
        { id: "it1", purchase: "buy-1", product: "p1", quantity: 2, unit_price: 10 },
      ])
      .mockResolvedValueOnce([{ id: "p1", stock: 5 }]);
    pb.create.mockRejectedValueOnce(
      Object.assign(new Error("UNIQUE constraint failed"), { status: 400 })
    );

    await expect(applyPurchaseStockAction("tok", "buy-1")).rejects.toThrow(
      /ya fue aplicado/
    );

    expect(pb.update).not.toHaveBeenCalled();
  });
});

describe("permiso de las acciones de proveedores", () => {
  const token = "tok";
  const denied = new Error("Acceso denegado: permisos insuficientes para esta acción");

  const actions: Array<{ name: string; run: () => Promise<unknown> }> = [
    {
      name: "getSuppliersOverviewAction",
      run: () => getSuppliersOverviewAction(token),
    },
    {
      name: "getSupplierDetailAction",
      run: () => getSupplierDetailAction(token, "sup-1"),
    },
    {
      name: "createSupplierAction",
      run: () => createSupplierAction(token, { name: "Proveedor", phone: "1234567" }),
    },
    {
      name: "updateSupplierAction",
      run: () =>
        updateSupplierAction(token, "sup-1", { name: "Proveedor", phone: "1234567" }),
    },
    {
      name: "deleteSupplierAction",
      run: () => deleteSupplierAction(token, "sup-1"),
    },
    {
      name: "createPurchaseAction",
      run: () =>
        createPurchaseAction(token, {
          supplier: "sup-1",
          purchasedAt: "2026-11-24T10:00:00Z",
          notes: "",
          items: [{ product: "p1", quantity: 1, unitPrice: 1 }],
        }),
    },
    {
      name: "deletePurchaseAction",
      run: () => deletePurchaseAction(token, "buy-1"),
    },
    {
      name: "applyPurchaseStockAction",
      run: () => applyPurchaseStockAction(token, "buy-1"),
    },
  ];

  test.each(actions)("$name pide el permiso suppliers", async ({ run }) => {
    mockRequirePermission.mockRejectedValueOnce(denied);

    await expect(run()).rejects.toThrow(denied);
    expect(mockRequirePermission).toHaveBeenCalledWith(token, "suppliers");
  });
});
