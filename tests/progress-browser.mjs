import { chromium, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

const base = process.env.PREPA_TEST_URL || "http://localhost:3107";
const databaseUrl = process.env.PREPA_TEST_DATABASE || "";
if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname) || !/^file:\/.*\/prepa-journeys-[^/]+\/test.db$/.test(databaseUrl)) throw new Error("Disposable local test database required");
const db = new PrismaClient({ datasourceUrl: databaseUrl });
const createdIds = [];
let browser;
try {
  const student = await db.user.findUniqueOrThrow({ where: { email: "student@example.test" } });
  const maths = await db.subject.findUniqueOrThrow({ where: { code: "MATHS" } });
  const esh = await db.subject.findUniqueOrThrow({ where: { code: "ESH" } });
  for (const [index, score] of [0, 12, 12, 12, 12, 12, 18, 16, 20].entries()) {
    const id = `progress-browser-${crypto.randomUUID()}`;
    createdIds.push(id);
    await db.studentGrade.create({ data: {
      id, studentId: student.id, subjectId: index === 8 ? esh.id : maths.id,
      title: index === 8 ? "Note hors parcours" : `Evaluation navigateur ${index}`,
      score, maxScore: 20, teacherName: "Professeur test",
      sourceType: index === 7 ? "mock_exam" : "teacher_entry",
      capturedAt: new Date(`2026-${index === 6 ? "04" : "10"}-${String(index + 1).padStart(2, "0")}T12:00:00Z`)
    } });
  }
  const allMathGrades = await db.studentGrade.findMany({ where: { studentId: student.id, subjectId: maths.id } });
  const firstSemester = allMathGrades.filter((grade) => grade.capturedAt.getMonth() >= 8 || grade.capturedAt.getMonth() === 0);
  const expectedAverage = firstSemester.reduce((sum, grade) => sum + grade.score / grade.maxScore * 20, 0) / firstSemester.length;
  browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${base}/login`);
  await page.locator('[name="email"]').fill("student@example.test");
  await page.locator('[name="password"]').fill("new-password-123");
  await page.getByRole("button", { name: "Se connecter", exact: true }).click();
  await expect(page).not.toHaveURL(/\/login/);
  await page.goto(`${base}/dashboard`);
  for (const name of ["Repères", "Programme du jour", "Points à renforcer", "Prochaines échéances"]) await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Classement anonyme", exact: true })).toHaveCount(1);
  await page.goto(`${base}/progress`);
  await expect(page.locator("[data-subject]")).toHaveCount(5);
  await expect(page.locator('[data-subject="ESH"]')).toHaveCount(0);
  const mathsCard = page.locator('[data-subject="Maths approfondies"]');
  await expect(mathsCard.getByText(`${expectedAverage.toFixed(1)}/20`, { exact: true })).toBeVisible();
  await expect(mathsCard.locator("svg circle")).toHaveCount(5);
  await expect(page.getByText("Note hors parcours", { exact: true })).toHaveCount(0);
  const note = page.getByRole("button", { name: /Evaluation navigateur 5/ });
  await note.click();
  await expect(note).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByText("Professeur : Professeur test", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Semestre 2", exact: true }).click();
  await expect(mathsCard.getByText("18.0/20", { exact: true })).toBeVisible();
  await expect(mathsCard.locator("svg circle")).toHaveCount(1);
  await expect(note).toHaveCount(0);
  await page.getByRole("button", { name: "Concours blancs", exact: true }).click();
  await expect(mathsCard.getByText("16.0/20", { exact: true })).toBeVisible();
  await expect(mathsCard.locator("svg circle")).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "Bilan par matière", exact: true })).toBeVisible();
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  }
  await page.screenshot({ path: "/tmp/prepatempo-progression-mobile.png" });
  expect(errors).toEqual([]);
  console.log("PASS: titres directs, cinq matieres, moyenne complete, filtre commun, details de note et mobile");
} finally {
  if (browser) await browser.close();
  if (createdIds.length) await db.studentGrade.deleteMany({ where: { id: { in: createdIds } } });
  await db.$disconnect();
}
