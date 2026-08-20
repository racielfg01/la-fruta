"use server";

import { decodePocketBaseToken } from "@/lib/auth";
import { getAdminPB, getAllRecords } from "@/lib/pocketbase";

export interface OrderActionResult {
  success: boolean;
  orderId?: string;
  error?: string;
}

// ponytail: mutex por proceso que serializa validación→decremento de stock al
// crear/cancelar órdenes. PB no ofrece update atómico condicional (el filtro en
// update se ignora), así que sin esto dos pedidos simultáneos podrían vender el
// mismo último item (TOCTOU). Cierra la carrera cuando la app corre en una sola
// instancia. Si se despliega en multi-instancia serverless, migrar la creación
// de órdenes a una cola o a una DB con transacciones reales.
let orderMutex: Promise<unknown> = Promise.resolve();
function withOrderLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = orderMutex.then(fn, fn);
  orderMutex = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

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
  zoneId: string;
  bankAccountId?: string;
  bankName?: string;
  accountNumber?: string;
  receipt?: string;
  reference?: string;
  transferAmount?: number;
}

export async function createOrderAction(
  orderData: CreateOrderInput,
  token: string
): Promise<OrderActionResult> {
  const payload = decodePocketBaseToken(token);
  if (!payload) {
    return { success: false, error: "No autorizado" };
  }

  try {
    return await withOrderLock(async () => {
      const pb = await getAdminPB();

      // Validación de stock server-side con datos frescos + precio real del producto
      // (evita vender a precio/stock desactualizados del carrito del cliente).
      const validatedItems: {
        productId: string;
        productName: string;
        quantity: number;
        price: number;
      }[] = [];
      for (const item of orderData.items) {
        if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
          return {
            success: false,
            error: `Cantidad inválida para "${item.productName}".`,
          };
        }
        let product: any;
        try {
          product = await pb.collection('products').getOne(item.productId);
        } catch {
          return {
            success: false,
            error: `El producto "${item.productName}" ya no está disponible.`,
          };
        }
        const stock = Math.max(0, Number(product.stock) || 0);
        if (stock < item.quantity) {
          return {
            success: false,
            error:
              `Stock insuficiente para "${item.productName}". ` +
              `Solo quedan ${stock} disponible(s).`,
          };
        }
        validatedItems.push({
          productId: item.productId,
          productName: product.name || item.productName,
          quantity: Math.floor(item.quantity),
          price: Number(product.price) || 0,
        });
      }

      const order = await pb.collection('orders').create({
        // id único con sufijo aleatorio: evita colisión entre pedidos del mismo ms
        id: `${Date.now()}${Math.floor(Math.random() * 10000)}`,
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
        currency_code: orderData.currencyCode,
        zone_id: orderData.zoneId,
        bank_account_id: orderData.bankAccountId || '',
        bank_name: orderData.bankName || '',
        account_number: orderData.accountNumber || '',
        receipt: orderData.receipt || '',
        reference: orderData.reference || '',
        transfer_amount: orderData.transferAmount || 0,
      });

      const orderId = order.id;

      for (const item of validatedItems) {
        await pb.collection('order_items').create({
          order_id: orderId,
          product_id: item.productId,
          product_name: item.productName,
          quantity: item.quantity,
          price: item.price,
        });
      }

      // Decremento de stock: dentro del lock, sin doble venta entre pedidos concurrentes
      for (const item of validatedItems) {
        const product = await pb.collection('products').getOne(item.productId);
        const newStock = Math.max(0, (Number(product.stock) || 0) - item.quantity);
        await pb.collection('products').update(item.productId, {
          stock: newStock,
          in_stock: newStock > 0,
        });
      }

      const user = await pb.collection('users').getOne(orderData.userId);
      await pb.collection('users').update(orderData.userId, {
        total_orders: ((user as any).total_orders || 0) + 1,
        total_spent: Number((user as any).total_spent || 0) + orderData.total,
      });

      // Contabilidad de cuentas bancarias en transferencias (best-effort)
      if (orderData.paymentMethod === 'transfer' && orderData.bankAccountId) {
        try {
          const account = await pb.collection('bank_accounts').getOne(orderData.bankAccountId);
          const newCount = (Number(account.transfer_count) || 0) + 1;
          const limit = Number(account.transfer_limit) || 0;
          const updateData: any = { transfer_count: newCount };
          if (limit > 0 && newCount >= limit) {
            updateData.active = false;
          }
          await pb.collection('bank_accounts').update(orderData.bankAccountId, updateData);
        } catch {
          console.warn(`No se pudo actualizar la cuenta bancaria ${orderData.bankAccountId}`);
        }
      }

      return { success: true, orderId };
    });
  } catch (error: any) {
    const info = {
      message: error?.message,
      status: error?.status,
      data: error?.data,
      response: error?.response,
    };
    console.error("Error creating order:", JSON.stringify(info, null, 2));
    return { success: false, error: JSON.stringify(info, null, 2) };
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
        currencyCode: order.currency_code || 'CUP',
        zoneId: order.zone_id || '',
        cancelReason: order.cancel_reason || '',
        receipt: order.receipt || '',
        reference: order.reference || '',
        bankName: order.bank_name || '',
        accountNumber: order.account_number || '',
        transferAmount: Number(order.transfer_amount) || 0,
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

export async function cancelOrderAction(
  orderId: string,
  reason: string,
  token: string
): Promise<OrderActionResult> {
  const payload = decodePocketBaseToken(token);
  if (!payload) {
    return { success: false, error: "No autorizado" };
  }
  if (!reason || !reason.trim()) {
    return { success: false, error: "El motivo de cancelación es obligatorio" };
  }

  try {
    return await withOrderLock(async () => {
      const pb = await getAdminPB();
      const order = await pb.collection('orders').getOne(orderId);
      if (order.user_id !== payload.userId) {
        return { success: false, error: "No autorizado para cancelar esta orden" };
      }
      if (order.status === 'delivered' || order.status === 'cancelled') {
        return { success: false, error: "Esta orden ya no puede cancelarse" };
      }

      await pb.collection('orders').update(orderId, {
        status: 'cancelled',
        cancel_reason: reason.trim(),
      });

      // Restaurar inventario al cancelar (dentro del lock)
      const items = await getAllRecords(pb, 'order_items', {
        filter: `order_id = "${orderId}"`,
      });
      for (const item of items) {
        try {
          const product = await pb.collection('products').getOne(item.product_id);
          const newStock = (Number(product.stock) || 0) + item.quantity;
          await pb.collection('products').update(item.product_id, {
            stock: newStock,
            in_stock: true,
          });
        } catch {
          // producto eliminado, ignorar
        }
      }

      return { success: true };
    });
  } catch (error: any) {
    console.error('Error cancelling order:', error);
    return { success: false, error: error?.message || 'Error al cancelar la orden' };
  }
}
