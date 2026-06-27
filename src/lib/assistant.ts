import { generateAssistantReply } from "./ai";
import { getCurrentUserClass } from "./auth";
import { prisma } from "./db";
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
      include: { subject: true }
    }),
    prisma.essay.findMany({
      where: { studentId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { subject: true }
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

  const [resource, essay, essayFeedback, weakPoints, flashcards] = await Promise.all([
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
    prisma.flashcard.findMany({
      where: {
        deck: {
          ownerUserId: user.id
        }
      },
      include: {
        states: {
          where: { userId: user.id }
        }
      }
    })
  ]);

  const reply = await generateAssistantReply({
    userId: user.id,
    prompt: input.prompt,
    history: input.history ?? [],
    weakPointLabels: weakPoints.map((point) => point.label),
    dueFlashcards: flashcards.filter((card) => {
      const state = card.states[0];
      return !state?.nextReviewAt || state.nextReviewAt <= new Date();
    }).length,
    selectedResourceTitle: resource?.title,
    selectedResourceContent: resource?.storageKey,
    selectedEssayTitle: essay?.title,
    selectedEssaySummary:
      essayFeedback && typeof essayFeedback.feedbackJson === "object" && essayFeedback.feedbackJson
        ? JSON.stringify(essayFeedback.feedbackJson)
        : essay
          ? essay.submissionType === "FILE_UPLOAD"
            ? "Copie deposee au format fichier."
            : essay.storageKey
          : undefined
  });

  return reply;
}
