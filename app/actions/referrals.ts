"use server";

import { getAdminPB, getTokenPB, sanitize } from "@/lib/pocketbase";
import { decodePocketBaseToken } from "@/lib/auth";
import { generateReferralCode } from "@/lib/referral";

export async function ensureReferralCode(token: string) {
  try {
    const payload = decodePocketBaseToken(token);
    if (!payload) return { success: false, error: "Sesión inválida" };

    const pb = getTokenPB(token);
    const user = await pb.collection("users").getOne(payload.userId);

    if (user.referral_code) {
      return { success: true, code: user.referral_code };
    }

    const adminPb = await getAdminPB();
    let code = generateReferralCode();
    let attempts = 0;

    while (attempts < 10) {
      const existing = await adminPb.collection("users").getList(1, 1, {
        filter: `referral_code = "${sanitize(code)}"`,
      });
      if (existing.items.length === 0) break;
      code = generateReferralCode();
      attempts++;
    }

    await adminPb.collection("users").update(payload.userId, {
      referral_code: code,
    });

    return { success: true, code };
  } catch (error: any) {
    console.error("ensureReferralCode error:", error);
    return { success: false, error: error?.message || "Error al generar código" };
  }
}

export async function getMyReferralData(token: string) {
  try {
    const payload = decodePocketBaseToken(token);
    if (!payload) return { success: false, error: "Sesión inválida" };

    const pb = getTokenPB(token);
    const user = await pb.collection("users").getOne(payload.userId);

    let code = user.referral_code;
    if (!code) {
      const result = await ensureReferralCode(token);
      if (result.success) code = result.code;
    }

    const referrals = await pb.collection("referrals").getList(1, 100, {
      filter: `referrer = "${payload.userId}"`,
      sort: "-created",
      expand: "referred",
    });

    const history = await pb.collection("points_history").getList(1, 50, {
      filter: `user = "${payload.userId}"`,
      sort: "-created",
    });

    return {
      success: true,
      code,
      points: user.referral_points || 0,
      invitesCount: user.referral_invites_count || 0,
      referrals: referrals.items.map((r: any) => ({
        id: r.id,
        name: r.expand?.referred?.name || "Usuario",
        created: r.created,
      })),
      history: history.items.map((h: any) => ({
        id: h.id,
        amount: h.amount,
        type: h.type,
        description: h.description,
        created: h.created,
      })),
    };
  } catch (error: any) {
    console.error("getMyReferralData error:", error);
    return { success: false, error: error?.message || "Error al obtener datos" };
  }
}

export async function applyReferralCode(code: string, newUserId: string) {
  try {
    if (!code || !newUserId) return { success: false };

    const adminPb = await getAdminPB();

    const existing = await adminPb.collection("referrals").getList(1, 1, {
      filter: `referred = "${newUserId}"`,
    });
    if (existing.items.length > 0) return { success: false };

    const referrerList = await adminPb.collection("users").getList(1, 1, {
      filter: `referral_code = "${sanitize(code)}"`,
    });
    if (referrerList.items.length === 0) return { success: false };

    const referrer = referrerList.items[0];
    if (referrer.id === newUserId) return { success: false };

    await adminPb.collection("referrals").create({
      referrer: referrer.id,
      referred: newUserId,
      points_awarded: true,
    });

    await adminPb.collection("users").update(referrer.id, {
      referral_points: (referrer.referral_points || 0) + 10,
      referral_invites_count: (referrer.referral_invites_count || 0) + 1,
    });

    const newUser = await adminPb.collection("users").getOne(newUserId);
    await adminPb.collection("users").update(newUserId, {
      referral_points: (newUser.referral_points || 0) + 10,
      referred_by: referrer.id,
    });

    await adminPb.collection("points_history").create({
      user: referrer.id,
      amount: 10,
      type: "referral_inviter",
      description: "Puntos por invitado registrado",
    });

    await adminPb.collection("points_history").create({
      user: newUserId,
      amount: 10,
      type: "referral_invitee",
      description: "Puntos por registro con código de referido",
    });

    return { success: true };
  } catch (error: any) {
    console.error("applyReferralCode error:", error);
    return { success: false, error: error?.message };
  }
}

export async function getReferralStatsForAdmin() {
  try {
    const adminPb = await getAdminPB();

    const users = await adminPb.collection("users").getFullList({
      sort: "-referral_points",
    });

    const referrals = await adminPb.collection("referrals").getFullList({
      sort: "-created",
      expand: "referrer,referred",
    });

    const history = await adminPb.collection("points_history").getFullList({
      sort: "-created",
      expand: "user",
    });

    const topReferrers = users
      .filter((u: any) => (u.referral_invites_count || 0) > 0)
      .slice(0, 10)
      .map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        code: u.referral_code,
        invites: u.referral_invites_count || 0,
        points: u.referral_points || 0,
      }));

    return {
      success: true,
      totalUsersWithCode: users.filter((u: any) => u.referral_code).length,
      totalReferrals: referrals.length,
      totalPointsAwarded: history.reduce((sum: number, h: any) => sum + (h.amount > 0 ? h.amount : 0), 0),
      topReferrers,
      referrals: referrals.map((r: any) => ({
        id: r.id,
        referrerName: r.expand?.referrer?.name || "-",
        referrerCode: r.expand?.referrer?.referral_code || "-",
        referredName: r.expand?.referred?.name || "-",
        referredEmail: r.expand?.referred?.email || "-",
        created: r.created,
      })),
      history: history.slice(0, 100).map((h: any) => ({
        id: h.id,
        userName: h.expand?.user?.name || "-",
        userEmail: h.expand?.user?.email || "-",
        amount: h.amount,
        type: h.type,
        description: h.description,
        created: h.created,
      })),
    };
  } catch (error: any) {
    console.error("getReferralStatsForAdmin error:", error);
    return { success: false, error: error?.message || "Error al obtener estadísticas" };
  }
}
