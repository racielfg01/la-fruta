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