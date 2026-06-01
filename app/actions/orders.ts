"use server";

import { decodePocketBaseToken } from "@/lib/auth";
import { getAdminPB, getAllRecords } from "@/lib/pocketbase";

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
  const payload = decodePocketBaseToken(token);
  if (!payload) {
    return { success: false, error: "No autorizado" };
  }

  try {
    const pb = await getAdminPB();

    const order = await pb.collection('orders').create({
      user_id: orderData.userId,
      user_name: orderData.userName,
      user_email: orderData.userEmail,
      subtotal: orderData.subtotal,
      delivery_fee: orderData.deliveryFee,
      total: orderData.total,
      status: 'pending',
      payment_method: orderData.paymentMethod,
      payment_status: 'pending',
      delivery_address: orderData.deliveryAddress,
      delivery_notes: orderData.deliveryNotes || '',
    });

    const orderId = order.id;

    for (const item of orderData.items) {
      await pb.collection('order_items').create({
        order_id: orderId,
        product_id: item.productId,
        product_name: item.productName,
        quantity: item.quantity,
        price: item.price,
      });
    }

    const user = await pb.collection('users').getOne(orderData.userId);
    await pb.collection('users').update(orderData.userId, {
      total_orders: ((user as any).total_orders || 0) + 1,
      total_spent: Number((user as any).total_spent || 0) + orderData.total,
    });

    return { success: true, orderId };
  } catch (error) {
    console.error("Error creating order:", error);
    return { success: false, error: "Error interno al crear la orden" };
  }
}

export async function getUserOrders(token: string) {
  const payload = decodePocketBaseToken(token);
  if (!payload) throw new Error("No autorizado");

  const pb = await getAdminPB();
  const orders = await getAllRecords(pb, 'orders', {
    filter: `user_id = "${payload.userId}"`,
    sort: '-created_at',
  });

  return await Promise.all(
    orders.map(async (order: any) => {
      const items = await getAllRecords(pb, 'order_items', {
        filter: `order_id = "${order.id}"`,
      });
      return {
        id: order.id,
        userId: order.user_id,
        userName: order.user_name,
        userEmail: order.user_email,
        subtotal: Number(order.subtotal),
        deliveryFee: Number(order.delivery_fee),
        total: Number(order.total),
        status: order.status,
        paymentMethod: order.payment_method,
        paymentStatus: order.payment_status,
        deliveryAddress: order.delivery_address,
        deliveryNotes: order.delivery_notes || '',
        createdAt: order.created,
        updatedAt: order.updated,
        items: items.map((i: any) => ({
          productId: i.product_id,
          productName: i.product_name,
          quantity: i.quantity,
          price: Number(i.price),
        })),
      };
    })
  );
}

export async function updateUserProfile(
  data: { name: string; email: string; phone: string; address: string; gender: string },
  token: string
) {
  const payload = decodePocketBaseToken(token);
  if (!payload) throw new Error("No autorizado");

  const pb = await getAdminPB();
  const updatedUser = await pb.collection('users').update(payload.userId, {
    name: data.name,
    email: data.email,
    phone: data.phone,
    address: data.address,
    gender: data.gender,
  });

  return { success: true, user: updatedUser };
}
