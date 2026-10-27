export interface VapidConfig {
  configured: boolean;
  publicKey: string;
  privateKey: string;
  subject: string;
}

const DEFAULT_SUBJECT = "https://mercatoma.vercel.app";

export function getVapidConfig(): VapidConfig {
  const publicKey = (process.env.VAPID_PUBLIC_KEY || "").trim();
  const privateKey = (process.env.VAPID_PRIVATE_KEY || "").trim();
  const rawSubject = (
    process.env.VAPID_SUBJECT ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    DEFAULT_SUBJECT
  ).trim();
  const subject =
    rawSubject.startsWith("https://") || rawSubject.startsWith("mailto:")
      ? rawSubject
      : DEFAULT_SUBJECT;

  return {
    publicKey,
    privateKey,
    subject,
    configured: Boolean(publicKey && privateKey),
  };
}
