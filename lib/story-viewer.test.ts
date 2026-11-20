import { describe, expect, test } from "vitest";
import { advanceStoryIndex, retreatStoryIndex } from "./story-viewer";

describe("story viewer helpers", () => {
  test("advanceStoryIndex moves forward and closes at end", () => {
    expect(advanceStoryIndex(0, 3)).toBe(1);
    expect(advanceStoryIndex(1, 3)).toBe(2);
    expect(advanceStoryIndex(2, 3)).toBeNull();
  });

  test("retreatStoryIndex moves back and clamps at start", () => {
    expect(retreatStoryIndex(2, 3)).toBe(1);
    expect(retreatStoryIndex(1, 3)).toBe(0);
    expect(retreatStoryIndex(0, 3)).toBe(0);
  });
});
