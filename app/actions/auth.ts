'use server';

import { createUser, verifyUserCredentials, getUserByPhone } from '@/lib/auth';
import { SignupData, LoginCredentials } from '@/lib/auth';

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: {
    id: number;
    phone: string;
    name: string;
    gender: string;
    created_at?: string;
  };
  token?: string;
  error?: string;
}

// Validation helpers
function validatePhone(phone: string): { valid: boolean; error?: string } {
  const phoneRegex = /^[0-9]{10,15}$/;
  if (!phone) {
    return { valid: false, error: 'El teléfono es requerido' };
  }
  if (!phoneRegex.test(phone.replace(/\D/g, ''))) {
    return { valid: false, error: 'El teléfono debe contener entre 10 y 15 dígitos' };
  }
  return { valid: true };
}

function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password) {
    return { valid: false, error: 'La contraseña es requerida' };
  }
  if (password.length < 6) {
    return { valid: false, error: 'La contraseña debe tener al menos 6 caracteres' };
  }
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    return { 
      valid: false, 
      error: 'La contraseña debe contener mayúsculas, minúsculas y números' 
    };
  }
  return { valid: true };
}

function validateName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'El nombre es requerido' };
  }
  if (name.trim().length < 2) {
    return { valid: false, error: 'El nombre debe tener al menos 2 caracteres' };
  }
  if (name.length > 100) {
    return { valid: false, error: 'El nombre no debe exceder 100 caracteres' };
  }
  return { valid: true };
}

function validateGender(gender: string): { valid: boolean; error?: string } {
  const validGenders = ['masculino', 'femenino', 'otro', 'prefiero-no-decir'];
  if (!gender) {
    return { valid: false, error: 'El género es requerido' };
  }
  if (!validGenders.includes(gender)) {
    return { valid: false, error: 'Selecciona un género válido' };
  }
  return { valid: true };
}

// Signup action
export async function signupAction(data: SignupData): Promise<AuthResponse> {
  try {
    // Validate inputs
    const nameValidation = validateName(data.name);
    if (!nameValidation.valid) {
      return { success: false, message: '', error: nameValidation.error };
    }

    const phoneValidation = validatePhone(data.phone);
    if (!phoneValidation.valid) {
      return { success: false, message: '', error: phoneValidation.error };
    }

    const genderValidation = validateGender(data.gender);
    if (!genderValidation.valid) {
      return { success: false, message: '', error: genderValidation.error };
    }

    const passwordValidation = validatePassword(data.password);
    if (!passwordValidation.valid) {
      return { success: false, message: '', error: passwordValidation.error };
    }

    if (data.password !== data.confirmPassword) {
      return { 
        success: false, 
        message: '', 
        error: 'Las contraseñas no coinciden' 
      };
    }

    // Check if user already exists
    const existingUser = await getUserByPhone(data.phone);
    if (existingUser) {
      return { 
        success: false, 
        message: '', 
        error: 'El teléfono ya está registrado' 
      };
    }

    // Create user
    const newUser = await createUser(data);
    if (!newUser) {
      return { 
        success: false, 
        message: '', 
        error: 'Error al registrar el usuario. Intenta de nuevo.' 
      };
    }

    return {
      success: true,
      message: '¡Registro exitoso! Redirigiendo...',
      user: {
        id: newUser.id,
        phone: newUser.phone,
        name: newUser.name,
        gender: newUser.gender,
        created_at: newUser.created_at,
      },
    };
  } catch (error) {
    console.error('Signup error:', error);
    return {
      success: false,
      message: '',
      error: 'Error al registrar. Intenta más tarde.',
    };
  }
}

// Login action
export async function loginAction(credentials: LoginCredentials): Promise<AuthResponse> {
  try {
    // Validate inputs
    const phoneValidation = validatePhone(credentials.phone);
    if (!phoneValidation.valid) {
      return { success: false, message: '', error: phoneValidation.error };
    }

    if (!credentials.password) {
      return { success: false, message: '', error: 'La contraseña es requerida' };
    }

    // Verify credentials
    const user = await verifyUserCredentials(credentials.phone, credentials.password);
    if (!user) {
      return {
        success: false,
        message: '',
        error: 'Teléfono o contraseña incorrectos',
      };
    }

    return {
      success: true,
      message: '¡Inicio de sesión exitoso! Redirigiendo...',
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        gender: user.gender,
        created_at: user.created_at,
      },
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      message: '',
      error: 'Error al iniciar sesión. Intenta más tarde.',
    };
  }
}
