import assert from "node:assert/strict";
import { test } from "node:test";
import { checkRecoveryEmail } from "../scripts/check-recovery-email.mjs";
import { createAppLoader } from "./load-app.mjs";

const emailEnv = {
  PASSWORD_RESET_MODE: "email", RESEND_API_KEY: "private-test-key", RESEND_DOMAIN_ID: "test-domain-id",
  EMAIL_FROM: "comptes@notifications.prepatempo.test", NEXT_PUBLIC_APP_URL: "https://prepa.example.test"
};
const verified = { name: "notifications.prepatempo.test", status: "verified", capabilities: { sending: "enabled" }, open_tracking: false, click_tracking: false };
const response = (value) => async (_url, options) => {
  assert.equal(options.method, undefined, "Read-only verification");
  return new Response(JSON.stringify(value), { status: 200 });
};

test("Email preflight refuses missing configuration without sending a request", async () => {
  const result = await checkRecoveryEmail({}, async () => { throw new Error("Unexpected network access"); });
  assert.ok(result.errors.length >= 3);
  assert.equal(result.domainVerified, false);
});

test("Sender needs an owned domain, not Gmail or resend.dev", async () => {
  for (const from of ["onboarding@resend.dev", "x@sub.resend.dev", "x@gmail.com", "x@ton-domaine.fr", "Name <x@prepatempo.test>", "x@prepatempo.test\r\nBcc:x@other.test"]) {
    const result = await checkRecoveryEmail({ ...emailEnv, EMAIL_FROM: from }, async () => { throw new Error("Unexpected request"); });
    assert.ok(result.errors.length, from);
  }
});

test("Domain identity, sending permission and tracking are checked", async () => {
  assert.equal((await checkRecoveryEmail(emailEnv, response(verified))).domainVerified, true);
  for (const change of [{ name: "other.test" }, { status: "pending" }, { capabilities: { sending: "disabled" } }, { open_tracking: true }, { click_tracking: true }]) {
    const result = await checkRecoveryEmail(emailEnv, response({ ...verified, ...change }));
    assert.ok(result.errors.length);
    assert.equal(result.domainVerified, false);
  }
});

test("Restricted sending keys and provider failures never leak secrets or fake success", async () => {
  const limited = await checkRecoveryEmail(emailEnv, async () => new Response("private-test-key", { status: 403 }));
  assert.equal(limited.domainVerified, false);
  assert.equal(limited.warnings.length, 1);
  const failed = await checkRecoveryEmail(emailEnv, async () => { throw new Error("private-test-key"); });
  assert.equal(failed.domainVerified, false);
  assert.ok(failed.errors.length);
  assert.ok(!JSON.stringify([limited, failed]).includes("private-test-key"));
});

test("Recovery message has accessible HTML, plain text and an escaped one-use link", () => {
  const { createRecoveryEmail } = createAppLoader({})("src/lib/recovery-email.ts");
  const link = "https://prepa.example.test/reset-password?token=abc&extra=\"<script>";
  const result = createRecoveryEmail(link);
  assert.ok(result.text.includes(link));
  assert.ok(result.text.includes("une heure"));
  assert.ok(result.html.includes("Réinitialiser le mot de passe"));
  assert.ok(result.html.includes("&amp;extra=&quot;&lt;script&gt;"));
  assert.ok(!result.html.includes("<script>"));
});

test("Runtime also refuses test-only senders and unsafe recovery URLs", () => {
  const keys = ["RESEND_API_KEY", "EMAIL_FROM"];
  const saved = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  let appUrl = "https://prepa.example.test";
  const mail = createAppLoader({ "./app-config": { getPublicAppUrl: () => appUrl } })("src/lib/mail.ts");
  try {
    process.env.RESEND_API_KEY = "test-key";
    process.env.EMAIL_FROM = emailEnv.EMAIL_FROM;
    assert.equal(mail.isRecoveryEmailConfigured(), true);
    for (const from of ["onboarding@resend.dev", "x@sub.resend.dev", "x@gmail.com", "x@ton-domaine.fr"]) {
      process.env.EMAIL_FROM = from;
      assert.equal(mail.isRecoveryEmailConfigured(), false);
    }
    process.env.EMAIL_FROM = emailEnv.EMAIL_FROM;
    for (const url of ["http://prepa.example.test", "https://localhost", "https://user:password@prepa.example.test", "https://prepa.example.test?token=x", "https://prepa.example.test#x"]) {
      appUrl = url;
      assert.equal(mail.isRecoveryEmailConfigured(), false);
    }
  } finally {
    for (const key of keys) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  }
});

test("Confirmed publisher and contact are present but missing legal details remain flagged", () => {
  const keys = Object.keys(process.env).filter((key) => key.startsWith("NEXT_PUBLIC_LEGAL_") || /NEXT_PUBLIC_(SUPPORT_EMAIL|PRIVACY_EMAIL|PUBLICATION_DIRECTOR|HOSTING_|STORAGE_LEGAL_)/.test(key));
  const saved = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  for (const key of keys) delete process.env[key];
  try {
    const load = createAppLoader({ "./app-config": { getPublicAppUrl: () => "https://prepa.example.test" } });
    const getConfig = load("src/lib/public-site.ts").getPublicSiteConfig;
    const site = getConfig();
    assert.equal(site.legalName, "Clément Peyranne");
    assert.equal(site.publicationDirector, site.legalName);
    assert.equal(site.supportEmail, "prepacoach7@gmail.com");
    assert.equal(site.isIncomplete, true);
    process.env.NEXT_PUBLIC_LEGAL_NAME = "Éditeur à renseigner";
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL = "support@ton-domaine.fr";
    assert.equal(getConfig().legalName, site.legalName);
    assert.equal(getConfig().supportEmail, site.supportEmail);
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL = "contact@other.prepatempo.test";
    assert.equal(getConfig().supportEmail, "contact@other.prepatempo.test");
    process.env.NEXT_PUBLIC_LEGAL_ADDRESS = "Adresse complète";
    process.env.NEXT_PUBLIC_LEGAL_PHONE = "Téléphone à renseigner";
    assert.equal(getConfig().isIncomplete, true);
    process.env.NEXT_PUBLIC_LEGAL_ADDRESS = "Coordonnees de test uniquement";
    process.env.NEXT_PUBLIC_LEGAL_PHONE = "+33100000000";
    assert.equal(getConfig().isIncomplete, true, "The host phone still needs verification");
    process.env.NEXT_PUBLIC_HOSTING_PHONE = "+10000000000";
    assert.equal(getConfig().isIncomplete, false);
    process.env.NEXT_PUBLIC_LEGAL_REGISTRATION = "SIREN ou autre immatriculation, si applicable";
    assert.equal(getConfig().legalRegistration, "");
    process.env.NEXT_PUBLIC_HOSTING_ADDRESS = "À compléter";
    assert.equal(getConfig().hostingAddress, site.hostingAddress);
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL = "not-an-email";
    assert.equal(getConfig().isIncomplete, true);
  } finally {
    for (const key of [...keys, "NEXT_PUBLIC_LEGAL_NAME", "NEXT_PUBLIC_LEGAL_REGISTRATION", "NEXT_PUBLIC_SUPPORT_EMAIL", "NEXT_PUBLIC_LEGAL_ADDRESS", "NEXT_PUBLIC_LEGAL_PHONE", "NEXT_PUBLIC_HOSTING_ADDRESS", "NEXT_PUBLIC_HOSTING_PHONE"]) delete process.env[key];
    Object.assign(process.env, saved);
  }
});
