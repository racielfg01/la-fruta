import { decodePocketBaseToken, getRoleIds } from "@/lib/auth";
import { getTokenPB } from "@/lib/pocketbase";

export interface AuthenticatedUser {
  userId: string;
  name: string;
  isAdmin: boolean;
}

export async function requireUser(token: string): Promise<AuthenticatedUser> {
  const payload = decodePocketBaseToken(token);
  if (!payload) throw new Error("No autorizado");

  const pb = getTokenPB(token);
  const user = await pb.collection("users").getOne(payload.userId, {
    expand: "role_id",
  });
  const roleIds = await getRoleIds();
  const isAdmin = roleIds.admin
    ? user.role_id === roleIds.admin
    : user.expand?.role_id?.name === "admin";

  return {
    userId: user.id,
    name: user.name || user.email || "",
    isAdmin,
  };
}

export async function requireAdmin(token: string): Promise<AuthenticatedUser> {
  const user = await requireUser(token);
  if (!user.isAdmin) throw new Error("Acceso denegado");
  return user;
}
