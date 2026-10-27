import { describe, expect, it } from "vitest";
import {
  buildOrderPayload,
  buildProductPayload,
  buildTestPayload,
  buildUserPayload,
  formatCup,
  remainingCooldownMs,
} from "./payloads";

describe("formatCup", () => {
  it("redondea y separa miles", () => {
    expect(formatCup(1250)).toBe("1 250 CUP");
    expect(formatCup(99.6)).toBe("100 CUP");
    expect(formatCup(0)).toBe("0 CUP");
  });

  it("trata valores inválidos como 0", () => {
    expect(formatCup(Number.NaN)).toBe("0 CUP");
    expect(formatCup(-50)).toBe("0 CUP");
  });
});

describe("buildOrderPayload", () => {
  it("incluye código, cliente, total y zona, y abre las órdenes", () => {
    const payload = buildOrderPayload({
      orderId: "abc123",
      customerName: "Ana",
      total: 1250,
      zone: "Centro",
    });
    expect(payload.title).toBe("Pedido nuevo");
    expect(payload.body).toContain("#abc123");
    expect(payload.body).toContain("1 250 CUP");
    expect(payload.body).toContain("Centro");
    expect(payload.url).toBe("/admin/ordenes");
    expect(payload.tag).toBe("order-abc123");
  });

  it("omite la zona vacía", () => {
    const payload = buildOrderPayload({
      orderId: "x",
      customerName: "Luis",
      total: 10,
      zone: "  ",
    });
    expect(payload.body).toBe("#x · Luis · 10 CUP");
  });
});

describe("buildUserPayload", () => {
  it("avisa con el nombre y abre usuarios", () => {
    const payload = buildUserPayload({ userId: "u1", name: "Luis" });
    expect(payload.title).toBe("Cliente nuevo");
    expect(payload.body).toBe("Luis");
    expect(payload.url).toBe("/admin/usuarios");
    expect(payload.tag).toBe("user-u1");
  });
});

describe("buildProductPayload", () => {
  it("muestra hasta tres nombres y cuenta el resto", () => {
    const payload = buildProductPayload({ names: ["A", "B", "C", "D"], total: 5 });
    expect(payload.title).toBe("Productos nuevos");
    expect(payload.body).toBe("A, B, C y 2 más");
    expect(payload.url).toBe("/");
  });

  it("no deja el cuerpo vacío si no hay nombres", () => {
    expect(buildProductPayload({ names: [], total: 2 }).body).toContain("productos nuevos");
  });
});

describe("buildTestPayload", () => {
  it("apunta a la pantalla de configuración", () => {
    expect(buildTestPayload().url).toBe("/admin/notificaciones");
  });
});

describe("remainingCooldownMs", () => {
  const now = Date.parse("2026-10-27T15:00:00.000Z");

  it("devuelve el tiempo restante dentro del minuto", () => {
    expect(remainingCooldownMs("2026-10-27 14:59:30.000Z", now)).toBe(30_000);
  });

  it("devuelve 0 cuando ya pasó o no hay marca", () => {
    expect(remainingCooldownMs("2026-10-27 14:58:00.000Z", now)).toBe(0);
    expect(remainingCooldownMs(null, now)).toBe(0);
    expect(remainingCooldownMs("no-es-fecha", now)).toBe(0);
  });
});
