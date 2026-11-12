import assert from "node:assert/strict";
import { test } from "node:test";
import { createAppLoader } from "./load-app.mjs";

const { buildProgressSummary } = createAppLoader({})("src/lib/progress-summary.ts");
const grade = (id, score, extra = {}) => ({ id: String(id), title: `Devoir ${id}`, subject: "Maths appliquées", score, dateLabel: `${id} oct.`, capturedAtIso: `2026-10-${String(id).padStart(2, "0")}T12:00:00.000Z`, teacherName: "Professeur", sourceType: "teacher_entry", sourceLabel: "Devoir", semesterLabel: "Semestre 1", ...extra });
const subjects = ["Maths appliquées", "ESH", "Anglais", "Espagnol", "Culture générale"];

test("La moyenne utilise toutes les notes, pas seulement les cinq points affiches", () => {
  const result = buildProgressSummary([grade(1, 0), ...[2, 3, 4, 5, 6].map((id) => grade(id, 12))], subjects, "Semestre 1");
  assert.equal(result.selectedAverage, 10);
  assert.equal(result.subjectCharts[0].average, 10);
  assert.equal(result.subjectCharts[0].count, 6);
  assert.equal(result.subjectCharts[0].points.length, 5);
  assert.equal(result.subjectCharts[0].points[0].id, "2");
  assert.match(result.visualReading.consolidateAreas[0], /10.0\/20/);
});

test("Semestre et concours blancs filtrent ensemble courbes, moyennes, bilan et tableau", () => {
  const grades = [grade(1, 9), grade(2, 13), grade(3, 15, { semesterLabel: "Semestre 2" }), grade(4, 19, { sourceType: "mock_exam" })];
  const first = buildProgressSummary(grades, subjects, "Semestre 1");
  assert.equal(first.filteredGrades.length, 3);
  assert.equal(first.subjectCharts[0].count, 3);
  const second = buildProgressSummary(grades, subjects, "Semestre 2");
  assert.equal(second.selectedAverage, 15);
  assert.deepEqual(second.subjectCharts[0].points.map((point) => point.id), ["3"]);
  const mock = buildProgressSummary(grades, subjects, "Concours blancs");
  assert.equal(mock.selectedAverage, 19);
  assert.equal(mock.filteredGrades.length, 1);
  assert.equal(mock.subjectCharts[0].status, "Premier résultat");
  assert.equal(mock.visualReading.strongAreas.length, 0);
});

test("Les matieres hors parcours ne participent ni aux moyennes ni au bilan", () => {
  const result = buildProgressSummary([grade(1, 10), grade(2, 20, { subject: "HGG" }), grade(3, 20, { subject: "Allemand" })], subjects, "Semestre 1");
  assert.equal(result.selectedAverage, 10);
  assert.equal(result.filteredGrades.length, 1);
  assert.deepEqual(result.subjectCharts.map((subject) => subject.subject), subjects);
});

test("Pas de diagnostic ni de moyenne fictive en l'absence de notes", () => {
  const result = buildProgressSummary([], subjects, "Semestre 2");
  assert.equal(result.selectedAverage, null);
  assert.equal(result.subjectCharts.length, 5);
  assert.ok(result.subjectCharts.every((subject) => subject.average === null && subject.status === "Sans note"));
  assert.deepEqual(result.visualReading, { strongAreas: [], watchAreas: [], consolidateAreas: [] });
});

test("Les courbes sont chronologiques, les notes recentes d'abord, sans mutation des donnees", () => {
  const grades = [grade(4, 12), grade(1, 14), grade(3, 15), grade(2, 13)];
  const before = structuredClone(grades);
  const result = buildProgressSummary(grades, subjects, "Semestre 1");
  assert.deepEqual(result.filteredGrades.map((grade) => grade.id), ["4", "3", "2", "1"]);
  assert.deepEqual(result.subjectCharts[0].points.map((point) => point.id), ["1", "2", "3", "4"]);
  assert.deepEqual(grades, before);
  assert.ok(result.visualReading.watchAreas.some((text) => /en baisse/.test(text)));
});

test("Un vrai zero compte ; une note invalide ne contamine pas les calculs", () => {
  const result = buildProgressSummary([grade(1, 0), grade(2, NaN), grade(3, 25)], subjects, "Semestre 1");
  assert.equal(result.selectedAverage, 0);
  assert.equal(result.filteredGrades.length, 1);
});
