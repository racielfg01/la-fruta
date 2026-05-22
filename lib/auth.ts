// import crypto from 'crypto';
// import { neon } from '@neondatabase/serverless';
// import bcrypt from 'bcryptjs';

// const sql = neon(process.env.DATABASE_URL!);

// export interface User {
//   id: number;
//   phone: string;
//   name: string;
//   gender: string;
//   created_at: string;
// }

// export interface LoginCredentials {
//   phone: string;
//   password: string;
// }

// export interface SignupData {
//   name: string;
//   phone: string;
//   gender: string;
//   password: string;
//   confirmPassword: string;
// }

// // Hash password
// export async function hashPassword(password: string): Promise<string> {
//   const salt = await bcrypt.genSalt(10);
//   return bcrypt.hash(password, salt);
// }

// // Compare password
// export async function comparePasswords(password: string, hash: string): Promise<boolean> {
//   return bcrypt.compare(password, hash);
// }

// // Get user by phone
// export async function getUserByPhone(phone: string): Promise<User | null> {
//   try {
//     const result = await sql`
//       SELECT id, phone, name, created_at 
//       FROM users 
//       WHERE phone = ${phone}
//     `;
//     return result.length > 0 ? (result[0] as User) : null;
//   } catch (error) {
//     console.error('Error getting user by phone:', error);
//     return null;
//   }
// }

// // Create user
// export async function createUser(data: SignupData): Promise<User | null> {
//   try {
//     const passwordHash = await hashPassword(data.password);
//     const result = await sql`
// INSERT INTO users (id, name, email, phone, address, password_hash, role_id, gender)
//        VALUES (
//          ${crypto.randomUUID()},
//          ${data.name},
//          '',
//          ${data.phone},
//          '',
//          ${passwordHash},
//          1,
//          ${data.gender ?? null}
//        )
//        RETURNING id, phone, name, gender, created_at
//     `;
//     return result.length > 0 ? (result[0] as User) : null;
//   } catch (error) {
//     console.error('Error creating user:', error);
//     throw error;
//   }
// }

// // Verify user credentials
// export async function verifyUserCredentials(phone: string, password: string): Promise<User | null> {
//   try {
//     const result = await sql`
//       SELECT id, phone, name, gender, password_hash, created_at 
//       FROM users 
//       WHERE phone = ${phone}
//     `;

//     if (result.length === 0) {
//       return null;
//     }

//     const user = result[0] as any;
//     const isPasswordValid = await comparePasswords(password, user.password_hash);

//     if (!isPasswordValid) {
//       return null;
//     }

//     const { password_hash, ...userWithoutPassword } = user;
//     return userWithoutPassword as User;
//   } catch (error) {
//     console.error('Error verifying credentials:', error);
//     return null;
//   }
// }


// lib/auth.ts
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

const sql = neon(process.env.DATABASE_URL!);

export interface User {
  id: string;        // UUID
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
  phone?: string;
  email?: string;
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

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePasswords(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Buscar usuario por teléfono o email
export async function getUserByIdentifier(identifier: string): Promise<User | null> {
  try {
    const result = await sql`
      SELECT * FROM users 
      WHERE phone = ${identifier} OR email = ${identifier}
      LIMIT 1
    `;
    return result.length > 0 ? (result[0] as User) : null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

// Buscar solo por teléfono (para validar unicidad)
export async function getUserByPhone(phone: string): Promise<User | null> {
  try {
    const result = await sql`
      SELECT * FROM users WHERE phone = ${phone}
    `;
    return result.length > 0 ? (result[0] as User) : null;
  } catch (error) {
    console.error('Error getting user by phone:', error);
    return null;
  }
}

// Buscar solo por email
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const result = await sql`
      SELECT * FROM users WHERE email = ${email}
    `;
    return result.length > 0 ? (result[0] as User) : null;
  } catch (error) {
    console.error('Error getting user by email:', error);
    return null;
  }
}

// Crear usuario
export async function createUser(data: SignupData): Promise<User | null> {
  try {
    const passwordHash = await hashPassword(data.password);
    const result = await sql`
      INSERT INTO users (id, name, email, phone, address, role_id, status, created_at, total_orders, total_spent, password_hash, gender)
      VALUES (
        gen_random_uuid(),
        ${data.name},
        ${data.email},
        ${data.phone},
        '',
        1,         -- role_id = 1 (USER)
        'active',
        NOW(),
        0,
        0,
        ${passwordHash},
        ${data.gender}
      )
      RETURNING id, name, email, phone, gender, created_at, address, role_id, status, total_orders, total_spent
    `;
    return result.length > 0 ? (result[0] as User) : null;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

// Verificar credenciales (por teléfono O email)
export async function verifyUserCredentials(identifier: string, password: string): Promise<User | null> {
  try {
    const result = await sql`
      SELECT * FROM users 
      WHERE phone = ${identifier} OR email = ${identifier}
      LIMIT 1
    `;
    if (result.length === 0) return null;

    const user = result[0] as any;
    const isPasswordValid = await comparePasswords(password, user.password_hash);
    if (!isPasswordValid) return null;

    // Eliminar password_hash antes de devolver
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  } catch (error) {
    console.error('Error verifying credentials:', error);
    return null;
  }
}