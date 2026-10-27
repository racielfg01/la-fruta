import { getAdminPB, getAllRecords, sanitize } from "@/lib/pocketbase";
import { parseNotificationSettings, toPocketBaseDate } from "./settings";
import { MAX_SUBSCRIPTIONS_PER_USER } from "./subscriptions";
import type {
  Audience,
  NotificationSettings,
  PushSubscriptionInput,
  StoredPushSubscription,
} from "./types";

function mapSubscription(record: any): StoredPushSubscription {
  return {
    id: record.id,
    userId: record.user_id,
    endpoint: record.endpoint,
    keys: { p256dh: record.p256dh, auth: record.auth },
    audience: record.audience === "admin" ? "admin" : "client",
    userName: record.user_name || "",
    active: record.active === true,
    expirationTime: null,
  };
}

export async function getSettingsRecord(): Promise<{ id: string; record: any } | null> {
  const pb = await getAdminPB();
  const records = await getAllRecords<any>(pb, "settings", {});
  return records[0] ? { id: records[0].id, record: records[0] } : null;
}

export async function getNotificationSettings(): Promise<NotificationSettings> {
  const current = await getSettingsRecord();
  return parseNotificationSettings(current?.record);
}

export async function updateNotificationSettings(patch: {
  newOrder?: boolean;
  newUser?: boolean;
  newProducts?: boolean;
  lastProductsPushAt?: Date;
}): Promise<NotificationSettings> {
  const pb = await getAdminPB();
  const current = await getSettingsRecord();

  const body: Record<string, unknown> = {};
  if (typeof patch.newOrder === "boolean") body.notify_new_order = patch.newOrder;
  if (typeof patch.newUser === "boolean") body.notify_new_user = patch.newUser;
  if (typeof patch.newProducts === "boolean") body.notify_new_products = patch.newProducts;
  if (patch.lastProductsPushAt instanceof Date) {
    body.last_products_push_at = toPocketBaseDate(patch.lastProductsPushAt);
  }

  if (!current) {
    await pb.collection("settings").create({
      notify_new_order: true,
      notify_new_user: true,
      notify_new_products: true,
      last_products_push_at: toPocketBaseDate(new Date()),
      ...body,
    });
  } else {
    if (
      patch.newProducts === true &&
      !current.record.last_products_push_at &&
      body.last_products_push_at === undefined
    ) {
      body.last_products_push_at = toPocketBaseDate(new Date());
    }
    if (Object.keys(body).length > 0) {
      await pb.collection("settings").update(current.id, body);
    }
  }

  return getNotificationSettings();
}

export async function countActiveSubscriptions(audience: Audience): Promise<number> {
  const pb = await getAdminPB();
  const result = await pb.collection("push_subscriptions").getList(1, 1, {
    filter: `active = true && audience = "${sanitize(audience)}"`,
  });
  return result.totalItems;
}

export async function listActiveSubscriptions(
  audience: Audience
): Promise<StoredPushSubscription[]> {
  const pb = await getAdminPB();
  const records = await getAllRecords<any>(pb, "push_subscriptions", {
    filter: `active = true && audience = "${sanitize(audience)}"`,
    sort: "-last_seen",
  });
  return records.map(mapSubscription);
}

export async function getSubscriptionForUser(
  userId: string,
  endpoint: string
): Promise<StoredPushSubscription | null> {
  const pb = await getAdminPB();
  const result = await pb.collection("push_subscriptions").getList(1, 1, {
    filter: `user_id = "${sanitize(userId)}" && endpoint = "${sanitize(endpoint)}"`,
  });
  return result.items[0] ? mapSubscription(result.items[0]) : null;
}

export async function upsertSubscription(input: {
  userId: string;
  userName: string;
  audience: Audience;
  subscription: PushSubscriptionInput;
  userAgent: string;
}): Promise<string> {
  const pb = await getAdminPB();
  const { userId, userName, audience, subscription, userAgent } = input;
  const body = {
    user_id: userId,
    endpoint: subscription.endpoint,
    p256dh: subscription.keys.p256dh,
    auth: subscription.keys.auth,
    audience,
    user_name: userName.slice(0, 200),
    user_agent: userAgent.slice(0, 300),
    active: true,
    last_seen: new Date().toISOString(),
  };

  const existing = await pb.collection("push_subscriptions").getList(1, 1, {
    filter: `endpoint = "${sanitize(subscription.endpoint)}"`,
  });

  let id: string;
  if (existing.items[0]) {
    id = existing.items[0].id;
    await pb.collection("push_subscriptions").update(id, body);
  } else {
    try {
      const created = await pb.collection("push_subscriptions").create(body);
      id = created.id;
    } catch (error) {
      // Carrera con otra pestaña: el endpoint ya existe, se actualiza.
      const again = await pb.collection("push_subscriptions").getList(1, 1, {
        filter: `endpoint = "${sanitize(subscription.endpoint)}"`,
      });
      if (!again.items[0]) throw error;
      id = again.items[0].id;
      await pb.collection("push_subscriptions").update(id, body);
    }
  }

  // Límite por usuario para que una cuenta no llene la colección de endpoints.
  const active = await getAllRecords<any>(pb, "push_subscriptions", {
    filter: `user_id = "${sanitize(userId)}" && active = true`,
    sort: "-last_seen",
  });
  if (active.length > MAX_SUBSCRIPTIONS_PER_USER) {
    await Promise.all(
      active.slice(MAX_SUBSCRIPTIONS_PER_USER).map((record) =>
        pb.collection("push_subscriptions").update(record.id, { active: false })
      )
    );
  }

  return id;
}

export async function removeSubscription(userId: string, endpoint: string): Promise<number> {
  const pb = await getAdminPB();
  const records = await getAllRecords<any>(pb, "push_subscriptions", {
    filter: `user_id = "${sanitize(userId)}" && endpoint = "${sanitize(endpoint)}"`,
  });
  const results = await Promise.allSettled(
    records.map((record) => pb.collection("push_subscriptions").delete(record.id))
  );
  return results.filter((result) => result.status === "fulfilled").length;
}

export async function removeExpiredSubscriptions(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const pb = await getAdminPB();
  await Promise.allSettled(
    ids.map((id) => pb.collection("push_subscriptions").delete(id))
  );
}

export async function getNewProducts(
  marker: string | null,
  limit = 3
): Promise<{ total: number; names: string[] }> {
  // Sin marca no hay línea base: no se anuncia el catálogo anterior.
  if (!marker) return { total: 0, names: [] };

  const pb = await getAdminPB();
  const since = toPocketBaseDate(marker || new Date(0));
  const filter = `is_visible = true && created_at > "${sanitize(since || toPocketBaseDate(new Date(0)))}"`;

  const [count, list] = await Promise.all([
    pb.collection("products").getList(1, 1, { filter }),
    pb.collection("products").getList(1, Math.max(1, limit), {
      filter,
      sort: "-created_at",
    }),
  ]);

  return {
    total: count.totalItems,
    names: list.items
      .map((product: any) => String(product.name || "").trim())
      .filter(Boolean),
  };
}
