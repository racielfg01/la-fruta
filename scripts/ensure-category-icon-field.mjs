#!/usr/bin/env node
/** Campo opcional `icon` en categories. Idempotente. */
import PocketBase from "pocketbase";
import fs from "node:fs";
import path from "node:path";
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    const key = t.slice(0, eq).trim();
    let value = t.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (!process.env[key]) process.env[key] = value;
  }
}
const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || "https://everything-hay-mercatoma.pockethost.io";
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error("Faltan credenciales de admin de PocketBase en el entorno.");
  process.exit(1);
}
const pb = new PocketBase(PB_URL);
pb.autoCancellation(false);
await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
const categories = await pb.collections.getOne("categories");
const fields = categories.fields ?? categories.schema ?? [];
if (fields.some((field) => field.name === "icon")) {
  console.log('El campo "icon" ya existe en categories.');
  process.exit(0);
}
await pb.collections.update(categories.id, { fields: [...fields, { name: "icon", type: "text", required: false }] });
console.log('Campo "icon" añadido a categories.');
