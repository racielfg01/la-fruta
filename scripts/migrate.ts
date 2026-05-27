import { neon } from "@neondatabase/serverless";
import * as fs from "fs";
import * as path from "path";
import bcrypt from "bcryptjs";

// Load .env.local manually since plain Node.js doesn't auto-load it
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) process.env[key] = val;
      }
    }
  }
}

const sql = neon(process.env.DATABASE_URL!);

// Función para hashear contraseñas
async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function migrate() {
  console.log("Running migration...");

  // Create tables
  await sql`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      image TEXT NOT NULL DEFAULT ''
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      price DECIMAL(10,2) NOT NULL DEFAULT 0,
      unit TEXT NOT NULL DEFAULT 'por lb',
      image TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT '',
      origin TEXT NOT NULL DEFAULT '',
      in_stock BOOLEAN NOT NULL DEFAULT true
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS delivery_zones (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      min_distance DECIMAL(10,2) NOT NULL DEFAULT 0,
      max_distance DECIMAL(10,2) NOT NULL DEFAULT 0,
      price DECIMAL(10,2) NOT NULL DEFAULT 0,
      estimated_time TEXT NOT NULL DEFAULT ''
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS roles (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      address TEXT NOT NULL DEFAULT '',
      role_id INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      total_orders INTEGER DEFAULT 0,
      total_spent DECIMAL(10,2) DEFAULT 0,
      password_hash TEXT NOT NULL DEFAULT '',
      gender TEXT
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT '',
      user_name TEXT NOT NULL DEFAULT '',
      user_email TEXT NOT NULL DEFAULT '',
      subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
      delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
      total DECIMAL(10,2) NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      payment_method TEXT NOT NULL DEFAULT '',
      payment_status TEXT NOT NULL DEFAULT 'pending',
      delivery_address TEXT NOT NULL DEFAULT '',
      delivery_notes TEXT DEFAULT '',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL DEFAULT '',
      product_name TEXT NOT NULL DEFAULT '',
      quantity INTEGER NOT NULL DEFAULT 0,
      price DECIMAL(10,2) NOT NULL DEFAULT 0
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS currencies (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      symbol TEXT NOT NULL DEFAULT '',
      exchange_rate DECIMAL(10,4) NOT NULL DEFAULT 1,
      is_default BOOLEAN NOT NULL DEFAULT false,
      is_active BOOLEAN NOT NULL DEFAULT true
    )`;

  console.log("Tables created.");

  // Add foreign key for role_id
  await sql`
    ALTER TABLE users
    ADD CONSTRAINT fk_users_role
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
  `.catch(() => {
    // Constraint may already exist, ignore
  });

  // Insert roles
  const existingRoles = await sql`SELECT COUNT(*) as count FROM roles`;
  if (Number(existingRoles[0].count) === 0) {
    await sql`
      INSERT INTO roles (name, description) VALUES
        ('USER', 'Usuario regular con permisos básicos de compra'),
        ('ADMIN', 'Administrador con acceso completo al sistema')
    `;
    console.log("Seeded roles.");
  }

  // Seed categories
  const existingCats = await sql`SELECT COUNT(*) as count FROM categories`;
  if (Number(existingCats[0].count) === 0) {
    await sql`
      INSERT INTO categories (id, name, description, image) VALUES
        ('1', 'Frutas', 'Frutas frescas de temporada', 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400&h=300&fit=crop'),
        ('2', 'Cítricos', 'Naranjas, limones y más', 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=400&h=300&fit=crop'),
        ('3', 'Bayas', 'Fresas, arándanos y frambuesas', 'https://images.unsplash.com/photo-1425934398893-310a009a77f9?w=400&h=300&fit=crop'),
        ('4', 'Tropicales', 'Frutas exóticas tropicales', 'https://images.unsplash.com/photo-1490885578174-acda8905c2c6?w=400&h=300&fit=crop'),
        ('5', 'Melones', 'Sandías, melones y más', 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&h=300&fit=crop')
    `;
    console.log("Seeded categories.");
  }

  // Seed products
  const existingProds = await sql`SELECT COUNT(*) as count FROM products`;
  if (Number(existingProds[0].count) === 0) {
    const products = [
      { id: "1", name: "Organic Apples", description: "Crisp and sweet organic apples freshly picked from local orchards.", price: 4.99, unit: "por lb", image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=800&h=600&fit=crop", category: "Frutas", origin: "Washington Valley Farms" },
      { id: "2", name: "Valencia Oranges", description: "Juicy Valencia oranges bursting with vitamin C.", price: 5.49, unit: "por lb", image: "https://images.unsplash.com/photo-1547514701-42782101795e?w=800&h=600&fit=crop", category: "Cítricos", origin: "California Sun Orchards" },
      { id: "3", name: "Fresh Strawberries", description: "Sweet, red strawberries picked at peak ripeness.", price: 6.99, unit: "por pinta", image: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=800&h=600&fit=crop", category: "Bayas", origin: "Green Valley Farms" },
      { id: "4", name: "Ripe Bananas", description: "Perfectly ripe bananas, naturally sweet.", price: 2.49, unit: "c/u", image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=800&h=600&fit=crop", category: "Tropicales", origin: "Costa Rica Plantations" },
      { id: "5", name: "Organic Blueberries", description: "Plump, organic blueberries packed with antioxidants.", price: 7.99, unit: "por pinta", image: "https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=800&h=600&fit=crop", category: "Bayas", origin: "Maine Berry Farms" },
      { id: "6", name: "Fresh Mangoes", description: "Tropical mangoes with buttery, sweet flesh.", price: 3.99, unit: "c/u", image: "https://images.unsplash.com/photo-1553279768-865429fa0078?w=800&h=600&fit=crop", category: "Tropicales", origin: "Mexican Tropical Farms" },
      { id: "7", name: "Red Grapes", description: "Seedless red grapes, crisp and naturally sweet.", price: 4.49, unit: "por lb", image: "https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=800&h=600&fit=crop", category: "Frutas", origin: "Napa Valley Vineyards" },
      { id: "8", name: "Ripe Avocados", description: "Creamy Hass avocados, perfectly ripe.", price: 2.99, unit: "c/u", image: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=800&h=600&fit=crop", category: "Frutas", origin: "California Avocado Farms" },
      { id: "9", name: "Fresh Lemons", description: "Bright, tangy lemons perfect for cooking.", price: 3.49, unit: "por lb", image: "https://images.unsplash.com/photo-1590502593747-42a996133562?w=800&h=600&fit=crop", category: "Cítricos", origin: "Mediterranean Citrus Co." },
      { id: "10", name: "Sweet Watermelon", description: "Refreshing seedless watermelon.", price: 8.99, unit: "c/u", image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&h=600&fit=crop", category: "Melones", origin: "Georgia Melon Farms" },
      { id: "11", name: "Fresh Raspberries", description: "Delicate, sweet raspberries.", price: 8.49, unit: "por pinta", image: "https://images.unsplash.com/photo-1577003833619-76bbd7f82948?w=800&h=600&fit=crop", category: "Bayas", origin: "Pacific Northwest Farms" },
      { id: "12", name: "Organic Pears", description: "Sweet, juicy organic pears.", price: 4.79, unit: "por lb", image: "https://images.unsplash.com/photo-1514756331096-242fdeb70d4a?w=800&h=600&fit=crop", category: "Frutas", origin: "Oregon Orchard Co." },
    ];
    for (const p of products) {
      await sql`
        INSERT INTO products (id, name, description, price, unit, image, category, origin, in_stock)
        VALUES (${p.id}, ${p.name}, ${p.description}, ${p.price}, ${p.unit}, ${p.image}, ${p.category}, ${p.origin}, true)
      `;
    }
    console.log("Seeded products.");
  }

  // Seed delivery zones
  const existingZones = await sql`SELECT COUNT(*) as count FROM delivery_zones`;
  if (Number(existingZones[0].count) === 0) {
    await sql`
      INSERT INTO delivery_zones (id, name, min_distance, max_distance, price, estimated_time) VALUES
        ('1', 'Zona Centro', 0, 5, 2.99, '30-45 min'),
        ('2', 'Zona Intermedia', 5, 15, 4.99, '45-60 min'),
        ('3', 'Zona Extendida', 15, 30, 7.99, '60-90 min'),
        ('4', 'Zona Remota', 30, 50, 12.99, '90-120 min')
    `;
    console.log("Seeded delivery zones.");
  }

  // Seed users (1 admin + 3 clients)
  const existingUsers = await sql`SELECT COUNT(*) as count FROM users`;
  if (Number(existingUsers[0].count) === 0) {
    // Hashear contraseñas
    const adminPasswordHash = await hashPassword("admin.123*");
    const client1PasswordHash = await hashPassword("cliente.123");
    const client2PasswordHash = await hashPassword("cliente.456");
    const client3PasswordHash = await hashPassword("cliente.789");

    // Obtener IDs de roles
    const roles = await sql`SELECT id, name FROM roles`;
    const userRoleId = roles.find(r => r.name === 'USER')?.id || 1;
    const adminRoleId = roles.find(r => r.name === 'ADMIN')?.id || 2;

    await sql`
      INSERT INTO users (id, name, email, phone, address, role_id, status, created_at, total_orders, total_spent, password_hash, gender) VALUES
        ('usr_1', 'Administrador La Fruta', 'admin@lafruta.com', '+34 600 000 001', 'Calle Principal 123, Madrid', ${adminRoleId}, 'active', NOW(), 0, 0, ${adminPasswordHash}, 'masculino'),
        ('usr_2', 'María García López', 'maria.garcia@email.com', '+34 612 345 678', 'Calle Mayor 45, Barcelona', ${userRoleId}, 'active', NOW(), 5, 245.80, ${client1PasswordHash}, 'femenino'),
        ('usr_3', 'Carlos Rodríguez Sánchez', 'carlos.rodriguez@email.com', '+34 623 456 789', 'Avenida Reforma 234, Valencia', ${userRoleId}, 'active', NOW(), 3, 156.50, ${client2PasswordHash}, 'masculino'),
        ('usr_4', 'Ana Martínez Fernández', 'ana.martinez@email.com', '+34 634 567 890', 'Plaza Central 78, Sevilla', ${userRoleId}, 'active', NOW(), 2, 89.30, ${client3PasswordHash}, 'femenino')
    `;
    console.log("Seeded users (1 admin + 3 clients).");
    console.log("Admin credentials: admin@lafruta.com / admin.123*");
    console.log("Client credentials:");
    console.log("  - maria.garcia@email.com / cliente.123");
    console.log("  - carlos.rodriguez@email.com / cliente.456");
    console.log("  - ana.martinez@email.com / cliente.789");
  }

  // Seed orders
  const existingOrders = await sql`SELECT COUNT(*) as count FROM orders`;
  if (Number(existingOrders[0].count) === 0) {
    // Obtener usuarios para relacionar pedidos
    const users = await sql`SELECT id, name, email FROM users WHERE role_id = 1`; // solo clientes
    
    if (users.length > 0) {
      await sql`
        INSERT INTO orders (id, user_id, user_name, user_email, subtotal, delivery_fee, total, status, payment_method, payment_status, delivery_address, delivery_notes, created_at, updated_at) VALUES
          ('ORD-001', ${users[0]?.id || ''}, ${users[0]?.name || 'Cliente'}, ${users[0]?.email || 'cliente@email.com'}, 16.97, 2.99, 19.96, 'delivered', 'Tarjeta de Crédito', 'paid', 'Calle Mayor 45, Barcelona', 'Dejar en portería', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
          ('ORD-002', ${users[0]?.id || ''}, ${users[0]?.name || 'Cliente'}, ${users[0]?.email || 'cliente@email.com'}, 26.96, 4.99, 31.95, 'shipped', 'PayPal', 'paid', 'Calle Mayor 45, Barcelona', '', NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days'),
          ('ORD-003', ${users[1]?.id || ''}, ${users[1]?.name || 'Cliente'}, ${users[1]?.email || 'cliente@email.com'}, 19.95, 2.99, 22.94, 'preparing', 'Tarjeta de Crédito', 'paid', 'Avenida Reforma 234, Valencia', 'Llamar antes de entregar', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'),
          ('ORD-004', ${users[2]?.id || ''}, ${users[2]?.name || 'Cliente'}, ${users[2]?.email || 'cliente@email.com'}, 20.97, 4.99, 25.96, 'pending', 'Transferencia Bancaria', 'pending', 'Plaza Central 78, Sevilla', '', NOW(), NOW()),
          ('ORD-005', ${users[0]?.id || ''}, ${users[0]?.name || 'Cliente'}, ${users[0]?.email || 'cliente@email.com'}, 5.99, 7.99, 13.98, 'cancelled', 'Tarjeta de Crédito', 'refunded', 'Calle Mayor 45, Barcelona', '', NOW() - INTERVAL '15 days', NOW() - INTERVAL '14 days')
      `;
      
      await sql`
        INSERT INTO order_items (order_id, product_id, product_name, quantity, price) VALUES
          ('ORD-001', '1', 'Organic Apples', 2, 4.99),
          ('ORD-001', '3', 'Fresh Strawberries', 1, 6.99),
          ('ORD-002', '5', 'Organic Blueberries', 3, 5.99),
          ('ORD-002', '7', 'Red Grapes', 1, 8.99),
          ('ORD-003', '2', 'Valencia Oranges', 5, 3.99),
          ('ORD-004', '4', 'Ripe Bananas', 2, 7.99),
          ('ORD-004', '6', 'Fresh Mangoes', 1, 4.99),
          ('ORD-005', '8', 'Ripe Avocados', 1, 5.99)
      `;
    }
    console.log("Seeded orders.");
  }

  // Seed currencies
  const existingCurrencies = await sql`SELECT COUNT(*) as count FROM currencies`;
  if (Number(existingCurrencies[0].count) === 0) {
    await sql`
      INSERT INTO currencies (id, code, name, symbol, exchange_rate, is_default, is_active) VALUES
        ('1', 'EUR', 'Euro', '€', 1, true, true),
        ('2', 'USD', 'Dólar Estadounidense', '$', 1.08, false, true),
        ('3', 'GBP', 'Libra Esterlina', '£', 0.86, false, true)
    `;
    console.log("Seeded currencies.");
  }

  console.log("Migration complete.");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});