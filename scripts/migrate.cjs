const { neon } = require("@neondatabase/serverless");
const fs = require("fs");
const path = require("path");

// Load .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
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

const sql = neon(process.env.DATABASE_URL);

async function migrate() {
  console.log("Creating tables...");

  await sql`CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL, image TEXT NOT NULL DEFAULT ''
  )`;
  await sql`CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL DEFAULT '',
    price DECIMAL(10,2) NOT NULL DEFAULT 0, unit TEXT NOT NULL DEFAULT 'por lb',
    image TEXT NOT NULL DEFAULT '', category TEXT NOT NULL DEFAULT '',
    origin TEXT NOT NULL DEFAULT '', in_stock BOOLEAN NOT NULL DEFAULT true
  )`;
  await sql`CREATE TABLE IF NOT EXISTS delivery_zones (
    id TEXT PRIMARY KEY, name TEXT NOT NULL,
    min_distance DECIMAL(10,2) NOT NULL DEFAULT 0, max_distance DECIMAL(10,2) NOT NULL DEFAULT 0,
    price DECIMAL(10,2) NOT NULL DEFAULT 0, estimated_time TEXT NOT NULL DEFAULT ''
  )`;
  await sql`CREATE TABLE IF NOT EXISTS admin_users (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '', address TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL DEFAULT 'customer', status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_orders INTEGER DEFAULT 0, total_spent DECIMAL(10,2) DEFAULT 0
  )`;
  await sql`CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL DEFAULT '', user_name TEXT NOT NULL DEFAULT '',
    user_email TEXT NOT NULL DEFAULT '', subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0, total DECIMAL(10,2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending', payment_method TEXT NOT NULL DEFAULT '',
    payment_status TEXT NOT NULL DEFAULT 'pending', delivery_address TEXT NOT NULL DEFAULT '',
    delivery_notes TEXT DEFAULT '', created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY, order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL DEFAULT '', product_name TEXT NOT NULL DEFAULT '',
    quantity INTEGER NOT NULL DEFAULT 0, price DECIMAL(10,2) NOT NULL DEFAULT 0
  )`;
  await sql`CREATE TABLE IF NOT EXISTS currencies (
    id TEXT PRIMARY KEY, code TEXT NOT NULL, name TEXT NOT NULL,
    symbol TEXT NOT NULL DEFAULT '', exchange_rate DECIMAL(10,4) NOT NULL DEFAULT 1,
    is_default BOOLEAN NOT NULL DEFAULT false, is_active BOOLEAN NOT NULL DEFAULT true
  )`;

  console.log("Tables created.");

  // Seed categories
  const [{ count: catCount }] = await sql`SELECT COUNT(*) as count FROM categories`;
  if (Number(catCount) === 0) {
    await sql`INSERT INTO categories (id, name, description, image) VALUES
      ('1','Frutas','Frutas frescas de temporada','https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400&h=300&fit=crop'),
      ('2','Cítricos','Naranjas, limones y más','https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=400&h=300&fit=crop'),
      ('3','Bayas','Fresas, arándanos y frambuesas','https://images.unsplash.com/photo-1425934398893-310a009a77f9?w=400&h=300&fit=crop'),
      ('4','Tropicales','Frutas exóticas tropicales','https://images.unsplash.com/photo-1490885578174-acda8905c2c6?w=400&h=300&fit=crop'),
      ('5','Melones','Sandías, melones y más','https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&h=300&fit=crop')`;
    console.log("  categories seeded.");
  }

  // Seed products
  const [{ count: prodCount }] = await sql`SELECT COUNT(*) as count FROM products`;
  if (Number(prodCount) === 0) {
    const products = [
      ["1","Organic Apples","Crisp and sweet organic apples freshly picked from local orchards. Perfect for snacking, baking, or making fresh juice.",4.99,"por lb","https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=800&h=600&fit=crop","Fruits","Washington Valley Farms"],
      ["2","Valencia Oranges","Juicy Valencia oranges bursting with vitamin C. Ideal for fresh-squeezed juice or eating out of hand.",5.49,"por lb","https://images.unsplash.com/photo-1547514701-42782101795e?w=800&h=600&fit=crop","Citrus","California Sun Orchards"],
      ["3","Fresh Strawberries","Sweet, red strawberries picked at peak ripeness. Perfect for desserts, smoothies, or eating fresh.",6.99,"por pinta","https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=800&h=600&fit=crop","Berries","Green Valley Farms"],
      ["4","Ripe Bananas","Perfectly ripe bananas, naturally sweet and full of potassium. Great for smoothies, baking, or as a healthy snack.",2.49,"c/u","https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=800&h=600&fit=crop","Tropical","Costa Rica Plantations"],
      ["5","Organic Blueberries","Plump, organic blueberries packed with antioxidants. Perfect for breakfast, baking, or snacking.",7.99,"por pinta","https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=800&h=600&fit=crop","Berries","Maine Berry Farms"],
      ["6","Fresh Mangoes","Tropical mangoes with buttery, sweet flesh. Excellent for smoothies, salsas, or enjoying fresh.",3.99,"c/u","https://images.unsplash.com/photo-1553279768-865429fa0078?w=800&h=600&fit=crop","Tropical","Mexican Tropical Farms"],
      ["7","Red Grapes","Seedless red grapes, crisp and naturally sweet. Perfect for snacking, salads, or cheese boards.",4.49,"por lb","https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=800&h=600&fit=crop","Fruits","Napa Valley Vineyards"],
      ["8","Ripe Avocados","Creamy Hass avocados, perfectly ripe and ready to eat. Ideal for guacamole, toast, or salads.",2.99,"c/u","https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=800&h=600&fit=crop","Fruits","California Avocado Farms"],
      ["9","Fresh Lemons","Bright, tangy lemons perfect for cooking, baking, or making refreshing lemonade.",3.49,"por lb","https://images.unsplash.com/photo-1590502593747-42a996133562?w=800&h=600&fit=crop","Citrus","Mediterranean Citrus Co."],
      ["10","Sweet Watermelon","Refreshing seedless watermelon, perfectly sweet and hydrating. A summer favorite for picnics and gatherings.",8.99,"c/u","https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&h=600&fit=crop","Melons","Georgia Melon Farms"],
      ["11","Fresh Raspberries","Delicate, sweet raspberries with a perfect balance of tartness. Great for desserts and breakfast.",8.49,"por pinta","https://images.unsplash.com/photo-1577003833619-76bbd7f82948?w=800&h=600&fit=crop","Berries","Pacific Northwest Farms"],
      ["12","Organic Pears","Sweet, juicy organic pears with a buttery texture. Perfect for snacking or adding to salads.",4.79,"por lb","https://images.unsplash.com/photo-1514756331096-242fdeb70d4a?w=800&h=600&fit=crop","Fruits","Oregon Orchard Co."],
    ];
    for (const p of products) {
      await sql`INSERT INTO products (id, name, description, price, unit, image, category, origin, in_stock) VALUES (${p[0]},${p[1]},${p[2]},${p[3]},${p[4]},${p[5]},${p[6]},${p[7]},true)`;
    }
    console.log("  products seeded.");
  }

  // Seed delivery zones
  const [{ count: zoneCount }] = await sql`SELECT COUNT(*) as count FROM delivery_zones`;
  if (Number(zoneCount) === 0) {
    await sql`INSERT INTO delivery_zones (id, name, min_distance, max_distance, price, estimated_time) VALUES
      ('1','Zona Centro',0,5,2.99,'30-45 min'),
      ('2','Zona Intermedia',5,15,4.99,'45-60 min'),
      ('3','Zona Extendida',15,30,7.99,'60-90 min'),
      ('4','Zona Remota',30,50,12.99,'90-120 min')`;
    console.log("  delivery zones seeded.");
  }

  // Seed admin users
  const [{ count: userCount }] = await sql`SELECT COUNT(*) as count FROM admin_users`;
  if (Number(userCount) === 0) {
    await sql`INSERT INTO admin_users (id, name, email, phone, address, role, status, created_at, total_orders, total_spent) VALUES
      ('1','María García','maria@ejemplo.com','+34 612 345 678','Calle Mayor 123, Madrid','customer','active','2024-01-15',12,245.80),
      ('2','Carlos López','carlos@ejemplo.com','+34 623 456 789','Avenida Principal 45, Barcelona','customer','active','2024-02-20',8,156.50),
      ('3','Ana Martínez','ana@ejemplo.com','+34 634 567 890','Plaza Central 7, Valencia','customer','inactive','2024-03-10',3,67.20),
      ('4','Admin Principal','admin@lafruta.com','+34 600 000 000','Oficina Central, Madrid','admin','active','2024-01-01',0,0),
      ('5','Pedro Sánchez','pedro@ejemplo.com','+34 645 678 901','Calle Nueva 89, Sevilla','customer','suspended','2024-04-05',1,23.50)`;
    console.log("  admin users seeded.");
  }

  // Seed orders + items
  const [{ count: orderCount }] = await sql`SELECT COUNT(*) as count FROM orders`;
  if (Number(orderCount) === 0) {
    await sql`INSERT INTO orders (id, user_id, user_name, user_email, subtotal, delivery_fee, total, status, payment_method, payment_status, delivery_address, delivery_notes, created_at, updated_at) VALUES
      ('ORD-001','1','María García','maria@ejemplo.com',16.97,2.99,19.96,'delivered','Tarjeta de Crédito','paid','Calle Mayor 123, Madrid','Dejar en portería','2024-12-01T10:30:00','2024-12-01T14:45:00'),
      ('ORD-002','2','Carlos López','carlos@ejemplo.com',26.96,4.99,31.95,'shipped','PayPal','paid','Avenida Principal 45, Barcelona','','2024-12-05T15:20:00','2024-12-06T09:00:00'),
      ('ORD-003','1','María García','maria@ejemplo.com',19.95,2.99,22.94,'preparing','Tarjeta de Crédito','paid','Calle Mayor 123, Madrid','Llamar antes de entregar','2024-12-07T11:00:00','2024-12-07T11:30:00'),
      ('ORD-004','3','Ana Martínez','ana@ejemplo.com',20.97,4.99,25.96,'pending','Transferencia Bancaria','pending','Plaza Central 7, Valencia','','2024-12-08T09:15:00','2024-12-08T09:15:00'),
      ('ORD-005','5','Pedro Sánchez','pedro@ejemplo.com',5.99,7.99,13.98,'cancelled','Tarjeta de Crédito','refunded','Calle Nueva 89, Sevilla','','2024-12-02T16:45:00','2024-12-03T10:00:00')`;
    await sql`INSERT INTO order_items (order_id, product_id, product_name, quantity, price) VALUES
      ('ORD-001','1','Manzanas Orgánicas',2,4.99),
      ('ORD-001','3','Fresas Premium',1,6.99),
      ('ORD-002','5','Mangos Maduros',3,5.99),
      ('ORD-002','7','Sandía Sin Semillas',1,8.99),
      ('ORD-003','2','Naranjas Valencia',5,3.99),
      ('ORD-004','4','Arándanos Frescos',2,7.99),
      ('ORD-004','6','Piña Tropical',1,4.99),
      ('ORD-005','8','Melón Cantalupo',1,5.99)`;
    console.log("  orders seeded.");
  }

  // Seed currencies
  const [{ count: currCount }] = await sql`SELECT COUNT(*) as count FROM currencies`;
  if (Number(currCount) === 0) {
    await sql`INSERT INTO currencies (id, code, name, symbol, exchange_rate, is_default, is_active) VALUES
      ('1','EUR','Euro','€',1,true,true),
      ('2','USD','Dólar Estadounidense','$',1.08,false,true),
      ('3','GBP','Libra Esterlina','£',0.86,false,true),
      ('4','MXN','Peso Mexicano','$',18.50,false,false),
      ('5','COP','Peso Colombiano','$',4250,false,false)`;
    console.log("  currencies seeded.");
  }

  console.log("Migration complete.");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
