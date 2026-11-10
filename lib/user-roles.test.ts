import { describe, expect, it } from "vitest";
import { Role } from "./admin-store";
import {
  deriveNumericRoleId,
  resolveRoleForSave,
  roleSelectionFor,
} from "./user-roles";

const roles: Role[] = [
  { id: "rol_admin", name: "admin", description: "" },
  { id: "rol_client", name: "client", description: "" },
  { id: "rol_super", name: "supervisor", description: "rol personalizado" },
];

const roleIds = { admin: "rol_admin", client: "rol_client" };

describe("roleSelectionFor — qué rol preselecciona el diálogo de edición", () => {
  it("preselecciona el rol real del usuario (rol configurado en la plataforma)", () => {
    expect(roleSelectionFor({ role_id: 1, roleId: "rol_super" }, roles)).toBe(
      "rol_super",
    );
  });

  it("resuelve por nombre cuando el usuario viene sin rol real (dato viejo)", () => {
    expect(roleSelectionFor({ role_id: 2 }, roles)).toBe("rol_admin");
    expect(roleSelectionFor({ role_id: 1 }, roles)).toBe("rol_client");
  });

  it("cae al rol por nombre si el rol real ya no existe en la plataforma", () => {
    expect(
      roleSelectionFor({ role_id: 1, roleId: "rol_borrado" }, roles),
    ).toBe("rol_client");
  });

  it("sin roles configurados devuelve cadena vacía", () => {
    expect(roleSelectionFor({ role_id: 1 }, [])).toBe("");
  });
});

describe("deriveNumericRoleId — espejo numérico legado (User.role_id)", () => {
  it("2 solo para el rol admin, 1 para cualquier otro", () => {
    expect(deriveNumericRoleId("rol_admin", roles)).toBe(2);
    expect(deriveNumericRoleId("rol_super", roles)).toBe(1);
    expect(deriveNumericRoleId("no_existe", roles)).toBe(1);
  });
});

describe("resolveRoleForSave — qué rol se guarda en PocketBase", () => {
  it("guarda el rol real elegido, incluidos los roles personalizados", () => {
    expect(
      resolveRoleForSave({ role_id: 1, roleId: "rol_super" }, roleIds),
    ).toBe("rol_super");
  });

  it("retrocompatibilidad: sin rol real usa el mapeo legado admin/client", () => {
    expect(resolveRoleForSave({ role_id: 2 }, roleIds)).toBe("rol_admin");
    expect(resolveRoleForSave({ role_id: 1 }, roleIds)).toBe("rol_client");
  });

  it("nunca devuelve un rol vacío que borre la relación", () => {
    expect(resolveRoleForSave({ role_id: 1 }, { admin: "", client: "" })).toBe(
      "",
    );
  });
});
