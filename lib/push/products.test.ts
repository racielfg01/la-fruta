import { describe, expect, it } from "vitest";
import { isNewVisibleProduct, selectNewProducts } from "./products";

const since = Date.parse("2026-10-27T13:00:00.000Z");

describe("isNewVisibleProduct", () => {
  it("cuenta un visible creado después de la marca", () => {
    expect(
      isNewVisibleProduct(
        { is_visible: true, created_at: "2026-10-27 14:00:00.000Z" },
        since
      )
    ).toBe(true);
  });

  it("no cuenta ocultos, viejos ni sin fecha", () => {
    expect(
      isNewVisibleProduct(
        { is_visible: false, created_at: "2026-10-27 14:00:00.000Z" },
        since
      )
    ).toBe(false);
    expect(
      isNewVisibleProduct(
        { is_visible: true, created_at: "2026-10-27 12:00:00.000Z" },
        since
      )
    ).toBe(false);
    expect(isNewVisibleProduct({ is_visible: true }, since)).toBe(false);
  });

  it("no asume visible cuando el campo falta", () => {
    expect(
      isNewVisibleProduct({ created_at: "2026-10-27 14:00:00.000Z" }, since)
    ).toBe(false);
  });
});

describe("selectNewProducts", () => {
  it("devuelve el total y hasta tres nombres, del más nuevo al más viejo", () => {
    const result = selectNewProducts(
      [
        { name: "Viejo", is_visible: true, created_at: "2026-10-27 12:00:00.000Z" },
        { name: "A", is_visible: true, created_at: "2026-10-27 14:00:00.000Z" },
        { name: "B", is_visible: true, created_at: "2026-10-27 15:00:00.000Z" },
        { name: "C", is_visible: true, created_at: "2026-10-27 16:00:00.000Z" },
        { name: "D", is_visible: true, created_at: "2026-10-27 17:00:00.000Z" },
        { name: "Oculto", is_visible: false, created_at: "2026-10-27 18:00:00.000Z" },
      ],
      since
    );
    expect(result.total).toBe(4);
    expect(result.names).toEqual(["D", "C", "B"]);
  });

  it("devuelve cero cuando no hay novedades", () => {
    expect(selectNewProducts([], since)).toEqual({ total: 0, names: [] });
  });
});
