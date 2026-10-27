"use server";

import { headers } from "next/headers";
import { requireAdmin, requireUser } from "@/lib/push/authz";
import { getVapidConfig } from "@/lib/push/config";
import { announceProductsNow } from "@/lib/push/notify";
import { buildTestPayload, remainingCooldownMs } from "@/lib/push/payloads";
import { audienceForRole } from "@/lib/push/audience";
import {
  countActiveSubscriptions,
  getNewProducts,
  getSettingsRecord,
  getSubscriptionForUser,
  removeExpiredSubscriptions,
  removeSubscription,
  updateNotificationSettings,
  upsertSubscription,
} from "@/lib/push/repository";
import { sendPushToSubscriptions } from "@/lib/push/send";
import { normalizePushSubscription } from "@/lib/push/subscriptions";
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  parseNotificationSettings,
} from "@/lib/push/settings";
import type {
  AnnounceActionResult,
  NotificationOverview,
  NotificationOverviewResult,
  PushConfigResult,
  SettingsActionResult,
  SimpleActionResult,
  SubscribeResult,
} from "@/lib/push/types";

const SETUP_MESSAGE =
  "Falta preparar PocketBase para los avisos. Ejecuta el script de configuración.";

function isSetupError(error: unknown): boolean {
  const candidate = error as {
    status?: number;
    message?: string;
    data?: unknown;
    response?: { data?: unknown };
  };
  const text = JSON.stringify(
    candidate?.data ?? candidate?.response?.data ?? candidate?.message ?? ""
  );
  return (
    candidate?.status === 404 ||
    /push_subscriptions|created_at|notify_new_|last_products_push_at|Unknown field/i.test(text)
  );
}

function setupOverview(configured: boolean): NotificationOverview {
  return {
    configured,
    setupNeeded: true,
    settings: DEFAULT_NOTIFICATION_SETTINGS,
    counts: { admins: 0, clients: 0, newProducts: 0, newProductNames: [] },
    canAnnounce: false,
    cooldownSeconds: 0,
  };
}

export async function getPushConfigAction(): Promise<PushConfigResult> {
  const config = getVapidConfig();
  return {
    configured: config.configured,
    publicKey: config.publicKey || null,
  };
}

export async function getNotificationOverviewAction(
  token: string
): Promise<NotificationOverviewResult> {
  try {
    await requireAdmin(token);
  } catch {
    return { success: false, error: "No autorizado" };
  }

  const configured = getVapidConfig().configured;

  try {
    const current = await getSettingsRecord();
    const fieldsReady =
      !!current &&
      ["notify_new_order", "notify_new_user", "notify_new_products", "last_products_push_at"].every(
        (field) => field in current.record
      );
    if (!fieldsReady) {
      return { success: true, ...setupOverview(configured) };
    }
    const settings = parseNotificationSettings(current.record);

    const [admins, clients, products] = await Promise.all([
      countActiveSubscriptions("admin"),
      countActiveSubscriptions("client"),
      getNewProducts(settings.lastProductsPushAt, 3),
    ]);

    const cooldownSeconds = Math.ceil(
      remainingCooldownMs(settings.lastProductsPushAt, Date.now()) / 1000
    );

    return {
      success: true,
      configured,
      setupNeeded: false,
      settings,
      counts: {
        admins,
        clients,
        newProducts: products.total,
        newProductNames: products.names,
      },
      canAnnounce:
        configured &&
        settings.newProducts &&
        products.total > 0 &&
        clients > 0 &&
        cooldownSeconds === 0,
      cooldownSeconds,
    };
  } catch (error) {
    if (isSetupError(error)) {
      return { success: true, ...setupOverview(configured) };
    }
    console.warn(
      "[push] no se pudo leer el resumen",
      error instanceof Error ? error.message : ""
    );
    return { success: false, error: "No se pudo leer la configuración de avisos." };
  }
}

export async function updateNotificationSettingsAction(
  token: string,
  input: { newOrder?: boolean; newUser?: boolean; newProducts?: boolean }
): Promise<SettingsActionResult> {
  try {
    await requireAdmin(token);
  } catch {
    return { success: false, error: "No autorizado" };
  }

  const patch: { newOrder?: boolean; newUser?: boolean; newProducts?: boolean } = {};
  if (typeof input?.newOrder === "boolean") patch.newOrder = input.newOrder;
  if (typeof input?.newUser === "boolean") patch.newUser = input.newUser;
  if (typeof input?.newProducts === "boolean") patch.newProducts = input.newProducts;
  if (Object.keys(patch).length === 0) {
    return { success: false, error: "Nada que guardar." };
  }

  try {
    const settings = await updateNotificationSettings(patch);
    return { success: true, settings };
  } catch (error) {
    if (isSetupError(error)) return { success: false, error: SETUP_MESSAGE };
    console.warn(
      "[push] no se pudo guardar la configuración",
      error instanceof Error ? error.message : ""
    );
    return { success: false, error: "No se pudo guardar la configuración." };
  }
}

export async function subscribePushAction(
  token: string,
  subscription: unknown
): Promise<SubscribeResult> {
  let user;
  try {
    user = await requireUser(token);
  } catch {
    return { success: false, error: "No autorizado" };
  }

  const normalized = normalizePushSubscription(subscription);
  if (!normalized) {
    return { success: false, error: "La suscripción del dispositivo no es válida." };
  }

  const audience = audienceForRole(user.isAdmin ? 2 : 1);
  const userAgent = (await headers()).get("user-agent") || "";

  try {
    await upsertSubscription({
      userId: user.userId,
      userName: user.name,
      audience,
      subscription: normalized,
      userAgent,
    });
    return { success: true, audience };
  } catch (error) {
    if (isSetupError(error)) return { success: false, error: SETUP_MESSAGE };
    console.warn(
      "[push] no se pudo guardar la suscripción",
      error instanceof Error ? error.message : ""
    );
    return { success: false, error: "No se pudo activar el aviso en este dispositivo." };
  }
}

export async function unsubscribePushAction(
  token: string,
  endpoint: string
): Promise<SimpleActionResult> {
  let user;
  try {
    user = await requireUser(token);
  } catch {
    return { success: false, error: "No autorizado" };
  }

  if (
    typeof endpoint !== "string" ||
    !endpoint.startsWith("https://") ||
    endpoint.length > 2048
  ) {
    return { success: false, error: "El dispositivo no es válido." };
  }

  try {
    await removeSubscription(user.userId, endpoint);
    return { success: true };
  } catch {
    return { success: false, error: "No se pudo desactivar el aviso." };
  }
}

export async function sendTestPushAction(
  token: string,
  endpoint: string
): Promise<SimpleActionResult> {
  let user;
  try {
    user = await requireAdmin(token);
  } catch {
    return { success: false, error: "No autorizado" };
  }

  if (
    typeof endpoint !== "string" ||
    !endpoint.startsWith("https://") ||
    endpoint.length > 2048
  ) {
    return { success: false, error: "El dispositivo no es válido." };
  }

  try {
    const subscription = await getSubscriptionForUser(user.userId, endpoint);
    if (!subscription) {
      return { success: false, error: "Este dispositivo no está activo." };
    }
    const result = await sendPushToSubscriptions([subscription], buildTestPayload(), "high");
    await removeExpiredSubscriptions(result.expired);
    if (!result.configured) {
      return { success: false, error: "Faltan las claves VAPID en el servidor." };
    }
    if (result.sent === 0) {
      return { success: false, error: "No se pudo entregar la prueba." };
    }
    return { success: true };
  } catch {
    return { success: false, error: "No se pudo enviar la prueba." };
  }
}

export async function announceNewProductsAction(token: string): Promise<AnnounceActionResult> {
  try {
    await requireAdmin(token);
  } catch {
    return { success: false, error: "No autorizado" };
  }

  return announceProductsNow();
}
