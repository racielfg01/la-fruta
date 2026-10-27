import {
  getNewProducts,
  getNotificationSettings,
  listActiveSubscriptions,
  removeExpiredSubscriptions,
  updateNotificationSettings,
} from "./repository";
import { sendPushToSubscriptions } from "./send";
import {
  buildOrderPayload,
  buildProductPayload,
  buildUserPayload,
  remainingCooldownMs,
} from "./payloads";

export interface AnnounceResult {
  success: boolean;
  error?: string;
  sent?: number;
  failed?: number;
  total?: number;
  names?: string[];
  cooldownSeconds?: number;
}

let announceInFlight = false;

async function cleanup(expired: string[]): Promise<void> {
  if (expired.length === 0) return;
  await removeExpiredSubscriptions(expired).catch(() => undefined);
}

export async function notifyNewOrder(input: {
  orderId: string;
  customerName: string;
  total: number;
  zone?: string;
}): Promise<void> {
  try {
    const settings = await getNotificationSettings();
    if (!settings.newOrder) return;

    const subscriptions = await listActiveSubscriptions("admin");
    if (subscriptions.length === 0) return;

    const result = await sendPushToSubscriptions(
      subscriptions,
      buildOrderPayload(input),
      "high"
    );
    await cleanup(result.expired);
  } catch (error) {
    console.warn("[push] no se pudo avisar del pedido", error instanceof Error ? error.message : "");
  }
}

export async function notifyNewUser(input: { userId: string; name: string }): Promise<void> {
  try {
    const settings = await getNotificationSettings();
    if (!settings.newUser) return;

    const subscriptions = await listActiveSubscriptions("admin");
    if (subscriptions.length === 0) return;

    const result = await sendPushToSubscriptions(
      subscriptions,
      buildUserPayload(input),
      "normal"
    );
    await cleanup(result.expired);
  } catch (error) {
    console.warn("[push] no se pudo avisar del usuario", error instanceof Error ? error.message : "");
  }
}

export async function announceProductsNow(): Promise<AnnounceResult> {
  if (announceInFlight) {
    return { success: false, error: "Ya hay un envío de productos en curso." };
  }
  announceInFlight = true;

  try {
    const settings = await getNotificationSettings();
    if (!settings.newProducts) {
      return { success: false, error: "El aviso de productos está apagado." };
    }

    const cooldown = remainingCooldownMs(settings.lastProductsPushAt, Date.now());
    if (cooldown > 0) {
      return {
        success: false,
        error: `Espera ${Math.ceil(cooldown / 1000)} s antes de volver a avisar.`,
        cooldownSeconds: Math.ceil(cooldown / 1000),
      };
    }

    const subscriptions = await listActiveSubscriptions("client");
    if (subscriptions.length === 0) {
      return { success: false, error: "No hay clientes suscritos." };
    }

    const products = await getNewProducts(settings.lastProductsPushAt, 3);
    if (products.total === 0) {
      return { success: false, error: "No hay productos visibles nuevos." };
    }

    const result = await sendPushToSubscriptions(
      subscriptions,
      buildProductPayload({ names: products.names, total: products.total }),
      "normal"
    );
    await cleanup(result.expired);

    if (!result.configured) {
      return { success: false, error: "Faltan las claves VAPID en el servidor." };
    }
    if (result.sent === 0) {
      return {
        success: false,
        error: "No se pudo entregar a ningún cliente. Intenta de nuevo.",
        failed: result.failed,
        total: products.total,
        names: products.names,
      };
    }

    await updateNotificationSettings({ lastProductsPushAt: new Date() });

    return {
      success: true,
      sent: result.sent,
      failed: result.failed,
      total: products.total,
      names: products.names,
    };
  } catch (error) {
    console.warn("[push] no se pudo anunciar productos", error instanceof Error ? error.message : "");
    return {
      success: false,
      error: "No se pudieron enviar los avisos. Revisa la configuración.",
    };
  } finally {
    announceInFlight = false;
  }
}
