"use server";

import { isUnavailableSession, verifySession } from "@/lib/verify-session";
import { getAdminPB, getAllRecords, sanitize } from "@/lib/pocketbase";
import { parseLocations, matchLocationIndex, StoredLocation } from "@/lib/order-stock";
import { orderItemPrice } from "@/lib/price-margin";
import { orderTotalCup } from "@/lib/order-total";
import { roundCashUp } from "@/lib/cash-rounding";
import {
  requiresReceiptError,
  validatePaymentMethod,
  type PaymentMethodRecord,
} from "@/lib/payment-methods";
import { orderDates } from "@/lib/order-dates";
import { isValidBirthDate, normalizeBirthDate } from "@/lib/birthdays";
import { convertOfferPrice, offerCurrencyCode } from "@/lib/offer-currency";
import {
  canRateDelivery,
  deliveryRatingFromRecord,
  validateDeliveryRating,
} from "@/lib/order-ratings";
import { notifyNewOrder, notifyNewRating } from "@/lib/push/notify";
import { after } from "next/server";
import { randomUUID } from "crypto";

export interface OrderActionResult {
  success: boolean;
  orderId?: string;
  error?: string;
  /** Solo en efectivo: importe exacto a cobrar con billetes (ya redondeado). */
  cashAmount?: number;
}

/**
 * Convierte un total en CUP a la moneda del pedido. Es la instantánea que se
 * guarda como monto transferido; no redondea, el cliente debe transferir el
 * monto exacto que se le muestra.
 */
async function cupAmountInCurrency(
  pb: any,
  currencyCode: string,
  totalCup: number
): Promise<number> {
  if (currencyCode === 'CUP') return totalCup;

  const rows = await getAllRecords<any>(pb, 'currencies', {
    filter: `code = "${sanitize(currencyCode)}" || code = "CUP"`,
  });
  const cupRate = Number(rows.find((c) => c.code === 'CUP')?.exchange_rate) || 0;
  const targetRate =
    Number(rows.find((c) => c.code === currencyCode)?.exchange_rate) || 0;
  if (!cupRate || !targetRate) return totalCup;
  return Math.round((totalCup / cupRate) * targetRate * 100) / 100;
}

/**
 * Importe a cobrar en efectivo, redondeado hacia arriba a la unidad pagable
 * con billetes, y la tasa aplicada (CUP por 1 unidad de la moneda del pedido).
 */
async function cashPaymentAmount(
  pb: any,
  currencyCode: string,
  totalCup: number
): Promise<{ amount: number; rate: number }> {
  if (currencyCode === 'CUP') {
    return { amount: roundCashUp(totalCup, 'CUP'), rate: 1 };
  }

  const rows = await getAllRecords<any>(pb, 'currencies', {
    filter: `code = "${sanitize(currencyCode)}" || code = "CUP"`,
  });
  const cupRate = Number(rows.find((c) => c.code === 'CUP')?.exchange_rate) || 0;
  const targetRate =
    Number(rows.find((c) => c.code === currencyCode)?.exchange_rate) || 0;

  if (!cupRate || !targetRate) {
    return { amount: roundCashUp(totalCup, currencyCode), rate: 1 };
  }

  const converted = Math.round((totalCup / cupRate) * targetRate * 100) / 100;
  return {
    amount: roundCashUp(converted, currencyCode),
    rate: Math.round((cupRate / targetRate) * 10000) / 10000,
  };
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
    /** Presente cuando la línea viene de una oferta. */
    offerId?: string;
    productName: string;
    quantity: number;
    price: number;
  }[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  /** Método de pago elegido en el checkout. El servidor deriva el tipo. */
  paymentMethodId: string;
  /** Tipo que muestra el cliente; se comprueba contra el método guardado. */
  paymentMethod?: string;
  deliveryAddress: string;
  deliveryNotes?: string;
  currencyCode: string;
  zoneId: string;
  municipalityId?: string;
  provinceId?: string;
  receipt?: string;
  reference?: string;
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
  // El titular se valida contra PocketBase: el `userId` del pedido tiene que
  // ser el del usuario autenticado de verdad, no el que afirme el token
  // (que tampoco comprobaba la firma) ni el que envíe el cliente.
  const session = await verifySession(token);
  if (session.userId !== orderData.userId) {
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

      // El método de pago pudo desactivarse, cambiar de moneda o agotar su
      // cupo entre la carga del checkout y el envío. El tipo del pedido y los
      // datos de la transferencia salen del registro validado, no del cliente.
      const method = (orderData.paymentMethodId
        ? await pb
            .collection('payment_methods')
            .getOne(orderData.paymentMethodId)
            .catch(() => null)
        : null) as (PaymentMethodRecord & {
        id: string;
        name?: string;
        account_number?: string;
      }) | null;
      const paymentType = method?.type === 'transfer' ? 'transfer' : 'cash';
      const methodError = validatePaymentMethod({
        method,
        currencyCode: orderData.currencyCode,
        expectedType:
          orderData.paymentMethod === 'cash' ||
          orderData.paymentMethod === 'transfer'
            ? orderData.paymentMethod
            : undefined,
      });
      if (methodError) return { success: false, error: methodError };
      const receiptError = requiresReceiptError({
        method,
        receiptUrl: orderData.receipt,
      });
      if (receiptError) return { success: false, error: receiptError };

      // Margen de ganancia global (%) de la configuración de la tienda.
      // Solo se aplica a órdenes pagadas en CUP (orderItemPrice).
      const settingsRec = (
        await getAllRecords(pb, 'settings', {}).catch(() => [] as any[])
      )[0] as any;
      const globalMargin = settingsRec?.price_margin ?? null;
      // Costo operativo de la tienda (CUP) que se suma a TODAS las órdenes.
      const operationalCost = Math.max(0, Math.round(Number(settingsRec?.operational_cost) || 0));
      const currencyRows = await getAllRecords<any>(pb, 'currencies', {
        filter: 'is_active = true',
      }).catch(() => [] as any[]);
      const offerCurrencies = currencyRows.map((c: any) => ({
        code: String(c.code || '').toUpperCase(),
        exchangeRate: Number(c.exchange_rate) || 1,
        isDefault: c.is_default === true,
      }));

      // Validación de stock server-side con datos frescos + precio real del producto
      // (evita vender a precio/stock desactualizados del carrito del cliente).
      const validatedItems: {
        productId: string;
        offerId?: string;
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

        if (item.offerId) {
          // Línea de oferta: se revalida con datos frescos (anti-tampering)
          // y el precio FINAL lo pone la oferta, sin margen de ganancia.
          const offer = await pb
            .collection('offers')
            .getOne(item.offerId)
            .catch(() => null);
          if (!offer) {
            return {
              success: false,
              error: `La oferta "${item.productName}" ya no está disponible.`,
            };
          }
          if (offer.active === false) {
            return {
              success: false,
              error: `La oferta "${offer.name}" fue desactivada. Retírala del carrito.`,
            };
          }
          const endMs = new Date(
            String(offer.end_date || '').replace(' ', 'T')
          ).getTime();
          if (!(Number.isNaN(endMs) || endMs <= 0) && Date.now() >= endMs) {
            return {
              success: false,
              error: `La oferta "${offer.name}" ya venció. Retírala del carrito.`,
            };
          }
          const offerPrice = convertOfferPrice(
            Math.round((Number(offer.price) || 0) * 100) / 100,
            offerCurrencies,
            offerCurrencyCode(offer as Record<string, any>),
            'CUP'
          );

          let offerProductId = '';
          if (offer.type === 'product' && offer.product_id) {
            // La rebaja vende el producto real: zona y stock se validan contra él.
            let product: any;
            try {
              product = await pb
                .collection('products')
                .getOne(offer.product_id);
            } catch {
              return {
                success: false,
                error: `El producto de la oferta "${offer.name}" ya no está disponible.`,
              };
            }
            const availableMuns = String(
              product.available_municipalities || ''
            )
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
                error: `"${product.name}" no está disponible en tu zona de entrega.`,
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
                  `Stock insuficiente para "${product.name}". ` +
                  `Solo quedan ${stock} disponible(s).`,
              };
            }
            offerProductId = offer.product_id;
          }
          validatedItems.push({
            productId: offerProductId,
            offerId: item.offerId,
            productName: offer.name || item.productName,
            quantity: Math.floor(item.quantity),
            price: offerPrice,
          });
          continue;
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

      // En efectivo se cobra redondeado a billetes; en transferencia, el total exacto.
      const cash =
        paymentType === 'cash'
          ? await cashPaymentAmount(pb, orderData.currencyCode, total)
          : null;
      const transferAmount =
        paymentType === 'transfer'
          ? await cupAmountInCurrency(pb, orderData.currencyCode, total)
          : 0;

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
        payment_method: paymentType,
        payment_status: 'pending',
        delivery_address: orderData.deliveryAddress,
        delivery_notes: orderData.deliveryNotes || '',
        currency_code: orderData.currencyCode,
        zone_id: orderData.zoneId,
        delivery_municipality: orderData.municipalityId || '',
        delivery_province: orderData.provinceId || '',
        // Instantánea del método: aunque el admin lo edite o lo borre, el
        // pedido conserva el nombre y la cuenta con los que se pagó.
        bank_account_id: '',
        bank_name: method?.name || '',
        account_number: method?.account_number || '',
        receipt: orderData.receipt || '',
        reference: orderData.reference || '',
        transfer_amount: transferAmount,
        cash_amount: cash?.amount ?? 0,
        exchange_rate_used: cash?.rate ?? 0,
      });

      const orderId = order.id;

      for (const item of validatedItems) {
        await pb.collection('order_items').create({
          order_id: orderId,
          product_id: item.productId,
          offer_id: item.offerId || '',
          product_name: item.productName,
          quantity: item.quantity,
          price: item.price,
        });
      }

      // Decremento de stock: dentro del lock, sin doble venta entre pedidos concurrentes.
      // Baja el stock global y, si hay zonas configuradas, la del municipio/provincia.
      // Los combos (sin productId) no tocan stock: no hay producto que descontar.
      for (const item of validatedItems) {
        if (!item.productId) continue;
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

      // Contabilidad del método de transferencia (best-effort): el contador y
      // el cupo viven ahora en el propio método.
      if (paymentType === 'transfer' && method) {
        try {
          const fresh = await pb.collection('payment_methods').getOne(method.id);
          const newCount = (Number(fresh.transfer_count) || 0) + 1;
          const limit = Number(fresh.transfer_limit) || 0;
          const updateData: any = { transfer_count: newCount };
          if (limit > 0 && newCount >= limit) {
            updateData.active = false;
          }
          await pb.collection('payment_methods').update(method.id, updateData);
        } catch {
          console.warn(`No se pudo actualizar el método de pago ${method.id}`);
        }
      }

      // El aviso va después de responder: un fallo de push nunca tumba el pedido.
      after(() =>
        notifyNewOrder({
          orderId,
          customerName: orderData.userName,
          total,
          zone: (zone as any).name || "",
        })
      );

      return { success: true, orderId, cashAmount: cash?.amount ?? 0 };
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

export type UserOrdersResult =
  | { ok: true; orders: Awaited<ReturnType<typeof loadOrders>> }
  | { ok: false; reason: "unavailable" };

async function loadOrders(userId: string) {
  const pb = await getAdminPB();
  const orders = await getAllRecords(pb, 'orders', {
    filter: `user_id = "${sanitize(userId)}"`,
    sort: '-created_at',
  });

  return await Promise.all(
    orders.map(async (order: any) => {
      const items = await getAllRecords(pb, 'order_items', {
        filter: `order_id = "${sanitize(order.id)}"`,
      });
      return {
        ...orderDates(order),
        ...deliveryRatingFromRecord(order),
        id: order.id,
        userId: order.user_id,
        userName: order.user_name,
        userEmail: order.user_email,
        contactPhone: order.contact_phone || '',
        contactCarnet: order.contact_carnet || '',
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
        items: items.map((i: any) => ({
          productId: i.product_id,
          offerId: i.offer_id || undefined,
          productName: i.product_name,
          quantity: i.quantity,
          price: Number(i.price),
        })),
      };
    })
  );
}

export async function getUserOrders(token: string): Promise<UserOrdersResult> {
  let session: Awaited<ReturnType<typeof verifySession>>;
  try {
    session = await verifySession(token);
  } catch (error) {
    if (isUnavailableSession(error)) {
      // PocketBase no respondió: el token puede estar bien y la sesión sigue.
      return { ok: false, reason: "unavailable" };
    }
    throw error;
  }

  return { ok: true, orders: await loadOrders(session.userId) };
}

export async function updateUserProfile(
  data: { name: string; email: string; phone: string; address: string; gender: string },
  token: string
) {
  // Sin validar, un token forjado con el id de otra persona permitiría
  // reescribir su nombre, correo, teléfono y dirección (el update va con el
  // cliente superusuario).
  const session = await verifySession(token);

  const pb = await getAdminPB();
  const updatedUser = await pb.collection('users').update(session.userId, {
    name: data.name,
    email: data.email,
    phone: data.phone,
    address: data.address,
    gender: data.gender,
  });

  return { success: true, user: updatedUser };
}

/** Guarda o borra la fecha de nacimiento del propio usuario autenticado. */
export async function saveBirthDateAction(
  token: string,
  value: string | null
): Promise<{ success: boolean; birthDate?: string; error?: string }> {
  const session = await verifySession(token);
  const date = normalizeBirthDate(value);
  if (value && (!date || !isValidBirthDate(date))) {
    return { success: false, error: "La fecha de nacimiento no es válida" };
  }
  try {
    const pb = await getAdminPB();
    await pb.collection("users").update(session.userId, {
      birth_date: date || null,
    });
    return { success: true, birthDate: date };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "No se pudo guardar",
    };
  }
}

export interface RateDeliveryResult {
  success: boolean;
  error?: string;
  rating?: number;
  comment?: string;
}

/** Valora la entrega de una orden propia dentro de las 72 h posteriores. */
export async function rateDeliveryAction(
  orderId: string,
  stars: unknown,
  comment: unknown,
  token: string
): Promise<RateDeliveryResult> {
  const session = await verifySession(token);
  const valid = validateDeliveryRating({ stars, comment });
  if (!valid.ok) return { success: false, error: valid.error };

  try {
    const pb = await getAdminPB();
    const order = await pb.collection('orders').getOne(orderId).catch(() => null);
    if (!order || order.user_id !== session.userId) {
      return { success: false, error: "Pedido no encontrado" };
    }

    const existing = deliveryRatingFromRecord(order);
    if (!canRateDelivery({
      status: order.status,
      deliveredAt: existing.deliveredAt,
      deliveryRating: existing.deliveryRating,
    })) {
      return {
        success: false,
        error: "El plazo para valorar esta entrega ha terminado",
      };
    }

    await pb.collection('orders').update(orderId, {
      delivery_rating: valid.value.stars,
      delivery_comment: valid.value.comment,
    });

    // PocketBase descarta sin avisar los campos que no existen en la
    // colección: se confirma con una lectura antes de dar el éxito por hecho.
    const saved = deliveryRatingFromRecord(
      await pb.collection('orders').getOne(orderId)
    );
    if (
      saved.deliveryRating !== valid.value.stars ||
      saved.deliveryComment !== valid.value.comment
    ) {
      return {
        success: false,
        error: "Faltan los campos de valoración en PocketBase",
      };
    }
    after(() =>
      notifyNewRating({
        orderId,
        customerName: order.user_name || order.user_email || "un cliente",
        rating: valid.value.stars,
      })
    );

    return {
      success: true,
      rating: saved.deliveryRating,
      comment: saved.deliveryComment,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "No se pudo guardar",
    };
  }
}
