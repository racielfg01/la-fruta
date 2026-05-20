import { neon } from "@neondatabase/serverless";
import { Product } from "./store";

const sql = neon(process.env.DATABASE_URL!);

// ── Categories ──

export async function getCategories() {
  return await sql`SELECT * FROM categories ORDER BY name`;
}

export async function createCategory(cat: { id: string; name: string; description: string; image: string }) {
  await sql`
    INSERT INTO categories (id, name, description, image)
    VALUES (${cat.id}, ${cat.name}, ${cat.description}, ${cat.image})
  `;
}

export async function updateCategory(id: string, data: { name?: string; description?: string; image?: string }) {
  const fields: string[] = [];
  const values: any[] = [];
  if (data.name !== undefined) { fields.push("name"); values.push(data.name); }
  if (data.description !== undefined) { fields.push("description"); values.push(data.description); }
  if (data.image !== undefined) { fields.push("image"); values.push(data.image); }
  if (fields.length === 0) return;
  await sql`
    UPDATE categories SET ${sql(fields.join(", "), ...values)} WHERE id = ${id}
  `;
}

export async function deleteCategory(id: string) {
  await sql`DELETE FROM categories WHERE id = ${id}`;
}

// ── Products ──

export async function getProducts(): Promise<Product[]> {
  const rows = await sql`
    SELECT id, name, description, price::float AS price, unit, image, category, origin, in_stock AS "inStock"
    FROM products ORDER BY name
  `;
  return rows as unknown as Product[];
}

export async function createProduct(product: Product) {
  await sql`
    INSERT INTO products (id, name, description, price, unit, image, category, origin, in_stock)
    VALUES (${product.id}, ${product.name}, ${product.description}, ${product.price}, ${product.unit}, ${product.image}, ${product.category}, ${product.origin}, ${product.inStock})
  `;
}

export async function updateProduct(id: string, data: Partial<Product>) {
  const fields: string[] = [];
  const values: any[] = [];
  if (data.name !== undefined) { fields.push("name"); values.push(data.name); }
  if (data.description !== undefined) { fields.push("description"); values.push(data.description); }
  if (data.price !== undefined) { fields.push("price"); values.push(data.price); }
  if (data.unit !== undefined) { fields.push("unit"); values.push(data.unit); }
  if (data.image !== undefined) { fields.push("image"); values.push(data.image); }
  if (data.category !== undefined) { fields.push("category"); values.push(data.category); }
  if (data.origin !== undefined) { fields.push("origin"); values.push(data.origin); }
  if (data.inStock !== undefined) { fields.push("in_stock"); values.push(data.inStock); }
  if (fields.length === 0) return;
  await sql`
    UPDATE products SET ${sql(fields.join(", "), ...values)} WHERE id = ${id}
  `;
}

export async function deleteProduct(id: string) {
  await sql`DELETE FROM products WHERE id = ${id}`;
}

// ── Delivery Zones ──

export async function getDeliveryZones() {
  const rows = await sql`
    SELECT id, name, min_distance::float AS "minDistance", max_distance::float AS "maxDistance", price::float AS price, estimated_time AS "estimatedTime"
    FROM delivery_zones ORDER BY min_distance
  `;
  return rows as any[];
}

export async function createDeliveryZone(zone: any) {
  await sql`
    INSERT INTO delivery_zones (id, name, min_distance, max_distance, price, estimated_time)
    VALUES (${zone.id}, ${zone.name}, ${zone.minDistance}, ${zone.maxDistance}, ${zone.price}, ${zone.estimatedTime})
  `;
}

export async function updateDeliveryZone(id: string, data: any) {
  const fields: string[] = [];
  const values: any[] = [];
  if (data.name !== undefined) { fields.push("name"); values.push(data.name); }
  if (data.minDistance !== undefined) { fields.push("min_distance"); values.push(data.minDistance); }
  if (data.maxDistance !== undefined) { fields.push("max_distance"); values.push(data.maxDistance); }
  if (data.price !== undefined) { fields.push("price"); values.push(data.price); }
  if (data.estimatedTime !== undefined) { fields.push("estimated_time"); values.push(data.estimatedTime); }
  if (fields.length === 0) return;
  await sql`
    UPDATE delivery_zones SET ${sql(fields.join(", "), ...values)} WHERE id = ${id}
  `;
}

export async function deleteDeliveryZone(id: string) {
  await sql`DELETE FROM delivery_zones WHERE id = ${id}`;
}

// ── Admin Users ──

export async function getAdminUsers() {
  const rows = await sql`
    SELECT id, name, email, phone, address, role, status,
      created_at::text AS "createdAt",
      total_orders AS "totalOrders",
      total_spent::float AS "totalSpent"
    FROM users ORDER BY created_at DESC
  `;
  return rows as any[];
}

export async function createAdminUser(user: any) {
  await sql`
    INSERT INTO users (id, name, email, phone, address, role, status, created_at, total_orders, total_spent)
    VALUES (${user.id}, ${user.name}, ${user.email}, ${user.phone}, ${user.address}, ${user.role}, ${user.status}, ${user.createdAt || new Date().toISOString()}, ${user.totalOrders || 0}, ${user.totalSpent || 0})
  `;
}

export async function updateAdminUser(id: string, data: any) {
  const fields: string[] = [];
  const values: any[] = [];
  if (data.name !== undefined) { fields.push("name"); values.push(data.name); }
  if (data.email !== undefined) { fields.push("email"); values.push(data.email); }
  if (data.phone !== undefined) { fields.push("phone"); values.push(data.phone); }
  if (data.address !== undefined) { fields.push("address"); values.push(data.address); }
  if (data.role !== undefined) { fields.push("role"); values.push(data.role); }
  if (data.status !== undefined) { fields.push("status"); values.push(data.status); }
  if (data.totalOrders !== undefined) { fields.push("total_orders"); values.push(data.totalOrders); }
  if (data.totalSpent !== undefined) { fields.push("total_spent"); values.push(data.totalSpent); }
  if (fields.length === 0) return;
  await sql`
    UPDATE users SET ${sql(fields.join(", "), ...values)} WHERE id = ${id}
  `;
}

export async function deleteAdminUser(id: string) {
  await sql`DELETE FROM users WHERE id = ${id}`;
}

// ── Orders ──

export async function getOrders() {
  const rows = await sql`
    SELECT id, user_id AS "userId", user_name AS "userName", user_email AS "userEmail",
      subtotal::float AS subtotal, delivery_fee::float AS "deliveryFee", total::float AS total,
      status, payment_method AS "paymentMethod", payment_status AS "paymentStatus",
      delivery_address AS "deliveryAddress", delivery_notes AS "deliveryNotes",
      created_at::text AS "createdAt", updated_at::text AS "updatedAt"
    FROM orders ORDER BY created_at DESC
  `;
  const orders = rows as any[];
  for (const order of orders) {
    const items = await sql`
      SELECT product_id AS "productId", product_name AS "productName", quantity, price::float AS price
      FROM order_items WHERE order_id = ${order.id}
    `;
    order.items = items;
  }
  return orders;
}

export async function updateOrderStatus(id: string, status: string) {
  await sql`
    UPDATE orders SET status = ${status}, updated_at = NOW() WHERE id = ${id}
  `;
}

export async function updatePaymentStatus(id: string, paymentStatus: string) {
  await sql`
    UPDATE orders SET payment_status = ${paymentStatus}, updated_at = NOW() WHERE id = ${id}
  `;
}

// ── Currencies ──

export async function getCurrencies() {
  const rows = await sql`
    SELECT id, code, name, symbol, exchange_rate::float AS "exchangeRate",
      is_default AS "isDefault", is_active AS "isActive"
    FROM currencies ORDER BY is_default DESC, code
  `;
  return rows as any[];
}

export async function createCurrency(currency: any) {
  await sql`
    INSERT INTO currencies (id, code, name, symbol, exchange_rate, is_default, is_active)
    VALUES (${currency.id}, ${currency.code}, ${currency.name}, ${currency.symbol}, ${currency.exchangeRate}, ${currency.isDefault || false}, ${currency.isActive !== false})
  `;
}

export async function updateCurrency(id: string, data: any) {
  const fields: string[] = [];
  const values: any[] = [];
  if (data.code !== undefined) { fields.push("code"); values.push(data.code); }
  if (data.name !== undefined) { fields.push("name"); values.push(data.name); }
  if (data.symbol !== undefined) { fields.push("symbol"); values.push(data.symbol); }
  if (data.exchangeRate !== undefined) { fields.push("exchange_rate"); values.push(data.exchangeRate); }
  if (data.isDefault !== undefined) { fields.push("is_default"); values.push(data.isDefault); }
  if (data.isActive !== undefined) { fields.push("is_active"); values.push(data.isActive); }
  if (fields.length === 0) return;
  await sql`
    UPDATE currencies SET ${sql(fields.join(", "), ...values)} WHERE id = ${id}
  `;
}

export async function deleteCurrency(id: string) {
  await sql`DELETE FROM currencies WHERE id = ${id}`;
}

export async function setDefaultCurrency(id: string) {
  await sql`UPDATE currencies SET is_default = false WHERE is_default = true`;
  await sql`UPDATE currencies SET is_default = true WHERE id = ${id}`;
}

// ── Initialisation: load all data ──

export async function getAllAdminData() {
  const [categories, products, deliveryZones, users, orders, currencies] = await Promise.all([
    getCategories(),
    getProducts(),
    getDeliveryZones(),
    getAdminUsers(),
    getOrders(),
    getCurrencies(),
  ]);
  return { categories, products, deliveryZones, users, orders, currencies };
}
