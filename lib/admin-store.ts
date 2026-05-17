import { create } from "zustand";
import { Product } from "./store";
import {
  getAdminData,
  addProductAction,
  editProductAction,
  removeProductAction,
  addCategoryAction,
  editCategoryAction,
  removeCategoryAction,
  addDeliveryZoneAction,
  editDeliveryZoneAction,
  removeDeliveryZoneAction,
  addUserAction,
  editUserAction,
  removeUserAction,
  setOrderStatusAction,
  setPaymentStatusAction,
  addCurrencyAction,
  editCurrencyAction,
  removeCurrencyAction,
  setDefaultCurrencyAction,
} from "@/app/actions/admin";

export interface Category {
  id: string;
  name: string;
  description: string;
  image: string;
}

export interface DeliveryZone {
  id: string;
  name: string;
  minDistance: number;
  maxDistance: number;
  price: number;
  estimatedTime: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  role: "admin" | "customer";
  status: "active" | "inactive" | "suspended";
  createdAt: string;
  totalOrders: number;
  totalSpent: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: "pending" | "confirmed" | "preparing" | "shipped" | "delivered" | "cancelled";
  paymentMethod: string;
  paymentStatus: "pending" | "paid" | "refunded";
  deliveryAddress: string;
  deliveryNotes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  exchangeRate: number;
  isDefault: boolean;
  isActive: boolean;
}

interface AdminStore {
  loaded: boolean;
  loading: boolean;
  products: Product[];
  categories: Category[];
  deliveryZones: DeliveryZone[];
  users: User[];
  orders: Order[];
  currencies: Currency[];

  initialize: () => Promise<void>;

  addProduct: (product: Product) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;

  addCategory: (category: Category) => Promise<void>;
  updateCategory: (id: string, category: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  addDeliveryZone: (zone: DeliveryZone) => Promise<void>;
  updateDeliveryZone: (id: string, zone: Partial<DeliveryZone>) => Promise<void>;
  deleteDeliveryZone: (id: string) => Promise<void>;

  addUser: (user: User) => Promise<void>;
  updateUser: (id: string, user: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;

  updateOrderStatus: (id: string, status: Order["status"]) => Promise<void>;
  updatePaymentStatus: (id: string, status: Order["paymentStatus"]) => Promise<void>;

  addCurrency: (currency: Currency) => Promise<void>;
  updateCurrency: (id: string, currency: Partial<Currency>) => Promise<void>;
  deleteCurrency: (id: string) => Promise<void>;
  setDefaultCurrency: (id: string) => Promise<void>;
}

export const useAdminStore = create<AdminStore>()((set, get) => ({
  loaded: false,
  loading: false,
  products: [],
  categories: [],
  deliveryZones: [],
  users: [],
  orders: [],
  currencies: [],

  initialize: async () => {
    if (get().loaded || get().loading) return;
    set({ loading: true });
    try {
      const data = await getAdminData();
      set({
        products: data.products as Product[],
        categories: data.categories as Category[],
        deliveryZones: data.deliveryZones as DeliveryZone[],
        users: data.users as User[],
        orders: data.orders as Order[],
        currencies: data.currencies as Currency[],
        loaded: true,
        loading: false,
      });
    } catch (e) {
      console.error("Failed to load admin data:", e);
      set({ loading: false });
    }
  },

  addProduct: async (product) => {
    await addProductAction(product);
    set({ products: [...get().products, product] });
  },
  updateProduct: async (id, data) => {
    await editProductAction(id, data);
    set({ products: get().products.map((p) => (p.id === id ? { ...p, ...data } : p)) });
  },
  deleteProduct: async (id) => {
    await removeProductAction(id);
    set({ products: get().products.filter((p) => p.id !== id) });
  },

  addCategory: async (category) => {
    await addCategoryAction(category);
    set({ categories: [...get().categories, category] });
  },
  updateCategory: async (id, data) => {
    await editCategoryAction(id, data);
    set({ categories: get().categories.map((c) => (c.id === id ? { ...c, ...data } : c)) });
  },
  deleteCategory: async (id) => {
    await removeCategoryAction(id);
    set({ categories: get().categories.filter((c) => c.id !== id) });
  },

  addDeliveryZone: async (zone) => {
    await addDeliveryZoneAction(zone);
    set({ deliveryZones: [...get().deliveryZones, zone] });
  },
  updateDeliveryZone: async (id, data) => {
    await editDeliveryZoneAction(id, data);
    set({ deliveryZones: get().deliveryZones.map((z) => (z.id === id ? { ...z, ...data } : z)) });
  },
  deleteDeliveryZone: async (id) => {
    await removeDeliveryZoneAction(id);
    set({ deliveryZones: get().deliveryZones.filter((z) => z.id !== id) });
  },

  addUser: async (user) => {
    await addUserAction(user);
    set({ users: [...get().users, user] });
  },
  updateUser: async (id, data) => {
    await editUserAction(id, data);
    set({ users: get().users.map((u) => (u.id === id ? { ...u, ...data } : u)) });
  },
  deleteUser: async (id) => {
    await removeUserAction(id);
    set({ users: get().users.filter((u) => u.id !== id) });
  },

  updateOrderStatus: async (id, status) => {
    await setOrderStatusAction(id, status);
    set({
      orders: get().orders.map((o) =>
        o.id === id ? { ...o, status, updatedAt: new Date().toISOString() } : o
      ),
    });
  },
  updatePaymentStatus: async (id, paymentStatus) => {
    await setPaymentStatusAction(id, paymentStatus);
    set({
      orders: get().orders.map((o) =>
        o.id === id ? { ...o, paymentStatus, updatedAt: new Date().toISOString() } : o
      ),
    });
  },

  addCurrency: async (currency) => {
    await addCurrencyAction(currency);
    set({ currencies: [...get().currencies, currency] });
  },
  updateCurrency: async (id, data) => {
    await editCurrencyAction(id, data);
    set({ currencies: get().currencies.map((c) => (c.id === id ? { ...c, ...data } : c)) });
  },
  deleteCurrency: async (id) => {
    await removeCurrencyAction(id);
    set({ currencies: get().currencies.filter((c) => c.id !== id) });
  },
  setDefaultCurrency: async (id) => {
    await setDefaultCurrencyAction(id);
    set({ currencies: get().currencies.map((c) => ({ ...c, isDefault: c.id === id })) });
  },
}));
