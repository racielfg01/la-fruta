"use server";

import { decodePocketBaseToken } from "@/lib/auth";
import { getAdminPB, getAllRecords, sanitize } from "@/lib/pocketbase";
import { parseLocations, matchLocationIndex, StoredLocation } from "@/lib/order-stock";
import { orderItemPrice } from "@/lib/price-margin";
import { orderTotalCup } from "@/lib/order-total";
import { randomUUID } from "crypto";

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
  contactPhone?: string;
  contactCarnet?: string;
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
  municipalityId?: string;
  provinceId?: string;
  bankAccountId?: string;
  bankName?: string;
  accountNumber?: string;
  receipt?: string;
  reference?: string;
  transferAmount?: number;
}

// Stock efectivo para la zona del cliente. Sin zonas configuradas cae al stock
// global; con zonas configuradas pero fuera de cobertura devuelve 0.
function effectiveStock(
  locs: StoredLocation[],
  municipalityId: string | undefined,
  provinceId: string | undefined,
  globalStock: number
): number {
  if (locs.length === 0) return globalStock;
  const idx = matchLocationIndex(locs, municipalityId, provinceId);
  if (idx < 0) return municipalityId ? 0 : globalStock;
  return Math.max(0, Number(locs[idx].stock) || 0);
}

export async function createOrderAction(
  orderData: CreateOrderInput,
  token: string
): Promise<OrderActionResult> {
  const payload = decodePocketBaseToken(token);
  if (!payload) {
    return { success: false, error: "No autorizado" };
  }
  if (payload.userId !== orderData.userId) {
    return { success: false, error: "No autorizado" };
  }

  try {
    return await withOrderLock(async () => {
      const pb = await getAdminPB();

      // La zona de envío manda el precio; los totales se recalculan aquí, nunca
      // se confía en subtotal/deliveryFee/total del cliente.
      const zone = await pb
        .collection('delivery_zones')
        .getOne(orderData.zoneId)
        .catch(() => null);
      if (!zone) {
        return { success: false, error: 'Zona de envío inválida.' };
      }
      const deliveryFee = Math.max(0, Number(zone.price) || 0);

      // Margen de ganancia global (%) de la configuración de la tienda.
      // Solo se aplica a órdenes pagadas en CUP (orderItemPrice).
      const settingsRec = (
        await getAllRecords(pb, 'settings', {}).catch(() => [] as any[])
      )[0] as any;
      const globalMargin = settingsRec?.price_margin ?? null;
      // Costo operativo de la tienda (CUP) que se suma a TODAS las órdenes.
      const operationalCost = Math.max(0, Math.round(Number(settingsRec?.operational_cost) || 0));

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
        const productName = product.name || item.productName;

        // Disponibilidad por zona: si el producto lista municipios, el pedido
        // debe entregarse en uno de ellos (el filtrado del cliente no basta).
        const availableMuns = String(product.available_municipalities || '')
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean);
        if (
          availableMuns.length > 0 &&
          orderData.municipalityId &&
          !availableMuns.includes(orderData.municipalityId)
        ) {
          return {
            success: false,
            error: `"${productName}" no está disponible en tu zona de entrega.`,
          };
        }

        const locs = parseLocations(product.product_locations);
        const stock = effectiveStock(
          locs,
          orderData.municipalityId,
          orderData.provinceId,
          Math.max(0, Number(product.stock) || 0)
        );
        if (stock < item.quantity) {
          return {
            success: false,
            error:
              `Stock insuficiente para "${productName}". ` +
              `Solo quedan ${stock} disponible(s).`,
          };
        }
        validatedItems.push({
          productId: item.productId,
          productName,
          quantity: Math.floor(item.quantity),
          price: orderItemPrice(
            Number(product.price) || 0,
            {
              globalMargin,
              productMargin: product.price_margin
                ? Number(product.price_margin)
                : null,
            },
            orderData.currencyCode
          ),
        });
      }

      const subtotal = validatedItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      const total = orderTotalCup(subtotal, deliveryFee, operationalCost);

      const order = await pb.collection('orders').create({
        // id único: [a-z0-9] sin guiones (PB orders.id exige ^[a-z0-9]+$)
        id: randomUUID().replace(/-/g, ''),
        user_id: orderData.userId,
        user_name: orderData.userName,
        user_email: orderData.userEmail,
        contact_phone: orderData.contactPhone || '',
        contact_carnet: orderData.contactCarnet || '',
        subtotal,
        delivery_fee: deliveryFee,
        operational_cost: operationalCost,
        total,
        status: 'pending',
        payment_method: orderData.paymentMethod,
        payment_status: 'pending',
        delivery_address: orderData.deliveryAddress,
        delivery_notes: orderData.deliveryNotes || '',
        currency_code: orderData.currencyCode,
        zone_id: orderData.zoneId,
        delivery_municipality: orderData.municipalityId || '',
        delivery_province: orderData.provinceId || '',
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

      // Decremento de stock: dentro del lock, sin doble venta entre pedidos concurrentes.
      // Baja el stock global y, si hay zonas configuradas, la del municipio/provincia.
      for (const item of validatedItems) {
        const product = await pb.collection('products').getOne(item.productId);
        const newStock = Math.max(0, (Number(product.stock) || 0) - item.quantity);
        const update: any = { stock: newStock, in_stock: newStock > 0 };

        const locs = parseLocations(product.product_locations);
        const idx = matchLocationIndex(locs, orderData.municipalityId, orderData.provinceId);
        if (idx >= 0) {
          locs[idx] = {
            ...locs[idx],
            stock: Math.max(0, (Number(locs[idx].stock) || 0) - item.quantity),
          };
          update.product_locations = JSON.stringify(locs);
        }
        await pb.collection('products').update(item.productId, update);
      }

      const user = await pb.collection('users').getOne(orderData.userId);
      await pb.collection('users').update(orderData.userId, {
        total_orders: ((user as any).total_orders || 0) + 1,
        total_spent: Number((user as any).total_spent || 0) + total,
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
    filter: `user_id = "${sanitize(payload.userId)}"`,
    sort: '-created_at',
  });

  return await Promise.all(
    orders.map(async (order: any) => {
      const items = await getAllRecords(pb, 'order_items', {
        filter: `order_id = "${sanitize(order.id)}"`,
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
