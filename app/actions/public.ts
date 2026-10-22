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

// ── Bank transfer data (public) ──

export async function getPublicTransferData() {
  try {
    const pb = getPB();
    const [banks, accounts] = await Promise.all([
      getAllRecords(pb, 'banks', { filter: 'active = true', sort: 'name' }),
      getAllRecords(pb, 'bank_accounts', { expand: 'bank' }),
    ]);
    const activeBankIds = new Set(banks.map((b: any) => b.id));
    const usable = accounts
      .filter((a: any) => a.active !== false && activeBankIds.has(a.bank))
      .map((a: any) => ({
        id: a.id,
        bank: a.expand?.bank?.name || '',
        accountNumber: a.account_number || '',
        accountType: a.account_type || '',
        owner: a.owner || '',
        ci: a.ci || '',
        currency: a.currency || 'CUP',
        transferLimit: Number(a.transfer_limit) || 0,
        transferCount: Number(a.transfer_count) || 0,
      }));
    return {
      banks: banks.map((b: any) => ({ id: b.id, name: b.name })),
      accounts: usable,
    };
  } catch (error) {
    console.error('Error fetching transfer data:', error);
    return { banks: [], accounts: [] };
  }
}

// ── Settings (public) ──

/** Zonas de envío para el checkout: la colección es de lectura pública. */
export async function getPublicDeliveryZones() {
  try {
    const pb = getPB();
    const zones = await getAllRecords(pb, 'delivery_zones', {
      sort: 'min_distance',
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
    };
  } catch (error) {
    console.error('Error fetching settings:', error);
    return { storeName: '', storeDescription: '', logo: '', theme: 'system', font: 'poppins', background_color: '', primary_color: '', accent_color: '', success_color: '', warning_color: '', light_background_color: '', light_primary_color: '', light_accent_color: '', light_success_color: '', light_warning_color: '', font_family: '', priceMargin: 0, operationalCost: 0 };
  }
}