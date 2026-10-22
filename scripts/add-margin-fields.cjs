// Adds the price-margin fields to the live PocketBase collections:
//   products.price_margin  (number, %)  — per-product margin, optional
//   settings.price_margin  (number, %)  — global margin for the store
// Idempotent: skips fields that already exist.
"use strict";
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

const PocketBase = require("pocketbase").default || require("pocketbase");
const pb = new PocketBase(
  process.env.NEXT_PUBLIC_POCKETBASE_URL ||
    "https://everything-hay-mercatoma.pockethost.io"
);

async function addFields(collName, newFields) {
  const c = await pb.collections.getOne(collName);
  const names = new Set(c.fields.map((f) => f.name));
  const toAdd = newFields.filter((f) => !names.has(f.name));
  if (toAdd.length === 0) {
    console.log(`[fields] "${collName}" already has all fields, skipping`);
    return;
  }
  await pb.collections.update(collName, { fields: [...c.fields, ...toAdd] });
  console.log(`[fields] "${collName}" + ${toAdd.map((f) => f.name).join(", ")}`);
}

(async () => {
  await pb
    .collection("_superusers")
    .authWithPassword(
      process.env.POCKETBASE_ADMIN_EMAIL,
      process.env.POCKETBASE_ADMIN_PASSWORD
    );
  await addFields("products", [{ name: "price_margin", type: "number", required: false }]);
  await addFields("settings", [{ name: "price_margin", type: "number", required: false }]);
  console.log("[ok] margin fields ready");
})().catch((err) => {
  console.error("[error]", err?.response || err);
  process.exit(1);
});
