import { describe, it, expect } from "vitest";
import { normalizeWhatsAppPhone, whatsAppLink } from "./whatsapp";

describe("normalizeWhatsAppPhone", () => {
  it("quita espacios, guiones, paréntesis y el +", () => {
    expect(normalizeWhatsAppPhone("+53 5555-1234")).toBe("5355551234");
    expect(normalizeWhatsAppPhone("(53) 5555 1234")).toBe("5355551234");
    expect(normalizeWhatsAppPhone("53.5555.1234")).toBe("5355551234");
  });

  it("devuelve vacío para null, undefined o sin dígitos", () => {
    expect(normalizeWhatsAppPhone(null)).toBe("");
    expect(normalizeWhatsAppPhone(undefined)).toBe("");
    expect(normalizeWhatsAppPhone("sin numero")).toBe("");
    expect(normalizeWhatsAppPhone("   ")).toBe("");
  });
});

describe("whatsAppLink", () => {
  it("construye el enlace sin mensaje", () => {
    expect(whatsAppLink("+53 5555-1234")).toBe("https://wa.me/5355551234");
  });

  it("codifica el mensaje precargado", () => {
    expect(whatsAppLink("5355551234", "Hola, necesito ayuda")).toBe(
      "https://wa.me/5355551234?text=Hola%2C%20necesito%20ayuda"
    );
  });

  it("ignora un mensaje en blanco", () => {
    expect(whatsAppLink("5355551234", "   ")).toBe("https://wa.me/5355551234");
  });

  it("devuelve null si no hay número o es demasiado corto", () => {
    expect(whatsAppLink("")).toBeNull();
    expect(whatsAppLink(null)).toBeNull();
    expect(whatsAppLink("12345")).toBeNull();
  });
});
