import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Product } from "./store";
import { products as initialProducts } from "./products";

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
  products: Product[];
  categories: Category[];
  deliveryZones: DeliveryZone[];
  users: User[];
  orders: Order[];
  currencies: Currency[];
  
  // Product actions
  addProduct: (product: Product) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  
  // Category actions
  addCategory: (category: Category) => void;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  
  // Delivery zone actions
  addDeliveryZone: (zone: DeliveryZone) => void;
  updateDeliveryZone: (id: string, zone: Partial<DeliveryZone>) => void;
  deleteDeliveryZone: (id: string) => void;

  // User actions
  addUser: (user: User) => void;
  updateUser: (id: string, user: Partial<User>) => void;
  deleteUser: (id: string) => void;

  // Order actions
  updateOrderStatus: (id: string, status: Order["status"]) => void;
  updatePaymentStatus: (id: string, status: Order["paymentStatus"]) => void;

  // Currency actions
  addCurrency: (currency: Currency) => void;
  updateCurrency: (id: string, currency: Partial<Currency>) => void;
  deleteCurrency: (id: string) => void;
  setDefaultCurrency: (id: string) => void;
}

const initialCategories: Category[] = [
  {
    id: "1",
    name: "Frutas",
    description: "Frutas frescas de temporada",
    image: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400&h=300&fit=crop",
  },
  {
    id: "2",
    name: "Cítricos",
    description: "Naranjas, limones y más",
    image: "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=400&h=300&fit=crop",
  },
  {
    id: "3",
    name: "Bayas",
    description: "Fresas, arándanos y frambuesas",
    image: "https://images.unsplash.com/photo-1425934398893-310a009a77f9?w=400&h=300&fit=crop",
  },
  {
    id: "4",
    name: "Tropicales",
    description: "Frutas exóticas tropicales",
    image: "https://images.unsplash.com/photo-1490885578174-acda8905c2c6?w=400&h=300&fit=crop",
  },
  {
    id: "5",
    name: "Melones",
    description: "Sandías, melones y más",
    image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&h=300&fit=crop",
  },
];

const initialDeliveryZones: DeliveryZone[] = [
  {
    id: "1",
    name: "Zona Centro",
    minDistance: 0,
    maxDistance: 5,
    price: 2.99,
    estimatedTime: "30-45 min",
  },
  {
    id: "2",
    name: "Zona Intermedia",
    minDistance: 5,
    maxDistance: 15,
    price: 4.99,
    estimatedTime: "45-60 min",
  },
  {
    id: "3",
    name: "Zona Extendida",
    minDistance: 15,
    maxDistance: 30,
    price: 7.99,
    estimatedTime: "60-90 min",
  },
  {
    id: "4",
    name: "Zona Remota",
    minDistance: 30,
    maxDistance: 50,
    price: 12.99,
    estimatedTime: "90-120 min",
  },
];

const initialUsers: User[] = [
  {
    id: "1",
    name: "María García",
    email: "maria@ejemplo.com",
    phone: "+34 612 345 678",
    address: "Calle Mayor 123, Madrid",
    role: "customer",
    status: "active",
    createdAt: "2024-01-15",
    totalOrders: 12,
    totalSpent: 245.80,
  },
  {
    id: "2",
    name: "Carlos López",
    email: "carlos@ejemplo.com",
    phone: "+34 623 456 789",
    address: "Avenida Principal 45, Barcelona",
    role: "customer",
    status: "active",
    createdAt: "2024-02-20",
    totalOrders: 8,
    totalSpent: 156.50,
  },
  {
    id: "3",
    name: "Ana Martínez",
    email: "ana@ejemplo.com",
    phone: "+34 634 567 890",
    address: "Plaza Central 7, Valencia",
    role: "customer",
    status: "inactive",
    createdAt: "2024-03-10",
    totalOrders: 3,
    totalSpent: 67.20,
  },
  {
    id: "4",
    name: "Admin Principal",
    email: "admin@lafruta.com",
    phone: "+34 600 000 000",
    address: "Oficina Central, Madrid",
    role: "admin",
    status: "active",
    createdAt: "2024-01-01",
    totalOrders: 0,
    totalSpent: 0,
  },
  {
    id: "5",
    name: "Pedro Sánchez",
    email: "pedro@ejemplo.com",
    phone: "+34 645 678 901",
    address: "Calle Nueva 89, Sevilla",
    role: "customer",
    status: "suspended",
    createdAt: "2024-04-05",
    totalOrders: 1,
    totalSpent: 23.50,
  },
];

const initialOrders: Order[] = [
  {
    id: "ORD-001",
    userId: "1",
    userName: "María García",
    userEmail: "maria@ejemplo.com",
    items: [
      { productId: "1", productName: "Manzanas Orgánicas", quantity: 2, price: 4.99 },
      { productId: "3", productName: "Fresas Premium", quantity: 1, price: 6.99 },
    ],
    subtotal: 16.97,
    deliveryFee: 2.99,
    total: 19.96,
    status: "delivered",
    paymentMethod: "Tarjeta de Crédito",
    paymentStatus: "paid",
    deliveryAddress: "Calle Mayor 123, Madrid",
    deliveryNotes: "Dejar en portería",
    createdAt: "2024-12-01T10:30:00",
    updatedAt: "2024-12-01T14:45:00",
  },
  {
    id: "ORD-002",
    userId: "2",
    userName: "Carlos López",
    userEmail: "carlos@ejemplo.com",
    items: [
      { productId: "5", productName: "Mangos Maduros", quantity: 3, price: 5.99 },
      { productId: "7", productName: "Sandía Sin Semillas", quantity: 1, price: 8.99 },
    ],
    subtotal: 26.96,
    deliveryFee: 4.99,
    total: 31.95,
    status: "shipped",
    paymentMethod: "PayPal",
    paymentStatus: "paid",
    deliveryAddress: "Avenida Principal 45, Barcelona",
    deliveryNotes: "",
    createdAt: "2024-12-05T15:20:00",
    updatedAt: "2024-12-06T09:00:00",
  },
  {
    id: "ORD-003",
    userId: "1",
    userName: "María García",
    userEmail: "maria@ejemplo.com",
    items: [
      { productId: "2", productName: "Naranjas Valencia", quantity: 5, price: 3.99 },
    ],
    subtotal: 19.95,
    deliveryFee: 2.99,
    total: 22.94,
    status: "preparing",
    paymentMethod: "Tarjeta de Crédito",
    paymentStatus: "paid",
    deliveryAddress: "Calle Mayor 123, Madrid",
    deliveryNotes: "Llamar antes de entregar",
    createdAt: "2024-12-07T11:00:00",
    updatedAt: "2024-12-07T11:30:00",
  },
  {
    id: "ORD-004",
    userId: "3",
    userName: "Ana Martínez",
    userEmail: "ana@ejemplo.com",
    items: [
      { productId: "4", productName: "Arándanos Frescos", quantity: 2, price: 7.99 },
      { productId: "6", productName: "Piña Tropical", quantity: 1, price: 4.99 },
    ],
    subtotal: 20.97,
    deliveryFee: 4.99,
    total: 25.96,
    status: "pending",
    paymentMethod: "Transferencia Bancaria",
    paymentStatus: "pending",
    deliveryAddress: "Plaza Central 7, Valencia",
    deliveryNotes: "",
    createdAt: "2024-12-08T09:15:00",
    updatedAt: "2024-12-08T09:15:00",
  },
  {
    id: "ORD-005",
    userId: "5",
    userName: "Pedro Sánchez",
    userEmail: "pedro@ejemplo.com",
    items: [
      { productId: "8", productName: "Melón Cantalupo", quantity: 1, price: 5.99 },
    ],
    subtotal: 5.99,
    deliveryFee: 7.99,
    total: 13.98,
    status: "cancelled",
    paymentMethod: "Tarjeta de Crédito",
    paymentStatus: "refunded",
    deliveryAddress: "Calle Nueva 89, Sevilla",
    deliveryNotes: "",
    createdAt: "2024-12-02T16:45:00",
    updatedAt: "2024-12-03T10:00:00",
  },
];

const initialCurrencies: Currency[] = [
  {
    id: "1",
    code: "EUR",
    name: "Euro",
    symbol: "€",
    exchangeRate: 1,
    isDefault: true,
    isActive: true,
  },
  {
    id: "2",
    code: "USD",
    name: "Dólar Estadounidense",
    symbol: "$",
    exchangeRate: 1.08,
    isDefault: false,
    isActive: true,
  },
  {
    id: "3",
    code: "GBP",
    name: "Libra Esterlina",
    symbol: "£",
    exchangeRate: 0.86,
    isDefault: false,
    isActive: true,
  },
  {
    id: "4",
    code: "MXN",
    name: "Peso Mexicano",
    symbol: "$",
    exchangeRate: 18.50,
    isDefault: false,
    isActive: false,
  },
  {
    id: "5",
    code: "COP",
    name: "Peso Colombiano",
    symbol: "$",
    exchangeRate: 4250,
    isDefault: false,
    isActive: false,
  },
];

export const useAdminStore = create<AdminStore>()(
  persist(
    (set, get) => ({
      products: initialProducts,
      categories: initialCategories,
      deliveryZones: initialDeliveryZones,
      users: initialUsers,
      orders: initialOrders,
      currencies: initialCurrencies,

      addProduct: (product) => {
        set({ products: [...get().products, product] });
      },
      updateProduct: (id, updatedProduct) => {
        set({
          products: get().products.map((p) =>
            p.id === id ? { ...p, ...updatedProduct } : p
          ),
        });
      },
      deleteProduct: (id) => {
        set({ products: get().products.filter((p) => p.id !== id) });
      },

      addCategory: (category) => {
        set({ categories: [...get().categories, category] });
      },
      updateCategory: (id, updatedCategory) => {
        set({
          categories: get().categories.map((c) =>
            c.id === id ? { ...c, ...updatedCategory } : c
          ),
        });
      },
      deleteCategory: (id) => {
        set({ categories: get().categories.filter((c) => c.id !== id) });
      },

      addDeliveryZone: (zone) => {
        set({ deliveryZones: [...get().deliveryZones, zone] });
      },
      updateDeliveryZone: (id, updatedZone) => {
        set({
          deliveryZones: get().deliveryZones.map((z) =>
            z.id === id ? { ...z, ...updatedZone } : z
          ),
        });
      },
      deleteDeliveryZone: (id) => {
        set({ deliveryZones: get().deliveryZones.filter((z) => z.id !== id) });
      },

      addUser: (user) => {
        set({ users: [...get().users, user] });
      },
      updateUser: (id, updatedUser) => {
        set({
          users: get().users.map((u) =>
            u.id === id ? { ...u, ...updatedUser } : u
          ),
        });
      },
      deleteUser: (id) => {
        set({ users: get().users.filter((u) => u.id !== id) });
      },

      updateOrderStatus: (id, status) => {
        set({
          orders: get().orders.map((o) =>
            o.id === id ? { ...o, status, updatedAt: new Date().toISOString() } : o
          ),
        });
      },
      updatePaymentStatus: (id, paymentStatus) => {
        set({
          orders: get().orders.map((o) =>
            o.id === id ? { ...o, paymentStatus, updatedAt: new Date().toISOString() } : o
          ),
        });
      },

      addCurrency: (currency) => {
        set({ currencies: [...get().currencies, currency] });
      },
      updateCurrency: (id, updatedCurrency) => {
        set({
          currencies: get().currencies.map((c) =>
            c.id === id ? { ...c, ...updatedCurrency } : c
          ),
        });
      },
      deleteCurrency: (id) => {
        set({ currencies: get().currencies.filter((c) => c.id !== id) });
      },
      setDefaultCurrency: (id) => {
        set({
          currencies: get().currencies.map((c) => ({
            ...c,
            isDefault: c.id === id,
          })),
        });
      },
    }),
    { name: "la-fruta-admin" }
  )
);
