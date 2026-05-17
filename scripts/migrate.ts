import { neon } from "@neondatabase/serverless";
import * as fs from "fs";
import * as path from "path";

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
    CREATE TABLE IF NOT EXISTS admin_users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      address TEXT NOT NULL DEFAULT '',
      role TEXT NOT NULL DEFAULT 'customer',
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      total_orders INTEGER DEFAULT 0,
      total_spent DECIMAL(10,2) DEFAULT 0
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
      { id: "1", name: "Organic Apples", description: "Crisp and sweet organic apples freshly picked from local orchards.", price: 4.99, unit: "por lb", image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=800&h=600&fit=crop", category: "Fruits", origin: "Washington Valley Farms" },
      { id: "2", name: "Valencia Oranges", description: "Juicy Valencia oranges bursting with vitamin C.", price: 5.49, unit: "por lb", image: "https://images.unsplash.com/photo-1547514701-42782101795e?w=800&h=600&fit=crop", category: "Citrus", origin: "California Sun Orchards" },
      { id: "3", name: "Fresh Strawberries", description: "Sweet, red strawberries picked at peak ripeness.", price: 6.99, unit: "por pinta", image: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=800&h=600&fit=crop", category: "Berries", origin: "Green Valley Farms" },
      { id: "4", name: "Ripe Bananas", description: "Perfectly ripe bananas, naturally sweet.", price: 2.49, unit: "c/u", image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=800&h=600&fit=crop", category: "Tropical", origin: "Costa Rica Plantations" },
      { id: "5", name: "Organic Blueberries", description: "Plump, organic blueberries packed with antioxidants.", price: 7.99, unit: "por pinta", image: "https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=800&h=600&fit=crop", category: "Berries", origin: "Maine Berry Farms" },
      { id: "6", name: "Fresh Mangoes", description: "Tropical mangoes with buttery, sweet flesh.", price: 3.99, unit: "c/u", image: "https://images.unsplash.com/photo-1553279768-865429fa0078?w=800&h=600&fit=crop", category: "Tropical", origin: "Mexican Tropical Farms" },
      { id: "7", name: "Red Grapes", description: "Seedless red grapes, crisp and naturally sweet.", price: 4.49, unit: "por lb", image: "https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=800&h=600&fit=crop", category: "Fruits", origin: "Napa Valley Vineyards" },
      { id: "8", name: "Ripe Avocados", description: "Creamy Hass avocados, perfectly ripe.", price: 2.99, unit: "c/u", image: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=800&h=600&fit=crop", category: "Fruits", origin: "California Avocado Farms" },
      { id: "9", name: "Fresh Lemons", description: "Bright, tangy lemons perfect for cooking.", price: 3.49, unit: "por lb", image: "https://images.unsplash.com/photo-1590502593747-42a996133562?w=800&h=600&fit=crop", category: "Citrus", origin: "Mediterranean Citrus Co." },
      { id: "10", name: "Sweet Watermelon", description: "Refreshing seedless watermelon.", price: 8.99, unit: "c/u", image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&h=600&fit=crop", category: "Melons", origin: "Georgia Melon Farms" },
      { id: "11", name: "Fresh Raspberries", description: "Delicate, sweet raspberries.", price: 8.49, unit: "por pinta", image: "https://images.unsplash.com/photo-1577003833619-76bbd7f82948?w=800&h=600&fit=crop", category: "Berries", origin: "Pacific Northwest Farms" },
      { id: "12", name: "Organic Pears", description: "Sweet, juicy organic pears.", price: 4.79, unit: "por lb", image: "https://images.unsplash.com/photo-1514756331096-242fdeb70d4a?w=800&h=600&fit=crop", category: "Fruits", origin: "Oregon Orchard Co." },
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

  // Seed admin users
  const existingUsers = await sql`SELECT COUNT(*) as count FROM admin_users`;
  if (Number(existingUsers[0].count) === 0) {
    await sql`
      INSERT INTO admin_users (id, name, email, phone, address, role, status, created_at, total_orders, total_spent) VALUES
        ('1', 'María García', 'maria@ejemplo.com', '+34 612 345 678', 'Calle Mayor 123, Madrid', 'customer', 'active', '2024-01-15', 12, 245.80),
        ('2', 'Carlos López', 'carlos@ejemplo.com', '+34 623 456 789', 'Avenida Principal 45, Barcelona', 'customer', 'active', '2024-02-20', 8, 156.50),
        ('3', 'Ana Martínez', 'ana@ejemplo.com', '+34 634 567 890', 'Plaza Central 7, Valencia', 'customer', 'inactive', '2024-03-10', 3, 67.20),
        ('4', 'Admin Principal', 'admin@lafruta.com', '+34 600 000 000', 'Oficina Central, Madrid', 'admin', 'active', '2024-01-01', 0, 0),
        ('5', 'Pedro Sánchez', 'pedro@ejemplo.com', '+34 645 678 901', 'Calle Nueva 89, Sevilla', 'customer', 'suspended', '2024-04-05', 1, 23.50)
    `;
    console.log("Seeded admin users.");
  }

  // Seed orders
  const existingOrders = await sql`SELECT COUNT(*) as count FROM orders`;
  if (Number(existingOrders[0].count) === 0) {
    await sql`
      INSERT INTO orders (id, user_id, user_name, user_email, subtotal, delivery_fee, total, status, payment_method, payment_status, delivery_address, delivery_notes, created_at, updated_at) VALUES
        ('ORD-001', '1', 'María García', 'maria@ejemplo.com', 16.97, 2.99, 19.96, 'delivered', 'Tarjeta de Crédito', 'paid', 'Calle Mayor 123, Madrid', 'Dejar en portería', '2024-12-01T10:30:00', '2024-12-01T14:45:00'),
        ('ORD-002', '2', 'Carlos López', 'carlos@ejemplo.com', 26.96, 4.99, 31.95, 'shipped', 'PayPal', 'paid', 'Avenida Principal 45, Barcelona', '', '2024-12-05T15:20:00', '2024-12-06T09:00:00'),
        ('ORD-003', '1', 'María García', 'maria@ejemplo.com', 19.95, 2.99, 22.94, 'preparing', 'Tarjeta de Crédito', 'paid', 'Calle Mayor 123, Madrid', 'Llamar antes de entregar', '2024-12-07T11:00:00', '2024-12-07T11:30:00'),
        ('ORD-004', '3', 'Ana Martínez', 'ana@ejemplo.com', 20.97, 4.99, 25.96, 'pending', 'Transferencia Bancaria', 'pending', 'Plaza Central 7, Valencia', '', '2024-12-08T09:15:00', '2024-12-08T09:15:00'),
        ('ORD-005', '5', 'Pedro Sánchez', 'pedro@ejemplo.com', 5.99, 7.99, 13.98, 'cancelled', 'Tarjeta de Crédito', 'refunded', 'Calle Nueva 89, Sevilla', '', '2024-12-02T16:45:00', '2024-12-03T10:00:00')
    `;
    await sql`
      INSERT INTO order_items (order_id, product_id, product_name, quantity, price) VALUES
        ('ORD-001', '1', 'Manzanas Orgánicas', 2, 4.99),
        ('ORD-001', '3', 'Fresas Premium', 1, 6.99),
        ('ORD-002', '5', 'Mangos Maduros', 3, 5.99),
        ('ORD-002', '7', 'Sandía Sin Semillas', 1, 8.99),
        ('ORD-003', '2', 'Naranjas Valencia', 5, 3.99),
        ('ORD-004', '4', 'Arándanos Frescos', 2, 7.99),
        ('ORD-004', '6', 'Piña Tropical', 1, 4.99),
        ('ORD-005', '8', 'Melón Cantalupo', 1, 5.99)
    `;
    console.log("Seeded orders.");
  }

  // Seed currencies
  const existingCurrencies = await sql`SELECT COUNT(*) as count FROM currencies`;
  if (Number(existingCurrencies[0].count) === 0) {
    await sql`
      INSERT INTO currencies (id, code, name, symbol, exchange_rate, is_default, is_active) VALUES
        ('1', 'EUR', 'Euro', '€', 1, true, true),
        ('2', 'USD', 'Dólar Estadounidense', '$', 1.08, false, true),
        ('3', 'GBP', 'Libra Esterlina', '£', 0.86, false, true),
        ('4', 'MXN', 'Peso Mexicano', '$', 18.50, false, false),
        ('5', 'COP', 'Peso Colombiano', '$', 4250, false, false)
    `;
    console.log("Seeded currencies.");
  }

  console.log("Migration complete.");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
