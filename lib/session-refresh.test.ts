import { describe, expect, it } from "vitest";
import { decideSessionRefresh } from "./session-refresh";

describe("decideSessionRefresh", () => {
  it("acepta la sesión cuando el servidor devuelve el usuario", () => {
    expect(
      decideSessionRefresh({ success: true, user: { id: "u1" } }),
    ).toBe("accept");
  });

  it("cierra la sesión solo cuando el servidor dice que el token no vale", () => {
    expect(
      decideSessionRefresh({
        success: false,
        code: "invalid_session",
        error: "Sesión inválida o expirada",
      }),
    ).toBe("logout");
  });

  it("conserva la sesión ante un fallo transitorio", () => {
    expect(
      decideSessionRefresh({
        success: false,
        code: "error",
        error: "No se pudo validar la sesión",
      }),
    ).toBe("keep");
    expect(decideSessionRefresh({ success: false })).toBe("keep");
  });

  it("una respuesta ausente o fallida no cierra la sesión", () => {
    expect(decideSessionRefresh(null)).toBe("keep");
    expect(decideSessionRefresh(undefined)).toBe("keep");
  });

  it("no acepta una respuesta exitosa sin usuario", () => {
    expect(decideSessionRefresh({ success: true })).toBe("keep");
  });
});
