import { describe, expect, test, vi, beforeEach } from "vitest";

vi.mock("@/lib/verify-session", () => ({
  verifySession: vi.fn(),
  isInvalidSession: (e: any) => e?.code === "invalid_session",
  isUnavailableSession: (e: any) => e?.code === "unavailable",
}));

vi.mock("@/lib/pocketbase", () => ({
  getAdminPB: vi.fn(),
  getTokenPB: vi.fn(),
  getAllRecords: vi.fn(),
  sanitize: (v: string) => v.replace(/"/g, '\\"'),
  buildOrFilter: (field: string, ids: string[]) =>
    ids.length ? ids.map((id) => `${field} = "${id}"`).join(" || ") : null,
}));

import { verifySession } from "@/lib/verify-session";
import { getAdminPB } from "@/lib/pocketbase";
import { getMyStoryReactionsAction, setStoryReactionAction } from "./story-reactions";

const mockVerify = vi.mocked(verifySession);
const mockGetAdminPB = vi.mocked(getAdminPB);

const mockGetFullList = vi.fn();
const mockGetFirstListItem = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();

const pb = {
  collection: vi.fn(() => ({
    getFullList: mockGetFullList,
    getFirstListItem: mockGetFirstListItem,
    create: mockCreate,
    update: mockUpdate,
  })),
} as any;

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAdminPB.mockResolvedValue(pb);
});

describe("story reactions actions", () => {
  test("getMyStoryReactionsAction returns null reactions for invalid session", async () => {
    const err = Object.assign(new Error("invalid"), { code: "invalid_session" });
    mockVerify.mockRejectedValue(err);
    await expect(getMyStoryReactionsAction("bad", ["s1"])).resolves.toEqual({ s1: null });
  });

  test("setStoryReactionAction rejects unauthenticated/invalid token", async () => {
    const err = Object.assign(new Error("invalid"), { code: "invalid_session" });
    mockVerify.mockRejectedValue(err);
    await expect(setStoryReactionAction("bad", "s1", "like")).rejects.toThrow();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  test("setStoryReactionAction upserts reaction for authenticated user", async () => {
    mockVerify.mockResolvedValue({ userId: "u1", email: "a@b.c", name: "A", roleId: "" });
    mockGetFirstListItem.mockRejectedValue(new Error("not found"));
    mockCreate.mockResolvedValue({ id: "r1", story: "s1", user: "u1", reaction: "love" });

    const res = await setStoryReactionAction("tok", "s1", "love");
    expect(res).toEqual({ storyId: "s1", reaction: "love" });
    expect(pb.collection).toHaveBeenCalledWith("story_reactions");
    expect(mockCreate).toHaveBeenCalledWith({ story: "s1", user: "u1", reaction: "love" });
  });

  test("getMyStoryReactionsAction returns current user reactions", async () => {
    mockVerify.mockResolvedValue({ userId: "u1", email: "a@b.c", name: "A", roleId: "" });
    mockGetFullList.mockResolvedValue([
      { id: "r1", story: "s1", user: "u1", reaction: "like" },
      { id: "r2", story: "s2", user: "u1", reaction: "whatever" },
    ]);

    await expect(getMyStoryReactionsAction("tok", ["s1", "s2", "s3"])).resolves.toEqual({
      s1: "like",
      s2: "whatever",
      s3: null,
    });
  });
});
