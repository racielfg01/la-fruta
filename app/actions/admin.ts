'use server';

import { decodePocketBaseToken } from '@/lib/auth';
import { getAdminPB, getPB } from '@/lib/pocketbase';
import { Product } from '@/lib/store';
import { Category, DeliveryZone, User, Order, Currency } from '@/lib/admin-store';

async function verifyAdminAndGetUserId(token: string): Promise<string> {
  const payload = decodePocketBaseToken(token);
  if (!payload) throw new Error('No autorizado: token inválido o expirado');

  const pb = await getAdminPB();
  const user = await pb.collection('users').getOne(payload.userId, { expand: 'role_id' });
  const roleName = (user as any).expand?.role_id?.name || '';
  if (roleName !== 'admin') {
    throw new Error('Acceso denegado: se requieren privilegios de administrador');
  }
  return payload.userId;
}

async function getRoleIdByName(name: string): Promise<string> {
  const pb = await getAdminPB();
  const roles = await pb.collection('roles').getFullList({ filter: `name = "${name}"` });
  return roles[0]?.id || '';
}

async function getCategoryIdByName(name: string): Promise<string> {
  const pb = await getAdminPB();
  const cats = await pb.collection('categories').getFullList({ filter: `name = "${name}"` });
  return cats[0]?.id || '';
}

function mapProduct(p: any) {
  return {
    ...p,
    price: Number(p.price),
    inStock: p.in_stock ?? true,
    visible: p.is_visible ?? true,
    category: p.expand?.category?.name || p.category || '',
  };
}

function mapDeliveryZone(z: any) {
  return {
    ...z,
    price: Number(z.price),
    minDistance: Number(z.min_distance),
    maxDistance: Number(z.max_distance),
  };
}

function mapOrder(o: any) {
  return {
    ...o,
    subtotal: Number(o.subtotal),
    deliveryFee: Number(o.delivery_fee),
    total: Number(o.total),
  };
}

export async function getAdminData(token: string) {
  await verifyAdminAndGetUserId(token);

  const pb = await getAdminPB();

  const [products, categories, deliveryZones, users, orders, currencies] = await Promise.all([
    pb.collection('products').getFullList({ sort: 'name', expand: 'category' }),
    pb.collection('categories').getFullList({ sort: 'name' }),
    pb.collection('delivery_zones').getFullList({ sort: 'min_distance' }),
    pb.collection('users').getFullList({ sort: '-created', expand: 'role_id' }),
    pb.collection('orders').getFullList({ sort: '-created' }),
    pb.collection('currencies').getFullList({ sort: 'code' }),
  ]);

  const ordersFixed = await Promise.all(
    orders.map(async (order: any) => {
      const items = await pb.collection('order_items').getFullList({
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
      role_id: (u.expand?.role_id?.name === 'admin' ? 2 : 1),
    })),
    orders: ordersFixed,
    currencies,
  };
}

export async function addProductAction(product: Omit<Product, 'id'>, token: string) {
  await verifyAdminAndGetUserId(token);
  const pb = await getAdminPB();
  const categoryId = await getCategoryIdByName(product.category);
  const record = await pb.collection('products').create({
    name: product.name,
    description: product.description,
    price: product.price,
    unit: product.unit,
    image: product.image,
    category: categoryId,
    origin: product.origin,
    in_stock: product.inStock,
    is_visible: product.visible,
  });
  return { id: record.id, ...product };
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
  if (data.inStock !== undefined) updateData.in_stock = data.inStock;
  if (data.visible !== undefined) updateData.is_visible = data.visible;
  if (Object.keys(updateData).length === 0) return;
  await pb.collection('products').update(id, updateData);
}

export async function removeProductAction(id: string, token: string) {
  await verifyAdminAndGetUserId(token);
  const pb = await getAdminPB();
  await pb.collection('products').delete(id);
}

export async function addCategoryAction(category: Omit<Category, 'id'>, token: string) {
  await verifyAdminAndGetUserId(token);
  const pb = await getAdminPB();
  const record = await pb.collection('categories').create({
    name: category.name,
    description: category.description,
    image: category.image,
  });
  return { id: record.id, ...category };
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

export async function addDeliveryZoneAction(zone: Omit<DeliveryZone, 'id'>, token: string) {
  await verifyAdminAndGetUserId(token);
  const pb = await getAdminPB();
  const record = await pb.collection('delivery_zones').create({
    name: zone.name,
    min_distance: zone.minDistance,
    max_distance: zone.maxDistance,
    price: zone.price,
    estimated_time: zone.estimatedTime,
  });
  return { id: record.id, ...zone };
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

export async function addUserAction(user: Omit<User, 'id'>, token: string) {
  await verifyAdminAndGetUserId(token);
  const pb = await getAdminPB();
  const roleId = await getRoleIdByName(user.role_id === 2 ? 'admin' : 'user');
  const record = await pb.collection('users').create({
    name: user.name,
    email: user.email,
    phone: user.phone,
    address: user.address,
    role_id: roleId,
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
  if (data.role_id !== undefined) updateData.role_id = await getRoleIdByName(data.role_id === 2 ? 'admin' : 'user');
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

export async function addCurrencyAction(currency: Omit<Currency, 'id'>, token: string) {
  await verifyAdminAndGetUserId(token);
  const pb = await getAdminPB();
  const record = await pb.collection('currencies').create({
    code: currency.code,
    name: currency.name,
    symbol: currency.symbol,
    exchange_rate: currency.exchangeRate,
    is_default: currency.isDefault || false,
    is_active: currency.isActive !== false,
  });
  return { id: record.id, ...currency };
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
  await pb.collection('currencies').getFullList({
    filter: 'is_default = true',
  }).then((currencies: any) =>
    Promise.all(currencies.map((c: any) =>
      pb.collection('currencies').update(c.id, { is_default: false })
    ))
  );
  await pb.collection('currencies').update(id, { is_default: true });
}
