import { describe, expect, it } from "vitest";
import { adminNavigation, adminSectionLabel } from "@/lib/admin-navigation";

describe("etiqueta de sección del panel de administración", () => {
  it("muestra Panel Principal en la raíz", () => {
    expect(adminSectionLabel("/admin")).toBe("Panel Principal");
  });

  it("muestra la sección padre en una ruta profunda", () => {
    expect(adminSectionLabel("/admin/productos/abc123")).toBe("Productos");
  });

  it("muestra Proveedores en la ruta de proveedores", () => {
    expect(adminSectionLabel("/admin/proveedores")).toBe("Proveedores");
  });

  it("cae al título general en una ruta sin sección", () => {
    expect(adminSectionLabel("/admin/desconocido")).toBe(
      "Panel de Administración"
    );
  });
});

describe("permiso de la navegación de Proveedores", () => {
  it("se rige por suppliers y no por products", () => {
    const item = adminNavigation.find(
      (entry) => entry.href === "/admin/proveedores"
    );

    expect(item?.name).toBe("Proveedores");
    expect(item?.permission).toBe("suppliers");
  });
});
