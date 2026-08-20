'use server';

import { decodePocketBaseToken } from '@/lib/auth';
import { getAdminPB, getTokenPB, getAllRecords } from '@/lib/pocketbase';
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
  return rows.map((p: any) => ({ id: p.id, name: p.name }));
}

export async function createProvinceAction(name: string, token: string) {
  await verifyAdminAndGetUserId(token);
  const pb = await getDataPB(token);
  const rec = await pb.collection('provinces').create({ name });
  return { id: rec.id, name: rec.name };
}

export async function updateProvinceAction(id: string, name: string, token: string) {
  await verifyAdminAndGetUserId(token);
  const pb = await getDataPB(token);
  return pb.collection('provinces').update(id, { name });
}

export async function deleteProvinceAction(id: string, token: string) {
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
    province: m.expand?.province?.name || m.province || '',
  }));
}

export async function createMunicipalityAction(data: { name: string; province: string }, token: string) {
  await verifyAdminAndGetUserId(token);
  const pb = await getDataPB(token);
  const rec = await pb.collection('municipalities').create({ name: data.name, province: data.province || '' });
  return { id: rec.id, name: rec.name, province: data.province };
}

export async function updateMunicipalityAction(id: string, data: { name: string; province: string }, token: string) {
  await verifyAdminAndGetUserId(token);
  const pb = await getDataPB(token);
  return pb.collection('municipalities').update(id, { name: data.name, province: data.province || '' });
}

export async function deleteMunicipalityAction(id: string, token: string) {
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
    code: c.code || '',
    phoneCode: c.phone_code || '',
    currencyCode: c.currency_code || '',
  }));
}

export async function createCountryAction(data: { name: string; code: string; phoneCode: string; currencyCode: string }, token: string) {
  await verifyAdminAndGetUserId(token);
  const pb = await getDataPB(token);
  const rec = await pb.collection('countries').create({
    name: data.name,
    code: data.code,
    phone_code: data.phoneCode,
    currency_code: data.currencyCode,
  });
  return { id: rec.id, ...data };
}

export async function updateCountryAction(id: string, data: { name: string; code: string; phoneCode: string; currencyCode: string }, token: string) {
  await verifyAdminAndGetUserId(token);
  const pb = await getDataPB(token);
  return pb.collection('countries').update(id, {
    name: data.name,
    code: data.code,
    phone_code: data.phoneCode,
    currency_code: data.currencyCode,
  });
}

export async function deleteCountryAction(id: string, token: string) {
  await verifyAdminAndGetUserId(token);
  const pb = await getDataPB(token);
  return pb.collection('countries').delete(id);
}

// ── Roles ──

export async function getRolesAction(token: string) {
  await verifyAdminAndGetUserId(token);
  const pb = await getDataPB(token);
  return getAllRecords(pb, 'roles', { sort: 'name' });
}

export async function createRoleAction(name: string, token: string) {
  await verifyAdminAndGetUserId(token);
  const pb = await getDataPB(token);
  const rec = await pb.collection('roles').create({ name });
  return rec;
}

export async function updateRoleAction(id: string, name: string, token: string) {
  await verifyAdminAndGetUserId(token);
  const pb = await getDataPB(token);
  return pb.collection('roles').update(id, { name });
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
  return rows.map((b: any) => ({ id: b.id, name: b.name, active: b.active !== false }));
}

export async function createBankAction(name: string, token: string) {
  await verifyAdminAndGetUserId(token);
  const pb = await getDataPB(token);
  const rec = await pb.collection('banks').create({ name, active: true });
  return { id: rec.id, name: rec.name, active: true };
}

export async function updateBankAction(id: string, data: { name?: string; active?: boolean }, token: string) {
  await verifyAdminAndGetUserId(token);
  const pb = await getDataPB(token);
  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.active !== undefined) updateData.active = data.active;
  return pb.collection('banks').update(id, updateData);
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
  const rows = await getAllRecords(pb, 'bank_accounts', { sort: '-active,name', expand: 'bank' });
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
  const banks = await getAllRecords(pb, 'banks', { filter: `name = "${bankName}"` });
  return banks[0]?.id || '';
}

// ── Settings ──

const EMPTY_SETTINGS = {
  storeName: '',
  storeDescription: '',
  logo: '',
  theme: 'system',
  font: 'poppins',
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
  };
  if (recs[0]) {
    return pb.collection('settings').update(recs[0].id, body);
  }
  return pb.collection('settings').create(body);
}