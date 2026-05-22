// 'use server';

// import { createUser, verifyUserCredentials, getUserByPhone } from '@/lib/auth';
// import { signAdminToken } from '@/lib/jwt';
// import { SignupData, LoginCredentials } from '@/lib/auth';

// export interface AuthResponse {
//   success: boolean;
//   message: string;
//   user?: {
//     id: number;
//     phone: string;
//     name: string;
//     gender: string;
//     created_at?: string;
//   };
//   token?: string;
//   error?: string;
// }

// // Validation helpers
// function validatePhone(phone: string): { valid: boolean; error?: string } {
//   const phoneRegex = /^[0-9]{10,15}$/;
//   if (!phone) {
//     return { valid: false, error: 'El teléfono es requerido' };
//   }
//   if (!phoneRegex.test(phone.replace(/\D/g, ''))) {
//     return { valid: false, error: 'El teléfono debe contener entre 10 y 15 dígitos' };
//   }
//   return { valid: true };
// }

// function validatePassword(password: string): { valid: boolean; error?: string } {
//   if (!password) {
//     return { valid: false, error: 'La contraseña es requerida' };
//   }
//   if (password.length < 6) {
//     return { valid: false, error: 'La contraseña debe tener al menos 6 caracteres' };
//   }
//   if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
//     return { 
//       valid: false, 
//       error: 'La contraseña debe contener mayúsculas, minúsculas y números' 
//     };
//   }
//   return { valid: true };
// }

// function validateName(name: string): { valid: boolean; error?: string } {
//   if (!name || name.trim().length === 0) {
//     return { valid: false, error: 'El nombre es requerido' };
//   }
//   if (name.trim().length < 2) {
//     return { valid: false, error: 'El nombre debe tener al menos 2 caracteres' };
//   }
//   if (name.length > 100) {
//     return { valid: false, error: 'El nombre no debe exceder 100 caracteres' };
//   }
//   return { valid: true };
// }

// function validateGender(gender: string): { valid: boolean; error?: string } {
//   const validGenders = ['masculino', 'femenino', 'otro', 'prefiero-no-decir'];
//   if (!gender) {
//     return { valid: false, error: 'El género es requerido' };
//   }
//   if (!validGenders.includes(gender)) {
//     return { valid: false, error: 'Selecciona un género válido' };
//   }
//   return { valid: true };
// }

// // Signup action
// export async function signupAction(data: SignupData): Promise<AuthResponse> {
//   try {
//     // Validate inputs
//     const nameValidation = validateName(data.name);
//     if (!nameValidation.valid) {
//       return { success: false, message: '', error: nameValidation.error };
//     }

//     const phoneValidation = validatePhone(data.phone);
//     if (!phoneValidation.valid) {
//       return { success: false, message: '', error: phoneValidation.error };
//     }

// // gender field removed per new schema

//     const passwordValidation = validatePassword(data.password);
//     if (!passwordValidation.valid) {
//       return { success: false, message: '', error: passwordValidation.error };
//     }

//     if (data.password !== data.confirmPassword) {
//       return { 
//         success: false, 
//         message: '', 
//         error: 'Las contraseñas no coinciden' 
//       };
//     }

//     // Check if user already exists
//     const existingUser = await getUserByPhone(data.phone);
//     if (existingUser) {
//       return { 
//         success: false, 
//         message: '', 
//         error: 'El teléfono ya está registrado' 
//       };
//     }

//     // Create user
//     const newUser = await createUser(data);
//     if (!newUser) {
//       return { 
//         success: false, 
//         message: '', 
//         error: 'Error al registrar el usuario. Intenta de nuevo.' 
//       };
//     }

// const token = await signAdminToken({ userId: newUser.id.toString(), email: newUser.phone, role: 'user' });
// return {
//         success: true,
//         message: '¡Registro exitoso! Redirigiendo...',
//         user: {
//           id: newUser.id,
//           phone: newUser.phone,
//           name: newUser.name,
//           gender: newUser.gender,
//           created_at: newUser.created_at,
//         },
//         token,
//       };
//   } catch (error) {
//     console.error('Signup error:', error);
//     return {
//       success: false,
//       message: '',
//       error: 'Error al registrar. Intenta más tarde.',
//     };
//   }
// }

// // Login action
// export async function loginAction(credentials: LoginCredentials): Promise<AuthResponse> {
//   try {
//     // Validate inputs
//     const phoneValidation = validatePhone(credentials.phone);
//     if (!phoneValidation.valid) {
//       return { success: false, message: '', error: phoneValidation.error };
//     }

//     if (!credentials.password) {
//       return { success: false, message: '', error: 'La contraseña es requerida' };
//     }

//     // Verify credentials
//     const user = await verifyUserCredentials(credentials.phone, credentials.password);
//     if (!user) {
//       return {
//         success: false,
//         message: '',
//         error: 'Teléfono o contraseña incorrectos',
//       };
//     }

//     return {
//       success: true,
//       message: '¡Inicio de sesión exitoso! Redirigiendo...',
//       user: {
//         id: user.id,
//         phone: user.phone,
//         name: user.name,
//         gender: user.gender,
//         created_at: user.created_at,
//       },
//     };
//   } catch (error) {
//     console.error('Login error:', error);
//     return {
//       success: false,
//       message: '',
//       error: 'Error al iniciar sesión. Intenta más tarde.',
//     };
//   }
// }

// app/actions/auth.ts
'use server';

import { createUser, verifyUserCredentials, getUserByPhone, getUserByEmail } from '@/lib/auth';
import { signAdminToken } from '@/lib/jwt';
import { SignupData, LoginCredentials } from '@/lib/auth';

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    gender: string;
    // created_at?: string;
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
  const phoneRegex = /^[0-9]{8,10}$/;
  if (!phone) return { valid: false, error: 'El teléfono es requerido' };
  if (!phoneRegex.test(phone.replace(/\D/g, ''))) {
    return { valid: false, error: 'El teléfono debe contener entre 10 y 15 dígitos' };
  }
  return { valid: true };
}

function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password) return { valid: false, error: 'La contraseña es requerida' };
  if (password.length < 6) return { valid: false, error: 'La contraseña debe tener al menos 6 caracteres' };
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

// Acción de registro
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

    // Verificar que no exista el teléfono ni el email
    const existingPhone = await getUserByPhone(data.phone);
    if (existingPhone) {
      return { success: false, message: '', error: 'El teléfono ya está registrado' };
    }
    const existingEmail = await getUserByEmail(data.email);
    if (existingEmail) {
      return { success: false, message: '', error: 'El correo electrónico ya está registrado' };
    }

    const newUser = await createUser(data);
    if (!newUser) {
      return { success: false, message: '', error: 'Error al registrar el usuario. Intenta de nuevo.' };
    }

    const token = await signAdminToken({ userId: newUser.id, email: newUser.email, role: 'user' });
    return {
      success: true,
      message: '¡Registro exitoso! Redirigiendo...',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        gender: newUser.gender as "",
        // created_at: newUser.created_at,
      },
      token,
    };
  } catch (error) {
    console.error('Signup error:', error);
    return { success: false, message: '', error: 'Error al registrar. Intenta más tarde.' };
  }
}

// Acción de login (acepta email o teléfono)
export async function loginAction(credentials: { identifier: string; password: string }): Promise<AuthResponse> {
  try {
    const { identifier, password } = credentials;
    if (!identifier) {
      return { success: false, message: '', error: 'Ingresa tu correo o teléfono' };
    }
    if (!password) {
      return { success: false, message: '', error: 'La contraseña es requerida' };
    }

    const user = await verifyUserCredentials(identifier, password);
    if (!user) {
      return { success: false, message: '', error: 'Correo/Teléfono o contraseña incorrectos' };
    }

    const token = await signAdminToken({ userId: user.id, email: user.email, role: user.role_id === 2 ? 'admin' : 'user' });
    return {
      success: true,
      message: '¡Inicio de sesión exitoso! Redirigiendo...',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        gender: user.gender as "",
        // created_at: user.created_at,
      },
      token,
    };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, message: '', error: 'Error al iniciar sesión. Intenta más tarde.' };
  }
}