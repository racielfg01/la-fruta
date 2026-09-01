"use strict";
// Siembra TODOS los municipios de Cuba (168) enlazados a su provincia.
// Dataset canónico (división oficial post-2011 + Isla de la Juventud como
// municipio especial enlazado a su provincia homónima).
// Idempotente: salta por par (provincia, municipio). Throttle + retry por el
// rate-limit (429) de pockethost.
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
const PocketBase = require("pocketbase").default || require("pocketbase");

const norm = (s) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

// Nota: "San Luis" existe en Pinar del Río y en Santiago de Cuba -> la clave
// de deduplicación SIEMPRE incluye la provincia.
const MUNICIPIOS = {
  "Pinar del Río": [
    "Consolación del Sur", "Guane", "La Palma", "Los Palacios", "Mantua",
    "Minas de Matahambre", "Pinar del Río", "San Juan y Martínez", "San Luis",
    "Sandino", "Viñales",
  ],
  Artemisa: [
    "Alquízar", "Artemisa", "Bahía Honda", "Bauta", "Caimito", "Candelaria",
    "Guanajay", "Güira de Melena", "Mariel", "San Antonio de los Baños",
    "San Cristóbal",
  ],
  "La Habana": [
    "Arroyo Naranjo", "Boyeros", "Centro Habana", "Cerro", "Cotorro",
    "Diez de Octubre", "Guanabacoa", "La Habana del Este", "Habana Vieja",
    "La Lisa", "Marianao", "Playa", "Plaza de la Revolución", "Regla",
    "San Miguel del Padrón",
  ],
  Mayabeque: [
    "Batabanó", "Bejucal", "Güines", "Jaruco", "Madruga", "Melena del Sur",
    "Nueva Paz", "Quivicán", "San José de las Lajas", "San Nicolás",
    "Santa Cruz del Norte",
  ],
  Matanzas: [
    "Calimete", "Cárdenas", "Ciénaga de Zapata", "Colón", "Jagüey Grande",
    "Jovellanos", "Limonar", "Los Arabos", "Martí", "Matanzas",
    "Pedro Betancourt", "Perico", "Unión de Reyes",
  ],
  Cienfuegos: [
    "Abreus", "Aguada de Pasajeros", "Cienfuegos", "Cruces", "Cumanayagua",
    "Lajas", "Palmira", "Rodas",
  ],
  "Villa Clara": [
    "Caibarién", "Camajuaní", "Cifuentes", "Corralillo", "Encrucijada",
    "Manicaragua", "Placetas", "Quemado de Güines", "Ranchuelo", "Remedios",
    "Sagua la Grande", "Santa Clara", "Santo Domingo",
  ],
  "Sancti Spíritus": [
    "Cabaiguán", "Fomento", "Jatibonico", "La Sierpe", "Sancti Spíritus",
    "Taguasco", "Trinidad", "Yaguajay",
  ],
  "Ciego de Ávila": [
    "Baraguá", "Bolivia", "Chambas", "Ciego de Ávila", "Ciro Redondo",
    "Florencia", "Majagua", "Morón", "Primero de Enero", "Venezuela",
  ],
  Camagüey: [
    "Camagüey", "Carlos M. de Céspedes", "Esmeralda", "Florida", "Guáimaro",
    "Jimaguayú", "Minas", "Najasa", "Nuevitas", "Santa Cruz del Sur",
    "Sibanicú", "Sierra de Cubitas", "Vertientes",
  ],
  "Las Tunas": [
    "Amancio", "Colombia", "Jesús Menéndez", "Jobabo", "Las Tunas",
    "Majibacoa", "Manatí", "Puerto Padre",
  ],
  Granma: [
    "Bayamo", "Bartolomé Masó", "Buey Arriba", "Campechuela", "Cauto Cristo",
    "Guisa", "Jiguaní", "Manzanillo", "Media Luna", "Niquero", "Pilón",
    "Río Cauto", "Yara",
  ],
  Holguín: [
    "Antilla", "Báguanos", "Banes", "Cacocum", "Calixto García", "Cueto",
    "Frank País", "Gibara", "Holguín", "Mayarí", "Moa", "Rafael Freyre",
    "Sagua de Tánamo", "Urbano Noris",
  ],
  "Santiago de Cuba": [
    "Contramaestre", "Guamá", "Mella", "Palma Soriano", "San Luis",
    "Santiago de Cuba", "Segundo Frente", "Songo-La Maya", "Tercer Frente",
  ],
  Guantánamo: [
    "Baracoa", "Caimanera", "El Salvador", "Guantánamo", "Imías", "Maisí",
    "Manuel Tames", "Niceto Pérez", "San Antonio del Sur", "Yateras",
  ],
  // Municipio especial: lo enlazamos a la provincia homónima para que el
  // selector provincia/municipio de la tienda funcione igual que el resto.
  "Isla de la Juventud": ["Isla de la Juventud"],
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function createWithRetry(pb, data, retries = 5) {
  for (let i = 0; ; i++) {
    try {
      return await pb.collection("municipalities").create(data);
    } catch (e) {
      const status = e?.status || e?.response?.status;
      if (status === 429 && i < retries) {
        await sleep(2000 * (i + 1));
        continue;
      }
      throw e;
    }
  }
}

async function setup() {
  console.log(`Connecting to ${PB_URL}...`);
  const pb = new PocketBase(PB_URL);
  await pb.admins.authWithPassword(
    process.env.POCKETBASE_ADMIN_EMAIL,
    process.env.POCKETBASE_ADMIN_PASSWORD
  );
  console.log("Authenticated\n");

  const expectedTotal = Object.values(MUNICIPIOS)
    .reduce((a, l) => a + l.length, 0);
  console.log(`Dataset canónico: ${expectedTotal} municipios`);

  // provincias por nombre normalizado -> id
  const provinces = await pb.collection("provinces").getFullList();
  const provByNorm = new Map(provinces.map((p) => [norm(p.name), p.id]));
  const missingProvs = Object.keys(MUNICIPIOS).filter((p) => !provByNorm.has(norm(p)));
  if (missingProvs.length) {
    throw new Error("Provincias sin registro en BD: " + missingProvs.join(", "));
  }

  // existentes con su provincia (clave provincia|municipio)
  const existingMunis = await pb.collection("municipalities").getFullList({
    batch: 500,
  });
  const existingKeys = new Set(
    existingMunis.map((m) => `${m.province}|${norm(m.name)}`)
  );

  let created = 0, skipped = 0;
  const resumen = {};
  for (const [province, munis] of Object.entries(MUNICIPIOS)) {
    const provId = provByNorm.get(norm(province));
    for (const name of munis) {
      const key = `${provId}|${norm(name)}`;
      if (existingKeys.has(key)) {
        skipped++;
        continue;
      }
      await createWithRetry(pb, { name, province: provId });
      existingKeys.add(key);
      created++;
      resumen[province] = (resumen[province] || 0) + 1;
      await sleep(150);
    }
  }

  console.log(`\nCreados: ${created} | Ya existían: ${skipped}`);
  for (const [p, n] of Object.entries(resumen)) console.log(`  ${p}: ${n}`);

  // verificación final por provincia
  const total = (await pb.collection("municipalities").getFullList({ batch: 500 })).length;
  const faltantes = [];
  for (const [province, munis] of Object.entries(MUNICIPIOS)) {
    const provId = provByNorm.get(norm(province));
    for (const name of munis) {
      if (!existingKeys.has(`${provId}|${norm(name)}`)) faltantes.push(`${name} (${province})`);
    }
  }
  console.log(`\nTotal municipios en BD: ${total}/${expectedTotal}`);
  console.log(faltantes.length ? "FALTAN: " + faltantes.join(", ") : "Verificación: no falta ningún municipio ✔");
  process.exit(0);
}

setup().catch((e) => {
  console.error(`Seed failed [status=${e?.status || "?"}]:`, e?.message || e);
  process.exit(1);
});