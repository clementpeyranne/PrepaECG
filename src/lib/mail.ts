import { getPublicAppUrl } from "./app-config";

export function isRecoveryEmailConfigured() {
  const from = process.env.EMAIL_FROM?.trim() || "";
  try {
    const url = new URL(getPublicAppUrl());
    return Boolean(process.env.RESEND_API_KEY?.trim()) &&
      /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(from) &&
      url.protocol === "https:" && !url.username && !url.password &&
      !["localhost", "127.0.0.1", "ton-domaine.fr"].includes(url.hostname);
  } catch {
    return false;
  }
}

export async function sendRecoveryEmail(email: string, token: string, requestId: string) {
  if (!isRecoveryEmailConfigured()) throw new Error("EMAIL_NOT_CONFIGURED");
  const link = new URL("/reset-password", getPublicAppUrl());
  link.searchParams.set("token", token);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY!.trim()}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `password-reset/${requestId}`
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM!.trim(),
      to: [email],
      subject: "Prepa ECG - Reinitialiser ton mot de passe",
      text: `Pour choisir un nouveau mot de passe, ouvre ce lien :\n\n${link.href}\n\nCe lien est valable une heure et ne peut servir qu'une fois.\nSi tu n'as pas demande ce changement, ignore cet email. Ton mot de passe reste inchange.`
    }),
    signal: AbortSignal.timeout(10000)
  });
  if (!response.ok) throw new Error(`EMAIL_SEND_FAILED:${response.status}`);
  const result = await response.json() as { id?: string };
  if (!result.id) throw new Error("EMAIL_SEND_FAILED");
}
