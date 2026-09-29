import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, rm, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { zipSync } from "fflate";
import { createAppLoader, root } from "./load-app.mjs";

test("Parcours comptes, documents, corrections et flashcards sur une base isolee", async (t) => {
  const dir = await mkdtemp(path.join(tmpdir(), "prepa-journeys-"));
  const originalCwd = process.cwd();
  const previousEnv = { ...process.env };
  const previousFetch = globalThis.fetch;
  await writeFile(path.join(dir, "test.db"), "");
  Object.assign(process.env, {
    APP_MODE: "production", NODE_ENV: "production", AUTH_SECRET: "test-secret-only-not-production",
    DATABASE_URL: `file:${dir}/test.db`, FILE_STORAGE_DRIVER: "local", PASSWORD_RESET_MODE: "support",
    NEXT_PUBLIC_APP_URL: "https://prepa.example.test", RESEND_API_KEY: "", OPENAI_API_KEY: "", VERCEL: ""
  });
  execFileSync(path.join(root, "node_modules/.bin/prisma"), ["db", "push", "--schema", path.join(root, "prisma/schema.prisma"), "--skip-generate"], { env: process.env, stdio: "pipe" });
  const db = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });
  process.chdir(dir);
  let cookie;
  const sessions = new Map();
  const objects = new Map();
  let uploadPath;
  let lastAiReviewInput;
  const mocks = {
    react: { cache: (fn) => fn }, "./db": { prisma: db },
    "@/lib/db": { prisma: db }, "next/cache": { revalidatePath: () => {} },
    "next/headers": {
      headers: async () => new Headers(),
      cookies: async () => ({
        get: () => cookie ? { value: cookie } : undefined,
        set: (_, value) => { cookie = value; }, delete: () => { cookie = undefined; }
      })
    },
    "./supabase-admin": { getSupabaseAdminClient: () => ({ storage: { from: () => ({
      createSignedUploadUrl: async (key) => { uploadPath = key; return { data: { signedUrl: `https://storage.example.test/${key}` }, error: null }; },
      download: async (key) => ({ data: objects.has(key) ? new Blob([objects.get(key)]) : null, error: objects.has(key) ? null : new Error("missing") }),
      createSignedUrl: async (key) => ({ data: { signedUrl: `https://storage.example.test/read/${key}` }, error: null })
    }) } }) }
  };
  const load = createAppLoader(mocks);
  const auth = load("src/lib/auth.ts");
  const refs = load("src/lib/reference-data.ts");
  const ai = load("src/lib/ai.ts");
  const aiTasks = load("src/lib/ai-task-catalog.ts");
  mocks["./ai"] = {
    ...ai,
    generateEssayReview: async (input) => {
      lastAiReviewInput = input;
      return {
        scoreMin: 10,
        scoreMax: 12,
        overview: "La copie doit gagner en precision.",
        strengths: ["Structure visible"],
        mistakes: ["Definitions trop vagues"],
        nextSteps: ["Reprendre les definitions du chapitre"],
        planningSignals: ["Precision des notions"]
      };
    }
  };
  mocks["./student-app"] = { ensureDemoStudent: async () => {
    const user = await auth.requireRole(["STUDENT", "ADMIN"]);
    const membership = await auth.getCurrentUserClass(user.id);
    if (!membership) throw new Error("CLASS_REQUIRED");
    return { user, prepClass: membership.class, subjects: (await refs.ensureReferenceData()).subjects };
  } };
  const resources = load("src/lib/resources.ts");
  const essays = load("src/lib/essays.ts");
  const assistant = load("src/lib/assistant.ts");
  const cards = load("src/lib/flashcards.ts");
  const storage = load("src/lib/storage.ts");
  const limits = load("src/lib/auth-rate-limit.ts");
  const mail = load("src/lib/mail.ts");
  const signup = (email, role = "STUDENT", code = "PREPA-A", invitationToken = "") => auth.registerUser({
    email, firstName: "Test", lastName: "Parcours", password: "test-password-123", role, accessCode: code, invitationToken
  });
  const invite = async (email, classId, options = {}) => {
    const token = randomBytes(32).toString("hex");
    await db.teacherInvitation.create({ data: {
      email, classId, tokenHash: createHash("sha256").update(token).digest("hex"),
      expiresAt: new Date(Date.now() + 60000), ...options
    } });
    return token;
  };
  const use = (user) => { cookie = sessions.get(user.id); };
  let prepA, prepB, student, studentB, teacher, teacher2, teacherB, chapter, otherChapter, essayId, resourceId, rootDeck, subDeck, share;
  const pdf = new File(["%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF"], "copie.pdf", { type: "application/pdf" });
  const pngBytes = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j8ioAAAAASUVORK5CYII=", "base64");

  try {
    await t.test("un code inconnu ne cree pas d'etablissement", async () => {
      assert.equal((await signup("unknown@example.test")).ok, false);
      assert.equal(await db.class.count(), 0);
      prepA = await db.class.create({ data: { name: "A", yearLabel: "2026", track: "ECG", accessCode: "PREPA-A" } });
      prepB = await db.class.create({ data: { name: "B", yearLabel: "2026", track: "ECG", accessCode: "PREPA-B" } });
    });
    await t.test("un eleve ne peut pas se declarer professeur ou administrateur", async () => {
      assert.equal((await signup("fake-prof@example.test", "TEACHER")).ok, false);
      assert.equal((await signup("fake-admin@example.test", "ADMIN")).ok, false);
      assert.equal(await db.user.count(), 0);
    });
    await t.test("invitation liee a une adresse et a une prepa, expiree ou revoquee refusee", async () => {
      const token = await invite("teacher@example.test", prepA.id);
      assert.equal((await signup("intruder@example.test", "TEACHER", "PREPA-A", token)).ok, false);
      assert.equal((await signup("teacher@example.test", "TEACHER", "PREPA-B", token)).ok, false);
      for (const options of [{ expiresAt: new Date(0) }, { usedAt: new Date() }]) {
        const invalid = await invite("invalid@example.test", prepA.id, options);
        assert.equal((await signup("invalid@example.test", "TEACHER", "PREPA-A", invalid)).ok, false);
      }
      const result = await signup("teacher@example.test", "TEACHER", "PREPA-A", token);
      assert.equal(result.ok, true);
      teacher = result.user; sessions.set(teacher.id, cookie);
      assert.equal((await signup("teacher@example.test", "TEACHER", "PREPA-A", token)).ok, false);
      assert.equal(await db.classMembership.count({ where: { userId: teacher.id, classId: prepA.id } }), 1);
    });
    await t.test("creation d'eleves et de professeurs dans deux prepas", async () => {
      for (const [email, role, prep] of [
        ["student@example.test", "STUDENT", prepA], ["student-b@example.test", "STUDENT", prepB],
        ["teacher2@example.test", "TEACHER", prepA], ["teacher-b@example.test", "TEACHER", prepB]
      ]) {
        const token = role === "TEACHER" ? await invite(email, prep.id) : "";
        const result = await signup(email, role, prep.accessCode, token);
        assert.equal(result.ok, true); sessions.set(result.user.id, cookie);
        if (email.startsWith("student@")) student = result.user;
        if (email.startsWith("student-b")) studentB = result.user;
        if (email.startsWith("teacher2")) teacher2 = result.user;
        if (email.startsWith("teacher-b")) teacherB = result.user;
      }
      await resources.ensureDemoResources();
      chapter = await db.chapter.findUnique({ where: { slug: "esh-croissance" } });
      otherChapter = await db.chapter.findUnique({ where: { slug: "maths-probabilites" } });
    });
    await t.test("connexion, refus du mauvais mot de passe et deconnexion", async () => {
      await auth.signOut(); assert.equal(await auth.getCurrentUser(), null);
      assert.equal((await auth.loginUser({ email: student.email, password: "wrong" })).ok, false);
      assert.equal((await auth.loginUser({ email: student.email, password: "test-password-123" })).ok, true);
      assert.equal((await auth.getCurrentUser()).id, student.id); sessions.set(student.id, cookie);
    });
    await t.test("moteur IA: toutes les missions ont un contrat de donnees et de sortie", async () => {
      const catalog = aiTasks.getAITaskCatalog();
      for (const taskId of ["assistant_reply", "essay_review", "planning_guidance", "resource_summary", "resource_sheet", "resource_flashcards", "weekly_review"]) {
        const task = catalog.find((entry) => entry.id === taskId);
        assert.ok(task, `Mission IA manquante : ${taskId}`);
        assert.ok(task.inputSources.length > 0);
        assert.ok(task.outputs.length > 0);
        assert.ok(task.writes.length > 0);
      }
      const weeklyReview = await ai.generateWeeklyReview({
        userId: student.id,
        completedMinutes: 120,
        completedBlocks: 3,
        reviewedFlashcards: 24,
        dueFlashcards: 5,
        recentGrades: [{ subject: "ESH", score: 13 }],
        weakPointLabels: ["Precision des definitions"],
        completedTaskTitles: ["Revoir le chapitre croissance"]
      });
      assert.match(weeklyReview.summary, /3 blocs/);
      assert.ok(weeklyReview.focusAreas.includes("Precision des definitions"));
    });

    const planning = load("src/lib/student-app.ts");
    const planningActions = load("src/app/(student)/planning/actions.ts");
    const blockForm = (id, forceMissingSubmission = false) => {
      const form = new FormData(); form.set("entryId", id); form.set("plannedDurationMin", "9999");
      if (forceMissingSubmission) form.set("confirmMissingSubmission", "yes");
      return form;
    };
    let initialDay;
    await t.test("planning: valider un bloc conserve la journee entiere et les autres jours", async () => {
      use(student);
      await db.studentProfile.create({ data: { userId: student.id, classId: prepA.id, prepYear: 1, targetExams: { bceSchools: ["HEC"], ecricomeSchools: [] } } });
      const before = await planning.getStudentPlanningData();
      initialDay = before.todayPlan;
      assert.equal(before.week.length, 7);
      assert.ok(initialDay.entries.length > 1);
      assert.deepEqual(await planningActions.markPlanningSessionDone(blockForm(initialDay.entries[0].id)), { ok: false, reason: "missing_copy" });
      assert.equal(await db.studySession.count({ where: { studentId: student.id } }), 0);
      assert.deepEqual(await planningActions.markPlanningSessionDone(blockForm(initialDay.entries[0].id, true)), { ok: true });
      const after = await planning.getStudentPlanningData();
      assert.deepEqual(after.todayPlan.entries.map((entry) => entry.id), initialDay.entries.map((entry) => entry.id));
      assert.equal(after.todayPlan.entries[0].status, "COMPLETED");
      assert.ok(after.todayPlan.entries.every((entry) => entry.persisted));
      assert.ok(after.todayPlan.entries.slice(1).every((entry) => entry.status === "PLANNED"));
      assert.deepEqual(after.week.filter((day) => !day.isToday), before.week.filter((day) => !day.isToday));
      const saved = await db.studySession.findUnique({ where: { id: initialDay.entries[0].id } });
      assert.equal(saved.actualDurationMin, initialDay.entries[0].duration, "La duree vient du planning serveur, pas du formulaire");
    });
    await t.test("planning: nouvelle validation sans doublon, autre bloc puis annulation persistante", async () => {
      await planningActions.markPlanningSessionDone(blockForm(initialDay.entries[0].id, true));
      assert.deepEqual(await planningActions.markPlanningSessionDone(blockForm(initialDay.entries[1].id)), { ok: false, reason: "flashcards_time_required" });
      const planningSubject = await db.subject.findFirst({ where: { code: "ESH" } });
      const planningDeck = await db.flashcardDeck.create({ data: { ownerUserId: student.id, classId: prepA.id, subjectId: planningSubject.id, title: "Planning", createdByType: "MANUAL" } });
      const planningCard = await db.flashcard.create({ data: { deckId: planningDeck.id, frontText: "Planning ?", backText: "Fait", position: 1 } });
      await cards.reviewFlashcard({ cardId: planningCard.id, deckId: planningDeck.id, rating: "EASY", planningEntryId: initialDay.entries[1].id });
      assert.deepEqual(await planningActions.markPlanningSessionDone(blockForm(initialDay.entries[1].id)), { ok: false, reason: "flashcards_time_required" }, "Une seule carte ne suffit pas a valider le bloc");
      const firstHeartbeat = await planningActions.recordFlashcardFocusHeartbeat(initialDay.entries[1].id);
      assert.equal(firstHeartbeat.ok, true);
      assert.equal(firstHeartbeat.elapsedSeconds, 0);
      await db.studySession.update({
        where: { id: initialDay.entries[1].id },
        data: {
          usefulnessFeedback: `flashcard-focus:v1:${JSON.stringify({
            elapsedSeconds: initialDay.entries[1].duration * 60 - 10,
            heartbeatAt: new Date(Date.now() - 10_500).toISOString()
          })}`
        }
      });
      const completedHeartbeat = await planningActions.recordFlashcardFocusHeartbeat(initialDay.entries[1].id);
      assert.equal(completedHeartbeat.ok, true);
      assert.equal(completedHeartbeat.complete, true);
      const focusedPlanning = await planning.getStudentPlanningData();
      assert.equal(focusedPlanning.todayPlan.entries[1].hasCompletedFlashcardTime, true);
      assert.ok(focusedPlanning.todayPlan.entries[1].flashcardFocusSeconds >= initialDay.entries[1].duration * 60);
      assert.deepEqual(await planningActions.markPlanningSessionDone(blockForm(initialDay.entries[1].id)), { ok: true });
      assert.equal(await db.studySession.count({ where: { studentId: student.id } }), initialDay.entries.length);
      await planningActions.markPlanningSessionPlanned(blockForm(initialDay.entries[0].id));
      const after = await planning.getStudentPlanningData();
      assert.equal(after.todayPlan.entries[0].status, "PLANNED");
      assert.equal(after.todayPlan.entries[1].status, "COMPLETED");
      assert.equal((await db.studySession.findUnique({ where: { id: initialDay.entries[0].id } })).actualDurationMin, null);
      const dashboard = await planning.getStudentDashboardData();
      assert.equal(dashboard.anonymousRanking.windows.find((window) => window.id === "today").userMinutes, initialDay.entries[1].duration);
    });
    await t.test("planning: un autre jour peut etre valide sans modifier aujourd'hui ni un autre compte", async () => {
      const before = await planning.getStudentPlanningData();
      const anotherDay = before.week.find((day) => !day.isToday);
      await planningActions.markPlanningSessionDone(blockForm(anotherDay.entries[0].id, true));
      const after = await planning.getStudentPlanningData();
      assert.deepEqual(after.todayPlan, before.todayPlan);
      assert.equal(after.week.find((day) => day.dateLabel === anotherDay.dateLabel).entries[0].status, "COMPLETED");
      use(studentB);
      assert.deepEqual(await planningActions.markPlanningSessionDone(blockForm(initialDay.entries[0].id)), { ok: false, reason: "unavailable" });
      assert.equal(await db.studySession.count({ where: { studentId: studentB.id } }), 0);
      use(student);
      assert.deepEqual(await planningActions.markPlanningSessionDone(blockForm("unknown")), { ok: false, reason: "unavailable" });
    });
    await t.test("planning: un bloc futur ne gonfle pas le classement du jour", async () => {
      use(student);
      const before = await planning.getStudentDashboardData();
      const todayMinutes = before.anonymousRanking.windows.find((window) => window.id === "today").userMinutes;
      const schedule = await planning.getStudentPlanningData();
      const endOfToday = new Date(); endOfToday.setHours(24, 0, 0, 0);
      const futureDay = schedule.week.find((day) => day.entries.some((entry) => new Date(entry.plannedStartAt).getTime() >= endOfToday.getTime()));
      assert.ok(futureDay);
      assert.deepEqual(await planningActions.markPlanningSessionDone(blockForm(futureDay.entries[0].id, true)), { ok: true });
      const after = await planning.getStudentDashboardData();
      assert.equal(after.anonymousRanking.windows.find((window) => window.id === "today").userMinutes, todayMinutes);
    });
    await t.test("configuration: modifier le profil conserve le travail et le classement", async () => {
      use(student);
      const completedBefore = await db.studySession.count({ where: { studentId: student.id, status: "COMPLETED" } });
      const minutesBefore = (await planning.getStudentDashboardData()).anonymousRanking.windows.find((window) => window.id === "today").userMinutes;
      await planning.saveStudentOnboarding({
        firstName: "Test", lastName: "Parcours", prepYear: 1, classId: prepA.id, lv2Language: "ESPAGNOL",
        weekdayDailyHours: 3, weekendDailyHours: 5, weekdayStart: "18:00", weekdayEnd: "21:30",
        weekendStart: "09:30", weekendEnd: "14:30", sessionBlockMinutes: 50, shortBreakMinutes: 10,
        longBreakMinutes: 25, breakEveryBlocks: 2, energyLevel: "modere", bacAverage: 14, bacMention: "B",
        subjectAssessments: { MATHS: 11, ESH: 12, HGG: 10, CG: 13, ANG: 14 },
        bacSubjectAssessments: { MATHS: 14, ESH: 14, HGG: 13, CG: 15, ANG: 16 },
        bceSchools: ["HEC"], ecricomeSchools: []
      });
      assert.equal(await db.studySession.count({ where: { studentId: student.id, status: "COMPLETED" } }), completedBefore);
      assert.equal((await planning.getStudentDashboardData()).anonymousRanking.windows.find((window) => window.id === "today").userMinutes, minutesBefore);
      await assert.rejects(planning.saveStudentOnboarding({
        firstName: "Test", lastName: "Parcours", prepYear: 1, classId: prepB.id, lv2Language: "ESPAGNOL",
        weekdayDailyHours: 3, weekendDailyHours: 5, weekdayStart: "18:00", weekdayEnd: "21:30",
        weekendStart: "09:30", weekendEnd: "14:30", sessionBlockMinutes: 50, shortBreakMinutes: 10,
        longBreakMinutes: 25, breakEveryBlocks: 2, energyLevel: "modere",
        subjectAssessments: { MATHS: null, ESH: null, HGG: null, CG: null, ANG: null },
        bacSubjectAssessments: { MATHS: null, ESH: null, HGG: null, CG: null, ANG: null },
        bceSchools: ["HEC"], ecricomeSchools: []
      }), /INVALID_CLASS/);
    });

    const resourceInput = () => ({ title: "Cours ESH", subjectCode: "ESH", chapterId: chapter.id, resourceType: "COURSE", description: "", content: "", file: pdf, aiEnabled: false, submissionKey: "resource-1" });
    const essayInput = () => ({ subjectCode: "ESH", chapterId: chapter.id, teacherId: teacher.id, submissionKey: "essay-1", title: "Dissertation", examType: "Dissertation", targetExam: "BCE", correctionMode: "teacher_only", instructions: "Verifier la structure du plan", planningEntryId: initialDay.entries[2].id, file: pdf });
    await t.test("publication PDF dans la bonne matiere, confirmation et refus d'un doublon", async () => {
      use(teacher);
      assert.equal((await resources.createTeacherResource({ ...resourceInput(), chapterId: otherChapter.id })).status, "invalid");
      const created = await resources.createTeacherResource(resourceInput());
      assert.equal(created.status, "created"); resourceId = created.resourceId;
      assert.equal((await resources.createTeacherResource(resourceInput())).status, "already_exists");
      assert.equal(await db.resource.count(), 1);
      const detail = await resources.getTeacherResourceDetailData(resourceId);
      assert.equal(detail.subject, "ESH");
      const data = await readFile(path.join(dir, "public", detail.fileUrl));
      assert.equal(data.toString(), await pdf.text());
    });
    await t.test("ressources visibles par la bonne prepa et modifiables seulement par leur auteur", async () => {
      use(student); assert.ok(await resources.getResourceDetailData(resourceId));
      use(studentB); assert.equal(await resources.getResourceDetailData(resourceId), null);
      assert.equal((await resources.getResourcesOverviewData()).resources.length, 0);
      use(teacher2); assert.equal(await resources.getTeacherResourceDetailData(resourceId), null);
      assert.equal((await resources.getTeacherResourcesData()).resources.length, 0);
      use(teacherB); assert.equal(await resources.getTeacherResourceDetailData(resourceId), null);
    });
    await t.test("envoi vers une autre prepa et incoherence de matiere refuses", async () => {
      use(student);
      assert.equal((await essays.createEssaySubmission({ ...essayInput(), teacherId: teacherB.id })).status, "invalid");
      assert.equal((await essays.createEssaySubmission({ ...essayInput(), chapterId: otherChapter.id })).status, "invalid");
      assert.equal(await db.essay.count(), 0);
    });
    await t.test("depot PDF, doublon apres rechargement et lecture par le seul professeur destinataire", async () => {
      use(student);
      const result = await essays.createEssaySubmission(essayInput());
      assert.equal(result.status, "created"); essayId = result.essayId;
      assert.equal((await essays.createEssaySubmission(essayInput())).status, "already_exists");
      assert.equal((await essays.createEssaySubmission({ ...essayInput(), submissionKey: "new-form" })).status, "already_exists");
      assert.equal(await db.essay.count(), 1);
      use(teacher); const queue = await essays.getTeacherEssaysQueueData();
      assert.equal(queue.essays.length, 1);
      assert.equal(queue.essays[0].instructions, "Verifier la structure du plan");
      assert.equal((await readFile(path.join(dir, "public", queue.essays[0].fileUrl))).toString(), await pdf.text());
      for (const other of [teacher2, teacherB]) { use(other); assert.equal((await essays.getTeacherEssaysQueueData()).essays.length, 0); }
      use(studentB); assert.equal(await essays.getEssayDetailData(essayId), null);
      use(student);
      assert.equal((await planning.getStudentPlanningData()).todayPlan.entries[2].hasSubmission, true);
      assert.deepEqual(await planningActions.markPlanningSessionDone(blockForm(initialDay.entries[2].id)), { ok: true });
      const beforeFeedback = await planning.getStudentProgressData();
      assert.equal(beforeFeedback.grades.length, 0, "Aucune fausse note ne doit etre injectee en production");
    });
    await t.test("correction IA: les lacunes et la prochaine action alimentent le planning sans doublon", async () => {
      use(teacher);
      const esh = await db.subject.findFirst({ where: { code: "ESH" } });
      assert.deepEqual(await essays.createTeacherRubric({
        subjectId: esh.id,
        title: "Correction IA ESH",
        criteria: "Problematique\nReferences"
      }), { status: "created" });
      use(student);
      await essays.generateEssayAiFeedback(essayId);
      await essays.generateEssayAiFeedback(essayId);
      assert.equal(lastAiReviewInput.rubric.title, "Correction IA ESH");
      assert.deepEqual(lastAiReviewInput.rubric.criteria, ["Problematique", "References"]);
      assert.equal(await db.essayFeedback.count({ where: { essayId, reviewerType: "AI" } }), 1);
      assert.equal(await db.weakPoint.count({ where: { sourceType: `ai_feedback:${essayId}` } }), 1);
      assert.equal(await db.task.count({ where: { sourceType: `ai_feedback:${essayId}` } }), 1);
      const schedule = await planning.getStudentPlanningData();
      assert.ok(schedule.week.flatMap((day) => day.entries).some((entry) => entry.title === "Reprendre les definitions du chapitre"));
    });
    await t.test("photo PNG enregistree et faux PDF executable refuse", async () => {
      use(student);
      const photo = new File([pngBytes], "page.png", { type: "image/png" });
      assert.equal((await essays.createEssaySubmission({ ...essayInput(), file: photo, submissionKey: "photo" })).status, "created");
      const bad = new File(["<script>alert(1)</script>"], "bad.pdf", { type: "application/pdf" });
      assert.equal((await essays.createEssaySubmission({ ...essayInput(), file: bad, submissionKey: "bad" })).status, "invalid");
    });
    const feedback = () => ({ essayId, submissionKey: "feedback", scoreMin: 14, scoreMax: 14, overview: "Progression nette", strengths: "Plan", mistakes: "Exemples", nextSteps: "Revoir les definitions", planningSignals: "Argumentation" });
    await t.test("correction reservee au destinataire, notes valides et anti-doublon", async () => {
      for (const other of [teacher2, teacherB]) { use(other); assert.equal((await essays.addTeacherEssayFeedback(feedback())).status, "invalid"); }
      use(teacher);
      assert.equal((await essays.addTeacherEssayFeedback({ ...feedback(), scoreMax: 30 })).status, "invalid");
      assert.equal((await essays.addTeacherEssayFeedback(feedback())).status, "saved");
      assert.equal((await essays.addTeacherEssayFeedback({ ...feedback(), submissionKey: "new" })).status, "already_exists");
      assert.equal(await db.essayFeedback.count({ where: { essayId, reviewerType: "TEACHER" } }), 1);
      use(student);
      const detail = await essays.getEssayDetailData(essayId);
      assert.equal(detail.teacherFeedback[0].scoreRange, "14/20");
      assert.equal(detail.teacherFeedback[0].overview, "Progression nette");
      const progress = await planning.getStudentProgressData();
      assert.equal(progress.grades.length, 1);
      assert.equal(progress.grades[0].sourceLabel, "Copie corrigee");
      assert.equal(progress.grades[0].score, 14);
      const dashboard = await planning.getStudentDashboardData();
      assert.ok(dashboard.weakPoints.some((point) => point.label === "Argumentation"));
      const schedule = await planning.getStudentPlanningData();
      const feedbackBlock = schedule.week.flatMap((day) => day.entries).find((entry) => entry.title === "Revoir les definitions");
      assert.ok(feedbackBlock?.taskId, "Le retour professeur doit devenir un bloc precis du planning");
      assert.deepEqual(await planningActions.markPlanningSessionDone(blockForm(feedbackBlock.id, true)), { ok: true });
      assert.equal(await db.task.findUnique({ where: { id: feedbackBlock.taskId } }).then((task) => task.status), "done");
      assert.ok(!(await planning.getStudentPlanningData()).upcomingTasks.some((task) => task.title === "Revoir les definitions"));
    });
    await t.test("notes: un professeur alimente le bon eleve sans doublon ni autre prepa", async () => {
      use(teacher);
      const form = await planning.getTeacherGradeEntryData();
      assert.ok(form.students.some((entry) => entry.id === student.id));
      assert.ok(!form.students.some((entry) => entry.id === studentB.id));
      const subject = await db.subject.findFirst({ where: { code: "MATHS" } });
      const input = { studentId: student.id, subjectId: subject.id, title: "DS matrices", score: 12.5, capturedAt: "2026-09-20", sourceType: "teacher_entry" };
      assert.deepEqual(await planning.createTeacherStudentGrade(input), { status: "created" });
      assert.deepEqual(await planning.createTeacherStudentGrade(input), { status: "already_exists" });
      assert.deepEqual(await planning.createTeacherStudentGrade({ ...input, studentId: studentB.id }), { status: "invalid" });
      const hgg = await db.subject.findFirst({ where: { code: "HGG" } });
      assert.deepEqual(await planning.createTeacherStudentGrade({
        ...input,
        subjectId: hgg.id,
        title: "Concours blanc geopolitique",
        score: 9,
        capturedAt: "2026-09-21",
        sourceType: "mock_exam"
      }), { status: "created" });
      use(student);
      const progress = await planning.getStudentProgressData();
      assert.ok(progress.grades.some((grade) => grade.title === "DS matrices" && grade.teacherName === "Test Parcours"));
      assert.ok((await planning.getStudentPlanningData()).week
        .flatMap((day) => day.entries)
        .some((entry) => entry.title === "Reprendre Concours blanc geopolitique"));
      const reply = await assistant.askStudentAssistant({ prompt: "Quelles sont mes notes et mes lacunes ?" });
      assert.match(reply.answer, /12\.5\/20/);
      assert.match(reply.answer, /Argumentation|Precision des notions/);
    });
    await t.test("grilles: l'espace professeur lit de vraies grilles en base", async () => {
      use(teacher);
      const subject = await db.subject.findFirst({ where: { code: "ESH" } });
      assert.deepEqual(await essays.createTeacherRubric({ subjectId: subject.id, title: "Dissertation BCE", criteria: "Problematique\nStructure" }), { status: "created" });
      assert.deepEqual(await essays.createTeacherRubric({ subjectId: subject.id, title: "Dissertation BCE", criteria: "Problematique" }), { status: "already_exists" });
      const data = await essays.getTeacherRubricsData();
      assert.ok(data.rubrics.some((rubric) => rubric.title === "Dissertation BCE" && rubric.criteria.length === 2));
    });
    await t.test("decks, sous-decks, cartes et export conservent la structure", async () => {
      use(student);
      await cards.createFlashcardDeck({ title: "ESH", subjectCode: "ESH" });
      rootDeck = await db.flashcardDeck.findFirst({ where: { ownerUserId: student.id, title: "ESH" } });
      await cards.createFlashcardDeck({ title: "Croissance", subjectCode: "ESH", parentDeckId: rootDeck.id });
      subDeck = await db.flashcardDeck.findFirst({ where: { parentDeckId: rootDeck.id } });
      await cards.createFlashcard({ deckId: subDeck.id, frontText: "Question", backText: "Reponse" });
      assert.ok((await planning.getStudentShellData()).dueFlashcards > 0);
      const payload = await cards.getFlashcardExportPayload(rootDeck.id);
      assert.ok(JSON.stringify(payload).includes("Croissance"));
      assert.ok(JSON.stringify(payload).includes("Reponse"));
      const exportedFile = new File([JSON.stringify(payload)], "esh.json", { type: "application/json" });
      share = await cards.createFlashcardShare(rootDeck.id);
      use(studentB);
      assert.equal(await cards.getFlashcardDeckData(subDeck.id), null);
      assert.equal(await cards.getFlashcardExportPayload(rootDeck.id), null);
      assert.equal((await cards.importSharedFlashcardDeck(share.shareCode)).ok, true);
      assert.equal(await db.flashcardDeck.count({ where: { ownerUserId: studentB.id } }), 2);
      const fileImport = await cards.importFlashcardArchive(exportedFile);
      assert.equal(fileImport.ok, true);
      assert.equal(fileImport.decksImported, 2);
      assert.equal(fileImport.cardsImported, 1);
      assert.equal(await db.flashcardDeck.count({ where: { ownerUserId: studentB.id } }), 4);

      const legacyDbPath = path.join(dir, "legacy-anki.sqlite");
      const legacyDecks = JSON.stringify({ "42": { name: "ESH Legacy::Croissance" } });
      const legacyModels = JSON.stringify({
        "7": {
          name: "Basic",
          flds: [{ name: "Front", ord: 0 }, { name: "Back", ord: 1 }],
          tmpls: [{ name: "Card 1", ord: 0 }]
        }
      });
      execFileSync("sqlite3", [legacyDbPath, [
        "create table col (decks text, models text)",
        "create table notes (id integer primary key, mid integer, flds text)",
        "create table cards (id integer primary key, nid integer, did integer, ord integer)",
        `insert into col values ('${legacyDecks}', '${legacyModels}')`,
        `insert into notes values (1, 7, 'Question Anki${String.fromCharCode(31)}Reponse Anki')`,
        "insert into cards values (1, 1, 42, 0)"
      ].join(";") + ";"]);
      const apkg = new File(
        [zipSync({ "collection.anki2": new Uint8Array(await readFile(legacyDbPath)) })],
        "legacy.apkg",
        { type: "application/octet-stream" }
      );
      const apkgImport = await cards.importFlashcardArchive(apkg);
      assert.equal(apkgImport.ok, true);
      assert.equal(apkgImport.decksImported, 2);
      assert.equal(apkgImport.cardsImported, 1);
      assert.ok(await db.flashcard.findFirst({
        where: { deck: { ownerUserId: studentB.id }, frontText: "Question Anki", backText: "Reponse Anki" }
      }));
    });
    await t.test("revision enregistree une seule fois, pas de reproposition avant echeance", async () => {
      use(student);
      let detail = await cards.getFlashcardDeckData(subDeck.id);
      assert.equal(detail.reviewOptions.length, 4);
      const cardId = detail.reviewCard.id;
      const dueBeforeReview = (await planning.getStudentShellData()).dueFlashcards;
      await cards.reviewFlashcard({ cardId, deckId: subDeck.id, rating: "EASY" });
      const state = await db.flashcardState.findFirst({ where: { flashcardId: cardId, userId: student.id } });
      assert.equal(state.repetitionCount, 1);
      assert.equal((await planning.getStudentShellData()).dueFlashcards, dueBeforeReview - 1);
      assert.ok(state.nextReviewAt.getTime() - Date.now() < 5 * 3600000);
      assert.ok(state.nextReviewAt.getTime() - Date.now() > 3 * 3600000);
      await cards.reviewFlashcard({ cardId, deckId: subDeck.id, rating: "EASY" });
      assert.equal(await db.flashcardReview.count({ where: { flashcardId: cardId } }), 1);
      detail = await cards.getFlashcardDeckData(subDeck.id);
      assert.equal(detail.reviewCard, null); assert.equal(detail.stats.due, 0);
      await db.flashcardState.update({ where: { id: state.id }, data: { nextReviewAt: new Date(0) } });
      await cards.reviewFlashcard({ cardId, deckId: subDeck.id, rating: "EASY" });
      const after = await db.flashcardState.findUnique({ where: { id: state.id } });
      assert.equal(after.repetitionCount, 2);
      assert.ok(after.nextReviewAt.getTime() - Date.now() > 20 * 3600000);
    });
    await t.test("autorisation de depot cloud liee au compte, au type et au fichier", async () => {
      const receipt = await storage.createDirectUpload(student.id, "essays", "copie.pdf", "application/pdf", pdf.size);
      objects.set(uploadPath, Buffer.from(await pdf.arrayBuffer()));
      assert.ok((await storage.resolveDirectUpload(receipt.receipt, student.id, "essays")).buffer.equals(Buffer.from(await pdf.arrayBuffer())));
      await assert.rejects(storage.resolveDirectUpload(receipt.receipt, studentB.id, "essays"), /INVALID_UPLOAD/);
      await assert.rejects(storage.resolveDirectUpload(receipt.receipt, student.id, "resources"), /INVALID_UPLOAD/);
      await assert.rejects(storage.resolveDirectUpload(receipt.receipt + "x", student.id, "essays"), /INVALID_UPLOAD/);
      await assert.rejects(storage.createDirectUpload(student.id, "essays", "large.pdf", "application/pdf", 60 * 1024 * 1024), /INVALID_DOCUMENT/);
    });
    await t.test("email de recuperation contient un lien unique, jamais renvoye au navigateur", async () => {
      process.env.PASSWORD_RESET_MODE = "email";
      process.env.RESEND_API_KEY = "test-key";
      process.env.EMAIL_FROM = "accounts@example.test";
      const sent = [];
      globalThis.fetch = async (url, options) => {
        assert.equal(url, "https://api.resend.com/emails");
        sent.push(JSON.parse(options.body));
        assert.ok(options.headers["Idempotency-Key"]);
        return new Response(JSON.stringify({ id: "email-test" }), { status: 200 });
      };
      const known = await auth.requestPasswordReset(student.email);
      const unknown = await auth.requestPasswordReset("nobody@example.test");
      assert.deepEqual(known, unknown); assert.equal(known.resetToken, null);
      assert.equal(sent.length, 1); assert.deepEqual(sent[0].to, [student.email]);
      const url = new URL(sent[0].text.match(/https:\/\/\S+/)[0]);
      const token = url.searchParams.get("token");
      assert.equal(url.origin, "https://prepa.example.test");
      const stored = await db.passwordResetToken.findFirst({ where: { userId: student.id } });
      assert.notEqual(stored.tokenHash, token);
      const oldCookie = sessions.get(student.id);
      const reset = await auth.resetPasswordFromToken({ token, password: "new-password-123" });
      assert.equal(reset.ok, true); sessions.set(student.id, cookie);
      assert.equal((await auth.resetPasswordFromToken({ token, password: "another-password-123" })).ok, false);
      cookie = oldCookie; assert.equal(await auth.getCurrentUser(), null);
      assert.equal((await auth.loginUser({ email: student.email, password: "test-password-123" })).ok, false);
      assert.equal((await auth.loginUser({ email: student.email, password: "new-password-123" })).ok, true);
    });
    await t.test("email refuse: aucun lien actif conserve et reponse sans fuite d'existence", async () => {
      globalThis.fetch = async () => new Response("rejected", { status: 403 });
      const failed = await auth.requestPasswordReset(studentB.email);
      const unknown = await auth.requestPasswordReset("absent@example.test");
      assert.deepEqual(failed, unknown);
      assert.equal(await db.passwordResetToken.count({ where: { userId: studentB.id } }), 0);
      process.env.EMAIL_FROM = "";
      assert.equal(mail.isRecoveryEmailConfigured(), false);
      assert.equal((await auth.requestPasswordReset(student.email)).ok, false);
    });
    await t.test("limitation persistante des tentatives entre requetes", async () => {
      assert.equal(await limits.consumeAuthLimit("test-unique", 2), true);
      assert.equal(await limits.consumeAuthLimit("test-unique", 2), true);
      assert.equal(await limits.consumeAuthLimit("test-unique", 2), false);
      const entries = await db.authRateLimit.findMany();
      assert.ok(entries.every((entry) => /^[a-f0-9]{64}$/.test(entry.id)));
    });
  } finally {
    globalThis.fetch = previousFetch;
    await db.$disconnect();
    process.chdir(originalCwd);
    for (const key of Object.keys(process.env)) if (!(key in previousEnv)) delete process.env[key];
    Object.assign(process.env, previousEnv);
    if (process.env.PREPA_KEEP_TEST_FIXTURE === "1") console.log(`Temporary browser fixture: ${dir}`);
    else await rm(dir, { recursive: true, force: true });
  }
});
