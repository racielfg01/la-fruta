'use server';

import { createUser, SignupData, getRoleIds, decodePocketBaseToken } from '@/lib/auth';
import { getAdminPB, getEphemeralPB, getTokenPB, sanitize } from '@/lib/pocketbase';

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    gender: string;
    address: string;
    role_id: number;
  };
  token?: string;
  error?: string;
}

function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email) return { valid: false, error: 'El correo electrónico es requerido' };
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return { valid: false, error: 'Correo electrónico inválido' };
  return { valid: true };
}

function validatePhone(phone: string): { valid: boolean; error?: string } {
  const phoneRegex = /^[0-9]{7,15}$/;
  if (!phone) return { valid: false, error: 'El teléfono es requerido' };
  if (!phoneRegex.test(phone.replace(/\D/g, ''))) {
    return { valid: false, error: 'El teléfono debe contener entre 7 y 15 dígitos' };
  }
  return { valid: true };
}

function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password) return { valid: false, error: 'La contraseña es requerida' };
  if (password.length < 8) return { valid: false, error: 'La contraseña debe tener al menos 8 caracteres' };
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    return { valid: false, error: 'La contraseña debe contener mayúsculas, minúsculas y números' };
  }
  return { valid: true };
}

// Traduce una excepción de PocketBase a un mensaje con la causa real.
// Antes un fallo de DNS (EAI_AGAIN), un 400 de credenciales y un 500
// terminaban mostrando mensajes distintos o engañosos.
function describeAuthError(error: any, kind: 'login' | 'signup'): string {
  const cause =
    error?.cause?.code ||
    error?.originalError?.cause?.code ||
    error?.originalError?.code;
  const networkCodes = new Set([
    'EAI_AGAIN', 'ENOTFOUND', 'ETIMEDOUT', 'EHOSTUNREACH',
    'ECONNREFUSED', 'ECONNRESET', 'UND_ERR_CONNECT_TIMEOUT',
  ]);
  if (networkCodes.has(cause) || error?.message?.includes?.('fetch failed')) {
    return `No se pudo conectar con PocketBase${cause ? ` (${cause})` : ''}. Revisa la conexión o el DNS.`;
  }
  const status = error?.response?.status;
  if (status === 400) {
    if (kind === 'signup') {
      // 400 en registro = validación de PB (email duplicado, campos faltantes),
      // nunca credenciales.
      const data = error?.response?.data;
      const first = data && Object.keys(data)[0];
      const detail = first ? data[first]?.message : undefined;
      return `Datos de registro inválidos${first ? ` (${first})` : ''}${detail ? `: ${detail}` : ''}`;
    }
    return 'Correo/Teléfono o contraseña incorrectos';
  }
  if (status === 401 || status === 403) return 'No tienes permiso para iniciar sesión.';
  if (status === 404) return 'No se encontró el recurso. ¿Falta aplicar el esquema?';
  if (status) {
    const detail = error?.response?.message || '';
    return `PocketBase respondió ${status}${detail ? `: ${detail}` : ''}`;
  }
  return `Error inesperado${error?.message ? `: ${error.message}` : ''}`;
}

function validateName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) return { valid: false, error: 'El nombre es requerido' };
  if (name.trim().length < 2) return { valid: false, error: 'El nombre debe tener al menos 2 caracteres' };
  if (name.length > 100) return { valid: false, error: 'El nombre no debe exceder 100 caracteres' };
  return { valid: true };
}

function validateGender(gender: string): { valid: boolean; error?: string } {
  const validGenders = ['masculino', 'femenino', 'otro', 'prefiero-no-decir'];
  if (!gender) return { valid: false, error: 'El género es requerido' };
  if (!validGenders.includes(gender)) return { valid: false, error: 'Selecciona un género válido' };
  return { valid: true };
}

export async function signupAction(data: SignupData): Promise<AuthResponse> {
  try {
    const nameValidation = validateName(data.name);
    if (!nameValidation.valid) return { success: false, message: '', error: nameValidation.error };

    const emailValidation = validateEmail(data.email);
    if (!emailValidation.valid) return { success: false, message: '', error: emailValidation.error };

    const phoneValidation = validatePhone(data.phone);
    if (!phoneValidation.valid) return { success: false, message: '', error: phoneValidation.error };

    const genderValidation = validateGender(data.gender);
    if (!genderValidation.valid) return { success: false, message: '', error: genderValidation.error };

    const passwordValidation = validatePassword(data.password);
    if (!passwordValidation.valid) return { success: false, message: '', error: passwordValidation.error };

    if (data.password !== data.confirmPassword) {
      return { success: false, message: '', error: 'Las contraseñas no coinciden' };
    }

    try {
      const adminPb = await getAdminPB();
      const existingPhone = await adminPb.collection('users').getList(1, 1, {
        filter: `phone = "${sanitize(data.phone)}"`,
      });
      if (existingPhone.items.length > 0) {
        return { success: false, message: '', error: 'El teléfono ya está registrado' };
      }
      const existingEmail = await adminPb.collection('users').getList(1, 1, {
        filter: `email = "${sanitize(data.email)}"`,
      });
      if (existingEmail.items.length > 0) {
        return { success: false, message: '', error: 'El correo electrónico ya está registrado' };
      }
    } catch (e) {
      console.warn('Could not check duplicates, proceeding — PB will enforce uniqueness', e);
    }

    const newUser = await createUser(data);
    if (!newUser) {
      return { success: false, message: '', error: 'Error al registrar el usuario. Intenta de nuevo.' };
    }

    const pb = getEphemeralPB();
    const authData = await pb.collection('users').authWithPassword(data.email, data.password);

    return {
      success: true,
      message: '¡Registro exitoso! Redirigiendo...',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        address: newUser.address,
        gender: newUser.gender || '',
        role_id: newUser.role_id || 1,
      },
      token: authData.token,
    };
  } catch (error: any) {
    console.error('Signup error:', error);
    return { success: false, message: '', error: describeAuthError(error, 'signup') };
  }
}

export async function loginAction(credentials: { identifier: string; password: string }): Promise<AuthResponse> {
  try {
    const { identifier, password } = credentials;
    if (!identifier) {
      return { success: false, message: '', error: 'Ingresa tu correo o teléfono' };
    }
    if (!password) {
      return { success: false, message: '', error: 'La contraseña es requerida' };
    }

    const pb = getEphemeralPB();

    let authData;
    if (identifier.includes('@')) {
      authData = await pb.collection('users').authWithPassword(identifier, password);
    } else {
      let email = identifier;
      try {
        const adminPb = await getAdminPB();
        const users = await adminPb.collection('users').getList(1, 1, {
          filter: `phone = "${sanitize(identifier)}"`,
        });
        if (users.items.length > 0) {
          email = users.items[0].email;
        }
      } catch {
        console.warn('Admin lookup failed for phone login, trying identifier as email');
      }
      authData = await pb.collection('users').authWithPassword(email, password);
    }

    const userWithRole = await pb.collection('users').getOne(authData.record.id, {
      expand: 'role_id',
    });

    const roleIds = await getRoleIds();

    return {
      success: true,
      message: '¡Inicio de sesión exitoso! Redirigiendo...',
      user: {
        id: authData.record.id,
        name: authData.record.name,
        email: authData.record.email,
        phone: authData.record.phone || '',
        address: authData.record.address || '',
        gender: authData.record.gender || '',
        role_id: roleIds.admin
          ? (userWithRole.role_id === roleIds.admin ? 2 : 1)
          : (userWithRole.expand?.role_id?.name === 'admin' ? 2 : 1),
      },
      token: authData.token,
    };
  } catch (error: any) {
    console.error('Login error:', error);
    return { success: false, message: '', error: describeAuthError(error, 'login') };
  }
}

export async function refreshUserAction(token: string): Promise<AuthResponse> {
  try {
    const payload = decodePocketBaseToken(token);
    if (!payload) {
      return { success: false, message: '', error: 'Sesión inválida o expirada' };
    }
    const pb = getTokenPB(token);
    const userWithRole = await pb.collection('users').getOne(payload.userId, {
      expand: 'role_id',
    });
    const roleIds = await getRoleIds();
    return {
      success: true,
      message: '',
      user: {
        id: userWithRole.id,
        name: userWithRole.name,
        email: userWithRole.email,
        phone: userWithRole.phone || '',
        address: userWithRole.address || '',
        gender: userWithRole.gender || '',
        role_id: roleIds.admin
          ? (userWithRole.role_id === roleIds.admin ? 2 : 1)
          : (userWithRole.expand?.role_id?.name === 'admin' ? 2 : 1),
      },
      token,
    };
  } catch (error) {
    console.error('Refresh user error:', error);
    return { success: false, message: '', error: 'No se pudo validar la sesión' };
  }
}
