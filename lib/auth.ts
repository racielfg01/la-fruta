import { getEphemeralPB, getAdminPB, getAllRecords } from './pocketbase';

let _roleIdsCache: { admin: string; client: string } | null = null;

export async function getRoleIds(): Promise<{ admin: string; client: string }> {
  if (_roleIdsCache) return _roleIdsCache;
  try {
    const adminPb = await getAdminPB();
    const roles = await getAllRecords(adminPb, 'roles');
    _roleIdsCache = {
      admin: roles.find((r: any) => r.name === 'admin')?.id || '',
      client: roles.find((r: any) => r.name === 'client')?.id || '',
    };
    return _roleIdsCache;
  } catch {
    return { admin: '', client: '' };
  }
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  role_id: number;
  status: string;
  created_at: string;
  total_orders: number;
  total_spent: number;
  gender: string | null;
}

export interface LoginCredentials {
  identifier: string;
  password: string;
}

export interface SignupData {
  name: string;
  email: string;
  phone: string;
  gender: string;
  password: string;
  confirmPassword: string;
}

function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return atob(str);
}

export function decodePocketBaseToken(token: string): { userId: string; email: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(base64UrlDecode(parts[1]));
    if (payload.exp && Date.now() / 1000 > payload.exp) return null;
    return { userId: payload.id, email: payload.email };
  } catch {
    return null;
  }
}

function mapUser(record: any, roleIds?: { admin: string; client: string }): User {
  const roleName = record.expand?.role_id?.name || 'client';
  const isAdmin = roleIds?.admin
    ? record.role_id === roleIds.admin
    : roleName === 'admin';
  return {
    id: record.id,
    name: record.name,
    email: record.email,
    phone: record.phone || '',
    address: record.address || '',
    role_id: isAdmin ? 2 : 1,
    status: record.status || 'active',
    created_at: record.created,
    total_orders: record.total_orders || 0,
    total_spent: Number(record.total_spent) || 0,
    gender: record.gender || null,
  };
}

export async function getUserByIdentifier(identifier: string): Promise<User | null> {
  try {
    const pb = await getAdminPB();
    const records = await pb.collection('users').getList(1, 1, {
      filter: `phone = "${identifier}" || email = "${identifier}"`,
      expand: 'role_id',
    });
    return records.items.length > 0 ? mapUser(records.items[0]) : null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

export async function getUserByPhone(phone: string): Promise<User | null> {
  try {
    const pb = await getAdminPB();
    const records = await pb.collection('users').getList(1, 1, {
      filter: `phone = "${phone}"`,
      expand: 'role_id',
    });
    return records.items.length > 0 ? mapUser(records.items[0]) : null;
  } catch (error) {
    console.error('Error getting user by phone:', error);
    return null;
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const pb = await getAdminPB();
    const records = await pb.collection('users').getList(1, 1, {
      filter: `email = "${email}"`,
      expand: 'role_id',
    });
    return records.items.length > 0 ? mapUser(records.items[0]) : null;
  } catch (error) {
    console.error('Error getting user by email:', error);
    return null;
  }
}

export async function createUser(data: SignupData): Promise<User | null> {
  try {
    const pb = getEphemeralPB();
    const roleIds = await getRoleIds();

    const payload: Record<string, any> = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: '',
      status: 'active',
      total_orders: 0,
      total_spent: 0,
      password: data.password,
      passwordConfirm: data.confirmPassword,
      gender: data.gender,
    };
    if (roleIds.client) {
      payload.role_id = roleIds.client;
    }

    const record = await pb.collection('users').create(payload);
    return mapUser(record);
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

export async function verifyUserCredentials(identifier: string, password: string): Promise<User | null> {
  try {
    const pb = getEphemeralPB();
    const isEmail = identifier.includes('@');

    let authData;
    if (isEmail) {
      authData = await pb.collection('users').authWithPassword(identifier, password);
    } else {
      const adminPb = await getAdminPB();
      const users = await adminPb.collection('users').getList(1, 1, {
        filter: `phone = "${identifier}"`,
      });
      if (users.items.length === 0) return null;
      authData = await pb.collection('users').authWithPassword(users.items[0].email, password);
    }

    const userWithRole = await pb.collection('users').getOne(authData.record.id, {
      expand: 'role_id',
    });

    return mapUser(userWithRole);
  } catch (error) {
    console.error('Error verifying credentials:', error);
    return null;
  }
}

