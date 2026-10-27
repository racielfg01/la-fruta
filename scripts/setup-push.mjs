#!/usr/bin/env node
/**
 * Prepara PocketBase para los avisos push. Es idempotente: se puede ejecutar
 * varias veces sin duplicar campos ni reactivar interruptores apagados.
 *
 * Uso:
 *   node scripts/setup-push.mjs --dry-run   # solo muestra lo que haría
 *   node scripts/setup-push.mjs             # escribe en PocketBase
 *
 * Lee las credenciales de .env.local (POCKETBASE_ADMIN_EMAIL/PASSWORD).
 */
import fs from "node:fs";
import path from "node:path";

const DRY_RUN = process.argv.includes("--dry-run");
const root = process.cwd();

function readEnv() {
  const file = path.join(root, ".env.local");
  if (!fs.existsSync(file)) throw new Error("Falta .env.local");
  const env = {};
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match) env[match[1]] = match[2].replace(/^"|"$/g, "");
  }
  return env;
}

const env = readEnv();
const base = (
  env.NEXT_PUBLIC_POCKETBASE_URL || "https://everything-hay-mercatoma.pockethost.io"
).replace(/\/$/, "");

async function api(pathname, options = {}) {
  const response = await fetch(base + pathname, options);
  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  if (!response.ok) {
    throw new Error(`${options.method || "GET"} ${pathname} -> ${response.status}: ${text}`);
  }
  return data;
}

function hasField(collection, name) {
  return (collection.fields || []).some((field) => field.name === name);
}

async function main() {
  if (!env.POCKETBASE_ADMIN_EMAIL || !env.POCKETBASE_ADMIN_PASSWORD) {
    throw new Error("Faltan POCKETBASE_ADMIN_EMAIL o POCKETBASE_ADMIN_PASSWORD en .env.local");
  }

  const auth = await api("/api/collections/_superusers/auth-with-password", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      identity: env.POCKETBASE_ADMIN_EMAIL,
      password: env.POCKETBASE_ADMIN_PASSWORD,
    }),
  });
  const headers = {
    authorization: auth.token,
    "content-type": "application/json",
  };

  const collections = await api("/api/collections?perPage=200", { headers });
  const byName = new Map(collections.items.map((collection) => [collection.name, collection]));

  const settings = byName.get("settings");
  const products = byName.get("products");
  if (!settings) throw new Error("No existe la colección settings");
  if (!products) throw new Error("No existe la colección products");

  const settingsNew = [];
  for (const field of [
    { name: "notify_new_order", type: "bool" },
    { name: "notify_new_user", type: "bool" },
    { name: "notify_new_products", type: "bool" },
    { name: "last_products_push_at", type: "date" },
  ]) {
    if (!hasField(settings, field.name)) settingsNew.push(field);
  }

  const productsNeedsCreatedAt = !hasField(products, "created_at");
  const subscriptions = byName.get("push_subscriptions");

  console.log(`PocketBase: ${base}`);
  console.log(`Modo: ${DRY_RUN ? "dry-run (no escribe)" : "aplicar cambios"}`);
  console.log("");
  console.log("settings:");
  console.log(
    settingsNew.length
      ? `  + ${settingsNew.map((field) => `${field.name}:${field.type}`).join(", ")}`
      : "  sin cambios"
  );
  console.log("products:");
  console.log(productsNeedsCreatedAt ? "  + created_at:autodate (onCreate)" : "  sin cambios");
  console.log("push_subscriptions:");
  console.log(subscriptions ? "  ya existe" : "  + crear colección (reglas cerradas, endpoint único)");

  const settingsRecord = await api("/api/collections/settings/records?perPage=1", { headers });
  const current = settingsRecord.items?.[0];
  const markerEmpty = !current?.last_products_push_at;
  console.log("");
  console.log(
    `settings: ${current ? `registro ${current.id}` : "sin registro"}; ` +
      `marcador de productos ${markerEmpty ? "vacío (se pondrá ahora)" : "ya definido"}`
  );

  if (DRY_RUN) {
    console.log("\nDry-run: no se escribió nada.");
    return;
  }

  if (settingsNew.length > 0) {
    await api(`/api/collections/${settings.id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ fields: [...settings.fields, ...settingsNew] }),
    });
  }

  if (productsNeedsCreatedAt) {
    await api(`/api/collections/${products.id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        fields: [
          ...products.fields,
          { name: "created_at", type: "autodate", onCreate: true, onUpdate: false },
        ],
      }),
    });
  }

  if (!subscriptions) {
    await api("/api/collections", {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: "push_subscriptions",
        type: "base",
        fields: [
          { name: "user_id", type: "text", required: true },
          { name: "endpoint", type: "text", required: true },
          { name: "p256dh", type: "text", required: true },
          { name: "auth", type: "text", required: true },
          { name: "audience", type: "text", required: true },
          { name: "user_name", type: "text" },
          { name: "user_agent", type: "text" },
          { name: "active", type: "bool" },
          { name: "last_seen", type: "date" },
          { name: "created", type: "autodate", onCreate: true, onUpdate: false },
          { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
        ],
        indexes: [
          "CREATE UNIQUE INDEX `idx_push_subscriptions_endpoint` ON `push_subscriptions` (`endpoint`)",
        ],
        listRule: null,
        viewRule: null,
        createRule: null,
        updateRule: null,
        deleteRule: null,
      }),
    });
  }

  const now = new Date().toISOString().replace("T", " ");
  const patch = {};
  for (const field of settingsNew) {
    if (field.type === "bool") patch[field.name] = true;
  }
  if (settingsNew.some((field) => field.name === "last_products_push_at") || markerEmpty) {
    patch.last_products_push_at = now;
  }

  if (!current) {
    await api("/api/collections/settings/records", {
      method: "POST",
      headers,
      body: JSON.stringify({
        notify_new_order: true,
        notify_new_user: true,
        notify_new_products: true,
        last_products_push_at: now,
      }),
    });
  } else if (Object.keys(patch).length > 0) {
    await api(`/api/collections/settings/records/${current.id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(patch),
    });
  }

  console.log("\nListo. Campos y colección preparados.");
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) {
    console.log("Faltan VAPID_PUBLIC_KEY y VAPID_PRIVATE_KEY en .env.local.");
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
