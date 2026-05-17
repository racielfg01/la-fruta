"use server";

import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { signAdminToken } from "@/lib/jwt";

const sql = neon(process.env.DATABASE_URL!);

export interface AdminLoginResponse {
  success: boolean;
  error?: string;
}

export async function adminLoginAction(
  email: string,
  password: string
): Promise<AdminLoginResponse> {
  if (!email || !password) {
    return { success: false, error: "Email y contraseña son requeridos" };
  }

  try {
    const rows = await sql`
      SELECT id, email, password_hash, name, role
      FROM admin_users
      WHERE email = ${email.toLowerCase().trim()}
    `;

    if (rows.length === 0) {
      return { success: false, error: "Credenciales inválidas" };
    }

    const user = rows[0] as any;

    if (user.role !== "admin") {
      return { success: false, error: "Credenciales inválidas" };
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return { success: false, error: "Credenciales inválidas" };
    }

    const token = await signAdminToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const cookieStore = await cookies();
    cookieStore.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/admin",
      maxAge: 60 * 60 * 8, // 8 hours
    });

    return { success: true };
  } catch (e) {
    console.error("Admin login error:", e);
    return { success: false, error: "Error al iniciar sesión" };
  }
}

export async function adminLogoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("admin_token");
}

export async function checkAdminAuth(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token");
    if (!token) return false;

    const { verifyAdminToken } = await import("@/lib/jwt");
    const payload = await verifyAdminToken(token.value);
    return payload !== null && payload.role === "admin";
  } catch {
    return false;
  }
}

export async function getAdminTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token");
  return token?.value ?? null;
}
