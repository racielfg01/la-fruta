'use server';

import { getPB, getAllRecords } from '@/lib/pocketbase';

// ── Provinces / Municipalities ──

export async function getPublicLocations() {
  try {
    const pb = getPB();
    const [provinces, municipalities] = await Promise.all([
      getAllRecords(pb, 'provinces', { sort: 'name' }),
      getAllRecords(pb, 'municipalities', { sort: 'name', expand: 'province' }),
    ]);
    return {
      provinces: provinces.map((p: any) => ({ id: p.id, name: p.name, active: p.active !== false })),
      municipalities: municipalities.map((m: any) => ({
        id: m.id,
        name: m.name,
        active: m.active !== false,
        province: m.expand?.province?.id || m.province || '',
      })),
    };
  } catch (error) {
    console.error('Error fetching locations:', error);
    return { provinces: [], municipalities: [] };
  }
}

// ── Payment methods (public) ──

export interface PublicPaymentMethod {
  id: string;
  name: string;
  type: 'cash' | 'transfer';
  image: string;
  currency: string;
  accountNumber: string;
  accountType: string;
  owner: string;
  requiresReceipt: boolean;
  instructions: string;
  transferLimit: number;
  transferCount: number;
  active: boolean;
  sort: number;
}

export async function getPublicPaymentMethods(): Promise<PublicPaymentMethod[]> {
  try {
    const pb = getPB();
    const rows = await getAllRecords(pb, 'payment_methods', { sort: 'sort,name' });
    return rows.map((m: any) => ({
      id: m.id,
      name: m.name || '',
      type: m.type === 'transfer' ? 'transfer' : 'cash',
      image: m.image || '',
      currency: m.currency || 'USD',
      accountNumber: m.account_number || '',
      accountType: m.account_type || '',
      owner: m.owner || '',
      requiresReceipt: m.requires_receipt === true,
      instructions: m.instructions || '',
      transferLimit: Number(m.transfer_limit) || 0,
      transferCount: Number(m.transfer_count) || 0,
      active: m.active !== false,
      sort: Number(m.sort) || 0,
    }));
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return [];
  }
}

// ── Settings (public) ──

/** Zonas de envío para el checkout: la colección es de lectura pública. */
export async function getPublicDeliveryZones() {
  try {
    const pb = getPB();
    const zones = await getAllRecords(pb, 'delivery_zones', {
      sort: 'name',
    });
    return zones.map((z: any) => ({
      id: z.id,
      name: z.name || '',
      minDistance: Number(z.min_distance) || 0,
      maxDistance: Number(z.max_distance) || 0,
      price: Number(z.price),
      estimatedTime: z.estimated_time || '',
      active: z.active !== false,
      province: z.province || '',
      municipality: z.municipality || '',
    }));
  } catch (error) {
    console.error('Error fetching delivery zones:', error);
    return [];
  }
}

export async function getPublicSettings() {
  try {
    const pb = getPB();
    const recs = await getAllRecords(pb, 'settings', {});
    const s = recs[0] || {};
    return {
      storeName: s.store_name || '',
      storeDescription: s.store_description || '',
      logo: s.logo || '',
      theme: s.theme || 'system',
      font: s.font || 'poppins',
      background_color: s.background_color || '',
      primary_color: s.primary_color || '',
      accent_color: s.accent_color || '',
      success_color: s.success_color || '',
      warning_color: s.warning_color || '',
      light_background_color: s.light_background_color || '',
      light_primary_color: s.light_primary_color || '',
      light_accent_color: s.light_accent_color || '',
      light_success_color: s.light_success_color || '',
      light_warning_color: s.light_warning_color || '',
      font_family: s.font_family || '',
      priceMargin: Number(s.price_margin) || 0,
      operationalCost: Math.round(Number(s.operational_cost) || 0),
      showPaymentCash: s.payment_cash_enabled !== false,
      showPaymentTransfer: s.payment_transfer_enabled !== false,
      whatsappPhone: s.whatsapp_phone || '',
      freeShippingMin: Number(s.free_shipping_min) || 0,
      storeSchedule: s.store_schedule || 'Lunes a sábado, 8:00 AM - 6:00 PM',
      showHomeBanners: s.show_home_banners !== false,
    };
  } catch (error) {
    console.error('Error fetching settings:', error);
    return { storeName: '', storeDescription: '', logo: '', theme: 'system', font: 'poppins', background_color: '', primary_color: '', accent_color: '', success_color: '', warning_color: '', light_background_color: '', light_primary_color: '', light_accent_color: '', light_success_color: '', light_warning_color: '', font_family: '', priceMargin: 0, operationalCost: 0, showPaymentCash: true, showPaymentTransfer: true, whatsappPhone: '', freeShippingMin: 0, storeSchedule: 'Lunes a sábado, 8:00 AM - 6:00 PM', showHomeBanners: true };
  }
}
// ── Banners (portada) ──

export interface PublicBanner {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  linkType: 'none' | 'product' | 'url';
  productId: string;
  url: string;
}

/** Banners activos, en el orden que fijó el administrador. */
export async function getPublicBanners(): Promise<PublicBanner[]> {
  try {
    const pb = getPB();
    const rows = await getAllRecords(pb, 'banners', {
      filter: 'active = true',
      sort: 'sort,created',
    });
    return rows.map((b: any) => ({
      id: b.id,
      title: b.title || '',
      subtitle: b.subtitle || '',
      image: b.image || '',
      linkType:
        b.link_type === 'product' || b.link_type === 'url' ? b.link_type : 'none',
      productId: b.product_id || '',
      url: b.url || '',
    }));
  } catch (error) {
    // Colección ausente o sin permisos: la portada se queda como está.
    console.error('Error fetching banners:', error);
    return [];
  }
}
