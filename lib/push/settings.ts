import type { NotificationSettings } from "./types";

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  newOrder: true,
  newUser: true,
  newProducts: true,
  lastProductsPushAt: null,
};

function boolOr(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

export function parseNotificationSettings(
  record: Record<string, unknown> | null | undefined
): NotificationSettings {
  return {
    newOrder: boolOr(record?.notify_new_order, true),
    newUser: boolOr(record?.notify_new_user, true),
    newProducts: boolOr(record?.notify_new_products, true),
    lastProductsPushAt:
      typeof record?.last_products_push_at === "string" && record.last_products_push_at
        ? record.last_products_push_at
        : null,
  };
}

/** Fecha en el formato que PocketBase usa en sus campos date. */
export function toPocketBaseDate(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(String(value).replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().replace("T", " ");
}

/** Convierte una marca de tiempo de PocketBase (o ISO) a milisegundos. */
export function markerToMs(marker: string | null | undefined): number {
  if (!marker) return 0;
  const ms = Date.parse(String(marker).replace(" ", "T"));
  return Number.isFinite(ms) ? ms : 0;
}
