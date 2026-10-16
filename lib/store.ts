import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Unit = "por lb" | "por kg" | "c/u" | "por pinta" | "por docena";

export const UNITS: Unit[] = ["por lb", "por kg", "c/u", "por pinta", "por docena"];

export interface ProductLocation {
  id: string;
  province: string;
  municipality?: string;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: Unit;
  image: string;
  category: string;
  origin: string;
  stock: number;
  inStock: boolean;
  visible: boolean;
  availableMunicipalities?: string[];
  productLocations?: ProductLocation[];
}

export interface UserLocation {
  province: string;
  municipality: string;
  provinceName?: string;
  municipalityName?: string;
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

// Stock disponible del producto en la ubicación actual del cliente.
// Sin stock por ubicación configurado, cae al stock global del producto. Con
// ubicaciones configuradas pero sin cubrir la del cliente, no hay stock (0).
export function availableStock(
  loc: UserLocation | null,
  product: Product
): number {
  const locs = product.productLocations;
  if (!locs?.length) return product.stock ?? 0;
  // Sin ubicación conocida no podemos confirmar la zona: usamos el stock global.
  if (!loc) return product.stock ?? 0;
  const mun = locs.find((l) => l.municipality && l.municipality === loc.municipality);
  if (mun) return mun.stock;
  const prov = locs.find((l) => !l.municipality && l.province === loc.province);
  if (prov) return prov.stock;
  // El producto se entrega en otras zonas: agotado aquí.
  return 0;
}

interface CartStore {
  items: CartItem[];
  deliveryLocation: DeliveryLocation | null;
  onboardingComplete: boolean;
  userLocation: UserLocation | null;
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  setDeliveryLocation: (location: DeliveryLocation | null) => void;
  setOnboardingComplete: (complete: boolean) => void;
  setUserLocation: (location: UserLocation | null) => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      deliveryLocation: null,
      onboardingComplete: false,
      userLocation: null,
      setOnboardingComplete: (complete) => set({ onboardingComplete: complete }),
      addItem: (product) => {
        const available = availableStock(get().userLocation, product);
        if (available <= 0) return;
        const items = get().items;
        const existingItem = items.find((item) => item.product.id === product.id);
        if (existingItem) {
          // Tope de stock: nunca superar el stock disponible
          if (existingItem.quantity >= available) return;
          set({
            items: items.map((item) =>
              item.product.id === product.id
                ? { ...item, quantity: Math.min(item.quantity + 1, available) }
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
        const { userLocation } = get();
        set({
          items: get()
            .items.map((item) => {
              if (item.product.id !== productId) return item;
              const available = availableStock(userLocation, item.product);
              if (available <= 0) return null;
              return { ...item, quantity: Math.min(quantity, available) };
            })
            .filter((item): item is CartItem => item !== null),
        });
      },
      clearCart: () => set({ items: [], deliveryLocation: null }),
      setDeliveryLocation: (location) => set({ deliveryLocation: location }),
      setUserLocation: (location) => {
        set({ userLocation: location });
        if (!location) {
          set({ deliveryLocation: null });
        }
      },
      getTotalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
      getTotalPrice: () =>
        get().items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    }),
    { name: "la-fruta-cart" }
  )
);
