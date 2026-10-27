import type { PushPayload } from "./types";

/** Formatea un monto entero en CUP con separador de miles simple. */
export function formatCup(value: number): string {
  const amount = Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
  return `${amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} CUP`;
}

export function buildOrderPayload(input: {
  orderId: string;
  customerName: string;
  total: number;
  zone?: string;
}): PushPayload {
  const parts = [
    `#${input.orderId}`,
    input.customerName?.trim(),
    formatCup(input.total),
    input.zone?.trim(),
  ].filter(Boolean);
  return {
    title: "Pedido nuevo",
    body: parts.join(" · "),
    url: "/admin/ordenes",
    tag: `order-${input.orderId}`,
  };
}

export function buildUserPayload(input: { userId: string; name: string }): PushPayload {
  return {
    title: "Cliente nuevo",
    body: input.name?.trim() || "Se registró una cuenta nueva.",
    url: "/admin/usuarios",
    tag: `user-${input.userId}`,
  };
}

export function buildProductPayload(input: { names: string[]; total: number }): PushPayload {
  const shown = input.names
    .map((name) => name.trim())
    .filter(Boolean)
    .slice(0, 3);
  const rest = Math.max(0, input.total - shown.length);
  const body =
    shown.length === 0
      ? "Hay productos nuevos en la tienda."
      : rest > 0
        ? `${shown.join(", ")} y ${rest} más`
        : shown.join(", ");

  return {
    title: "Productos nuevos",
    body,
    url: "/",
    tag: "products-new",
  };
}

export function buildTestPayload(): PushPayload {
  return {
    title: "Prueba de aviso",
    body: "Si ves esto, este dispositivo recibe avisos.",
    url: "/admin/notificaciones",
    tag: "push-test",
  };
}

/** Milisegundos que faltan para poder volver a anunciar productos. */
export function remainingCooldownMs(
  lastPushAt: string | null | undefined,
  now: number,
  cooldownMs = 60_000
): number {
  if (!lastPushAt) return 0;
  const last = Date.parse(String(lastPushAt).replace(" ", "T"));
  if (!Number.isFinite(last)) return 0;
  return Math.max(0, cooldownMs - (now - last));
}
