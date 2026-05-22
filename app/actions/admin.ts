// app/actions/admin.ts
'use server';

import { neon } from '@neondatabase/serverless';
import { verifyAdminToken } from '@/lib/jwt'; // tu función
import { Product } from '@/lib/store';
import { Category, DeliveryZone, User, Order, Currency } from '@/lib/admin-store';

const sql = neon(process.env.DATABASE_URL!);

// Helper: verifica token y además que el usuario sea administrador (role_id = 2)
async function verifyAdminAndGetUserId(token: string): Promise<string> {
  const payload = await verifyAdminToken(token);
  if (!payload) throw new Error('No autorizado: token inválido o expirado');
  
  const [user] = await sql`SELECT role_id FROM users WHERE id = ${payload.userId}`;
  if (!user || user.role_id !== 2) {
    throw new Error('Acceso denegado: se requieren privilegios de administrador');
  }
  return payload.userId;
}

// -------------------------------
// 1. Obtener todos los datos del panel
// -------------------------------
export async function getAdminData(token: string) {
  await verifyAdminAndGetUserId(token);
  
  const [products, categories, deliveryZones, users, orders, currencies] = await Promise.all([
    sql`SELECT * FROM products ORDER BY name ASC`,
    sql`SELECT * FROM categories ORDER BY name ASC`,
    sql`SELECT * FROM delivery_zones ORDER BY min_distance ASC`,
    sql`SELECT id, name, email, phone, address, role_id, status, created_at, total_orders, total_spent FROM users ORDER BY created_at DESC`,
    sql`
      SELECT 
        o.*,
        COALESCE(
          (SELECT json_agg(json_build_object(
            'productId', oi.product_id,
            'productName', oi.product_name,
            'quantity', oi.quantity,
            'price', oi.price
          )) FROM order_items oi WHERE oi.order_id = o.id),
          '[]'::json
        ) as items
      FROM orders o
      ORDER BY o.created_at DESC
    `,
    sql`SELECT * FROM currencies ORDER BY code ASC`,
  ]);
  
  return { products, categories, deliveryZones, users, orders, currencies };
}

// -------------------------------
// 2. Productos
// -------------------------------
export async function addProductAction(product: Omit<Product, 'id'>, token: string) {
  await verifyAdminAndGetUserId(token);
  const id = crypto.randomUUID();
  await sql`
    INSERT INTO products (id, name, description, price, unit, image, category, origin, in_stock)
    VALUES (${id}, ${product.name}, ${product.description}, ${product.price}, ${product.unit}, ${product.image}, ${product.category}, ${product.origin}, ${product.inStock})
  `;
  return { id, ...product };
}

export async function editProductAction(id: string, data: Partial<Product>, token: string) {
  await verifyAdminAndGetUserId(token);
  const updates: string[] = [];
  const values: any[] = [];
  let idx = 1;
  if (data.name !== undefined) { updates.push(`name = $${idx++}`); values.push(data.name); }
  if (data.description !== undefined) { updates.push(`description = $${idx++}`); values.push(data.description); }
  if (data.price !== undefined) { updates.push(`price = $${idx++}`); values.push(data.price); }
  if (data.unit !== undefined) { updates.push(`unit = $${idx++}`); values.push(data.unit); }
  if (data.image !== undefined) { updates.push(`image = $${idx++}`); values.push(data.image); }
  if (data.category !== undefined) { updates.push(`category = $${idx++}`); values.push(data.category); }
  if (data.origin !== undefined) { updates.push(`origin = $${idx++}`); values.push(data.origin); }
  if (data.inStock !== undefined) { updates.push(`in_stock = $${idx++}`); values.push(data.inStock); }
  if (updates.length === 0) return;
  values.push(id);
  await sql.query(`UPDATE products SET ${updates.join(', ')} WHERE id = $${idx}`, values);
}

export async function removeProductAction(id: string, token: string) {
  await verifyAdminAndGetUserId(token);
  await sql`DELETE FROM products WHERE id = ${id}`;
}

// -------------------------------
// 3. Categorías
// -------------------------------
export async function addCategoryAction(category: Omit<Category, 'id'>, token: string) {
  await verifyAdminAndGetUserId(token);
  const id = crypto.randomUUID();
  await sql`
    INSERT INTO categories (id, name, description, image)
    VALUES (${id}, ${category.name}, ${category.description}, ${category.image})
  `;
  return { id, ...category };
}

export async function editCategoryAction(id: string, data: Partial<Category>, token: string) {
  await verifyAdminAndGetUserId(token);
  const updates: string[] = [];
  const values: any[] = [];
  let idx = 1;
  if (data.name !== undefined) { updates.push(`name = $${idx++}`); values.push(data.name); }
  if (data.description !== undefined) { updates.push(`description = $${idx++}`); values.push(data.description); }
  if (data.image !== undefined) { updates.push(`image = $${idx++}`); values.push(data.image); }
  if (updates.length === 0) return;
  values.push(id);
  await sql.query(`UPDATE categories SET ${updates.join(', ')} WHERE id = $${idx}`, values);
}

export async function removeCategoryAction(id: string, token: string) {
  await verifyAdminAndGetUserId(token);
  await sql`DELETE FROM categories WHERE id = ${id}`;
}

// -------------------------------
// 4. Zonas de envío
// -------------------------------
export async function addDeliveryZoneAction(zone: Omit<DeliveryZone, 'id'>, token: string) {
  await verifyAdminAndGetUserId(token);
  const id = crypto.randomUUID();
  await sql`
    INSERT INTO delivery_zones (id, name, min_distance, max_distance, price, estimated_time)
    VALUES (${id}, ${zone.name}, ${zone.minDistance}, ${zone.maxDistance}, ${zone.price}, ${zone.estimatedTime})
  `;
  return { id, ...zone };
}

export async function editDeliveryZoneAction(id: string, data: Partial<DeliveryZone>, token: string) {
  await verifyAdminAndGetUserId(token);
  const updates: string[] = [];
  const values: any[] = [];
  let idx = 1;
  if (data.name !== undefined) { updates.push(`name = $${idx++}`); values.push(data.name); }
  if (data.minDistance !== undefined) { updates.push(`min_distance = $${idx++}`); values.push(data.minDistance); }
  if (data.maxDistance !== undefined) { updates.push(`max_distance = $${idx++}`); values.push(data.maxDistance); }
  if (data.price !== undefined) { updates.push(`price = $${idx++}`); values.push(data.price); }
  if (data.estimatedTime !== undefined) { updates.push(`estimated_time = $${idx++}`); values.push(data.estimatedTime); }
  if (updates.length === 0) return;
  values.push(id);
  await sql.query(`UPDATE delivery_zones SET ${updates.join(', ')} WHERE id = $${idx}`, values);
}

export async function removeDeliveryZoneAction(id: string, token: string) {
  await verifyAdminAndGetUserId(token);
  await sql`DELETE FROM delivery_zones WHERE id = ${id}`;
}

// -------------------------------
// 5. Usuarios
// -------------------------------
export async function addUserAction(user: Omit<User, 'id'>, token: string) {
  await verifyAdminAndGetUserId(token);
  const id = crypto.randomUUID();
  await sql`
    INSERT INTO users (id, name, email, phone, address, role_id, status, created_at, total_orders, total_spent)
    VALUES (${id}, ${user.name}, ${user.email}, ${user.phone}, ${user.address}, ${user.role_id}, ${user.status}, NOW(), 0, 0)
  `;
  return { id, ...user };
}

export async function editUserAction(id: string, data: Partial<User>, token: string) {
  await verifyAdminAndGetUserId(token);
  const updates: string[] = [];
  const values: any[] = [];
  let idx = 1;
  if (data.name !== undefined) { updates.push(`name = $${idx++}`); values.push(data.name); }
  if (data.email !== undefined) { updates.push(`email = $${idx++}`); values.push(data.email); }
  if (data.phone !== undefined) { updates.push(`phone = $${idx++}`); values.push(data.phone); }
  if (data.address !== undefined) { updates.push(`address = $${idx++}`); values.push(data.address); }
  if (data.role_id !== undefined) { updates.push(`role_id = $${idx++}`); values.push(data.role_id); }
  if (data.status !== undefined) { updates.push(`status = $${idx++}`); values.push(data.status); }
  if (updates.length === 0) return;
  values.push(id);
  await sql.query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${idx}`, values);
}

export async function removeUserAction(id: string, token: string) {
  await verifyAdminAndGetUserId(token);
  // Opcional: evitar borrar el último administrador
  await sql`DELETE FROM users WHERE id = ${id}`;
}

// -------------------------------
// 6. Órdenes
// -------------------------------
export async function setOrderStatusAction(orderId: string, status: Order['status'], token: string) {
  await verifyAdminAndGetUserId(token);
  await sql`UPDATE orders SET status = ${status}, updated_at = NOW() WHERE id = ${orderId}`;
}

export async function setPaymentStatusAction(orderId: string, paymentStatus: Order['paymentStatus'], token: string) {
  await verifyAdminAndGetUserId(token);
  await sql`UPDATE orders SET payment_status = ${paymentStatus}, updated_at = NOW() WHERE id = ${orderId}`;
}

// -------------------------------
// 7. Monedas
// -------------------------------
export async function addCurrencyAction(currency: Omit<Currency, 'id'>, token: string) {
  await verifyAdminAndGetUserId(token);
  const id = crypto.randomUUID();
  await sql`
    INSERT INTO currencies (id, code, name, symbol, exchange_rate, is_default, is_active)
    VALUES (${id}, ${currency.code}, ${currency.name}, ${currency.symbol}, ${currency.exchangeRate}, ${currency.isDefault}, ${currency.isActive})
  `;
  return { id, ...currency };
}

export async function editCurrencyAction(id: string, data: Partial<Currency>, token: string) {
  await verifyAdminAndGetUserId(token);
  const updates: string[] = [];
  const values: any[] = [];
  let idx = 1;
  if (data.code !== undefined) { updates.push(`code = $${idx++}`); values.push(data.code); }
  if (data.name !== undefined) { updates.push(`name = $${idx++}`); values.push(data.name); }
  if (data.symbol !== undefined) { updates.push(`symbol = $${idx++}`); values.push(data.symbol); }
  if (data.exchangeRate !== undefined) { updates.push(`exchange_rate = $${idx++}`); values.push(data.exchangeRate); }
  if (data.isDefault !== undefined) { updates.push(`is_default = $${idx++}`); values.push(data.isDefault); }
  if (data.isActive !== undefined) { updates.push(`is_active = $${idx++}`); values.push(data.isActive); }
  if (updates.length === 0) return;
  values.push(id);
  await sql.query(`UPDATE currencies SET ${updates.join(', ')} WHERE id = $${idx}`, values);
}

export async function removeCurrencyAction(id: string, token: string) {
  await verifyAdminAndGetUserId(token);
  await sql`DELETE FROM currencies WHERE id = ${id}`;
}

export async function setDefaultCurrencyAction(id: string, token: string) {
  await verifyAdminAndGetUserId(token);
  await sql`UPDATE currencies SET is_default = false WHERE is_default = true`;
  await sql`UPDATE currencies SET is_default = true WHERE id = ${id}`;
}