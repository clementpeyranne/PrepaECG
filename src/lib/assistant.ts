import { generateAssistantReply } from "./ai";
import { getCurrentUserClass } from "./auth";
import { prisma } from "./db";
import { getResourceReadableText } from "./resources";
import { ensureDemoStudent, getStudentAssistantData } from "./student-app";

export type AssistantWorkspaceData = {
  prompts: string[];
  responseTitle: string;
  responseSummary: string;
  actions: string[];
  aiStatus: {
    isLive: boolean;
    providerLabel: string;
    title: string;
    description: string;
    nextStep: string;
  };
  resources: Array<{
    id: string;
    title: string;
    subject: string;
  }>;
  essays: Array<{
    id: string;
    title: string;
    subject: string;
  }>;
};

export type AssistantReplyData = {
  answer: string;
  actions: string[];
  citations: string[];
};

function getWeekStart() {
  const date = new Date();
  const day = date.getDay();
  date.setDate(date.getDate() - (day === 0 ? 6 : day - 1));
  date.setHours(0, 0, 0, 0);
  return date;
}

function getTargetLabels(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  return Object.values(value)
    .flatMap((entry) => Array.isArray(entry) ? entry : [])
    .filter((entry): entry is string => typeof entry === "string" && Boolean(entry.trim()));
}

function getFeedbackSummary(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const payload = value as Record<string, unknown>;
  const nextSteps = Array.isArray(payload.nextSteps) ? payload.nextSteps : [];
  const mistakes = Array.isArray(payload.mistakes) ? payload.mistakes : [];
  const candidate = [...nextSteps, ...mistakes].find((item): item is string => typeof item === "string" && Boolean(item.trim()));
  return candidate?.trim() ?? null;
}

export async function getAssistantWorkspaceData(): Promise<AssistantWorkspaceData> {
  const { user } = await ensureDemoStudent();
  const membership = await getCurrentUserClass(user.id);
  const snapshot = await getStudentAssistantData();

  const [resources, essays] = await Promise.all([
    prisma.resource.findMany({
      where: membership?.classId
        ? {
            OR: [{ classId: membership.classId }, { classId: null }]
          }
        : undefined,
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        title: true,
        subject: {
          select: {
            name: true
          }
        }
      }
    }),
    prisma.essay.findMany({
      where: { studentId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        title: true,
        subject: {
          select: {
            name: true
          }
        }
      }
    })
  ]);

  return {
    ...snapshot,
    resources: resources.map((resource) => ({
      id: resource.id,
      title: resource.title,
      subject: resource.subject.name
    })),
    essays: essays.map((essay) => ({
      id: essay.id,
      title: essay.title,
      subject: essay.subject.name
    }))
  };
}

export async function askStudentAssistant(input: {
  prompt: string;
  history?: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
  resourceId?: string;
  essayId?: string;
}): Promise<AssistantReplyData> {
  const { user } = await ensureDemoStudent();
  const membership = await getCurrentUserClass(user.id);
  const prompt = input.prompt.trim().slice(0, 4_000);
  const history = (input.history ?? []).slice(-6).map((message) => ({
    role: message.role,
    content: message.content.slice(0, 3_000)
  }));

  const [
    resource,
    essay,
    essayFeedback,
    weakPoints,
    dueStatesCount,
    neverReviewedCount,
    profile,
    recentGrades,
    upcomingTasks,
    recentFeedbacks,
    completedSessions
  ] = await Promise.all([
    input.resourceId
      ? prisma.resource.findFirst({
          where: {
            id: input.resourceId,
            ...(membership?.classId
              ? {
                  OR: [{ classId: membership.classId }, { classId: null }]
                }
              : {})
          },
          include: {
            subject: true,
            chapter: true
          }
        })
      : null,
    input.essayId
      ? prisma.essay.findFirst({
          where: {
            id: input.essayId,
            studentId: user.id
          },
          include: {
            subject: true
          }
        })
      : null,
    input.essayId
      ? prisma.essayFeedback.findFirst({
          where: { essayId: input.essayId },
          orderBy: { createdAt: "desc" }
        })
      : null,
    prisma.weakPoint.findMany({
      where: { studentId: user.id },
      orderBy: { severityScore: "desc" },
      take: 4
    }),
    prisma.flashcardState.count({
      where: {
        userId: user.id,
        nextReviewAt: {
          lte: new Date()
        }
      }
    }),
    prisma.flashcard.count({
      where: {
        deck: {
          ownerUserId: user.id
        },
        states: {
          none: {
            userId: user.id
          }
        }
      }
    }),
    prisma.studentProfile.findUnique({ where: { userId: user.id } }),
    prisma.studentGrade.findMany({
      where: { studentId: user.id },
      include: { subject: true },
      orderBy: { capturedAt: "desc" },
      take: 5
    }),
    prisma.task.findMany({
      where: { studentId: user.id, status: { not: "done" } },
      include: { subject: true },
      orderBy: [{ dueAt: "asc" }, { priorityScore: "desc" }],
      take: 5
    }),
    prisma.essayFeedback.findMany({
      where: { essay: { studentId: user.id } },
      include: { essay: { include: { subject: true } } },
      orderBy: { createdAt: "desc" },
      take: 4
    }),
    prisma.studySession.aggregate({
      where: {
        studentId: user.id,
        status: "COMPLETED",
        plannedStartAt: { gte: getWeekStart(), lte: new Date() }
      },
      _sum: { actualDurationMin: true }
    })
  ]);

  const dueFlashcards = dueStatesCount + neverReviewedCount;
  const selectedResourceContent = resource
    ? await getResourceReadableText(resource).catch(() => null)
    : null;
  const recentFeedback = recentFeedbacks
    .map((feedback) => {
      const summary = getFeedbackSummary(feedback.feedbackJson);
      return summary ? `${feedback.essay.subject.name} : ${summary}` : null;
    })
    .filter((entry): entry is string => Boolean(entry));

  const reply = await generateAssistantReply({
    userId: user.id,
    prompt,
    history,
    weakPointLabels: weakPoints.map((point) => point.label),
    dueFlashcards,
    selectedResourceTitle: resource?.title,
    selectedResourceContent: selectedResourceContent?.slice(0, 30_000) ?? undefined,
    selectedEssayTitle: essay?.title,
    selectedEssaySummary:
      essayFeedback && typeof essayFeedback.feedbackJson === "object" && essayFeedback.feedbackJson
        ? JSON.stringify(essayFeedback.feedbackJson).slice(0, 15_000)
        : essay
          ? essay.submissionType === "FILE_UPLOAD"
            ? "Copie deposee au format fichier."
            : essay.storageKey.slice(0, 15_000)
          : undefined,
    studentContext: {
      prepYear: profile?.prepYear ?? null,
      targetExams: getTargetLabels(profile?.targetExams),
      completedMinutesThisWeek: completedSessions._sum.actualDurationMin ?? 0,
      recentGrades: recentGrades.map((grade) => ({
        subject: grade.subject.name,
        title: grade.title,
        score: Number(((grade.score / grade.maxScore) * 20).toFixed(1))
      })),
      upcomingTasks: upcomingTasks.map((task) => ({
        subject: task.subject?.name ?? "Matiere",
        title: task.title,
        dueLabel: task.dueAt
          ? task.dueAt.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
          : "sans echeance"
      })),
      recentFeedback
    }
  });

  return reply;
}
