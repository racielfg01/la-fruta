"use server";

import { neon } from "@neondatabase/serverless";
import { revalidatePath } from "next/cache";
import { verifyAdminToken } from "@/lib/jwt";

const sql = neon(process.env.DATABASE_URL!);

export interface CreateOrderInput {
  userId: string;
  userName: string;
  userEmail: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: string;
  deliveryAddress: string;
  deliveryNotes?: string;
  currencyCode: string;
}

export async function createOrderAction(orderData: CreateOrderInput, token: string) {
  // Verificar token (opcional, pero recomendado)
  const payload = await verifyAdminToken(token);
  if (!payload) {
    return { success: false, error: "No autorizado" };
  }

  try {
    // 1. Insertar la orden
    const [orderResult] = await sql`
      INSERT INTO orders (
        id, user_id, user_name, user_email, subtotal, delivery_fee, total,
        status, payment_method, payment_status, delivery_address, delivery_notes,
        created_at, updated_at
      )
      VALUES (
        gen_random_uuid(),
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
      RETURNING id
    `;

    const orderId = orderResult.id;

    // 2. Insertar cada item de la orden
    for (const item of orderData.items) {
      await sql`
        INSERT INTO order_items (
          order_id, product_id, product_name, quantity, price
        )
        VALUES (
          ${orderId},
          ${item.productId},
          ${item.productName},
          ${item.quantity},
          ${item.price}
        )
      `;
    }

    // Opcional: Actualizar total_orders y total_spent en la tabla users
    // (lo puedes hacer con un trigger o aquí mismo)
    await sql`
      UPDATE users
      SET total_orders = total_orders + 1,
          total_spent = total_spent + ${orderData.total}
      WHERE id = ${orderData.userId}
    `;

    revalidatePath("/admin/ordenes");
    revalidatePath("/mis-pedidos");

    return { success: true, orderId };
  } catch (error) {
    console.error("Error creating order:", error);
    return { success: false, error: "Error interno al crear la orden" };
  }
}



// Obtener órdenes del usuario autenticado
export async function getUserOrders(token: string) {
  const payload = await verifyAdminToken(token);
  if (!payload) throw new Error("No autorizado");

  const userId = payload.userId;

  const orders = await sql`
    SELECT 
      o.id, 
      o.user_name, 
      o.user_email, 
      o.subtotal, 
      o.delivery_fee, 
      o.total, 
      o.status, 
      o.payment_method, 
      o.payment_status, 
      o.delivery_address, 
      o.delivery_notes,
      o.created_at,
      o.updated_at,
      COALESCE(
        json_agg(
          json_build_object(
            'productId', oi.product_id,
            'productName', oi.product_name,
            'quantity', oi.quantity,
            'price', oi.price
          )
        ) FILTER (WHERE oi.id IS NOT NULL), '[]'
      ) as items
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    WHERE o.user_id = ${userId}
    GROUP BY o.id
    ORDER BY o.created_at DESC
  `;

  return orders;
}

// Actualizar perfil del usuario
export async function updateUserProfile(
  data: { name: string; email: string; phone: string; address: string; gender: string },
  token: string
) {
  const payload = await verifyAdminToken(token);
  if (!payload) throw new Error("No autorizado");

  const userId = payload.userId;

  const [updatedUser] = await sql`
    UPDATE users
    SET 
      name = ${data.name},
      email = ${data.email},
      phone = ${data.phone},
      address = ${data.address},
      gender = ${data.gender}
    WHERE id = ${userId}
    RETURNING id, name, email, phone, address, gender, created_at, role_id
  `;

  return { success: true, user: updatedUser };
}