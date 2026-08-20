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
      provinces: provinces.map((p: any) => ({ id: p.id, name: p.name })),
      municipalities: municipalities.map((m: any) => ({
        id: m.id,
        name: m.name,
        province: m.expand?.province?.id || m.province || '',
      })),
    };
  } catch (error) {
    console.error('Error fetching locations:', error);
    return { provinces: [], municipalities: [] };
  }
}

// ── Countries (currency mapping by phone code) ──

export async function getPublicCountries() {
  try {
    const pb = getPB();
    const rows = await getAllRecords(pb, 'countries', { sort: 'name' });
    return rows.map((c: any) => ({
      id: c.id,
      name: c.name,
      code: c.code || '',
      phoneCode: String(c.phone_code || ''),
      currencyCode: c.currency_code || '',
    }));
  } catch (error) {
    console.error('Error fetching countries:', error);
    return [];
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
    };
  } catch (error) {
    console.error('Error fetching settings:', error);
    return { storeName: '', storeDescription: '', logo: '', theme: 'system', font: 'poppins' };
  }
}