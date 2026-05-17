const { neon } = require("@neondatabase/serverless");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const envPath = path.resolve(process.cwd(), ".env.local");
const lines = fs.readFileSync(envPath, "utf-8").split("\n");
for (const line of lines) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith("#")) {
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

async function setup() {
  const sql = neon(process.env.DATABASE_URL);

  // Add password_hash column
  try {
    await sql`ALTER TABLE admin_users ADD COLUMN password_hash TEXT NOT NULL DEFAULT ''`;
    console.log("Added password_hash column");
  } catch (e) {
    console.log("Column may already exist:", e.message.slice(0, 60));
  }

  const hash = await bcrypt.hash("Admin123", 10);
  await sql`UPDATE admin_users SET password_hash = ${hash}, email = 'admin@lafruta.com' WHERE id = '4'`;
  console.log("Admin password set. Email: admin@lafruta.com / Password: Admin123");
  console.log("Done.");
}

setup().catch((e) => { console.error(e); process.exit(1); });
