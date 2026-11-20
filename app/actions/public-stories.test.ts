import { describe, expect, test, vi, beforeEach } from "vitest";
vi.mock("@/lib/pocketbase", () => ({ getPB: vi.fn(() => ({})), getAllRecords: vi.fn() }));
import { getAllRecords } from "@/lib/pocketbase";
import { getPublicStories } from "./public-stories";

const mockGetAll = getAllRecords as unknown as ReturnType<typeof vi.fn>;

describe("getPublicStories", () => {
  beforeEach(() => mockGetAll.mockReset());
  test("returns mapped active public stories in order", async () => {
    mockGetAll.mockResolvedValue([{ id: "1", name: "A", image: "x", duration: 6, link_type: "none", active: true, sort: 1 }]);
    await expect(getPublicStories()).resolves.toEqual([{ id: "1", name: "A", image: "x", duration: 6, linkType: "none", productId: "", offerId: "", active: true, sort: 1 }]);
  });
  test("returns [] on error/missing collection", async () => {
    mockGetAll.mockRejectedValueOnce(new Error("missing"));
    await expect(getPublicStories()).resolves.toEqual([]);
  });
});
