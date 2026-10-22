// Server actions para los datos guardados del usuario en checkout:
// beneficiarios (contacto de entrega) y direcciones de entrega con alias.
"use server";

import { decodePocketBaseToken } from "@/lib/auth";
import { getAdminPB, getAllRecords, sanitize } from "@/lib/pocketbase";

export interface Beneficiary {
  id: string;
  fullName: string;
  phone: string;
  carnet: string;
  isDefault: boolean;
}

export interface UserAddress {
  id: string;
  alias: string;
  address: string;
  zone: string;
  notes: string;
  isDefault: boolean;
}

async function requireUserId(token: string): Promise<string> {
  const payload = decodePocketBaseToken(token);
  if (!payload) throw new Error("No autorizado");
  return payload.userId;
}

async function getOwned(pb: any, collection: string, id: string, userId: string) {
  const records = await getAllRecords(pb, collection, {
    filter: `id = "${sanitize(id)}" && user = "${sanitize(userId)}"`,
  });
  if (records.length === 0) throw new Error("No encontrado o no autorizado");
  return records[0];
}

export async function getBeneficiariesAction(token: string): Promise<Beneficiary[]> {
  const userId = await requireUserId(token);
  const pb = await getAdminPB();
  const list = await getAllRecords(pb, "beneficiaries", {
    filter: `user = "${sanitize(userId)}"`,
    sort: "id",
  });
  return list.map((b: any) => ({
    id: b.id,
    fullName: b.full_name || "",
    phone: b.phone || "",
    carnet: b.carnet || "",
    isDefault: !!b.is_default,
  }));
}

export async function createBeneficiaryAction(
  data: { fullName: string; phone: string; carnet?: string; isDefault?: boolean },
  token: string
) {
  const userId = await requireUserId(token);
  const pb = await getAdminPB();
  const created = await pb.collection("beneficiaries").create({
    user: userId,
    full_name: data.fullName,
    phone: data.phone,
    carnet: data.carnet || "",
    is_default: !!data.isDefault,
  });
  return { success: true, id: created.id };
}

export async function deleteBeneficiaryAction(id: string, token: string) {
  const userId = await requireUserId(token);
  const pb = await getAdminPB();
  await getOwned(pb, "beneficiaries", id, userId);
  await pb.collection("beneficiaries").delete(id);
  return { success: true };
}

export async function getUserAddressesAction(token: string): Promise<UserAddress[]> {
  const userId = await requireUserId(token);
  const pb = await getAdminPB();
  const list = await getAllRecords(pb, "user_addresses", {
    filter: `user = "${sanitize(userId)}"`,
    sort: "id",
  });
  return list.map((a: any) => ({
    id: a.id,
    alias: a.alias || "",
    address: a.address || "",
    zone: a.zone || "",
    notes: a.notes || "",
    isDefault: !!a.is_default,
  }));
}

export async function createUserAddressAction(
  data: { alias: string; address: string; zone?: string; notes?: string; isDefault?: boolean },
  token: string
) {
  const userId = await requireUserId(token);
  const pb = await getAdminPB();
  const created = await pb.collection("user_addresses").create({
    user: userId,
    alias: data.alias,
    address: data.address,
    zone: data.zone || "",
    notes: data.notes || "",
    is_default: !!data.isDefault,
  });
  return { success: true, id: created.id };
}

/**
 * Actualiza una dirección guardada (alias, zona, instrucciones). Necesaria
 * para poder guardar las instrucciones de una dirección que ya existe: si se
 * rechazara como duplicada, sus notas nunca se podrían guardar.
 */
export async function updateUserAddressAction(
  id: string,
  data: { alias?: string; address?: string; zone?: string; notes?: string },
  token: string
) {
  const userId = await requireUserId(token);
  const pb = await getAdminPB();
  await getOwned(pb, "user_addresses", id, userId);
  const payload: Record<string, unknown> = {};
  if (data.alias !== undefined) payload.alias = data.alias;
  if (data.address !== undefined) payload.address = data.address;
  if (data.zone !== undefined) payload.zone = data.zone;
  if (data.notes !== undefined) payload.notes = data.notes;
  await pb.collection("user_addresses").update(id, payload);
  return { success: true, id };
}

export async function deleteUserAddressAction(id: string, token: string) {
  const userId = await requireUserId(token);
  const pb = await getAdminPB();
  await getOwned(pb, "user_addresses", id, userId);
  await pb.collection("user_addresses").delete(id);
  return { success: true };
}