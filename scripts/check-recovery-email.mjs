import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadMergedEnv } from "./load-env-files.mjs";

export async function checkRecoveryEmail(env, fetchImpl = fetch) {
  const errors = [];
  const warnings = [];
  const from = env.EMAIL_FROM?.trim() || "";
  const key = env.RESEND_API_KEY?.trim() || "";
  const domain = from.split("@")[1]?.toLowerCase() || "";
  if ((env.PASSWORD_RESET_MODE || "").trim() !== "email") errors.push("PASSWORD_RESET_MODE doit etre email pour activer la recuperation.");
  if (!key) errors.push("RESEND_API_KEY manque. Ne partage jamais cette cle dans le chat ou sur GitHub.");
  if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(from)) errors.push("EMAIL_FROM doit contenir une adresse seule, sur ton domaine verifie.");
  if (["resend.dev", "gmail.com", "outlook.com", "hotmail.com", "yahoo.com", "ton-domaine.fr", "a-renseigner.fr"].includes(domain) || domain.endsWith(".resend.dev")) {
    errors.push("EMAIL_FROM doit utiliser ton propre domaine : ni une adresse Gmail, ni le domaine de test Resend.");
  }
  try {
    const url = new URL(env.NEXT_PUBLIC_APP_URL || "");
    if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash || ["localhost", "127.0.0.1", "ton-domaine.fr"].includes(url.hostname) || url.hostname.endsWith(".localhost")) throw new Error();
  } catch {
    errors.push("NEXT_PUBLIC_APP_URL doit etre l'adresse HTTPS reelle du site, sans identifiants, parametre ni fragment.");
  }
  if (errors.length) return { errors, warnings, domainVerified: false };

  const domainId = env.RESEND_DOMAIN_ID?.trim() || "";
  if (!domainId) {
    warnings.push("Verification DNS non effectuee : renseigner RESEND_DOMAIN_ID ou verifier le domaine dans Resend.");
    return { errors, warnings, domainVerified: false };
  }
  try {
    const response = await fetchImpl(`https://api.resend.com/domains/${encodeURIComponent(domainId)}`, {
      headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(10000)
    });
    if (response.status === 403) {
      warnings.push("La cle d'envoi ne permet pas de lire les domaines. Verifier le domaine et desactiver les suivis dans Resend ; ne pas elargir les droits de la cle du site.");
      return { errors, warnings, domainVerified: false };
    }
    if (!response.ok) {
      errors.push(`Controle Resend refuse (HTTP ${response.status}). Aucun email n'a ete envoye.`);
      return { errors, warnings, domainVerified: false };
    }
    const result = await response.json();
    if (result.name?.toLowerCase() !== domain) errors.push("Le domaine Resend ne correspond pas a l'adresse EMAIL_FROM.");
    if (result.status !== "verified" || result.capabilities?.sending !== "enabled") errors.push("Le domaine n'est pas encore verifie et autorise a envoyer des emails.");
    if (result.open_tracking === true || result.click_tracking === true) errors.push("Desactiver le suivi des ouvertures et des clics sur le domaine utilise pour les liens de recuperation.");
    if (typeof result.open_tracking !== "boolean" || typeof result.click_tracking !== "boolean") warnings.push("Les reglages de suivi doivent etre verifies manuellement dans Resend.");
    return { errors, warnings, domainVerified: errors.length === 0 };
  } catch {
    errors.push("Impossible de verifier Resend pour le moment. Aucun email n'a ete envoye.");
    return { errors, warnings, domainVerified: false };
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const env = { ...loadMergedEnv([".env", ".env.local", ".env.production", ".env.production.local"]), ...process.env };
  const result = await checkRecoveryEmail(env);
  console.log("Verification des emails de recuperation (sans envoi)");
  for (const error of result.errors) console.log(`A corriger : ${error}`);
  for (const warning of result.warnings) console.log(`A verifier : ${warning}`);
  if (!result.errors.length) console.log(result.domainVerified ? "Configuration et domaine controles. La reception reelle reste a tester." : "Configuration presente ; verification du domaine et reception reelle encore necessaires.");
  console.log("Aucun compte ni mot de passe n'a ete modifie.");
  process.exitCode = result.errors.length ? 1 : result.warnings.length ? 2 : 0;
}
