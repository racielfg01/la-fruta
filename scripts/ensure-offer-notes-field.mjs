#!/usr/bin/env node
/**
 * Asegura que `offers` tenga el campo `notes` (texto, opcional).
 *
 * Sin él PocketBase acepta la escritura y la descarta en silencio: las notas
 * del admin no se guardan. Idempotente: si el campo existe, no toca nada.
 *
 *   node scripts/ensure-offer-notes-field.mjs
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

const offers = await pb.collections.getOne("offers");
const fields = offers.fields ?? offers.schema ?? [];
if (fields.some((field) => field.name === "notes")) {
  console.log('El campo "notes" ya existe en offers.');
  process.exit(0);
}

// PocketBase reemplaza el array entero: se reenvían los campos actuales.
await pb.collections.update(offers.id, {
  fields: [
    ...fields,
    { name: "notes", type: "text", required: false, maxLength: 2000 },
  ],
});

console.log('Campo "notes" añadido a offers.');
