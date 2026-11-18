import { describe, expect, it } from "vitest";
import { offlineStatus } from "@/lib/offline";

describe("estado de conexión de la pantalla sin conexión", () => {
  it("explica qué pasa cuando no hay red", () => {
    expect(offlineStatus(false)).toEqual({
      title: "Sin conexión",
      description:
        "No pudimos cargar la tienda. Revisa tu conexión o espera a que vuelva la señal.",
      action: "Reintentar",
    });
  });

  it("invita a volver cuando la conexión volvió", () => {
    expect(offlineStatus(true)).toEqual({
      title: "Conexión restaurada",
      description: "Ya puedes volver a la tienda y ver los productos actualizados.",
      action: "Volver a la tienda",
    });
  });
});
