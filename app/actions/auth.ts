'use server';

import { createUser, SignupData, getRoleIds } from '@/lib/auth';
import { getAdminPB, getEphemeralPB } from '@/lib/pocketbase';

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
        filter: `phone = "${data.phone}"`,
      });
      if (existingPhone.items.length > 0) {
        return { success: false, message: '', error: 'El teléfono ya está registrado' };
      }
      const existingEmail = await adminPb.collection('users').getList(1, 1, {
        filter: `email = "${data.email}"`,
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
    const isConnectionError =
      error?.originalError?.cause?.code === 'UND_ERR_CONNECT_TIMEOUT' ||
      error?.originalError?.cause?.code === 'EAI_AGAIN' ||
      error?.cause?.code === 'UND_ERR_CONNECT_TIMEOUT' ||
      error?.cause?.code === 'EAI_AGAIN' ||
      error?.message?.includes?.('fetch failed');
    if (isConnectionError) {
      return { success: false, message: '', error: 'Error de conexión. Verifica tu internet o intenta más tarde.' };
    }
    const msg = error?.response?.message || error?.message || 'Error al registrar. Intenta más tarde.';
    return { success: false, message: '', error: msg };
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
          filter: `phone = "${identifier}"`,
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
    const isConnectionError =
      error?.originalError?.cause?.code === 'UND_ERR_CONNECT_TIMEOUT' ||
      error?.originalError?.cause?.code === 'EAI_AGAIN' ||
      error?.cause?.code === 'UND_ERR_CONNECT_TIMEOUT' ||
      error?.cause?.code === 'EAI_AGAIN' ||
      error?.message?.includes?.('fetch failed');
    if (isConnectionError) {
      return { success: false, message: '', error: 'Error de conexión. Verifica tu internet o intenta más tarde.' };
    }
    return { success: false, message: '', error: 'Correo/Teléfono o contraseña incorrectos' };
  }
}
