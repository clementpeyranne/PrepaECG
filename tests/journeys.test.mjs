import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, rm, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
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
  const mocks = {
    react: { cache: (fn) => fn }, "./db": { prisma: db },
    "next/headers": {
      headers: async () => new Headers(),
      cookies: async () => ({
        get: () => cookie ? { value: cookie } : undefined,
        set: (_, value) => { cookie = value; }, delete: () => { cookie = undefined; }
      })
    },
    "./ai": new Proxy({}, { get: () => async () => { throw new Error("AI must not be called in these journeys"); } }),
    "./supabase-admin": { getSupabaseAdminClient: () => ({ storage: { from: () => ({
      createSignedUploadUrl: async (key) => { uploadPath = key; return { data: { signedUrl: `https://storage.example.test/${key}` }, error: null }; },
      download: async (key) => ({ data: objects.has(key) ? new Blob([objects.get(key)]) : null, error: objects.has(key) ? null : new Error("missing") }),
      createSignedUrl: async (key) => ({ data: { signedUrl: `https://storage.example.test/read/${key}` }, error: null })
    }) } }) }
  };
  const load = createAppLoader(mocks);
  const auth = load("src/lib/auth.ts");
  const refs = load("src/lib/reference-data.ts");
  mocks["./student-app"] = { ensureDemoStudent: async () => {
    const user = await auth.requireRole(["STUDENT", "ADMIN"]);
    const membership = await auth.getCurrentUserClass(user.id);
    if (!membership) throw new Error("CLASS_REQUIRED");
    return { user, prepClass: membership.class, subjects: (await refs.ensureReferenceData()).subjects };
  } };
  const resources = load("src/lib/resources.ts");
  const essays = load("src/lib/essays.ts");
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

    const resourceInput = () => ({ title: "Cours ESH", subjectCode: "ESH", chapterId: chapter.id, resourceType: "COURSE", description: "", content: "", file: pdf, aiEnabled: false, submissionKey: "resource-1" });
    const essayInput = () => ({ subjectCode: "ESH", chapterId: chapter.id, teacherId: teacher.id, submissionKey: "essay-1", title: "Dissertation", examType: "Dissertation", targetExam: "BCE", correctionMode: "teacher_only", instructions: "Verifier la structure du plan", file: pdf });
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
      assert.equal(await db.essayFeedback.count({ where: { essayId } }), 1);
      use(student);
      const detail = await essays.getEssayDetailData(essayId);
      assert.equal(detail.teacherFeedback[0].scoreRange, "14/20");
      assert.equal(detail.teacherFeedback[0].overview, "Progression nette");
    });
    await t.test("decks, sous-decks, cartes et export conservent la structure", async () => {
      use(student);
      await cards.createFlashcardDeck({ title: "ESH", subjectCode: "ESH" });
      rootDeck = await db.flashcardDeck.findFirst({ where: { ownerUserId: student.id } });
      await cards.createFlashcardDeck({ title: "Croissance", subjectCode: "ESH", parentDeckId: rootDeck.id });
      subDeck = await db.flashcardDeck.findFirst({ where: { parentDeckId: rootDeck.id } });
      await cards.createFlashcard({ deckId: subDeck.id, frontText: "Question", backText: "Reponse" });
      const payload = await cards.getFlashcardExportPayload(rootDeck.id);
      assert.ok(JSON.stringify(payload).includes("Croissance"));
      assert.ok(JSON.stringify(payload).includes("Reponse"));
      share = await cards.createFlashcardShare(rootDeck.id);
      use(studentB);
      assert.equal(await cards.getFlashcardDeckData(subDeck.id), null);
      assert.equal(await cards.getFlashcardExportPayload(rootDeck.id), null);
      assert.equal((await cards.importSharedFlashcardDeck(share.shareCode)).ok, true);
      assert.equal(await db.flashcardDeck.count({ where: { ownerUserId: studentB.id } }), 2);
    });
    await t.test("revision enregistree une seule fois, pas de reproposition avant echeance", async () => {
      use(student);
      let detail = await cards.getFlashcardDeckData(subDeck.id);
      assert.equal(detail.reviewOptions.length, 4);
      const cardId = detail.reviewCard.id;
      await cards.reviewFlashcard({ cardId, deckId: subDeck.id, rating: "EASY" });
      const state = await db.flashcardState.findFirst({ where: { flashcardId: cardId, userId: student.id } });
      assert.equal(state.repetitionCount, 1);
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
