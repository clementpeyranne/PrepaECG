import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { createAppLoader } from "./load-app.mjs";

const catalog = JSON.parse(readFileSync(new URL("../src/data/math-annals.json", import.meta.url), "utf8"));
const { filterMathAnnals, mathExamCategories, annalSourceName } = createAppLoader({})("src/lib/math-annals.ts");
const defaults = { track: "appliquees", category: "all", year: "all", query: "", correctedOnly: false };

test("Chaque filiere couvre les cinq concours de 2000 a 2026", () => {
  assert.equal(new Set(catalog.records.map((record) => record.id)).size, catalog.records.length);
  for (const track of ["appliquees", "approfondies"]) {
    for (const { id: category } of mathExamCategories) {
      for (let year = 2000; year <= 2026; year++) {
        const records = filterMathAnnals(catalog.records, { ...defaults, track, category, year: String(year) });
        assert.ok(records.length, `${track} ${category} ${year}`);
        assert.ok(records.every((record) => record.subject), `Sujet manquant : ${track} ${category} ${year}`);
      }
    }
  }
});

test("Les documents ont une provenance et une verification, sans faux lien de corrige", () => {
  for (const record of catalog.records) {
    assert.ok(["ECE", "ECS", null].includes(record.legacy));
    assert.equal(record.legacy, record.year < 2023 ? record.track === "appliquees" ? "ECE" : "ECS" : null);
    for (const kind of ["subject", "correction"]) {
      const document = record[kind];
      if (!document) continue;
      assert.ok(["https:", "http:"].includes(new URL(document.url).protocol));
      assert.ok(document.sourcePage.startsWith("https://"));
      assert.ok(Number.isFinite(Date.parse(document.checkedAt)));
      assert.ok(["pdf", "page"].includes(document.format));
    }
    if (record.correction) assert.notEqual(record.subject?.url, record.correction.url);
  }
  const wrong2026 = catalog.records.find((record) => record.id === "appliquees-maths-2-2026");
  assert.ok(!wrong2026.correction?.url.includes("298-MATHEMATIQUES_APPLIQUEES_EDHEC_BS"));
  assert.ok(!catalog.records.find((record) => record.id === "appliquees-ecricome-2014").subject.url.includes("2000"));
});

test("Recherche insensible aux accents et aux espaces, filtres combines", () => {
  const records = filterMathAnnals(catalog.records, { ...defaults, query: "ÉM Lyon", year: "2023", correctedOnly: true });
  assert.equal(records.length, 1);
  assert.equal(records[0].id, "appliquees-emlyon-2023");
  assert.equal(filterMathAnnals(catalog.records, { ...defaults, query: "introuvable" }).length, 0);
});

test("Un corrige absent reste absent et le filtre l'exclut", () => {
  const missing = { ...catalog.records[0], correction: null, track: "appliquees" };
  assert.equal(filterMathAnnals([missing], defaults).length, 1);
  assert.equal(filterMathAnnals([missing], { ...defaults, correctedOnly: true }).length, 0);
});

test("Les trois versions EDHEC 2018 ne melangent pas leurs corrections", () => {
  const papers = filterMathAnnals(catalog.records, { ...defaults, track: "approfondies", category: "edhec", year: "2018" });
  assert.equal(papers.length, 3);
  assert.equal(new Set(papers.map((paper) => paper.subject.url)).size, 3);
  assert.equal(new Set(papers.map((paper) => paper.correction.url)).size, 3);
  assert.match(papers.find((paper) => paper.id.includes("annule")).correction.url, /197zyyed4HeeYzxfefIUt3XxuMkhZtxev/);
});

test("Les annees recentes et anciennes restent accessibles sans melange de filieres", () => {
  for (const track of ["appliquees", "approfondies"]) {
    const records = filterMathAnnals(catalog.records, { ...defaults, track });
    assert.ok(records.every((record) => record.track === track));
    assert.equal(records[0].year, 2026);
    assert.equal(records.at(-1).year, 2000);
  }
  assert.equal(annalSourceName("https://www.annales-prepa.fr/a.pdf"), "Annales-Prépa");
});
