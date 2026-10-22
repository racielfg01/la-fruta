import { describe, it, expect } from "vitest";
import { buildOrFilter } from "./pocketbase";

describe("buildOrFilter", () => {
  it("repite el campo en cada operando del OR (sintaxis válida de PB)", () => {
    expect(buildOrFilter("order_id", ["a", "b"])).toBe(
      'order_id = "a" || order_id = "b"'
    );
  });

  it("escapa comillas dobles en los ids", () => {
    expect(buildOrFilter("order_id", ['a"x'])).toBe('order_id = "a\\"x"');
  });

  it("con un solo id genera una comparación simple", () => {
    expect(buildOrFilter("order_id", ["abc"])).toBe('order_id = "abc"');
  });

  it("con cero ids devuelve null para omitir el filtro", () => {
    expect(buildOrFilter("order_id", [])).toBe(null);
  });
});
