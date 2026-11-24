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

import { getAdminPB } from "@/lib/pocketbase";
import { addOfferAction, editOfferAction } from "./admin";

function fakePb() {
  const create = vi.fn(async (record) => ({ id: "offer-1", ...record }));
  const update = vi.fn(async (_id: string, record) => ({ id: "offer-1", ...record }));
  const getOne = vi.fn();
  return {
    create,
    update,
    getOne,
    collection: vi.fn(() => ({ create, update, getOne })),
  };
}

const base = {
  name: "Combo",
  description: "Desc",
  price: 1000,
  currencyCode: "CUP",
  type: "combo" as const,
  productId: "",
  image: "",
  endDate: "",
  notes: "Recordatorio interno",
  active: true,
};

let pb: ReturnType<typeof fakePb>;

beforeEach(() => {
  vi.clearAllMocks();
  pb = fakePb();
  vi.mocked(getAdminPB).mockResolvedValue(pb as never);
});

describe("notas y vencimiento en las acciones de ofertas", () => {
  test("crear sin vencimiento guarda fecha vacía y las notas", async () => {
    await addOfferAction(base, "token");

    expect(pb.create).toHaveBeenCalledWith(
      expect.objectContaining({ end_date: "", notes: "Recordatorio interno" })
    );
  });

  test("editar guarda las notas en el registro", async () => {
    await editOfferAction("offer-1", { notes: "Nueva nota" }, "token");

    expect(pb.update).toHaveBeenCalledWith(
      "offer-1",
      expect.objectContaining({ notes: "Nueva nota" })
    );
  });

  test("editar sin vencimiento limpia la fecha en vez de poner ahora", async () => {
    await editOfferAction("offer-1", { endDate: "" }, "token");

    expect(pb.update).toHaveBeenCalledWith(
      "offer-1",
      expect.objectContaining({ end_date: "" })
    );
  });
});
