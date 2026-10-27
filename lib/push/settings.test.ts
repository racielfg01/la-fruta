import { describe, expect, it } from "vitest";
import { markerToMs, parseNotificationSettings, toPocketBaseDate } from "./settings";

describe("parseNotificationSettings", () => {
  it("usa true por defecto cuando el campo no existe", () => {
    expect(parseNotificationSettings({})).toEqual({
      newOrder: true,
      newUser: true,
      newProducts: true,
      lastProductsPushAt: null,
    });
  });

  it("respeta los false guardados", () => {
    const settings = parseNotificationSettings({
      notify_new_order: false,
      notify_new_user: false,
      notify_new_products: false,
      last_products_push_at: "2026-10-27 14:00:00.000Z",
    });
    expect(settings.newOrder).toBe(false);
    expect(settings.newUser).toBe(false);
    expect(settings.newProducts).toBe(false);
    expect(settings.lastProductsPushAt).toBe("2026-10-27 14:00:00.000Z");
  });

  it("ignora un valor no booleano", () => {
    expect(parseNotificationSettings({ notify_new_order: "no" }).newOrder).toBe(true);
  });

  it("tolera un registro nulo", () => {
    expect(parseNotificationSettings(null).newOrder).toBe(true);
  });
});

describe("fechas de PocketBase", () => {
  it("convierte ISO al formato de PB", () => {
    expect(toPocketBaseDate("2026-10-27T14:00:00.000Z")).toBe("2026-10-27 14:00:00.000Z");
  });

  it("tolera el formato de PB al leer", () => {
    expect(markerToMs("2026-10-27 14:00:00.000Z")).toBe(
      Date.parse("2026-10-27T14:00:00.000Z")
    );
  });

  it("devuelve 0 para una fecha inválida", () => {
    expect(markerToMs("no-es-fecha")).toBe(0);
    expect(toPocketBaseDate("no-es-fecha")).toBe("");
  });
});
