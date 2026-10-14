"use strict";
// Creates the collections needed to save a user's own delivery data from checkout:
//   beneficiaries  -> contacto guardado (nombre, teléfono)
//   user_addresses -> dirección guardada (alias, dirección, zona)
// Both are scoped to the owning user via a `user` relation.
const fs = require("fs");
const path = require("path");

const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || "https://everything-hay-mercatoma.pockethost.io";
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASS = process.env.POCKETBASE_ADMIN_PASSWORD;

const PocketBase = require("pocketbase").default || require("pocketbase");

async function createCollection(pb, name, fields) {
  const existing = await pb.collections.getOne(name).catch(() => null);
  if (existing) {
    console.log(`[collection] "${name}" already exists, skipping`);
    return;
  }
  await pb.collections.create({ name, type: "base", fields });
  console.log(`[collection] created "${name}"`);
}

const T = {
  text: (name, required = false) => ({ name, type: "text", required }),
  bool: (name) => ({ name, type: "bool", required: false }),
  relation: (name, collectionId, cascadeDelete = true) => ({
    name, type: "relation", required: false, collectionId,
    cascadeDelete, minSelect: 0, maxSelect: 1,
  }),
};

async function setup() {
  console.log(`Connecting to ${PB_URL}...`);
  const pb = new PocketBase(PB_URL);
  await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASS);
  console.log("Authenticated as admin\n");

  const usersCollId = (await pb.collections.getOne("users")).id;

  await createCollection(pb, "beneficiaries", [
    T.relation("user", usersCollId),
    T.text("full_name", true),
    T.text("phone"),
    T.bool("is_default"),
  ]);

  await createCollection(pb, "user_addresses", [
    T.relation("user", usersCollId),
    T.text("alias"),
    T.text("address", true),
    T.text("zone"),
    T.bool("is_default"),
  ]);

  console.log("\nDone.");
}

setup().catch((e) => {
  console.error("Error:", e.message, e.data || "");
  process.exit(1);
});
