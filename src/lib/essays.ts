import { Prisma, ReviewerType, UserRole } from "@prisma/client";
import { createHash } from "node:crypto";

import { isDemoModeEnabled } from "./app-config";
import { getCurrentUserClass, requireRole } from "./auth";
import { generateEssayReview } from "./ai";
import { prisma } from "./db";
import { ensureDemoResources } from "./resources";
import { deleteStoredFile, discardDirectUpload, getStoredFileName, getStoredFileUrl, readStoredFileBuffer, saveUploadedFile, resolveDirectUpload } from "./storage";
import { validateDocumentBytes } from "./upload-rules";
import { ensureDemoStudent } from "./student-app";

type EssayFeedbackPayload = {
  overview: string;
  strengths: string[];
  mistakes: string[];
  nextSteps: string[];
  planningSignals: string[];
};

export type EssaysOverviewData = {
  essays: Array<{
    id: string;
    title: string;
    subject: string;
    teacher: string;
    examType: string;
    targetExam: string;
    status: string;
    latestScoreRange: string;
    latestFeedbackLabel: string;
    createdAtLabel: string;
  }>;
};

export type EssayDetailData = {
  essay: {
    instructions: string;
    id: string;
    title: string;
    subject: string;
    chapter: string;
    examType: string;
    targetExam: string;
    teacher: string;
    status: string;
    content: string;
    fileUrl: string | null;
    mimeType: string;
    createdAtLabel: string;
  };
  aiFeedback: Array<{
    id: string;
    scoreRange: string;
    overview: string;
    strengths: string[];
    mistakes: string[];
    nextSteps: string[];
    planningSignals: string[];
    createdAtLabel: string;
  }>;
  teacherFeedback: Array<{
    id: string;
    scoreRange: string;
    overview: string;
    strengths: string[];
    mistakes: string[];
    nextSteps: string[];
    planningSignals: string[];
    createdAtLabel: string;
  }>;
};

export type TeacherEssaysQueueData = {
  essays: Array<{
    instructions: string;
    id: string;
    title: string;
    subject: string;
    student: string;
    examType: string;
    targetExam: string;
    status: string;
    createdAtLabel: string;
    latestAiSummary: string;
    hasTeacherFeedback: boolean;
    fileUrl: string | null;
    mimeType: string;
  }>;
};

export type EssaySubmissionResult =
  | { status: "created"; essayId: string }
  | { status: "already_exists"; essayId: string }
  | { status: "invalid" };

export type TeacherEssayFeedbackResult = { status: "saved" | "already_exists" | "invalid" };

export type EssaySubmissionFormData = {
  subjects: Array<{
    code: string;
    name: string;
  }>;
  chapters: Array<{
    id: string;
    name: string;
    subjectCode: string;
  }>;
  teachers: Array<{
    id: string;
    label: string;
    email: string;
  }>;
};

function toFeedbackPayload(value: unknown): EssayFeedbackPayload {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      overview: "Feedback indisponible.",
      strengths: [],
      mistakes: [],
      nextSteps: [],
      planningSignals: []
    };
  }

  const payload = value as Record<string, unknown>;

  return {
    overview: typeof payload.overview === "string" ? payload.overview : "Feedback indisponible.",
    strengths: Array.isArray(payload.strengths) ? payload.strengths.map(String) : [],
    mistakes: Array.isArray(payload.mistakes) ? payload.mistakes.map(String) : [],
    nextSteps: Array.isArray(payload.nextSteps) ? payload.nextSteps.map(String) : [],
    planningSignals: Array.isArray(payload.planningSignals) ? payload.planningSignals.map(String) : []
  };
}

function getScoreRange(scoreMin: number | null, scoreMax: number | null) {
  if (scoreMin === null || scoreMax === null) {
    return "A preciser";
  }

  if (scoreMin === scoreMax) {
    return `${scoreMin}/20`;
  }

  return `${scoreMin}-${scoreMax}/20`;
}

function linesFromTextarea(value: string) {
  return value
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function getTeacherLabel(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`.trim();
}

function isKnownUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

async function getDefaultRubric(subjectId: string, teacherId: string) {
  const existing = await prisma.gradingRubric.findFirst({
    where: {
      creatorId: teacherId,
      subjectId
    }
  });

  if (existing) {
    return existing;
  }

  return prisma.gradingRubric.create({
    data: {
      creatorId: teacherId,
      subjectId,
      title: "Grille principale",
      description: "Grille par defaut pour les retours du MVP.",
      criteriaJson: [
        "Pertinence de la reponse au sujet",
        "Structure et methode",
        "Precision des connaissances",
        "Qualite de l'argumentation"
      ]
    }
  });
}

async function seedEssayIfNeeded() {
  if (!isDemoModeEnabled()) {
    return;
  }

  const { user } = await ensureDemoStudent();
  await ensureDemoResources();
  const membership = await getCurrentUserClass(user.id);

  const essaysCount = await prisma.essay.count({
    where: { studentId: user.id }
  });

  if (essaysCount > 0) {
    return;
  }

  const subject = await prisma.subject.findUnique({
    where: { code: "ESH" }
  });
  const chapter = await prisma.chapter.findUnique({
    where: { slug: "esh-croissance" }
  });
  const teacher = await prisma.user.findFirst({
    where: membership?.classId
      ? {
          role: "TEACHER",
          memberships: {
            some: {
              classId: membership.classId,
              roleInClass: "teacher"
            }
          }
        }
      : { role: "TEACHER" }
  });

  if (!subject || !teacher) {
    return;
  }

  const essay = await prisma.essay.create({
    data: {
      studentId: user.id,
      teacherId: teacher.id,
      subjectId: subject.id,
      chapterId: chapter?.id ?? null,
      title: "Dissertation ESH - Croissance et innovation",
      examType: "Dissertation",
      targetExam: "BCE",
      storageKey:
        "Introduction : la croissance repose-t-elle seulement sur l'accumulation des facteurs ?\nProblematique : dans quelle mesure l'innovation transforme-t-elle durablement la croissance ?\nPremiere partie : Solow montre le role du capital mais laisse le progres technique hors du modele.\nDeuxieme partie : Romer et Lucas reintegrent la connaissance et le capital humain dans la dynamique de croissance.\nConclusion : la croissance depend aussi des institutions, de l'education et des politiques d'innovation.",
      mimeType: "text/plain",
      submissionType: "TEXT_PASTE",
      status: "SUBMITTED"
    }
  });

  await generateEssayAiFeedback(essay.id);
}

async function getEssayFileUrl(storageKey: string, submissionType: string) {
  if (submissionType === "FILE_UPLOAD") {
    return getStoredFileUrl(storageKey);
  }

  return null;
}

export async function ensureDemoEssays() {
  await seedEssayIfNeeded();
}

export async function generateEssayAiFeedback(essayId: string) {
  const { user } = await ensureDemoStudent();
  await ensureDemoResources();

  const essay = await prisma.essay.findFirst({
    where: {
      id: essayId,
      studentId: user.id
    },
    include: {
      subject: true
    }
  });

  if (!essay) {
    return;
  }

  const rubric = essay.teacherId
    ? await prisma.gradingRubric.findFirst({
        where: { creatorId: essay.teacherId, subjectId: essay.subjectId },
        orderBy: { createdAt: "desc" }
      })
    : null;

  const essayContent =
    essay.submissionType === "FILE_UPLOAD"
      ? {
          kind: "file" as const,
          mimeType: essay.mimeType,
          fileName: getStoredFileName(essay.storageKey),
          base64Data: (await readStoredFileBuffer(essay.storageKey)).toString("base64")
        }
      : {
          kind: "text" as const,
          text: essay.storageKey
        };

  const review = await generateEssayReview({
    userId: user.id,
    essayId: essay.id,
    subject: essay.subject.name,
    examType: essay.examType,
    targetExam: essay.targetExam,
    rubric: rubric
      ? {
          title: rubric.title,
          criteria: Array.isArray(rubric.criteriaJson) ? rubric.criteriaJson.map(String) : []
        }
      : undefined,
    essayContent
  });
  const score = (review.scoreMin + review.scoreMax) / 2;
  const priorityLabel = review.planningSignals[0] ?? review.mistakes[0] ?? null;
  const nextTask = review.nextSteps[0] ?? review.planningSignals[0] ?? null;
  const weakPointId = `ai-review-weak-${essay.id}`;
  const taskId = `ai-review-task-${essay.id}`;

  await prisma.$transaction(async (tx) => {
    await tx.essayFeedback.deleteMany({
      where: {
        essayId: essay.id,
        reviewerType: ReviewerType.AI
      }
    });

    await tx.essayFeedback.create({
      data: {
        essayId: essay.id,
        reviewerType: ReviewerType.AI,
        scoreMin: review.scoreMin,
        scoreMax: review.scoreMax,
        feedbackJson: {
          overview: review.overview,
          strengths: review.strengths,
          mistakes: review.mistakes,
          nextSteps: review.nextSteps,
          planningSignals: review.planningSignals
        }
      }
    });

    await tx.essay.update({
      where: { id: essay.id },
      data: {
        status: essay.status === "TEACHER_REVIEWED" ? "TEACHER_REVIEWED" : "AI_REVIEWED"
      }
    });

    if (priorityLabel) {
      await tx.weakPoint.upsert({
        where: { id: weakPointId },
        update: {
          label: priorityLabel.slice(0, 180),
          description: [review.overview, review.nextSteps[0]].filter(Boolean).join(" Prochaine etape : "),
          severityScore: score < 10 ? 0.9 : score < 13 ? 0.7 : 0.45,
          status: score >= 14 ? "IMPROVING" : "ACTIVE",
          lastDetectedAt: new Date()
        },
        create: {
          id: weakPointId,
          studentId: essay.studentId,
          subjectId: essay.subjectId,
          chapterId: essay.chapterId,
          sourceType: `ai_feedback:${essay.id}`,
          severityScore: score < 10 ? 0.9 : score < 13 ? 0.7 : 0.45,
          label: priorityLabel.slice(0, 180),
          description: [review.overview, review.nextSteps[0]].filter(Boolean).join(" Prochaine etape : "),
          status: score >= 14 ? "IMPROVING" : "ACTIVE",
          lastDetectedAt: new Date()
        }
      });
    } else {
      await tx.weakPoint.deleteMany({ where: { id: weakPointId } });
    }

    if (nextTask) {
      await tx.task.upsert({
        where: { id: taskId },
        update: {
          title: nextTask.slice(0, 180),
          description: `Suite de la correction IA sur ${essay.title}.`,
          priorityScore: score < 10 ? 0.95 : 0.82,
          dueAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
        },
        create: {
          id: taskId,
          studentId: essay.studentId,
          subjectId: essay.subjectId,
          chapterId: essay.chapterId,
          title: nextTask.slice(0, 180),
          description: `Suite de la correction IA sur ${essay.title}.`,
          taskType: "REVISION",
          dueAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          priorityScore: score < 10 ? 0.95 : 0.82,
          status: "todo",
          sourceType: `ai_feedback:${essay.id}`
        }
      });
    } else {
      await tx.task.deleteMany({ where: { id: taskId, status: { not: "done" } } });
    }
  });
}

export async function createEssaySubmission(input: {
  subjectCode: string;
  chapterId: string;
  teacherId: string;
  submissionKey: string;
  title: string;
  examType: string;
  targetExam: string;
  correctionMode: string;
  instructions: string;
  planningEntryId?: string;
  file: File | null;
  uploadReceipt?: string;
}): Promise<EssaySubmissionResult> {
  const { user } = await ensureDemoStudent();
  await ensureDemoResources();
  const membership = await getCurrentUserClass(user.id);

  const chapter = await prisma.chapter.findFirst({
    where: { id: input.chapterId, subject: { code: input.subjectCode } },
    include: { subject: true }
  });
  if (input.correctionMode === "ai_only" && !isDemoModeEnabled() && !process.env.OPENAI_API_KEY?.trim()) return { status: "invalid" };
  const teacher = await prisma.user.findFirst({
    where: {
      id: input.teacherId || "__no_teacher__", role: "TEACHER",
      memberships: { some: { classId: membership?.classId ?? "__no_class__", roleInClass: "teacher" } }
    }
  });

  if (!membership?.classId || (input.correctionMode !== "ai_only" && !teacher) ||
    !["teacher_only", "ai_only", "ai_then_teacher"].includes(input.correctionMode) ||
    !chapter || !input.title.trim() || (!input.uploadReceipt && (!input.file || input.file.size === 0)) || !input.submissionKey.trim()) {
    return { status: "invalid" };
  }

  const submissionKey = createHash("sha256").update(`${user.id}:${input.submissionKey}`).digest("hex");
  const planningEntryId = input.planningEntryId && /^[a-zA-Z0-9_-]{1,100}$/.test(input.planningEntryId)
    ? input.planningEntryId
    : null;
  const teacherId = input.correctionMode === "ai_only" ? null : teacher!.id;
  const existingBySubmissionKey = await prisma.essay.findUnique({
    where: {
      submissionKey
    }
  });

  if (existingBySubmissionKey) {
    if (input.uploadReceipt) {
      await discardDirectUpload(input.uploadReceipt, user.id, "essays").catch(() => undefined);
    }
    return { status: "already_exists", essayId: existingBySubmissionKey.id };
  }

  let directUpload;
  let fileBuffer: Buffer;
  try {
    directUpload = input.uploadReceipt ? await resolveDirectUpload(input.uploadReceipt, user.id, "essays") : null;
    fileBuffer = directUpload?.buffer ?? Buffer.from(await input.file!.arrayBuffer());
    validateDocumentBytes(fileBuffer, directUpload?.storedFile.mimeType ?? input.file!.type, "essays");
  } catch { return { status: "invalid" }; }
  const contentHash = createHash("sha256").update(fileBuffer).digest("hex");
  const normalizedTitle = input.title.trim();
  const normalizedExamType = input.examType.trim() || "Copie";
  const normalizedTargetExam = input.targetExam.trim() || "BCE";
  const deduplicationKey = createHash("sha256").update(JSON.stringify([
    user.id, teacherId, chapter.id, normalizedTitle, normalizedExamType, normalizedTargetExam, contentHash
  ])).digest("hex");

  const existingDuplicate = await prisma.essay.findFirst({
    where: {
      studentId: user.id,
      teacherId,
      chapterId: chapter.id,
      title: normalizedTitle,
      examType: normalizedExamType,
      targetExam: normalizedTargetExam,
      contentHash
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  if (existingDuplicate) {
    if (directUpload) {
      await deleteStoredFile(directUpload.storedFile.storageKey).catch(() => undefined);
    }
    return { status: "already_exists", essayId: existingDuplicate.id };
  }

  const storedFile = directUpload?.storedFile ?? await saveUploadedFile(input.file!, "essays");

  try {
    const essay = await prisma.essay.create({
      data: {
        studentId: user.id,
        teacherId,
        subjectId: chapter.subject.id,
        chapterId: chapter.id,
        submissionKey,
        deduplicationKey,
        instructions: input.instructions.trim().slice(0, 5000) || null,
        planningEntryId,
        contentHash,
        title: normalizedTitle,
        examType: normalizedExamType,
        targetExam: normalizedTargetExam,
        storageKey: storedFile.storageKey,
        mimeType: storedFile.mimeType,
        submissionType: "FILE_UPLOAD",
        status: "SUBMITTED"
      }
    });

    if (input.correctionMode !== "teacher_only" && (isDemoModeEnabled() || process.env.OPENAI_API_KEY?.trim())) {
      try { await generateEssayAiFeedback(essay.id); }
      catch { console.error("ESSAY_AI_REVIEW_FAILED"); }
    }

    return { status: "created", essayId: essay.id };
  } catch (error) {
    await deleteStoredFile(storedFile.storageKey).catch(() => undefined);
    if (!isKnownUniqueConstraintError(error)) {
      throw error;
    }

    const existingEssay =
      (await prisma.essay.findUnique({
        where: {
          submissionKey
        }
      })) ??
      (await prisma.essay.findFirst({
        where: {
          studentId: user.id,
          teacherId,
          chapterId: chapter.id,
          title: normalizedTitle,
          examType: normalizedExamType,
          targetExam: normalizedTargetExam,
          contentHash
        },
        orderBy: {
          createdAt: "desc"
        }
      }));

    if (!existingEssay) {
      return { status: "invalid" };
    }

    return { status: "already_exists", essayId: existingEssay.id };
  }
}

export async function addTeacherEssayFeedback(input: {
  essayId: string;
  submissionKey: string;
  scoreMin?: number | null;
  scoreMax?: number | null;
  overview: string;
  strengths: string;
  mistakes: string;
  nextSteps: string;
  planningSignals: string;
}): Promise<TeacherEssayFeedbackResult> {
  await ensureDemoResources();
  const teacher = await requireRole([UserRole.TEACHER, UserRole.ADMIN]);
  const teacherMembership = await getCurrentUserClass(teacher.id);
  const essay = await prisma.essay.findUnique({
    where: { id: input.essayId },
    include: {
      student: {
        include: {
          memberships: true
        }
      }
    }
  });

  const belongsToSamePrep =
    teacherMembership?.classId &&
    essay?.student.memberships.some((membership) => membership.classId === teacherMembership.classId);
  const isAssignedTeacher = essay?.teacherId === teacher.id;

  if (!essay || !input.overview.trim() || !belongsToSamePrep || !isAssignedTeacher || !input.submissionKey.trim()) {
    return { status: "invalid" };
  }
  for (const score of [input.scoreMin, input.scoreMax]) {
    if (score != null && (!Number.isFinite(score) || score < 0 || score > 20)) return { status: "invalid" };
  }
  if (input.scoreMin != null && input.scoreMax != null && input.scoreMin > input.scoreMax) return { status: "invalid" };
  const feedbackKey = `teacher:${essay.id}:${teacher.id}`;

  const existingBySubmissionKey = await prisma.essayFeedback.findUnique({
    where: {
      submissionKey: feedbackKey
    }
  });

  if (existingBySubmissionKey) {
    return { status: "already_exists" };
  }

  const existingTeacherFeedback = await prisma.essayFeedback.findFirst({
    where: {
      essayId: essay.id,
      reviewerType: ReviewerType.TEACHER,
      reviewerUserId: teacher.id
    }
  });

  if (existingTeacherFeedback) {
    return { status: "already_exists" };
  }

  const rubric = await getDefaultRubric(essay.subjectId, teacher.id);
  const strengths = linesFromTextarea(input.strengths);
  const mistakes = linesFromTextarea(input.mistakes);
  const nextSteps = linesFromTextarea(input.nextSteps);
  const planningSignals = linesFromTextarea(input.planningSignals);
  const score =
    input.scoreMin != null && input.scoreMax != null
      ? (input.scoreMin + input.scoreMax) / 2
      : input.scoreMin ?? input.scoreMax ?? null;
  const teacherName = getTeacherLabel(teacher.firstName, teacher.lastName);

  try {
    await prisma.$transaction(async (tx) => {
      const feedback = await tx.essayFeedback.create({
        data: {
          essayId: essay.id,
          submissionKey: feedbackKey,
          reviewerType: ReviewerType.TEACHER,
          reviewerUserId: teacher.id,
          rubricId: rubric.id,
          scoreMin: input.scoreMin ?? null,
          scoreMax: input.scoreMax ?? null,
          feedbackJson: {
            overview: input.overview.trim(),
            strengths,
            mistakes,
            nextSteps,
            planningSignals
          }
        }
      });

      await tx.essay.update({
        where: { id: essay.id },
        data: { status: "TEACHER_REVIEWED" }
      });

      if (score !== null) {
        await tx.studentGrade.create({
          data: {
            id: `essay-feedback-${feedback.id}`,
            studentId: essay.studentId,
            subjectId: essay.subjectId,
            title: essay.title,
            score,
            maxScore: 20,
            sourceType: "essay_feedback",
            teacherName,
            capturedAt: new Date()
          }
        });
      }

      const priorityLabel = planningSignals[0] ?? mistakes[0] ?? null;
      if (priorityLabel) {
        await tx.weakPoint.create({
          data: {
            studentId: essay.studentId,
            subjectId: essay.subjectId,
            chapterId: essay.chapterId,
            sourceType: `teacher_feedback:${essay.id}`,
            severityScore: score === null ? 0.65 : score < 10 ? 0.9 : score < 13 ? 0.7 : 0.45,
            label: priorityLabel.slice(0, 180),
            description: [input.overview.trim(), nextSteps[0]].filter(Boolean).join(" Prochaine etape : "),
            status: score !== null && score >= 14 ? "IMPROVING" : "ACTIVE",
            lastDetectedAt: new Date()
          }
        });
      }

      const nextTask = nextSteps[0] ?? planningSignals[0] ?? null;
      if (nextTask) {
        await tx.task.create({
          data: {
            studentId: essay.studentId,
            subjectId: essay.subjectId,
            chapterId: essay.chapterId,
            title: nextTask.slice(0, 180),
            description: `Suite du retour de ${teacherName} sur ${essay.title}.`,
            taskType: "REVISION",
            dueAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            priorityScore: score !== null && score < 10 ? 0.95 : 0.82,
            status: "todo",
            sourceType: `teacher_feedback:${essay.id}`
          }
        });
      }
    });

    return { status: "saved" };
  } catch (error) {
    if (!isKnownUniqueConstraintError(error)) {
      throw error;
    }

    return { status: "already_exists" };
  }
}

export async function getStudentEssaysOverviewData(): Promise<EssaysOverviewData> {
  const { user } = await ensureDemoStudent();
  await ensureDemoEssays();

  const essays = await prisma.essay.findMany({
    where: {
      studentId: user.id
    },
    include: {
      subject: true,
      teacher: true,
      feedbacks: {
        orderBy: { createdAt: "desc" }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return {
    essays: essays.map((essay) => {
      const latestFeedback = essay.feedbacks[0] ?? null;

      return {
        id: essay.id,
        title: essay.title,
        subject: essay.subject.name,
        teacher: essay.teacher ? getTeacherLabel(essay.teacher.firstName, essay.teacher.lastName) : "IA uniquement",
        examType: essay.examType,
        targetExam: essay.targetExam,
        status:
          essay.status === "TEACHER_REVIEWED"
            ? "Feedback prof disponible"
            : essay.status === "AI_REVIEWED"
              ? "Feedback IA disponible"
              : "Copie deposee",
        latestScoreRange: latestFeedback ? getScoreRange(latestFeedback.scoreMin, latestFeedback.scoreMax) : "--",
        latestFeedbackLabel:
          latestFeedback?.reviewerType === ReviewerType.TEACHER ? "Professeur" : latestFeedback ? "IA" : "Aucun retour",
        createdAtLabel: essay.createdAt.toLocaleDateString("fr-FR")
      };
    })
  };
}

export async function getEssayDetailData(essayId: string): Promise<EssayDetailData | null> {
  const { user } = await ensureDemoStudent();
  await ensureDemoEssays();

  const essay = await prisma.essay.findFirst({
    where: {
      id: essayId,
      studentId: user.id
    },
    include: {
      subject: true,
      chapter: true,
      teacher: true,
      feedbacks: {
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!essay) {
    return null;
  }

  const mappedFeedbacks = essay.feedbacks.map((feedback) => {
    const payload = toFeedbackPayload(feedback.feedbackJson);

    return {
      id: feedback.id,
      scoreRange: getScoreRange(feedback.scoreMin, feedback.scoreMax),
      overview: payload.overview,
      strengths: payload.strengths,
      mistakes: payload.mistakes,
      nextSteps: payload.nextSteps,
      planningSignals: payload.planningSignals,
      createdAtLabel: feedback.createdAt.toLocaleDateString("fr-FR")
    };
  });

  const fileUrl = await getEssayFileUrl(essay.storageKey, essay.submissionType);

  return {
    essay: {
      instructions: essay.instructions ?? "",
      id: essay.id,
      title: essay.title,
      subject: essay.subject.name,
      chapter: essay.chapter?.name ?? "Sans chapitre",
      examType: essay.examType,
      targetExam: essay.targetExam,
      teacher: essay.teacher ? getTeacherLabel(essay.teacher.firstName, essay.teacher.lastName) : "IA uniquement",
      status:
          essay.status === "TEACHER_REVIEWED"
            ? "Feedback prof disponible"
            : essay.status === "AI_REVIEWED"
              ? "Feedback IA disponible"
              : "Copie deposee",
      content:
        essay.submissionType === "FILE_UPLOAD"
          ? "La copie a ete deposee sous forme de fichier."
          : essay.storageKey,
      fileUrl,
      mimeType: essay.mimeType,
      createdAtLabel: essay.createdAt.toLocaleDateString("fr-FR")
    },
    aiFeedback: mappedFeedbacks.filter((_, index) => essay.feedbacks[index]?.reviewerType === ReviewerType.AI),
    teacherFeedback: mappedFeedbacks.filter(
      (_, index) => essay.feedbacks[index]?.reviewerType === ReviewerType.TEACHER
    )
  };
}

export async function getTeacherEssaysQueueData(): Promise<TeacherEssaysQueueData> {
  await ensureDemoResources();
  const teacher = await requireRole([UserRole.TEACHER, UserRole.ADMIN]);
  const membership = await getCurrentUserClass(teacher.id);

  const essays = await prisma.essay.findMany({
    where: {
      teacherId: teacher.id,
      student: { memberships: { some: { classId: membership?.classId ?? "__no_class__" } } }
    },
    include: {
      subject: true,
      student: true,
      feedbacks: {
        where: {
          OR: [
            {
              reviewerType: ReviewerType.AI
            },
            {
              reviewerType: ReviewerType.TEACHER,
              reviewerUserId: teacher.id
            }
          ]
        },
        orderBy: { createdAt: "desc" }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return {
    essays: await Promise.all(
      essays.map(async (essay) => {
        const latestAiFeedback = essay.feedbacks.find((feedback) => feedback.reviewerType === ReviewerType.AI);
        const hasTeacherFeedback = essay.feedbacks.some(
          (feedback) => feedback.reviewerType === ReviewerType.TEACHER && feedback.reviewerUserId === teacher.id
        );
        const aiPayload = toFeedbackPayload(latestAiFeedback?.feedbackJson);
        const fileUrl = await getEssayFileUrl(essay.storageKey, essay.submissionType);

        return {
          id: essay.id,
          title: essay.title,
          subject: essay.subject.name,
          student: `${essay.student.firstName} ${essay.student.lastName}`.trim(),
          instructions: essay.instructions ?? "",
          examType: essay.examType,
          targetExam: essay.targetExam,
          status:
            hasTeacherFeedback || essay.status === "TEACHER_REVIEWED"
              ? "Corrigee par un prof"
              : essay.status === "AI_REVIEWED"
                ? "Correction IA disponible"
                : "A corriger",
          createdAtLabel: essay.createdAt.toLocaleDateString("fr-FR"),
          latestAiSummary: aiPayload.overview,
          hasTeacherFeedback,
          fileUrl,
          mimeType: essay.mimeType
        };
      })
    )
  };
}

export async function getTeacherRubricsData() {
  const teacher = await requireRole([UserRole.TEACHER, UserRole.ADMIN]);
  const [rubrics, subjects] = await Promise.all([
    prisma.gradingRubric.findMany({
      where: { creatorId: teacher.id },
      include: { subject: true, _count: { select: { feedbacks: true } } },
      orderBy: { createdAt: "desc" }
    }),
    prisma.subject.findMany({ orderBy: { name: "asc" } })
  ]);

  return {
    rubrics: rubrics.map((rubric) => ({
      id: rubric.id,
      title: rubric.title,
      subject: rubric.subject.name,
      criteria: Array.isArray(rubric.criteriaJson) ? rubric.criteriaJson.map(String) : [],
      usageCount: rubric._count.feedbacks
    })),
    subjects: subjects.map((subject) => ({ id: subject.id, name: subject.name }))
  };
}

export async function createTeacherRubric(input: { subjectId: string; title: string; criteria: string }) {
  const teacher = await requireRole([UserRole.TEACHER, UserRole.ADMIN]);
  const criteria = linesFromTextarea(input.criteria);
  const title = input.title.trim();
  const subject = await prisma.subject.findUnique({ where: { id: input.subjectId } });
  if (!subject || !title || criteria.length === 0) return { status: "invalid" as const };

  const existing = await prisma.gradingRubric.findFirst({
    where: { creatorId: teacher.id, subjectId: subject.id, title }
  });
  if (existing) return { status: "already_exists" as const };

  await prisma.gradingRubric.create({
    data: {
      creatorId: teacher.id,
      subjectId: subject.id,
      title,
      criteriaJson: criteria
    }
  });
  return { status: "created" as const };
}

export async function getLatestEssaySignals(studentId: string) {
  const feedbacks = await prisma.essayFeedback.findMany({
    where: {
      essay: {
        studentId
      }
    },
    orderBy: { createdAt: "desc" },
    take: 3
  });

  return feedbacks.flatMap((feedback) => toFeedbackPayload(feedback.feedbackJson).mistakes).slice(0, 4);
}

export async function getEssaySubmissionFormData(): Promise<EssaySubmissionFormData> {
  const { user } = await ensureDemoStudent();
  await ensureDemoResources();
  const membership = await getCurrentUserClass(user.id);

  const [subjects, chapters, teachers] = await Promise.all([
    prisma.subject.findMany({
      orderBy: { name: "asc" }
    }),
    prisma.chapter.findMany({
      include: {
        subject: true
      },
      orderBy: [{ subject: { name: "asc" } }, { name: "asc" }]
    }),
    prisma.user.findMany({
      where: membership?.classId
        ? {
            role: UserRole.TEACHER,
            memberships: {
              some: {
                classId: membership.classId,
                roleInClass: "teacher"
              }
            }
          }
        : {
            role: UserRole.TEACHER,
            id: "__no_teacher__"
          },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }]
    })
  ]);

  return {
    subjects: subjects.map((subject) => ({
      code: subject.code,
      name: subject.name
    })),
    chapters: chapters.map((chapter) => ({
      id: chapter.id,
      name: chapter.name,
      subjectCode: chapter.subject.code
    })),
    teachers: teachers.map((teacher) => ({
      id: teacher.id,
      label: getTeacherLabel(teacher.firstName, teacher.lastName),
      email: teacher.email
    }))
  };
}
