'use server';

import { decodePocketBaseToken } from '@/lib/auth';
import { getAdminPB, getTokenPB, getAllRecords, sanitize } from '@/lib/pocketbase';
import type PocketBase from 'pocketbase';

async function getDataPB(token: string): Promise<PocketBase> {
  try {
    return await getAdminPB();
  } catch {
    return getTokenPB(token);
  }
}

async function verifyAdminAndGetUserId(token: string): Promise<string> {
  const payload = decodePocketBaseToken(token);
  if (!payload) throw new Error('No autorizado: token inválido o expirado');
  const pb = getTokenPB(token);
  const user = await pb.collection('users').getOne(payload.userId, { expand: 'role_id' });
  const roles = await getAllRecords(pb, 'roles');
  const adminRole = roles.find((r: any) => r.name === 'admin');
  const isAdmin = adminRole
    ? user.role_id === adminRole.id
    : user.expand?.role_id?.name === 'admin';
  if (!isAdmin) throw new Error('Acceso denegado: se requieren privilegios de administrador');
  return payload.userId;
}

// ── Provinces ──

export async function getProvincesAction(token: string) {
  await verifyAdminAndGetUserId(token);
  const pb = await getDataPB(token);
  const rows = await getAllRecords(pb, 'provinces', { sort: 'name' });
  return rows.map((p: any) => ({ id: p.id, name: p.name, active: p.active !== false }));
}

export async function createProvinceAction(name: string, token: string) {
  if (!name?.trim()) throw new Error('El nombre de la provincia es requerido');
  await verifyAdminAndGetUserId(token);
  const pb = await getDataPB(token);
  const rec = await pb.collection('provinces').create({ name: name.trim(), active: true });
  return { id: rec.id, name: rec.name, active: true };
}

export async function updateProvinceAction(id: string, name: string, token: string) {
  if (!id) throw new Error('ID de provincia requerido');
  if (!name?.trim()) throw new Error('El nombre de la provincia es requerido');
  await verifyAdminAndGetUserId(token);
  const pb = await getDataPB(token);
  return pb.collection('provinces').update(id, { name: name.trim() });
}

export async function toggleProvinceAction(id: string, active: boolean, token: string) {
  if (!id) throw new Error('ID de provincia requerido');
  await verifyAdminAndGetUserId(token);
  const pb = await getDataPB(token);
  await pb.collection('provinces').update(id, { active });
  const muns = await getAllRecords(pb, 'municipalities', { filter: `province = "${sanitize(id)}"` });
  await Promise.all(muns.map((m: any) => pb.collection('municipalities').update(m.id, { active })));
}

export async function deleteProvinceAction(id: string, token: string) {
  if (!id) throw new Error('ID de provincia requerido');
  await verifyAdminAndGetUserId(token);
  const pb = await getDataPB(token);
  return pb.collection('provinces').delete(id);
}

// ── Municipalities ──

export async function getMunicipalitiesAction(token: string) {
  await verifyAdminAndGetUserId(token);
  const pb = await getDataPB(token);
  const rows = await getAllRecords(pb, 'municipalities', { sort: 'name', expand: 'province' });
  return rows.map((m: any) => ({
    id: m.id,
    name: m.name,
    province: m.expand?.province?.id || m.province || '',
    active: m.active !== false,
  }));
}

export async function createMunicipalityAction(data: { name: string; province: string }, token: string) {
  if (!data.name?.trim()) throw new Error('El nombre del municipio es requerido');
  await verifyAdminAndGetUserId(token);
  const pb = await getDataPB(token);
  const rec = await pb.collection('municipalities').create({ name: data.name.trim(), province: data.province || '', active: true });
  return { id: rec.id, name: rec.name, province: data.province, active: true };
}

export async function updateMunicipalityAction(id: string, data: { name: string; province: string }, token: string) {
  if (!id) throw new Error('ID de municipio requerido');
  if (!data.name?.trim()) throw new Error('El nombre del municipio es requerido');
  await verifyAdminAndGetUserId(token);
  const pb = await getDataPB(token);
  return pb.collection('municipalities').update(id, { name: data.name.trim(), province: data.province || '' });
}

export async function toggleMunicipalityAction(id: string, active: boolean, token: string) {
  if (!id) throw new Error('ID de municipio requerido');
  await verifyAdminAndGetUserId(token);
  const pb = await getDataPB(token);
  return pb.collection('municipalities').update(id, { active });
}

export async function deleteMunicipalityAction(id: string, token: string) {
  if (!id) throw new Error('ID de municipio requerido');
  await verifyAdminAndGetUserId(token);
  const pb = await getDataPB(token);
  return pb.collection('municipalities').delete(id);
}

// ── Countries ──

export async function getCountriesAction(token: string) {
  await verifyAdminAndGetUserId(token);
  const pb = await getDataPB(token);
  const rows = await getAllRecords(pb, 'countries', { sort: 'name' });
  return rows.map((c: any) => ({
    id: c.id,
    name: c.name,
    emoji: c.emoji || '',
    active: c.active !== false,
  }));
}

export async function createCountryAction(data: { name: string; emoji?: string; active?: boolean }, token: string) {
  await verifyAdminAndGetUserId(token);
  const pb = await getDataPB(token);
  const rec = await pb.collection('countries').create({
    name: data.name,
    emoji: data.emoji || '',
    active: data.active !== false,
  });
  return { id: rec.id, name: rec.name, emoji: rec.emoji || '', active: rec.active !== false };
}

export async function updateCountryAction(id: string, data: { name?: string; emoji?: string; active?: boolean }, token: string) {
  await verifyAdminAndGetUserId(token);
  const pb = await getDataPB(token);
  return pb.collection('countries').update(id, data);
}

export async function deleteCountryAction(id: string, token: string) {
  await verifyAdminAndGetUserId(token);
  const pb = await getDataPB(token);
  return pb.collection('countries').delete(id);
}

// ── Units (unidades de venta de los productos) ──

export interface UnitRow {
  id: string;
  name: string;
  active: boolean;
  productsCount: number;
}

export async function getUnitsAction(token: string): Promise<UnitRow[]> {
  await verifyAdminAndGetUserId(token);
  const pb = await getDataPB(token);
  const rows = await getAllRecords(pb, 'units', { sort: 'name' });
  const products = await pb.collection('products').getFullList<{ unit?: string }>({ fields: 'unit' });
  const counts = new Map<string, number>();
  for (const p of products) {
    const unit = (p.unit || '').trim();
    if (!unit) continue;
    counts.set(unit, (counts.get(unit) || 0) + 1);
  }
  return rows.map((u: any) => ({
    id: u.id,
    name: u.name,
    active: u.active !== false,
    productsCount: counts.get(u.name) || 0,
  }));
}

export async function createUnitAction(data: { name: string; active?: boolean }, token: string) {
  await verifyAdminAndGetUserId(token);
  const pb = await getDataPB(token);
  const name = (data.name || '').trim();
  if (!name) throw new Error('El nombre de la unidad es obligatorio');
  const dup = await getAllRecords(pb, 'units', { filter: `name = "${sanitize(name)}"` });
  if (dup.length > 0) throw new Error('Ya existe una unidad con ese nombre');
  const rec = await pb.collection('units').create({ name, active: data.active !== false });
  return { id: rec.id, name: rec.name, active: rec.active !== false, productsCount: 0 };
}

export async function updateUnitAction(
  id: string,
  data: { name?: string; active?: boolean },
  token: string
) {
  await verifyAdminAndGetUserId(token);
  const pb = await getDataPB(token);
  const before = await getAllRecords(pb, 'units', { filter: `id = "${sanitize(id)}"` });
  if (before.length === 0) throw new Error('Unidad no encontrada');
  const previous = before[0];
  const payload: Record<string, unknown> = {};
  const name = data.name?.trim();
  if (name) {
    if (name !== previous.name) {
      const dup = await getAllRecords(pb, 'units', { filter: `name = "${sanitize(name)}"` });
      if (dup.length > 0) throw new Error('Ya existe una unidad con ese nombre');
      payload.name = name;
    }
  }
  if (data.active !== undefined) payload.active = data.active;
  const rec = await pb.collection('units').update(id, payload);
  // Si se renombró, los productos que usaban el nombre anterior pasan al nuevo:
  // si no, quedarían con una unidad que ya no existe en la lista.
  if (payload.name) {
    const products = await pb.collection('products').getFullList({
      filter: `unit = "${sanitize(previous.name)}"`,
    });
    for (const product of products) {
      await pb.collection('products').update(product.id, { unit: payload.name });
    }
  }
  return { id: rec.id, name: rec.name, active: rec.active !== false };
}

export async function deleteUnitAction(id: string, token: string) {
  await verifyAdminAndGetUserId(token);
  const pb = await getDataPB(token);
  return pb.collection('units').delete(id);
}

// ── Roles ──

export async function getRolesAction(token: string) {
  await verifyAdminAndGetUserId(token);
  const pb = await getDataPB(token);
  return getAllRecords(pb, 'roles', { sort: 'name' });
}

export async function createRoleAction(data: { name: string; description?: string; permissions?: import("@/lib/permissions").RolePermissions }, token: string) {
  await verifyAdminAndGetUserId(token);
  const pb = await getDataPB(token);
  const rec = await pb.collection('roles').create({
    name: data.name,
    description: data.description || '',
    permissions: data.permissions ? JSON.stringify(data.permissions) : '',
  });
  return rec;
}

export async function updateRoleAction(id: string, data: { name: string; description?: string; permissions?: import("@/lib/permissions").RolePermissions }, token: string) {
  await verifyAdminAndGetUserId(token);
  const pb = await getDataPB(token);
  return pb.collection('roles').update(id, {
    name: data.name,
    description: data.description || '',
    permissions: data.permissions ? JSON.stringify(data.permissions) : '',
  });
}

export async function deleteRoleAction(id: string, token: string) {
  await verifyAdminAndGetUserId(token);
  const pb = await getDataPB(token);
  return pb.collection('roles').delete(id);
}

// ── Banks ──

export async function getBanksAction(token: string) {
  await verifyAdminAndGetUserId(token);
  const pb = await getDataPB(token);
  const rows = await getAllRecords(pb, 'banks', { sort: 'name' });
  return rows.map((b: any) => ({
    id: b.id,
    name: b.name,
    logo: b.logo || '',
    country: b.country || '',
    currency: b.currency || '',
    active: b.active !== false,
  }));
}

export async function createBankAction(data: { name: string; logo?: string; country?: string; currency?: string }, token: string) {
  await verifyAdminAndGetUserId(token);
  const pb = await getDataPB(token);
  const rec = await pb.collection('banks').create({
    name: data.name,
    logo: data.logo || '',
    country: data.country || '',
    currency: data.currency || '',
    active: true,
  });
  return { id: rec.id, name: rec.name, logo: rec.logo || '', country: rec.country || '', currency: rec.currency || '', active: true };
}

export async function updateBankAction(id: string, data: { name?: string; logo?: string; country?: string; currency?: string; active?: boolean }, token: string) {
  await verifyAdminAndGetUserId(token);
  const pb = await getDataPB(token);
  return pb.collection('banks').update(id, data);
}

export async function deleteBankAction(id: string, token: string) {
  await verifyAdminAndGetUserId(token);
  const pb = await getDataPB(token);
  return pb.collection('banks').delete(id);
}

// ── Bank accounts ──

export async function getBankAccountsAction(token: string) {
  await verifyAdminAndGetUserId(token);
  const pb = await getDataPB(token);
  let rows: any[];
  try {
    rows = await getAllRecords(pb, 'bank_accounts', { sort: '-active,name', expand: 'bank' });
  } catch {
    rows = await getAllRecords(pb, 'bank_accounts', { sort: '-active,name' });
  }
  return rows.map((a: any) => ({
    id: a.id,
    bank: a.expand?.bank?.name || a.bank || '',
    accountNumber: a.account_number || '',
    accountType: a.account_type || '',
    owner: a.owner || '',
    ci: a.ci || '',
    currency: a.currency || 'CUP',
    active: a.active !== false,
    transferLimit: Number(a.transfer_limit) || 0,
    transferCount: Number(a.transfer_count) || 0,
  }));
}

export async function createBankAccountAction(data: any, token: string) {
  await verifyAdminAndGetUserId(token);
  const pb = await getDataPB(token);
  const bankId = await getBankIdByName(data.bank, token);
  const rec = await pb.collection('bank_accounts').create({
    bank: bankId,
    account_number: data.accountNumber,
    account_type: data.accountType,
    owner: data.owner,
    ci: data.ci,
    currency: data.currency,
    active: data.active !== false,
    transfer_limit: data.transferLimit || 0,
    transfer_count: data.transferCount || 0,
  });
  return { id: rec.id, ...data };
}

export async function updateBankAccountAction(id: string, data: any, token: string) {
  await verifyAdminAndGetUserId(token);
  const pb = await getDataPB(token);
  const updateData: any = {};
  if (data.bank !== undefined) updateData.bank = await getBankIdByName(data.bank, token);
  if (data.accountNumber !== undefined) updateData.account_number = data.accountNumber;
  if (data.accountType !== undefined) updateData.account_type = data.accountType;
  if (data.owner !== undefined) updateData.owner = data.owner;
  if (data.ci !== undefined) updateData.ci = data.ci;
  if (data.currency !== undefined) updateData.currency = data.currency;
  if (data.active !== undefined) updateData.active = data.active;
  if (data.transferLimit !== undefined) updateData.transfer_limit = data.transferLimit;
  if (data.transferCount !== undefined) updateData.transfer_count = data.transferCount;
  await pb.collection('bank_accounts').update(id, updateData);
}

export async function deleteBankAccountAction(id: string, token: string) {
  await verifyAdminAndGetUserId(token);
  const pb = await getDataPB(token);
  return pb.collection('bank_accounts').delete(id);
}

async function getBankIdByName(bankName: string, token: string): Promise<string> {
  if (!bankName) return '';
  const pb = await getDataPB(token);
  const banks = await getAllRecords(pb, 'banks', { filter: `name = "${sanitize(bankName)}"` });
  return banks[0]?.id || '';
}

// ── Settings ──

const EMPTY_SETTINGS = {
  storeName: '',
  storeDescription: '',
  logo: '',
  theme: 'system',
  font: 'poppins',
  background_color: '#0D1b2a',
  primary_color: '#1e3a8a',
  accent_color: '#0ea5a5',
  success_color: '#22c55e',
  warning_color: '#Facc15',
  light_background_color: '#f4f7fb',
  light_primary_color: '#1e3a8a',
  light_accent_color: '#0ea5a5',
  light_success_color: '#16a34a',
  light_warning_color: '#d97706',
  font_family: 'Manrope, sans-serif',
  priceMargin: 0,
  operationalCost: 0,
  showPaymentCash: true,
  showPaymentTransfer: true,
};

export async function getSettingsAction(token: string) {
  await verifyAdminAndGetUserId(token);
  const pb = await getDataPB(token);
  const recs = await getAllRecords(pb, 'settings', {});
  const s = recs[0] || {};
  return {
    storeName: s.store_name || '',
    storeDescription: s.store_description || '',
    logo: s.logo || '',
    theme: s.theme || 'system',
    font: s.font || 'poppins',
    background_color: s.background_color || EMPTY_SETTINGS.background_color,
    primary_color: s.primary_color || EMPTY_SETTINGS.primary_color,
    accent_color: s.accent_color || EMPTY_SETTINGS.accent_color,
    success_color: s.success_color || EMPTY_SETTINGS.success_color,
    warning_color: s.warning_color || EMPTY_SETTINGS.warning_color,
    light_background_color: s.light_background_color || EMPTY_SETTINGS.light_background_color,
    light_primary_color: s.light_primary_color || EMPTY_SETTINGS.light_primary_color,
    light_accent_color: s.light_accent_color || EMPTY_SETTINGS.light_accent_color,
    light_success_color: s.light_success_color || EMPTY_SETTINGS.light_success_color,
    light_warning_color: s.light_warning_color || EMPTY_SETTINGS.light_warning_color,
    font_family: s.font_family || EMPTY_SETTINGS.font_family,
    priceMargin: Number(s.price_margin) || 0,
    operationalCost: Math.round(Number(s.operational_cost) || 0),
    showPaymentCash: s.payment_cash_enabled !== false,
    showPaymentTransfer: s.payment_transfer_enabled !== false,
  };
}

export async function updateSettingsAction(data: Partial<typeof EMPTY_SETTINGS>, token: string) {
  await verifyAdminAndGetUserId(token);
  const pb = await getDataPB(token);
  const recs = await getAllRecords(pb, 'settings', {});
  const body: any = {
    store_name: data.storeName,
    store_description: data.storeDescription,
    logo: data.logo,
    theme: data.theme,
    font: data.font,
    background_color: data.background_color,
    primary_color: data.primary_color,
    accent_color: data.accent_color,
    success_color: data.success_color,
    warning_color: data.warning_color,
    light_background_color: data.light_background_color,
    light_primary_color: data.light_primary_color,
    light_accent_color: data.light_accent_color,
    light_success_color: data.light_success_color,
    light_warning_color: data.light_warning_color,
    font_family: data.font_family,
  };
  // El margen solo se toca si el llamador lo envía (evita borrarlo al
  // guardar desde otra pestaña que no lo incluye).
  if (data.priceMargin !== undefined) {
    body.price_margin = Number(data.priceMargin) || 0;
  }
  if (data.operationalCost !== undefined) {
    body.operational_cost = Math.max(0, Math.round(Number(data.operationalCost) || 0));
  }
  // Métodos de pago: solo si el llamador los envía.
  if (data.showPaymentCash !== undefined) {
    body.payment_cash_enabled = data.showPaymentCash === true;
  }
  if (data.showPaymentTransfer !== undefined) {
    body.payment_transfer_enabled = data.showPaymentTransfer === true;
  }
  if (recs[0]) {
    return pb.collection('settings').update(recs[0].id, body);
  }
  return pb.collection('settings').create(body);
}