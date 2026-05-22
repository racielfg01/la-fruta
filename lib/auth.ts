import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

const sql = neon(process.env.DATABASE_URL!);

export interface User {
  id: number;
  phone: string;
  name: string;
  gender: string;
  created_at: string;
}

export interface LoginCredentials {
  phone: string;
  password: string;
}

export interface SignupData {
  name: string;
  phone: string;
  gender: string;
  password: string;
  confirmPassword: string;
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// Compare password
export async function comparePasswords(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Get user by phone
export async function getUserByPhone(phone: string): Promise<User | null> {
  try {
    const result = await sql`
      SELECT id, phone, name, created_at 
      FROM users 
      WHERE phone = ${phone}
    `;
    return result.length > 0 ? (result[0] as User) : null;
  } catch (error) {
    console.error('Error getting user by phone:', error);
    return null;
  }
}

// Create user
export async function createUser(data: SignupData): Promise<User | null> {
  try {
    const passwordHash = await hashPassword(data.password);
    const result = await sql`
      INSERT INTO users (id, name, email, phone, address, password_hash, role_id)
      VALUES (
        crypto.randomUUID(),
        ${data.name},
        '',
        ${data.phone},
        '',
        ${passwordHash},
        1
      )
      RETURNING id, phone, name, gender, created_at
    `;
    return result.length > 0 ? (result[0] as User) : null;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

// Verify user credentials
export async function verifyUserCredentials(phone: string, password: string): Promise<User | null> {
  try {
    const result = await sql`
      SELECT id, phone, name, gender, password_hash, created_at 
      FROM users 
      WHERE phone = ${phone}
    `;

    if (result.length === 0) {
      return null;
    }

    const user = result[0] as any;
    const isPasswordValid = await comparePasswords(password, user.password_hash);

    if (!isPasswordValid) {
      return null;
    }

    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  } catch (error) {
    console.error('Error verifying credentials:', error);
    return null;
  }
}
