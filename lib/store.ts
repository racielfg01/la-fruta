import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Unit = "por lb" | "por kg" | "c/u" | "por pinta" | "por docena";

export const UNITS: Unit[] = ["por lb", "por kg", "c/u", "por pinta", "por docena"];

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: Unit;
  image: string;
  category: string;
  origin: string;
  inStock: boolean;
  visible: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface DeliveryLocation {
  address: string;
  city?: string;
  lat: number;
  lng: number;
}

interface CartStore {
  items: CartItem[];
  deliveryLocation: DeliveryLocation | null;
  onboardingComplete: boolean;
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  setDeliveryLocation: (location: DeliveryLocation | null) => void;
  setOnboardingComplete: (complete: boolean) => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      deliveryLocation: null,
      onboardingComplete: false,
      setOnboardingComplete: (complete) => set({ onboardingComplete: complete }),
      addItem: (product) => {
        const items = get().items;
        const existingItem = items.find((item) => item.product.id === product.id);
        if (existingItem) {
          set({
            items: items.map((item) =>
              item.product.id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            ),
          });
        } else {
          set({ items: [...items, { product, quantity: 1 }] });
        }
      },
      removeItem: (productId) => {
        set({ items: get().items.filter((item) => item.product.id !== productId) });
      },
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set({
          items: get().items.map((item) =>
            item.product.id === productId ? { ...item, quantity } : item
          ),
        });
      },
      clearCart: () => set({ items: [], deliveryLocation: null }),
      setDeliveryLocation: (location) => set({ deliveryLocation: location }),
      getTotalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
      getTotalPrice: () =>
        get().items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    }),
    { name: "la-fruta-cart" }
  )
);
