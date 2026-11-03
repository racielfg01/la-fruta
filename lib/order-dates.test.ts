import { describe, expect, it } from "vitest";
import { formatOrderDate, orderDates, toIsoDate } from "./order-dates";

describe("orderDates", () => {
  it("lee created_at/updated_at, los campos reales de la colección orders", () => {
    const dates = orderDates({
      id: "abc",
      created_at: "2026-11-02 20:00:44.265Z",
      updated_at: "2026-11-03 08:15:00.000Z",
    });

    expect(dates.createdAt).toBe("2026-11-02T20:00:44.265Z");
    expect(dates.updatedAt).toBe("2026-11-03T08:15:00.000Z");
  });

  it("prefiere los campos de sistema cuando existen", () => {
    const dates = orderDates({
      created: "2026-10-01 10:00:00.000Z",
      updated: "2026-10-02 11:00:00.000Z",
      created_at: "2026-11-02 20:00:44.265Z",
      updated_at: "2026-11-03 08:15:00.000Z",
    });

    expect(dates.createdAt).toBe("2026-10-01T10:00:00.000Z");
    expect(dates.updatedAt).toBe("2026-10-02T11:00:00.000Z");
  });

  it("devuelve cadena vacía cuando no hay fecha", () => {
    expect(orderDates({ id: "abc" })).toEqual({ createdAt: "", updatedAt: "" });
    expect(orderDates({ created_at: null, updated_at: "" })).toEqual({
      createdAt: "",
      updatedAt: "",
    });
  });
});

describe("toIsoDate", () => {
  it("normaliza el separador de PocketBase para que Date lo entienda", () => {
    const iso = toIsoDate("2026-11-02 20:00:44.265Z");

    expect(iso).toBe("2026-11-02T20:00:44.265Z");
    expect(Number.isNaN(new Date(iso).getTime())).toBe(false);
  });
});

describe("formatOrderDate", () => {
  it("devuelve un texto legible y nunca 'Invalid Date'", () => {
    expect(formatOrderDate("2026-11-02 20:00:44.265Z")).not.toBe(
      "Invalid Date"
    );
    expect(formatOrderDate("2026-11-02 20:00:44.265Z")).toContain("2026");
    expect(formatOrderDate(undefined)).toBe("Fecha no disponible");
    expect(formatOrderDate("no-es-fecha")).toBe("Fecha no disponible");
  });
});
