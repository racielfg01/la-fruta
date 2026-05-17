"use server";

import { Product } from "@/lib/store";
import * as db from "@/lib/admin-db";

export type AdminData = {
  categories: any[];
  products: Product[];
  deliveryZones: any[];
  users: any[];
  orders: any[];
  currencies: any[];
};

// ── Full data fetch ──

export async function getAdminData(): Promise<AdminData> {
  return await db.getAllAdminData();
}

// ── Categories ──

export async function addCategoryAction(cat: { id: string; name: string; description: string; image: string }) {
  await db.createCategory(cat);
}

export async function editCategoryAction(id: string, data: { name?: string; description?: string; image?: string }) {
  await db.updateCategory(id, data);
}

export async function removeCategoryAction(id: string) {
  await db.deleteCategory(id);
}

// ── Products ──

export async function addProductAction(product: Product) {
  await db.createProduct(product);
}

export async function editProductAction(id: string, data: Partial<Product>) {
  await db.updateProduct(id, data);
}

export async function removeProductAction(id: string) {
  await db.deleteProduct(id);
}

// ── Delivery Zones ──

export async function addDeliveryZoneAction(zone: any) {
  await db.createDeliveryZone(zone);
}

export async function editDeliveryZoneAction(id: string, data: any) {
  await db.updateDeliveryZone(id, data);
}

export async function removeDeliveryZoneAction(id: string) {
  await db.deleteDeliveryZone(id);
}

// ── Admin Users ──

export async function addUserAction(user: any) {
  await db.createAdminUser(user);
}

export async function editUserAction(id: string, data: any) {
  await db.updateAdminUser(id, data);
}

export async function removeUserAction(id: string) {
  await db.deleteAdminUser(id);
}

// ── Orders ──

export async function setOrderStatusAction(id: string, status: any) {
  await db.updateOrderStatus(id, status);
}

export async function setPaymentStatusAction(id: string, paymentStatus: any) {
  await db.updatePaymentStatus(id, paymentStatus);
}

// ── Currencies ──

export async function addCurrencyAction(currency: any) {
  await db.createCurrency(currency);
}

export async function editCurrencyAction(id: string, data: any) {
  await db.updateCurrency(id, data);
}

export async function removeCurrencyAction(id: string) {
  await db.deleteCurrency(id);
}

export async function setDefaultCurrencyAction(id: string) {
  await db.setDefaultCurrency(id);
}
