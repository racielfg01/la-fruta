import { toIsoDate } from "@/lib/order-dates";

export const DELIVERY_RATING_WINDOW_HOURS = 72;

const WINDOW_MS = DELIVERY_RATING_WINDOW_HOURS * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const MAX_COMMENT_LENGTH = 500;

export interface DeliveryRatingRecord {
  status?: string | null;
  deliveredAt?: string | null;
  deliveryRating?: number | string | null;
  deliveryComment?: string | null;
}

function deliveredTime(record: DeliveryRatingRecord): number | null {
  const iso = toIsoDate(record.deliveredAt);
  if (!iso) return null;
  const time = new Date(iso).getTime();
  return Number.isNaN(time) ? null : time;
}

function hoursSince(delivered: number, now: Date): number {
  return (now.getTime() - delivered) / HOUR_MS;
}

export function deliveryRatingHoursLeft(
  record: DeliveryRatingRecord,
  now: Date = new Date()
): number {
  const delivered = deliveredTime(record);
  if (delivered === null) return 0;
  return Math.max(0, Math.floor(DELIVERY_RATING_WINDOW_HOURS - hoursSince(delivered, now)));
}

export function canRateDelivery(
  record: DeliveryRatingRecord,
  now: Date = new Date()
): boolean {
  if (record.status !== "delivered") return false;
  if (record.deliveryRating !== null && record.deliveryRating !== undefined && record.deliveryRating !== "") {
    return false;
  }
  const delivered = deliveredTime(record);
  if (delivered === null) return false;
  const elapsed = hoursSince(delivered, now);
  return elapsed >= 0 && elapsed < DELIVERY_RATING_WINDOW_HOURS;
}

export function validateDeliveryRating(input: {
  stars: unknown;
  comment: unknown;
}):
  | { ok: true; value: { stars: number; comment: string } }
  | { ok: false; error: string } {
  const stars = Number(input.stars);
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
    return { ok: false, error: "Elige entre 1 y 5 estrellas." };
  }
  const comment = typeof input.comment === "string" ? input.comment.trim() : "";
  if (!comment) {
    return { ok: false, error: "Escribe cómo fue la entrega." };
  }
  if (comment.length > MAX_COMMENT_LENGTH) {
    return { ok: false, error: `Máximo ${MAX_COMMENT_LENGTH} caracteres.` };
  }
  return { ok: true, value: { stars, comment } };
}

/** Campos de valoración tal como vienen de PocketBase, ya normalizados. */
export function deliveryRatingFromRecord(record: Record<string, any> | null | undefined) {
  return {
    deliveredAt: toIsoDate(record?.delivered_at ?? record?.deliveredAt),
    deliveryRating:
      record?.delivery_rating === null || record?.delivery_rating === undefined || record?.delivery_rating === ""
        ? undefined
        : Number(record.delivery_rating),
    deliveryComment: record?.delivery_comment || "",
  };
}
