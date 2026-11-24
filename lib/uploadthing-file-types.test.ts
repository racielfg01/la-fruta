import { describe, expect, it } from "vitest";
import { CATEGORY_IMAGE_FILE_TYPES } from "./uploadthing-file-types";

describe("CATEGORY_IMAGE_FILE_TYPES", () => {
  it("acepta SVG con el mismo límite que las demás imágenes", () => {
    expect(CATEGORY_IMAGE_FILE_TYPES["image/svg+xml"]).toEqual({
      maxFileSize: "2MB",
    });
  });

  it("conserva el alias general de imágenes", () => {
    expect(CATEGORY_IMAGE_FILE_TYPES.image).toEqual({ maxFileSize: "2MB" });
  });
});
