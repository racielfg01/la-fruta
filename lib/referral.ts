export function generateReferralCode(prefix = "MTC"): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${code}`;
}

export function buildShareLink(code: string, baseUrl?: string): string {
  const base = baseUrl || (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/auth/signup?ref=${encodeURIComponent(code)}`;
}

export function getReferralMessage(code: string, baseUrl?: string): string {
  const link = buildShareLink(code, baseUrl);
  return `Únete a MercaToma con mi código de referido ${code} y gana puntos!\n${link}`;
}
