import { describe, expect, it } from "vitest";
import { shouldShowNoAdminNotice } from "@/lib/push/notices";

const base = {
  setupNeeded: false,
  configured: true,
  supported: true,
  adminCount: 0,
};

describe("aviso de dispositivos admin sin activar", () => {
  it("aparece cuando no hay ningún admin suscrito", () => {
    expect(shouldShowNoAdminNotice(base)).toBe(true);
  });

  it("desaparece en cuanto hay un dispositivo activo", () => {
    expect(shouldShowNoAdminNotice({ ...base, adminCount: 1 })).toBe(false);
  });

  it("no se muestra si PocketBase o las claves VAPID no están listas", () => {
    expect(shouldShowNoAdminNotice({ ...base, setupNeeded: true })).toBe(false);
    expect(shouldShowNoAdminNotice({ ...base, configured: false })).toBe(false);
  });

  it("no se muestra en un navegador sin soporte push", () => {
    expect(shouldShowNoAdminNotice({ ...base, supported: false })).toBe(false);
  });
});
