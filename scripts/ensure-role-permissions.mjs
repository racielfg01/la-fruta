#!/usr/bin/env node
/**
 * Asegura que la colección `roles` tenga el campo `permissions` (json).
 *
 * La app escribe los permisos de cada rol en ese campo (server actions de
 * roles). Si la colección no lo tiene, PocketBase acepta la escritura pero
 * la descarta en silencio: el rol se queda sin permisos y nadie ve un error.
 *
 * En producción el campo se añadió a mano con un PATCH de colección; este
 * script deja de hacerlo a mano. Es idempotente: si el campo ya existe, no
 * toca nada.
 *
 *   node scripts/ensure-role-permissions.mjs
 */
import PocketBase from "pocketbase";
import fs from "node:fs";
import path from "node:path";

// Reusa el .env.local como los demás scripts del repo.
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

const roles = await pb.collections.getOne("roles");
const fields = roles.fields ?? [];

if (fields.some((field) => field.name === "permissions")) {
  console.log('El campo "permissions" ya existe en la colección roles.');
  process.exit(0);
}

// Se envía el array de campos tal cual estaba, más el nuevo: PocketBase
// reemplaza el array entero, así que omitir un campo lo borraría.
const nextFields = [
  ...fields,
  {
    name: "permissions",
    type: "json",
    required: false,
    hidden: false,
  },
];

await pb.collections.update(roles.id, {
  // Solo `fields`: es el nombre actual del array de campos en la API de
  // PocketBase (y el que devuelve el GET). Enviar también `schema` hace que
  // la API los trate como dos esquemas incompatibles.
  fields: nextFields,
});

console.log('Campo "permissions" añadido a la colección roles.');
