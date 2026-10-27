import webpush from "web-push";
import { getVapidConfig } from "./config";
import { isExpiredPushError } from "./subscriptions";
import type { PushPayload, StoredPushSubscription } from "./types";

export interface PushSendResult {
  configured: boolean;
  sent: number;
  failed: number;
  expired: string[];
}

type Urgency = "very-low" | "low" | "normal" | "high";

/**
 * Envía a todos los dispositivos. No lanza: los errores se cuentan y los
 * endpoints vencidos se devuelven para que el llamador los borre.
 */
export async function sendPushToSubscriptions(
  subscriptions: StoredPushSubscription[],
  payload: PushPayload,
  urgency: Urgency = "normal"
): Promise<PushSendResult> {
  const config = getVapidConfig();
  const result: PushSendResult = {
    configured: config.configured,
    sent: 0,
    failed: 0,
    expired: [],
  };
  if (!config.configured || subscriptions.length === 0) return result;

  try {
    webpush.setVapidDetails(config.subject, config.publicKey, config.privateKey);
  } catch (error) {
    console.warn("[push] claves VAPID inválidas", error instanceof Error ? error.message : "");
    return { ...result, configured: false };
  }

  const body = JSON.stringify(payload);

  async function sendOne(subscription: StoredPushSubscription): Promise<void> {
    try {
      await webpush.sendNotification(
        { endpoint: subscription.endpoint, keys: subscription.keys },
        body,
        { TTL: 3600, urgency }
      );
      result.sent += 1;
    } catch (error) {
      result.failed += 1;
      if (isExpiredPushError(error)) {
        result.expired.push(subscription.id);
      } else {
        const status = (error as { statusCode?: number })?.statusCode;
        console.warn(`[push] fallo al enviar${status ? ` (${status})` : ""}`);
      }
    }
  }

  // Lotes pequeños: suficientes para no bloquear y no saturar el servicio.
  for (let index = 0; index < subscriptions.length; index += 20) {
    await Promise.all(subscriptions.slice(index, index + 20).map(sendOne));
  }

  return result;
}
