import { describe, expect, it } from "vitest";
import { audienceForRole } from "./audience";

describe("audienceForRole", () => {
  it("rol 2 es admin", () => {
    expect(audienceForRole(2)).toBe("admin");
    expect(audienceForRole("2")).toBe("admin");
  });

  it("cualquier otro rol es cliente", () => {
    expect(audienceForRole(1)).toBe("client");
    expect(audienceForRole(null)).toBe("client");
    expect(audienceForRole(undefined)).toBe("client");
  });
});
