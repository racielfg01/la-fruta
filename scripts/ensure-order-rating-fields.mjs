#!/usr/bin/env node
/**
 * Asegura que `orders` tenga los campos de la valoración de entrega:
 * `delivered_at` (fecha real), `delivery_rating` (1-5) y `delivery_comment`.
 *
 * Sin ellos PocketBase acepta las escrituras y las descarta en silencio.
 * Idempotente: si los tres existen, no toca nada.
 *
 *   node scripts/ensure-order-rating-fields.mjs
 */
import PocketBase from "pocketbase";
import fs from "node:fs";
import path from "node:path";

const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

const PB_URL =
  process.env.NEXT_PUBLIC_POCKETBASE_URL ||
  "https://everything-hay-mercatoma.pockethost.io";
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error(
    "Faltan POCKETBASE_ADMIN_EMAIL o POCKETBASE_ADMIN_PASSWORD en el entorno.",
  );
  process.exit(1);
}

const pb = new PocketBase(PB_URL);
pb.autoCancellation(false);
await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);

const orders = await pb.collections.getOne("orders");
const fields = orders.fields ?? orders.schema ?? [];
const wanted = [
  { name: "delivered_at", type: "date", required: false },
  { name: "delivery_rating", type: "number", required: false },
  { name: "delivery_comment", type: "text", required: false },
];
const missing = wanted.filter((f) => !fields.some((x) => x.name === f.name));

if (missing.length === 0) {
  console.log("Los campos de valoración ya existen en orders.");
  process.exit(0);
}

// PocketBase reemplaza el array entero: hay que reenviar los campos actuales.
await pb.collections.update(orders.id, {
  fields: [...fields, ...missing],
});

console.log(`Campos añadidos: ${missing.map((f) => f.name).join(", ")}.`);
