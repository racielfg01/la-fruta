"use strict";

// app/actions/public-offers.test.ts
import { describe, test, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/pocketbase", () => ({
  getPB: vi.fn(),
  getAllRecords: vi.fn(),
}));

import { getPB, getAllRecords } from "@/lib/pocketbase";
import { getPublicOffers } from "./public-offers";

const mockGetPB = getPB as unknown as ReturnType<typeof vi.fn>;
const mockGetAll = getAllRecords as unknown as ReturnType<typeof vi.fn>;

function registro(over: Record<string, unknown> = {}) {
  return {
    id: "o1",
    name: "Oferta",
    description: "Desc",
    price: 100,
    type: "combo",
    product_id: "",
    image: "",
    end_date: "2999-01-01 00:00:00.000Z",
    active: true,
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetPB.mockReturnValue({});
});

describe("getPublicOffers", () => {
  test("devuelve solo las ofertas vigentes", async () => {
    mockGetAll.mockResolvedValue([
      registro({ id: "vigente" }),
      registro({ id: "vencida", end_date: "2020-01-01 00:00:00.000Z" }),
      registro({ id: "inactiva", active: false }),
    ]);

    const res = await getPublicOffers();
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.map((o) => o.id)).toEqual(["vigente"]);
    }
  });

  test("una oferta vencida no se sirve aunque esté activa", async () => {
    // El filtro por fecha es el que decide: `filter(isOfferActive)` pasaba el
    // indice del array como `now` y nunca filtraba.
    mockGetAll.mockResolvedValue([
      registro({ id: "vencida", end_date: "2020-01-01 00:00:00.000Z" }),
    ]);

    const res = await getPublicOffers();
    expect(res.success).toBe(true);
    if (res.success) expect(res.data).toEqual([]);
  });

  test("si PocketBase falla, responde con error y sin datos", async () => {
    mockGetAll.mockRejectedValue(new Error("PocketBase caído"));

    const res = await getPublicOffers();
    expect(res.success).toBe(false);
  });
});
