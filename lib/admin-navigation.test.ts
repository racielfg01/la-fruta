import { describe, expect, it } from "vitest";
import { adminSectionLabel } from "@/lib/admin-navigation";

describe("etiqueta de sección del panel de administración", () => {
  it("muestra Panel Principal en la raíz", () => {
    expect(adminSectionLabel("/admin")).toBe("Panel Principal");
  });

  it("muestra la sección padre en una ruta profunda", () => {
    expect(adminSectionLabel("/admin/productos/abc123")).toBe("Productos");
  });

  it("cae al título general en una ruta sin sección", () => {
    expect(adminSectionLabel("/admin/desconocido")).toBe(
      "Panel de Administración"
    );
  });
});
