import { getPublicAppUrl } from "./app-config";
import { createRecoveryEmail } from "./recovery-email";

export function isRecoveryEmailConfigured() {
  const from = process.env.EMAIL_FROM?.trim() || "";
  try {
    const url = new URL(getPublicAppUrl());
    const domain = from.split("@")[1]?.toLowerCase() || "";
    return Boolean(process.env.RESEND_API_KEY?.trim()) &&
      /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(from) &&
      !/\r|\n/.test(from) && domain !== "resend.dev" && !domain.endsWith(".resend.dev") &&
      !["gmail.com", "outlook.com", "hotmail.com", "yahoo.com", "ton-domaine.fr", "a-renseigner.fr"].includes(domain) &&
      url.protocol === "https:" && !url.username && !url.password && !url.search && !url.hash &&
      !["localhost", "127.0.0.1", "ton-domaine.fr"].includes(url.hostname) && !url.hostname.endsWith(".localhost");
  } catch {
    return false;
  }
}

export async function sendRecoveryEmail(email: string, token: string, requestId: string) {
  if (!isRecoveryEmailConfigured()) throw new Error("EMAIL_NOT_CONFIGURED");
  const link = new URL("/reset-password", getPublicAppUrl());
  link.searchParams.set("token", token);
  const content = createRecoveryEmail(link.href);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY!.trim()}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `password-reset/${requestId}`
    },
    body: JSON.stringify({
      from: `Prépatempo <${process.env.EMAIL_FROM!.trim()}>`,
      to: [email],
      subject: "Prépatempo - Réinitialiser le mot de passe",
      ...content
    }),
    signal: AbortSignal.timeout(10000)
  });
  if (!response.ok) throw new Error(`EMAIL_SEND_FAILED:${response.status}`);
  const result = await response.json() as { id?: string };
  if (!result.id) throw new Error("EMAIL_SEND_FAILED");
}
