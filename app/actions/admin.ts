'use server';

import { decodePocketBaseToken, getRoleIds } from '@/lib/auth';
import { getAdminPB, getPB, getAllRecords } from '@/lib/pocketbase';
import { Product } from '@/lib/store';
import { Category, DeliveryZone, User, Order, Currency } from '@/lib/admin-store';

async function verifyAdminAndGetUserId(token: string): Promise<string> {
  const payload = decodePocketBaseToken(token);
  if (!payload) throw new Error('No autorizado: token inválido o expirado');

  const pb = await getAdminPB();
  const user = await pb.collection('users').getOne(payload.userId);
  const roleIds = await getRoleIds();
  if (!roleIds.admin || user.role_id !== roleIds.admin) {
    throw new Error('Acceso denegado: se requieren privilegios de administrador');
  }
  return payload.userId;
}

async function getRoleIdByName(name: string): Promise<string> {
  const pb = await getAdminPB();
  const roles = await getAllRecords(pb, 'roles', { filter: `name = "${name}"` });
  return roles[0]?.id || '';
}

async function getCategoryIdByName(name: string): Promise<string> {
  const pb = await getAdminPB();
  const cats = await getAllRecords(pb, 'categories', { filter: `name = "${name}"` });
  return cats[0]?.id || '';
}

function mapProduct(p: any) {
  return {
    ...p,
    price: Number(p.price),
    stock: p.stock ?? 0,
    inStock: p.in_stock ?? (p.stock ?? 0) > 0,
    visible: p.is_visible ?? true,
    category: p.expand?.category?.name || p.category || '',
  };
}

function mapDeliveryZone(z: any) {
  return {
    ...z,
    price: Number(z.price),
    minDistance: Number(z.minDistance),
    maxDistance: Number(z.maxDistance),
    estimatedTime: z.estimated_time || '',
  };
}

function mapOrder(o: any) {
  return {
    id: o.id,
    userId: o.user_id,
    userName: o.user_name,
    userEmail: o.user_email,
    subtotal: Number(o.subtotal),
    deliveryFee: Number(o.delivery_fee),
    total: Number(o.total),
    status: o.status,
    paymentMethod: o.payment_method,
    paymentStatus: o.payment_status,
    deliveryAddress: o.delivery_address,
    deliveryNotes: o.delivery_notes || '',
    currencyCode: o.currency_code || 'CUP',
    zoneId: o.zone_id || '',
    createdAt: o.created,
    updatedAt: o.updated,
  };
}

export async function getAdminData(token: string) {
  await verifyAdminAndGetUserId(token);

  const pb = await getAdminPB();

  const [products, categories, deliveryZones, users, orders, currencies] = await Promise.all([
    getAllRecords(pb, 'products', { sort: 'name', expand: 'category' }),
    getAllRecords(pb, 'categories', { sort: 'name' }),
    getAllRecords(pb, 'delivery_zones', { sort: 'min_distance' }),
    getAllRecords(pb, 'users', { sort: '-created', expand: 'role_id' }),
    getAllRecords(pb, 'orders', { sort: '-created_at' }),
    getAllRecords(pb, 'currencies', { sort: 'code' }),
  ]);

  const roleIds = await getRoleIds();

  const ordersFixed = await Promise.all(
    orders.map(async (order: any) => {
      const items = await getAllRecords(pb, 'order_items', {
        filter: `order_id = "${order.id}"`,
      });
    return {
      ...mapOrder(order),
      items: items.map((item: any) => ({
        productId: item.product_id,
        productName: item.product_name,
        quantity: item.quantity,
        price: Number(item.price),
      })),
    };
  })
);

  return {
    products: products.map(mapProduct),
    categories,
    deliveryZones: deliveryZones.map(mapDeliveryZone),
    users: users.map((u: any) => ({
      ...u,
      role_id: roleIds.admin && u.role_id === roleIds.admin ? 2 : 1,
    })),
    orders: ordersFixed,
    currencies: currencies.map((c: any) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      symbol: c.symbol,
      exchangeRate: Number(c.exchange_rate) || 1,
      isDefault: c.is_default === true,
      isActive: c.is_active !== false,
    })),
  };
}

export async function addProductAction(product: Product, token: string) {
  await verifyAdminAndGetUserId(token);
  const pb = await getAdminPB();
  const categoryId = await getCategoryIdByName(product.category);
  const record = await pb.collection('products').create({
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    unit: product.unit,
    image: product.image,
    category: categoryId,
    origin: product.origin,
    stock: product.stock,
    in_stock: product.stock > 0,
    is_visible: product.visible,
  });
  return { ...product, id: record.id };
}

export async function editProductAction(id: string, data: Partial<Product>, token: string) {
  await verifyAdminAndGetUserId(token);
  const pb = await getAdminPB();
  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.price !== undefined) updateData.price = data.price;
  if (data.unit !== undefined) updateData.unit = data.unit;
  if (data.image !== undefined) updateData.image = data.image;
  if (data.category !== undefined) updateData.category = await getCategoryIdByName(data.category);
  if (data.origin !== undefined) updateData.origin = data.origin;
  if (data.stock !== undefined) {
    updateData.stock = data.stock;
    updateData.in_stock = data.stock > 0;
  }
  if (data.visible !== undefined) updateData.is_visible = data.visible;
  if (Object.keys(updateData).length === 0) return;
  await pb.collection('products').update(id, updateData);
}

export async function removeProductAction(id: string, token: string) {
  await verifyAdminAndGetUserId(token);
  const pb = await getAdminPB();
  await pb.collection('products').delete(id);
}

export async function addCategoryAction(category: Category, token: string) {
  await verifyAdminAndGetUserId(token);
  const pb = await getAdminPB();
  const record = await pb.collection('categories').create({
    id: category.id,
    name: category.name,
    description: category.description,
    image: category.image,
  });
  return { ...category, id: record.id };
}

export async function editCategoryAction(id: string, data: Partial<Category>, token: string) {
  await verifyAdminAndGetUserId(token);
  const pb = await getAdminPB();
  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.image !== undefined) updateData.image = data.image;
  if (Object.keys(updateData).length === 0) return;
  await pb.collection('categories').update(id, updateData);
}

export async function removeCategoryAction(id: string, token: string) {
  await verifyAdminAndGetUserId(token);
  const pb = await getAdminPB();
  await pb.collection('categories').delete(id);
}

export async function addDeliveryZoneAction(zone: DeliveryZone, token: string) {
  await verifyAdminAndGetUserId(token);
  const pb = await getAdminPB();
  const record = await pb.collection('delivery_zones').create({
    id: zone.id,
    name: zone.name,
    min_distance: zone.minDistance,
    max_distance: zone.maxDistance,
    price: zone.price,
    estimated_time: zone.estimatedTime,
  });
  return { ...zone, id: record.id };
}

export async function editDeliveryZoneAction(id: string, data: Partial<DeliveryZone>, token: string) {
  await verifyAdminAndGetUserId(token);
  const pb = await getAdminPB();
  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.minDistance !== undefined) updateData.min_distance = data.minDistance;
  if (data.maxDistance !== undefined) updateData.max_distance = data.maxDistance;
  if (data.price !== undefined) updateData.price = data.price;
  if (data.estimatedTime !== undefined) updateData.estimated_time = data.estimatedTime;
  if (Object.keys(updateData).length === 0) return;
  await pb.collection('delivery_zones').update(id, updateData);
}

export async function removeDeliveryZoneAction(id: string, token: string) {
  await verifyAdminAndGetUserId(token);
  const pb = await getAdminPB();
  await pb.collection('delivery_zones').delete(id);
}

function generatePassword(): string {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const all = upper + lower + digits;
  let pw = '';
  pw += upper[Math.floor(Math.random() * upper.length)];
  pw += lower[Math.floor(Math.random() * lower.length)];
  pw += digits[Math.floor(Math.random() * digits.length)];
  for (let i = 0; i < 8; i++) pw += all[Math.floor(Math.random() * all.length)];
  return pw.split('').sort(() => Math.random() - 0.5).join('');
}

export async function addUserAction(user: Omit<User, 'id'>, token: string) {
  await verifyAdminAndGetUserId(token);
  const pb = await getAdminPB();
  const roleId = await getRoleIdByName(user.role_id === 2 ? 'admin' : 'client');
  const password = generatePassword();
  const record = await pb.collection('users').create({
    name: user.name,
    email: user.email,
    phone: user.phone,
    address: user.address,
    role_id: roleId,
    password,
    passwordConfirm: password,
    status: user.status,
    total_orders: 0,
    total_spent: 0,
  });
  return { id: record.id, ...user };
}

export async function editUserAction(id: string, data: Partial<User>, token: string) {
  await verifyAdminAndGetUserId(token);
  const pb = await getAdminPB();
  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.address !== undefined) updateData.address = data.address;
  if (data.role_id !== undefined) updateData.role_id = await getRoleIdByName(data.role_id === 2 ? 'admin' : 'client');
  if (data.status !== undefined) updateData.status = data.status;
  if (Object.keys(updateData).length === 0) return;
  await pb.collection('users').update(id, updateData);
}

export async function removeUserAction(id: string, token: string) {
  await verifyAdminAndGetUserId(token);
  const pb = await getAdminPB();
  await pb.collection('users').delete(id);
}

export async function setOrderStatusAction(orderId: string, status: Order['status'], token: string) {
  await verifyAdminAndGetUserId(token);
  const pb = await getAdminPB();
  await pb.collection('orders').update(orderId, { status });
}

export async function setPaymentStatusAction(orderId: string, paymentStatus: Order['paymentStatus'], token: string) {
  await verifyAdminAndGetUserId(token);
  const pb = await getAdminPB();
  await pb.collection('orders').update(orderId, { payment_status: paymentStatus });
}

export async function addCurrencyAction(currency: Currency, token: string) {
  await verifyAdminAndGetUserId(token);
  const pb = await getAdminPB();
  const record = await pb.collection('currencies').create({
    id: currency.id,
    code: currency.code,
    name: currency.name,
    symbol: currency.symbol,
    exchange_rate: currency.exchangeRate,
    is_default: currency.isDefault || false,
    is_active: currency.isActive !== false,
  });
  return { ...currency, id: record.id };
}

export async function editCurrencyAction(id: string, data: Partial<Currency>, token: string) {
  await verifyAdminAndGetUserId(token);
  const pb = await getAdminPB();
  const updateData: any = {};
  if (data.code !== undefined) updateData.code = data.code;
  if (data.name !== undefined) updateData.name = data.name;
  if (data.symbol !== undefined) updateData.symbol = data.symbol;
  if (data.exchangeRate !== undefined) updateData.exchange_rate = data.exchangeRate;
  if (data.isDefault !== undefined) updateData.is_default = data.isDefault;
  if (data.isActive !== undefined) updateData.is_active = data.isActive;
  if (Object.keys(updateData).length === 0) return;
  await pb.collection('currencies').update(id, updateData);
}

export async function removeCurrencyAction(id: string, token: string) {
  await verifyAdminAndGetUserId(token);
  const pb = await getAdminPB();
  await pb.collection('currencies').delete(id);
}

export async function setDefaultCurrencyAction(id: string, token: string) {
  await verifyAdminAndGetUserId(token);
  const pb = await getAdminPB();
  await getAllRecords(pb, 'currencies', {
    filter: 'is_default = true',
  }).then((currencies: any) =>
    Promise.all(currencies.map((c: any) =>
      pb.collection('currencies').update(c.id, { is_default: false })
    ))
  );
  await pb.collection('currencies').update(id, { is_default: true });
}
