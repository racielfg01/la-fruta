// app/actions/orders.ts
'use server';

import { neon } from '@neondatabase/serverless';
import { verifyAdminToken } from '@/lib/jwt';

const sql = neon(process.env.DATABASE_URL!);

export async function getUserOrders(token: string) {
  const payload = await verifyAdminToken(token);
  if (!payload) throw new Error('No autorizado');
  
  const orders = await sql`
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
    WHERE o.user_id = ${payload.userId}
    ORDER BY o.created_at DESC
  `;
  
  return orders.map((o: any) => ({
    ...o,
    subtotal: Number(o.subtotal),
    deliveryFee: Number(o.delivery_fee),
    total: Number(o.total),
    items: o.items.map((i: any) => ({ ...i, price: Number(i.price) }))
  }));
}

export async function updateUserProfile(
  data: { name?: string; email?: string; phone?: string; address?: string; gender?: string },
  token: string
) {
  const payload = await verifyAdminToken(token);
  if (!payload) throw new Error('No autorizado');
  
  const setClauses: string[] = [];
  const values: any[] = [];
  let idx = 1;
  
  if (data.name !== undefined) {
    setClauses.push(`name = $${idx++}`);
    values.push(data.name);
  }
  if (data.email !== undefined) {
    setClauses.push(`email = $${idx++}`);
    values.push(data.email);
  }
  if (data.phone !== undefined) {
    setClauses.push(`phone = $${idx++}`);
    values.push(data.phone);
  }
  if (data.address !== undefined) {
    setClauses.push(`address = $${idx++}`);
    values.push(data.address);
  }
  if (data.gender !== undefined) {
    setClauses.push(`gender = $${idx++}`);
    values.push(data.gender);
  }
  
  if (setClauses.length === 0) {
    return { success: true, user: null };
  }
  
  values.push(payload.userId);
  const result = await sql.query(
    `UPDATE users SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING id, name, email, phone, address, gender, created_at`,
    values
  );
  
  return { success: true, user: result[0] || null };
}

export interface CreateOrderData {
  userId: string;
  userName: string;
  userEmail: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: string;
  deliveryAddress: string;
  deliveryNotes?: string;
  currencyCode: string;
}

export async function createOrderAction(orderData: CreateOrderData, token: string) {
  const payload = await verifyAdminToken(token);
  if (!payload) throw new Error('No autorizado');
  
  const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  
  // Insertar la orden
  await sql`
    INSERT INTO orders (
      id, user_id, user_name, user_email, 
      subtotal, delivery_fee, total, 
      status, payment_method, payment_status, 
      delivery_address, delivery_notes, 
      created_at, updated_at
    ) VALUES (
      ${orderId},
      ${orderData.userId},
      ${orderData.userName},
      ${orderData.userEmail},
      ${orderData.subtotal},
      ${orderData.deliveryFee},
      ${orderData.total},
      'pending',
      ${orderData.paymentMethod},
      'pending',
      ${orderData.deliveryAddress},
      ${orderData.deliveryNotes || ''},
      NOW(),
      NOW()
    )
  `;
  
  // Insertar los items de la orden
  for (const item of orderData.items) {
    await sql`
      INSERT INTO order_items (
        order_id, product_id, product_name, quantity, price
      ) VALUES (
        ${orderId},
        ${item.productId},
        ${item.productName},
        ${item.quantity},
        ${item.price}
      )
    `;
  }
  
  // Actualizar total_orders y total_spent del usuario
  await sql`
    UPDATE users 
    SET total_orders = total_orders + 1, 
        total_spent = total_spent + ${orderData.total},
        updated_at = NOW()
    WHERE id = ${orderData.userId}
  `;
  
  return { success: true, orderId };
}