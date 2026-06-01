function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return atob(str);
}

export interface AdminTokenPayload {
  userId: string;
  email: string;
  role: string;
}

export async function signAdminToken(_payload: AdminTokenPayload): Promise<string> {
  throw new Error('signAdminToken is deprecated — use PocketBase authWithPassword instead');
}

export async function verifyAdminToken(token: string): Promise<AdminTokenPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(base64UrlDecode(parts[1]));
    if (payload.exp && Date.now() / 1000 > payload.exp) return null;
    return {
      userId: payload.id,
      email: payload.email,
      role: 'user',
    };
  } catch {
    return null;
  }
}
