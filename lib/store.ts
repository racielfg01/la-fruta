import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { OfferType, PublicOffer } from "./offers";

/**
 * Unidad de venta del producto. Es texto libre porque la lista se administra
 * en Configuración → Unidades (colección `units`); estas son las unidades
 * que se siembran por defecto y el respaldo si la lista está vacía.
 */
export type Unit = string;

export const DEFAULT_UNITS: Unit[] = ["por lb", "por kg", "c/u", "por pinta", "por docena"];

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
  /** Margen de ganancia opcional (%); null/undefined = usa el global. */
  priceMargin?: number | null;
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
  /**
   * Presente cuando la línea viene de una oferta. `product` es sintético
   * (id `offer_<idOferta>`) y su `price` ya es el precio FINAL de la oferta,
   * sin margen de ganancia.
   */
  offer?: CartOffer;
}

/** Tope de unidades por línea de oferta: no hay stock que la respalde. */
export const MAX_OFFER_QUANTITY = 99;

/** Snapshot de la oferta guardado en la línea del carrito. */
export interface CartOffer {
  id: string;
  type: OfferType;
  /** Producto real (rebaja) o "" (combo). */
  productId: string;
  /** Fecha de vencimiento ISO. */
  endDate: string;
  /** Precio final por unidad en CUP. */
  price: number;
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
  favorites: Product[];
  deliveryLocation: DeliveryLocation | null;
  onboardingComplete: boolean;
  userLocation: UserLocation | null;
  addItem: (product: Product) => void;
  addOfferItem: (offer: PublicOffer) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  setDeliveryLocation: (location: DeliveryLocation | null) => void;
  setOnboardingComplete: (complete: boolean) => void;
  setUserLocation: (location: UserLocation | null) => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  toggleFavorite: (product: Product) => void;
  removeFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
  getFavorites: () => Product[];
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      favorites: [],
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
      addOfferItem: (offer) => {
        const items = get().items;
        // Línea propia por oferta: una rebaja no se mezcla con el producto a
        // precio normal (el precio final de la oferta manda).
        const lineId = `offer_${offer.id}`;
        const existing = items.find((item) => item.product.id === lineId);
        if (existing) {
          if (existing.quantity >= MAX_OFFER_QUANTITY) return;
          set({
            items: items.map((item) =>
              item.product.id === lineId
                ? { ...item, quantity: item.quantity + 1 }
                : item
            ),
          });
          return;
        }
        const synthetic: Product = {
          id: lineId,
          name: offer.name,
          description: offer.description,
          price: offer.price,
          unit: "c/u",
          image: offer.image,
          category: "Ofertas",
          origin: "",
          stock: 0,
          inStock: true,
          visible: true,
        };
        set({
          items: [
            ...items,
            {
              product: synthetic,
              quantity: 1,
              offer: {
                id: offer.id,
                type: offer.type,
                productId: offer.productId,
                endDate: offer.endDate,
                price: offer.price,
              },
            },
          ],
        });
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
              // Las líneas de oferta no dependen del stock del producto
              // sintético: el tope es MAX_OFFER_QUANTITY.
              if (item.offer) {
                return { ...item, quantity: Math.min(quantity, MAX_OFFER_QUANTITY) };
              }
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
      toggleFavorite: (product) => {
        const favorites = get().favorites;
        const exists = favorites.some((item) => item.id === product.id);
        if (exists) {
          set({ favorites: favorites.filter((item) => item.id !== product.id) });
        } else {
          set({ favorites: [...favorites, product] });
        }
      },
      removeFavorite: (productId) => {
        set({ favorites: get().favorites.filter((item) => item.id !== productId) });
      },
      isFavorite: (productId) => get().favorites.some((item) => item.id === productId),
      getFavorites: () => get().favorites,
    }),
    { name: "la-fruta-cart" }
  )
);
