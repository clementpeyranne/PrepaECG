import assert from "node:assert/strict";
import { test } from "node:test";
import { createAppLoader } from "./load-app.mjs";

const { getAcademicPath, getActiveSubjectCodes, getAcademicSubjectLabel, getPrepTask, isLegacyPlanningTitle } = createAppLoader({})("src/lib/academic-path.ts");

test("Chaque combinaison de parcours contient exactement cinq matieres", () => {
  for (const humanities of ["ESH", "HGG"]) for (const maths of ["APPLIQUEES", "APPROFONDIES"]) for (const lv2 of ["ESPAGNOL", "ALLEMAND", "ITALIEN"]) {
    const profile = { academicPath: { humanities, maths }, languagePreferences: { lv2 } };
    const codes = getActiveSubjectCodes(profile);
    assert.equal(new Set(codes).size, 5);
    assert.ok(codes.includes(humanities));
    assert.ok(!codes.includes(humanities === "ESH" ? "HGG" : "ESH"));
    assert.equal(getAcademicSubjectLabel("MATHS", profile), maths === "APPLIQUEES" ? "Maths appliquées" : "Maths approfondies");
  }
});

test("Les anciens profils restent lisibles sans migration ni valeurs invalides", () => {
  assert.deepEqual(getAcademicPath(null), { humanities: "ESH", maths: "APPLIQUEES" });
  assert.deepEqual(getAcademicPath({ academicPath: { humanities: "AUTRE", maths: null } }), getAcademicPath(null));
  assert.deepEqual(getActiveSubjectCodes({ languagePreferences: { lv2: "ALLEMAND" } }), ["MATHS", "ESH", "ANG", "ALL", "CG"]);
});

test("Les routines ne creent pas de faux devoirs, titres generiques ou numeros d'exercices", () => {
  for (const code of ["MATHS", "ESH", "HGG", "CG", "ANG", "ESP", "ITA", "ALL"]) {
    for (const type of ["CHAPTER_REVISION", "FLASHCARDS_REVIEW", "ESSAY_PRACTICE"]) for (let day = 0; day < 7; day++) {
      const title = getPrepTask(code, type, day);
      assert.ok(title.length > 20);
      assert.ok(!isLegacyPlanningTitle(title));
      assert.ok(!/exercice \d|demain|lundi|HEC/.test(title));
    }
  }
  assert.ok(isLegacyPlanningTitle("Bloc de progression Maths"));
  assert.ok(!isLegacyPlanningTitle("DM matrices donné par le professeur"));
  assert.match(getPrepTask("MATHS", "ESSAY_PRACTICE"), /Résoudre/);
});
