import { describe, expect, test, vi, beforeEach } from "vitest";

vi.mock("@/lib/admin-auth", () => ({
  requirePermission: vi.fn().mockResolvedValue({ userId: "u1", permissions: {} }),
}));

vi.mock("@/lib/pocketbase", () => ({
  getAdminPB: vi.fn(),
  getTokenPB: vi.fn(),
  getAllRecords: vi.fn(),
  sanitize: (v: string) => v,
}));

import { getAllRecords, getAdminPB } from "@/lib/pocketbase";
import { getStoriesAction, createStoryAction } from "./admin-extras";

const mockGetAll = vi.mocked(getAllRecords);
const mockGetAdminPB = vi.mocked(getAdminPB);

const mockCreate = vi.fn();
const pb = {
  collection: vi.fn(() => ({
    create: mockCreate,
    update: vi.fn(),
    delete: vi.fn(),
  })),
} as any;

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAdminPB.mockResolvedValue(pb);
});

describe("admin stories actions", () => {
  test("getStoriesAction maps rows", async () => {
    mockGetAll.mockResolvedValue([
      { id: "s1", name: "Historia", image: "/i.png", duration: 6, link_type: "offer", offer_id: "o1", active: true, sort: 3 },
    ]);

    await expect(getStoriesAction("tok")).resolves.toEqual([
      {
        id: "s1",
        name: "Historia",
        image: "/i.png",
        duration: 6,
        linkType: "offer",
        productId: "",
        offerId: "o1",
        active: true,
        sort: 3,
      },
    ]);
  });

  test("createStoryAction rejects invalid input before writing", async () => {
    await expect(
      createStoryAction({ name: "", image: "/i.png", duration: 5, linkType: "none" } as any, "tok"),
    ).rejects.toThrow(/nombre/i);
    await expect(
      createStoryAction({ name: "Ok", image: "", duration: 5, linkType: "none" } as any, "tok"),
    ).rejects.toThrow(/imagen/i);
    await expect(
      createStoryAction({ name: "Ok", image: "/i.png", duration: 0, linkType: "none" } as any, "tok"),
    ).rejects.toThrow(/duraci/i);
    await expect(
      createStoryAction({ name: "Ok", image: "/i.png", duration: 5, linkType: "product", productId: "" } as any, "tok"),
    ).rejects.toThrow(/producto/i);
    await expect(
      createStoryAction({ name: "Ok", image: "/i.png", duration: 5, linkType: "offer", offerId: "" } as any, "tok"),
    ).rejects.toThrow(/oferta/i);
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
