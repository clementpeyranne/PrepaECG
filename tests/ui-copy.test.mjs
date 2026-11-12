import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { createAppLoader } from "./load-app.mjs";

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const uiFiles = ["src/app", "src/components"].flatMap((dir) => readdirSync(new URL(`../${dir}`, import.meta.url), { recursive: true })
  .filter((path) => path.endsWith(".tsx")).map((path) => `${dir}/${path}`));

test("Le nom public est Prepatempo, sans exposer les anciens textes de conception", () => {
  for (const file of uiFiles) {
    const text = source(file);
    for (const old of ["Prepa ECG OS", "Prépa ECG OS", "Boucle produit", "volontairement sobre", "Un moteur de flashcards"]) assert.ok(!text.includes(old), `${file}: ${old}`);
    assert.ok(!/(?:title|actionLabel|label)="(?:Mon|Ma|Mes)\b/.test(text), file);
  }
  const load = createAppLoader({ "./app-config": { getPublicAppUrl: () => "https://example.test" } });
  assert.equal(load("src/lib/public-site.ts").getPublicSiteConfig().appName, "Prépatempo");
  const manifest = load("src/app/manifest.ts").default();
  assert.equal(manifest.name, "Prépatempo");
  assert.equal(manifest.short_name, "Prépatempo");
  assert.ok(source("public/offline.html").includes("<title>Prépatempo · Hors connexion</title>"));
  assert.ok(source("src/lib/mail.ts").includes('subject: "Prépatempo - Réinitialiser le mot de passe"'));
});

test("La correction des accents ne modifie pas les adresses des pages", () => {
  const { studentNavigation, teacherNavigation, adminNavigation } = createAppLoader({})("src/lib/navigation.ts");
  for (const item of [...studentNavigation, ...teacherNavigation, ...adminNavigation]) assert.ok(/^[\x20-\x7E]+$/.test(item.href));
  assert.ok(studentNavigation.some((item) => item.href === "/actualites" && item.label === "Actualités"));
  assert.ok(source("src/components/public/public-footer-links.tsx").includes('href: "/mentions-legales"'));
});

test("Les decks et les avertissements utiles sont conserves", () => {
  assert.ok(source("src/app/(student)/flashcards/page.tsx").includes('title="Nouveau deck"'));
  assert.ok(source("src/app/(student)/essays/[essayId]/page.tsx").includes("Note indicative"));
  assert.ok(source("src/app/(public)/confidentialite/page.tsx").includes("ne remplace pas le professeur"));
  assert.ok(source("src/components/public/public-page-shell.tsx").includes("site.isIncomplete"));
  assert.ok(source("src/app/(public)/forgot-password/page.tsx").includes("pas encore disponible"));
});
