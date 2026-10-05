"use strict";
// Creates the collections/fields needed by the Mercatoma app:
//   provinces, municipalities, countries, banks, bank_accounts, settings
//   + products.available_municipalities and orders.* (transfer/cancel fields)
// Also seeds reference data (Cuban provinces/municipalities, countries, banks, settings)
// when the corresponding collection is empty.
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

async function addFields(pb, collName, newFields) {
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

const T = {
  text: (name, required = false, extra = {}) => ({ name, type: "text", required, ...extra }),
  number: (name, required = false) => ({ name, type: "number", required }),
  bool: (name) => ({ name, type: "bool", required: false }),
  json: (name) => ({ name, type: "json", required: false, maxSelect: 1, maxSize: 200000 }),
  relation: (name, collectionId) => ({
    name, type: "relation", required: false, collectionId,
    cascadeDelete: false, minSelect: 0, maxSelect: 1,
  }),
};

async function setup() {
  console.log(`Connecting to ${PB_URL}...`);
  const pb = new PocketBase(PB_URL);
  await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASS);
  console.log("Authenticated as admin\n");

  // 1. provinces
  await createCollection(pb, "provinces", [T.text("name", true), T.bool("active")]);

  // 2. municipalities (relacion a provinces)
  let provincesCollId = "";
  try {
    provincesCollId = (await pb.collections.getOne("provinces")).id;
  } catch {}
  await createCollection(pb, "municipalities", [T.text("name", true), T.relation("province", provincesCollId), T.bool("active")]);

  // 3. countries
  await createCollection(pb, "countries", [
    T.text("name", true),
    T.text("emoji"),
    T.bool("active"),
  ]);

  // 4. banks
  await createCollection(pb, "banks", [
    T.text("name", true),
    T.text("logo"),
    T.text("country"),
    T.text("currency"),
    T.bool("active"),
  ]);

  // 5. bank_accounts (relacion a banks)
  let banksCollId = "";
  try {
    banksCollId = (await pb.collections.getOne("banks")).id;
  } catch {}
  await createCollection(pb, "bank_accounts", [
    T.relation("bank", banksCollId),
    T.text("account_number"),
    T.text("account_type"),
    T.text("owner"),
    T.text("ci"),
    T.text("currency"),
    T.bool("active"),
    T.number("transfer_limit"),
    T.number("transfer_count"),
  ]);

  // 6. settings (single record)
  await createCollection(pb, "settings", [
    T.text("store_name"),
    T.text("store_description"),
    T.text("logo"),
    T.text("theme"),
    T.text("font"),
    T.text("background_color"),
    T.text("primary_color"),
    T.text("accent_color"),
    T.text("success_color"),
    T.text("warning_color"),
    T.text("light_background_color"),
    T.text("light_primary_color"),
    T.text("light_accent_color"),
    T.text("light_success_color"),
    T.text("light_warning_color"),
    T.text("font_family"),
  ]);

  // 7. products: zonas disponibles (CSV de ids de municipio)
  await addFields(pb, "products", [T.text("available_municipalities"), T.json("product_locations")]);

  // 8. orders: datos de transferencia y cancelación
  await addFields(pb, "orders", [
    T.text("bank_account_id"),
    T.text("bank_name"),
    T.text("account_number"),
    T.text("receipt"),
    T.text("reference"),
    T.number("transfer_amount"),
    T.text("cancel_reason"),
  ]);

  // 9. provinces: add active field if missing
  await addFields(pb, "provinces", [T.bool("active")]);

  // 10. municipalities: add active field if missing
  await addFields(pb, "municipalities", [T.bool("active")]);

  // 11. countries: add emoji field if missing
  await addFields(pb, "countries", [T.text("emoji"), T.bool("active")]);

  // 12. settings: add color fields if missing
  await addFields(pb, "settings", [
    T.text("background_color"),
    T.text("primary_color"),
    T.text("accent_color"),
    T.text("success_color"),
    T.text("warning_color"),
    T.text("light_background_color"),
    T.text("light_primary_color"),
    T.text("light_accent_color"),
    T.text("light_success_color"),
    T.text("light_warning_color"),
    T.text("font_family"),
  ]);

  // ── Seed (solo si la colección está vacía) ──
  const PROVINCES = [
    "Pinar del Río", "Artemisa", "La Habana", "Mayabeque", "Matanzas",
    "Cienfuegos", "Villa Clara", "Sancti Spíritus", "Ciego de Ávila",
    "Camagüey", "Las Tunas", "Granma", "Holguín", "Santiago de Cuba",
    "Guantánamo", "Isla de la Juventud",
  ];
  const HABANA_MUNIS = [
    "Playa", "Plaza de la Revolución", "Centro Habana", "Habana Vieja",
    "Regla", "La Habana del Este", "Guanabacoa", "San Miguel del Padrón",
    "Diez de Octubre", "Cerro", "Marianao", "La Lisa", "Boyeros",
    "Arroyo Naranjo", "Cotorro",
  ];

  const seeds = [];
  const seeded = new Set();

  // Reparación: añadir un campo `bool` a una colección con registros existentes
  // los deja en false. Si TODOS están inactivos, es artefacto de la migración
  // (no una decisión del admin) y se reactivan.
  for (const collName of ["provinces", "municipalities"]) {
    try {
      const all = await pb.collection(collName).getFullList({ batch: 1 });
      const inactive = all.filter((r) => r.active === false);
      if (all.length > 0 && inactive.length === all.length) {
        for (const r of inactive) {
          await pb.collection(collName).update(r.id, { active: true });
        }
        console.log(`[fix] ${collName}: reactivados ${inactive.length} registros (todos estaban inactive)`);
      }
    } catch (e) {
      console.log(`[fix] ${collName} error:`, e.message);
    }
  }

  try {
    if ((await pb.collection("provinces").getFullList({ batch: 1 })).length === 0) {
      for (const name of PROVINCES) await pb.collection("provinces").create({ name, active: true });
      console.log("[seed] provinces (" + PROVINCES.length + ")");
      seeded.add("provinces");
    } else {
      console.log("[seed] provinces has data, skipping");
    }
  } catch (e) { console.log("[seed] provinces error:", e.message); }

  try {
    if ((await pb.collection("municipalities").getFullList({ batch: 1 })).length === 0) {
      const prov = await pb.collection("provinces").getFullList({ filter: 'name = "La Habana"' });
      if (prov[0]) {
        for (const name of HABANA_MUNIS) {
          await pb.collection("municipalities").create({ name, province: prov[0].id, active: true });
        }
        console.log("[seed] municipalities (La Habana, " + HABANA_MUNIS.length + ")");
        seeded.add("municipalities");
      }
    } else {
      console.log("[seed] municipalities has data, skipping");
    }
  } catch (e) { console.log("[seed] municipalities error:", e.message); }

  try {
    if ((await pb.collection("countries").getFullList({ batch: 1 })).length === 0) {
      await pb.collection("countries").create({ name: "Cuba", emoji: "🇨🇺", active: true });
      await pb.collection("countries").create({ name: "Estados Unidos", emoji: "🇺🇸", active: true });
      await pb.collection("countries").create({ name: "España", emoji: "🇪🇸", active: true });
      await pb.collection("countries").create({ name: "México", emoji: "🇲🇽", active: true });
      console.log("[seed] countries (4)");
      seeded.add("countries");
    } else {
      console.log("[seed] countries has data, skipping");
    }
  } catch (e) { console.log("[seed] countries error:", e.message); }

  try {
    if ((await pb.collection("banks").getFullList({ batch: 1 })).length === 0) {
      await pb.collection("banks").create({ name: "Banco de Crédito y Comercio (BANDEC)", logo: "", country: "Cuba", currency: "CUP", active: true });
      await pb.collection("banks").create({ name: "Banco Metropolitano", logo: "", country: "Cuba", currency: "CUP", active: true });
      await pb.collection("banks").create({ name: "Banco Popular de Ahorro (BPA)", logo: "", country: "Cuba", currency: "CUP", active: true });
      console.log("[seed] banks (3)");
      seeded.add("banks");
    } else {
      console.log("[seed] banks has data, skipping");
    }
  } catch (e) { console.log("[seed] banks error:", e.message); }

  try {
    if ((await pb.collection("settings").getFullList({ batch: 1 })).length === 0) {
      await pb.collection("settings").create({
        store_name: "MercaToma",
        store_description: "Del campo a tu mesa",
        logo: "",
        theme: "system",
        font: "poppins",
      });
      console.log("[seed] settings (1)");
      seeded.add("settings");
    } else {
      console.log("[seed] settings has data, skipping");
    }
  } catch (e) { console.log("[seed] settings error:", e.message); }

  console.log("\nDone. Seeded:", [...seeded].join(", ") || "(none)");
  process.exit(0);
}

setup().catch((e) => {
  console.error("Setup failed:", e.response?.data || e.message);
  process.exit(1);
});