import type { PushSubscriptionInput } from "./types";

export const MAX_SUBSCRIPTIONS_PER_USER = 5;

function cleanString(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/**
 * Valida y normaliza lo que envía el navegador. No se confía en nada más del
 * cliente: la audiencia y el dueño se resuelven en el servidor.
 */
export function normalizePushSubscription(input: unknown): PushSubscriptionInput | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as Record<string, unknown>;
  const endpoint = cleanString(raw.endpoint, 2048);
  if (!endpoint.startsWith("https://")) return null;

  const rawKeys =
    raw.keys && typeof raw.keys === "object"
      ? (raw.keys as Record<string, unknown>)
      : {};
  const p256dh = cleanString(rawKeys.p256dh, 1024);
  const auth = cleanString(rawKeys.auth, 1024);
  if (!p256dh || !auth) return null;

  return {
    endpoint,
    keys: { p256dh, auth },
    expirationTime:
      typeof raw.expirationTime === "number" && Number.isFinite(raw.expirationTime)
        ? raw.expirationTime
        : null,
  };
}

/** 404/410 significan que el dispositivo ya no existe: se descarta. */
export function isExpiredPushError(error: unknown): boolean {
  const status = Number(
    (error as { statusCode?: number; status?: number } | null)?.statusCode ??
      (error as { status?: number } | null)?.status
  );
  return status === 404 || status === 410;
}
