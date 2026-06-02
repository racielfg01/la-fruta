// lib/admin-store.ts
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
import { useAuthStore } from "./auth-context";

// Tipos (coinciden con la base de datos real)
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
  active: boolean; 
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  status: "active" | "inactive" | "suspended";
  created_at: string;
  total_orders: number;
  total_spent: number;
  role_id: number;
  gender?: string | null;
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

  addCurrency: (currency: Currency) => Promise<Currency | undefined>;
  updateCurrency: (id: string, currency: Partial<Currency>) => Promise<void>;
  deleteCurrency: (id: string) => Promise<void>;
  setDefaultCurrency: (id: string) => Promise<void>;
}

// Helper para obtener el token actual (fuera del store para evitar ciclos)
const getAuthToken = () => {
  const token = useAuthStore.getState().token;
  if (!token) throw new Error("No hay token de autenticación. Inicia sesión nuevamente.");
  return token;
};

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
};

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
      const token = getAuthToken();
      // const data = await getAdminData(token);
const data = await withTimeout(getAdminData(token), 15000);
      set({
        products: data.products as Product[],
        categories: data.categories as unknown as Category[],
        deliveryZones: data.deliveryZones as DeliveryZone[],
        users: data.users as User[],
        orders: data.orders as Order[],
        currencies: data.currencies as unknown as Currency[],
        loaded: true,
        loading: false,
      });
    } catch (error) {
      console.error("Failed to load admin data:", error);
      set({ loading: false });
      // Si el error es por token inválido, cerrar sesión y redirigir
      if (error instanceof Error && error.message.includes("autenticación")) {
        useAuthStore.getState().logout();
        window.location.href = "/auth/login";
      }
    }
  },

  addProduct: async (product) => {
    const token = getAuthToken();
    const created = await addProductAction(product, token);
    set({ products: [...get().products, created as Product] });
  },
  updateProduct: async (id, data) => {
    const token = getAuthToken();
    await editProductAction(id, data, token);
    set({ products: get().products.map((p) => (p.id === id ? { ...p, ...data } : p)) });
  },
  deleteProduct: async (id) => {
    const token = getAuthToken();
    await removeProductAction(id, token);
    set({ products: get().products.filter((p) => p.id !== id) });
  },

  addCategory: async (category) => {
    const token = getAuthToken();
    const created = await addCategoryAction(category, token);
    set({ categories: [...get().categories, created as Category] });
  },
  updateCategory: async (id, data) => {
    const token = getAuthToken();
    await editCategoryAction(id, data, token);
    set({ categories: get().categories.map((c) => (c.id === id ? { ...c, ...data } : c)) });
  },
  deleteCategory: async (id) => {
    const token = getAuthToken();
    await removeCategoryAction(id, token);
    set({ categories: get().categories.filter((c) => c.id !== id) });
  },

  addDeliveryZone: async (zone) => {
    const token = getAuthToken();
    const created = await addDeliveryZoneAction(zone, token);
    set({ deliveryZones: [...get().deliveryZones, created as DeliveryZone] });
  },
  updateDeliveryZone: async (id, data) => {
    const token = getAuthToken();
    await editDeliveryZoneAction(id, data, token);
    set({ deliveryZones: get().deliveryZones.map((z) => (z.id === id ? { ...z, ...data } : z)) });
  },
  deleteDeliveryZone: async (id) => {
    const token = getAuthToken();
    await removeDeliveryZoneAction(id, token);
    set({ deliveryZones: get().deliveryZones.filter((z) => z.id !== id) });
  },

  addUser: async (user) => {
    const token = getAuthToken();
    await addUserAction(user, token);
    set({ users: [...get().users, user] });
  },
  updateUser: async (id, data) => {
    const token = getAuthToken();
    await editUserAction(id, data, token);
    set({ users: get().users.map((u) => (u.id === id ? { ...u, ...data } : u)) });
  },
  deleteUser: async (id) => {
    const token = getAuthToken();
    await removeUserAction(id, token);
    set({ users: get().users.filter((u) => u.id !== id) });
  },

  updateOrderStatus: async (id, status) => {
    const token = getAuthToken();
    await setOrderStatusAction(id, status, token);
    set({
      orders: get().orders.map((o) =>
        o.id === id ? { ...o, status, updatedAt: new Date().toISOString() } : o
      ),
    });
  },
  updatePaymentStatus: async (id, paymentStatus) => {
    const token = getAuthToken();
    await setPaymentStatusAction(id, paymentStatus, token);
    set({
      orders: get().orders.map((o) =>
        o.id === id ? { ...o, paymentStatus, updatedAt: new Date().toISOString() } : o
      ),
    });
  },

  addCurrency: async (currency) => {
    const token = getAuthToken();
    const created = await addCurrencyAction(currency, token);
    set({ currencies: [...get().currencies, created as Currency] });
    return created;
  },
  updateCurrency: async (id, data) => {
    const token = getAuthToken();
    await editCurrencyAction(id, data, token);
    set({ currencies: get().currencies.map((c) => (c.id === id ? { ...c, ...data } : c)) });
  },
  deleteCurrency: async (id) => {
    const token = getAuthToken();
    await removeCurrencyAction(id, token);
    set({ currencies: get().currencies.filter((c) => c.id !== id) });
  },
  setDefaultCurrency: async (id) => {
    const token = getAuthToken();
    await setDefaultCurrencyAction(id, token);
    set({ currencies: get().currencies.map((c) => ({ ...c, isDefault: c.id === id })) });
  },
}));