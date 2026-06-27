import { Prisma, ReviewerType, UserRole } from "@prisma/client";
import { createHash } from "node:crypto";

import { isDemoModeEnabled } from "./app-config";
import { getCurrentUserClass, requireRole } from "./auth";
import { generateEssayReview } from "./ai";
import { prisma } from "./db";
import { ensureDemoResources } from "./resources";
import { getStoredFileName, getStoredFileUrl, readStoredFileBuffer, saveUploadedFile } from "./storage";
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
    essayContent
  });

  await prisma.essayFeedback.deleteMany({
    where: {
      essayId: essay.id,
      reviewerType: ReviewerType.AI
    }
  });

  await prisma.essayFeedback.create({
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

  await prisma.essay.update({
    where: { id: essay.id },
    data: {
      status: "AI_REVIEWED"
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
  file: File | null;
}): Promise<EssaySubmissionResult> {
  const { user } = await ensureDemoStudent();
  await ensureDemoResources();
  const membership = await getCurrentUserClass(user.id);

  const chapter = await prisma.chapter.findFirst({
    where: { id: input.chapterId },
    include: { subject: true }
  });
  const teacher = await prisma.user.findFirst({
    where: input.teacherId
      ? {
          id: input.teacherId,
          role: "TEACHER",
          ...(membership?.classId
            ? {
                memberships: {
                  some: {
                    classId: membership.classId,
                    roleInClass: "teacher"
                  }
                }
              }
            : {})
        }
      : membership?.classId
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

  if (!chapter || !input.title.trim() || !input.file || input.file.size === 0 || !input.submissionKey.trim()) {
    return { status: "invalid" };
  }

  const existingBySubmissionKey = await prisma.essay.findUnique({
    where: {
      submissionKey: input.submissionKey
    }
  });

  if (existingBySubmissionKey) {
    return { status: "already_exists", essayId: existingBySubmissionKey.id };
  }

  const fileBuffer = Buffer.from(await input.file.arrayBuffer());
  const contentHash = createHash("sha256").update(fileBuffer).digest("hex");
  const normalizedTitle = input.title.trim();
  const normalizedExamType = input.examType.trim() || "Copie";
  const normalizedTargetExam = input.targetExam.trim() || "BCE";

  const existingDuplicate = await prisma.essay.findFirst({
    where: {
      studentId: user.id,
      teacherId: teacher?.id ?? null,
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
    return { status: "already_exists", essayId: existingDuplicate.id };
  }

  const storedFile = await saveUploadedFile(input.file, "essays");

  try {
    const essay = await prisma.essay.create({
      data: {
        studentId: user.id,
        teacherId: teacher?.id ?? null,
        subjectId: chapter.subject.id,
        chapterId: chapter.id,
        submissionKey: input.submissionKey,
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

    if (input.correctionMode !== "teacher_only") {
      await generateEssayAiFeedback(essay.id);
    }

    return { status: "created", essayId: essay.id };
  } catch (error) {
    if (!isKnownUniqueConstraintError(error)) {
      throw error;
    }

    const existingEssay =
      (await prisma.essay.findUnique({
        where: {
          submissionKey: input.submissionKey
        }
      })) ??
      (await prisma.essay.findFirst({
        where: {
          studentId: user.id,
          teacherId: teacher?.id ?? null,
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

  const existingBySubmissionKey = await prisma.essayFeedback.findUnique({
    where: {
      submissionKey: input.submissionKey
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

  try {
    await prisma.essayFeedback.create({
      data: {
        essayId: essay.id,
        submissionKey: input.submissionKey,
        reviewerType: ReviewerType.TEACHER,
        reviewerUserId: teacher.id,
        rubricId: rubric.id,
        scoreMin: input.scoreMin ?? null,
        scoreMax: input.scoreMax ?? null,
        feedbackJson: {
          overview: input.overview.trim(),
          strengths: linesFromTextarea(input.strengths),
          mistakes: linesFromTextarea(input.mistakes),
          nextSteps: linesFromTextarea(input.nextSteps),
          planningSignals: linesFromTextarea(input.planningSignals)
        }
      }
    });

    await prisma.essay.update({
      where: { id: essay.id },
      data: {
        status: "TEACHER_REVIEWED"
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

  const essays = await prisma.essay.findMany({
    where: {
      teacherId: teacher.id
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
            role: UserRole.TEACHER
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
