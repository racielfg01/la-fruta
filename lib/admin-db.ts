import { getAdminPB } from './pocketbase';
import { Product } from './store';

function mapProduct(p: any): Product {
  return {
    id: p.id,
    name: p.name,
    description: p.description || '',
    price: Number(p.price),
    unit: p.unit || '',
    image: p.image || '',
    category: p.category || '',
    origin: p.origin || '',
    inStock: p.in_stock ?? true,
    visible: p.is_visible ?? true,
  };
}

// ── Categories ──

export async function getCategories() {
  const pb = await getAdminPB();
  return pb.collection('categories').getFullList({ sort: 'name' });
}

export async function createCategory(cat: { id: string; name: string; description: string; image: string }) {
  const pb = await getAdminPB();
  await pb.collection('categories').create({
    name: cat.name,
    description: cat.description,
    image: cat.image,
  });
}

export async function updateCategory(id: string, data: { name?: string; description?: string; image?: string }) {
  const pb = await getAdminPB();
  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.image !== undefined) updateData.image = data.image;
  if (Object.keys(updateData).length === 0) return;
  await pb.collection('categories').update(id, updateData);
}

export async function deleteCategory(id: string) {
  const pb = await getAdminPB();
  await pb.collection('categories').delete(id);
}

// ── Products ──

export async function getProducts(): Promise<Product[]> {
  const pb = await getAdminPB();
  const rows = await pb.collection('products').getFullList({ sort: 'name' });
  return rows.map(mapProduct);
}

export async function createProduct(product: Product) {
  const pb = await getAdminPB();
  await pb.collection('products').create({
    name: product.name,
    description: product.description,
    price: product.price,
    unit: product.unit,
    image: product.image,
    category: product.category,
    origin: product.origin,
    in_stock: product.inStock,
    is_visible: product.visible,
  });
}

export async function updateProduct(id: string, data: Partial<Product>) {
  const pb = await getAdminPB();
  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.price !== undefined) updateData.price = data.price;
  if (data.unit !== undefined) updateData.unit = data.unit;
  if (data.image !== undefined) updateData.image = data.image;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.origin !== undefined) updateData.origin = data.origin;
  if (data.inStock !== undefined) updateData.in_stock = data.inStock;
  if (data.visible !== undefined) updateData.is_visible = data.visible;
  if (Object.keys(updateData).length === 0) return;
  await pb.collection('products').update(id, updateData);
}

export async function deleteProduct(id: string) {
  const pb = await getAdminPB();
  await pb.collection('products').delete(id);
}

// ── Delivery Zones ──

export async function getDeliveryZones() {
  const pb = await getAdminPB();
  const rows = await pb.collection('delivery_zones').getFullList({ sort: 'min_distance' });
  return rows.map((z: any) => ({
    id: z.id,
    name: z.name,
    minDistance: Number(z.min_distance),
    maxDistance: Number(z.max_distance),
    price: Number(z.price),
    estimatedTime: z.estimated_time || '',
    active: z.active ?? true,
  }));
}

export async function createDeliveryZone(zone: any) {
  const pb = await getAdminPB();
  await pb.collection('delivery_zones').create({
    name: zone.name,
    min_distance: zone.minDistance,
    max_distance: zone.maxDistance,
    price: zone.price,
    estimated_time: zone.estimatedTime,
    active: zone.active ?? true,
  });
}

export async function updateDeliveryZone(id: string, data: any) {
  const pb = await getAdminPB();
  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.minDistance !== undefined) updateData.min_distance = data.minDistance;
  if (data.maxDistance !== undefined) updateData.max_distance = data.maxDistance;
  if (data.price !== undefined) updateData.price = data.price;
  if (data.estimatedTime !== undefined) updateData.estimated_time = data.estimatedTime;
  if (data.active !== undefined) updateData.active = data.active;
  if (Object.keys(updateData).length === 0) return;
  await pb.collection('delivery_zones').update(id, updateData);
}

export async function deleteDeliveryZone(id: string) {
  const pb = await getAdminPB();
  await pb.collection('delivery_zones').delete(id);
}

// ── Admin Users ──

export async function getAdminUsers() {
  const pb = await getAdminPB();
  const rows = await pb.collection('users').getFullList({
    sort: '-created',
  });
  return rows.map((u: any) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    address: u.address,
    role: u.role_id === 2 ? 'admin' : 'user',
    status: u.status,
    createdAt: u.created,
    totalOrders: u.total_orders || 0,
    totalSpent: Number(u.total_spent) || 0,
  }));
}

export async function createAdminUser(user: any) {
  const pb = await getAdminPB();
  const roleId = user.role === 'admin' ? 2 : 1;
  await pb.collection('users').create({
    name: user.name,
    email: user.email,
    phone: user.phone,
    address: user.address,
    role_id: roleId,
    status: user.status || 'active',
    total_orders: user.totalOrders || 0,
    total_spent: user.totalSpent || 0,
  });
}

export async function updateAdminUser(id: string, data: any) {
  const pb = await getAdminPB();
  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.address !== undefined) updateData.address = data.address;
  if (data.role !== undefined) updateData.role_id = data.role === 'admin' ? 2 : 1;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.totalOrders !== undefined) updateData.total_orders = data.totalOrders;
  if (data.totalSpent !== undefined) updateData.total_spent = data.totalSpent;
  if (Object.keys(updateData).length === 0) return;
  await pb.collection('users').update(id, updateData);
}

export async function deleteAdminUser(id: string) {
  const pb = await getAdminPB();
  await pb.collection('users').delete(id);
}

// ── Orders ──

export async function getOrders() {
  const pb = await getAdminPB();
  const rows = await pb.collection('orders').getFullList({ sort: '-created' });
  return await Promise.all(
    rows.map(async (order: any) => {
      const items = await pb.collection('order_items').getFullList({
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
        deliveryNotes: order.delivery_notes,
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

export async function updateOrderStatus(id: string, status: string) {
  const pb = await getAdminPB();
  await pb.collection('orders').update(id, { status });
}

export async function updatePaymentStatus(id: string, paymentStatus: string) {
  const pb = await getAdminPB();
  await pb.collection('orders').update(id, { payment_status: paymentStatus });
}

// ── Currencies ──

export async function getCurrencies() {
  const pb = await getAdminPB();
  const rows = await pb.collection('currencies').getFullList({ sort: '-is_default,code' });
  return rows.map((c: any) => ({
    id: c.id,
    code: c.code,
    name: c.name,
    symbol: c.symbol,
    exchangeRate: Number(c.exchange_rate),
    isDefault: c.is_default,
    isActive: c.is_active,
  }));
}

export async function createCurrency(currency: any) {
  const pb = await getAdminPB();
  await pb.collection('currencies').create({
    code: currency.code,
    name: currency.name,
    symbol: currency.symbol,
    exchange_rate: currency.exchangeRate,
    is_default: currency.isDefault || false,
    is_active: currency.isActive !== false,
  });
}

export async function updateCurrency(id: string, data: any) {
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

export async function deleteCurrency(id: string) {
  const pb = await getAdminPB();
  await pb.collection('currencies').delete(id);
}

export async function setDefaultCurrency(id: string) {
  const pb = await getAdminPB();
  const defaults = await pb.collection('currencies').getFullList({
    filter: 'is_default = true',
  });
  await Promise.all(defaults.map((c: any) =>
    pb.collection('currencies').update(c.id, { is_default: false })
  ));
  await pb.collection('currencies').update(id, { is_default: true });
}

// ── Initialisation: load all data ──

export async function getAllAdminData() {
  const [categories, products, deliveryZones, users, orders, currencies] = await Promise.all([
    getCategories(),
    getProducts(),
    getDeliveryZones(),
    getAdminUsers(),
    getOrders(),
    getCurrencies(),
  ]);
  return { categories, products, deliveryZones, users, orders, currencies };
}
