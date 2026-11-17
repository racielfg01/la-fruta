#!/usr/bin/env node
/** Campo opcional birth_date en users. Idempotente. */
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
const users = await pb.collections.getOne("users");
const fields = users.fields ?? users.schema ?? [];
if (fields.some((field) => field.name === "birth_date")) {
  console.log('El campo "birth_date" ya existe en users.');
  process.exit(0);
}
await pb.collections.update(users.id, { fields: [...fields, { name: "birth_date", type: "date", required: false }] });
console.log('Campo "birth_date" añadido a users.');
