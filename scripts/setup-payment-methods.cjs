#!/usr/bin/env node
"use strict";
/**
 * Crea la colección `payment_methods` y, si está vacía, siembra los métodos
 * actuales a partir de los bancos y cuentas existentes:
 *
 *   Efectivo CUP, Efectivo USD, Zelle, USDT
 *
 * Lectura pública (el checkout no manda token de admin); escritura solo por
 * las server actions con permiso `settings`.
 *
 * Uso:
 *   node scripts/setup-payment-methods.cjs
 * Lee NEXT_PUBLIC_POCKETBASE_URL, POCKETBASE_ADMIN_EMAIL y
 * POCKETBASE_ADMIN_PASSWORD de .env.local (o del entorno).
 */
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
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

const PB_URL =
  process.env.NEXT_PUBLIC_POCKETBASE_URL ||
  "https://everything-hay-mercatoma.pockethost.io";
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASS = process.env.POCKETBASE_ADMIN_PASSWORD;

const PocketBase = require("pocketbase").default || require("pocketbase");

const T = {
  text: (name, required = false) => ({ name, type: "text", required }),
  number: (name, required = false) => ({ name, type: "number", required }),
  bool: (name) => ({ name, type: "bool", required: false }),
  autodate: (name, onUpdate = false) => ({
    name,
    type: "autodate",
    onCreate: true,
    onUpdate,
  }),
};

async function authenticate(pb) {
  if (!ADMIN_EMAIL || !ADMIN_PASS) {
    throw new Error("Faltan POCKETBASE_ADMIN_EMAIL / POCKETBASE_ADMIN_PASSWORD");
  }
  // PocketBase ≥ 0.23 renombró `admins` a `_superusers`.
  try {
    await pb.collection("_superusers").authWithPassword(ADMIN_EMAIL, ADMIN_PASS);
  } catch {
    await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASS);
  }
}

async function main() {
  const pb = new PocketBase(PB_URL);
  await authenticate(pb);
  console.log(`Autenticado en ${PB_URL}`);

  const existing = await pb.collections.getOne("payment_methods").catch(() => null);
  if (existing) {
    console.log('La colección "payment_methods" ya existe; no se toca.');
  } else {
    await pb.collections.create({
      name: "payment_methods",
      type: "base",
      fields: [
        T.text("name", true),
        T.text("type", true), // cash | transfer
        T.text("image"),
        T.text("currency", true),
        T.text("account_number"),
        T.text("account_type"),
        T.text("owner"),
        T.bool("requires_receipt"),
        T.text("instructions"),
        T.number("transfer_limit"),
        T.number("transfer_count"),
        T.bool("active"),
        T.number("sort"),
        T.autodate("created"),
        T.autodate("updated", true),
      ],
      listRule: "",
      viewRule: "",
    });
    console.log('Colección "payment_methods" creada.');
  }

  const rows = await pb.collection("payment_methods").getFullList();
  if (rows.length > 0) {
    console.log(`Ya hay ${rows.length} métodos de pago; no se siembra.`);
    return;
  }

  const banks = await pb.collection("banks").getFullList().catch(() => []);
  const accounts = await pb
    .collection("bank_accounts")
    .getFullList({ expand: "bank" })
    .catch(() => []);

  const seeds = [
    {
      name: "Efectivo CUP",
      type: "cash",
      currency: "CUP",
      requires_receipt: false,
      active: true,
      sort: 1,
    },
    {
      name: "Efectivo USD",
      type: "cash",
      currency: "USD",
      requires_receipt: false,
      active: true,
      sort: 2,
    },
  ];

  // Un método por cuenta: el nombre y el logo vienen del banco; la cuenta y
  // el cupo viven dentro del método.
  let sort = 3;
  for (const acc of accounts) {
    const bank =
      acc.expand?.bank || banks.find((b) => b.id === acc.bank) || {};
    seeds.push({
      name: bank.name || "Transferencia",
      type: "transfer",
      image: bank.logo || "",
      currency: acc.currency || "USD",
      account_number: acc.account_number || "",
      account_type: acc.account_type || "",
      owner: acc.owner || "",
      requires_receipt: true,
      instructions: "",
      transfer_limit: Number(acc.transfer_limit) || 0,
      transfer_count: Number(acc.transfer_count) || 0,
      active: acc.active !== false,
      sort: sort++,
    });
  }

  for (const seed of seeds) {
    const rec = await pb.collection("payment_methods").create(seed);
    console.log(`Creado: ${rec.name} (${rec.id})`);
  }

  console.log(`Migración completada: ${seeds.length} métodos.`);
}

main().catch((error) => {
  console.error("Error:", error?.message || error);
  process.exit(1);
});
