"use strict";
// Diagnóstico de conexión a PocketBase. Ejecutar: node scripts/diagnose-pb.cjs
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

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL;
const PocketBase = require("pocketbase").default || require("pocketbase");

(async () => {
  console.log("URL:", PB_URL);
  if (!PB_URL) return console.log("FALTA NEXT_PUBLIC_POCKETBASE_URL en .env.local");

  // 1. DNS
  const host = new URL(PB_URL).hostname;
  try {
    const dns = require("dns/promises");
    const addrs = await dns.lookup(host, { all: true });
    console.log("DNS:", addrs.map((a) => a.address).join(", ") || "sin resultados");
  } catch (e) {
    console.log("DNS: FALLO ->", e.code || e.message);
  }

  // 2. HTTPS
  try {
    const res = await fetch(`${PB_URL}/api/health`, {
      signal: AbortSignal.timeout(15000),
    });
    console.log("HEALTH:", res.status, await res.text());
  } catch (e) {
    console.log("HEALTH: FALLO ->", e.cause?.code || e.name, e.message);
  }

  // 3. Auth real (contraseña falsa a propósito: si responde 400, la red funciona)
  const pb = new PocketBase(PB_URL);
  pb.autoCancellation(false);
  try {
    await pb.collection("users").authWithPassword(
      "diagnostico@inexistente.local",
      "contrasena-falsa"
    );
    console.log("AUTH: respuesta inesperada (login exitoso)");
  } catch (e) {
    const status = e?.response?.status;
    if (status === 400) {
      console.log("AUTH: red OK — PB respondió 400 (credenciales inválidas, esperado)");
    } else if (status) {
      console.log(`AUTH: PB respondió ${status} ->`, JSON.stringify(e.response?.message));
    } else {
      console.log("AUTH: FALLO DE RED ->", e?.cause?.code || e.name, e.message);
    }
  }

  // 4. Campos que espera el código
  try {
    const cols = await pb.collections.getFullList();
    const need = ["users", "provinces", "municipalities", "products", "banks", "roles"];
    for (const n of need) {
      const found = cols.find((c) => c.name === n);
      console.log(`  ${found ? "OK " : "FALTA"} colección ${n}`);
    }
    const provinces = cols.find((c) => c.name === "provinces");
    const hasActive = provinces?.fields?.some((f) => f.name === "active");
    console.log(`  ${hasActive ? "OK " : "FALTA"} provinces.active`);
    const products = cols.find((c) => c.name === "products");
    const hasLocs = products?.fields?.some((f) => f.name === "product_locations");
    console.log(`  ${hasLocs ? "OK " : "FALTA"} products.product_locations`);
  } catch (e) {
    console.log("SCHEMA: no verificable (requiere admin) ->", e.message);
  }
})();