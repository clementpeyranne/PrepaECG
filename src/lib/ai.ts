import { createHash } from "node:crypto";

import { Prisma } from "@prisma/client";

import {
  estimateAICostUsd,
  getAICacheTtlSeconds,
  getAIGuardrailConfig,
  getAIModel,
  parseAIUsage,
  startOfUtcDay,
  startOfUtcMonth
} from "./ai-guardrails";
import { prisma } from "./db";
import { getAITaskDefinition, type AITaskId } from "./ai-task-catalog";

type ReasoningEffort = "low" | "medium" | "high";

type AIStatusMeta = {
  isLive: boolean;
  providerLabel: string;
  title: string;
  description: string;
  nextStep: string;
};

type ResourceSummaryResult = {
  items: string[];
};

type ResourceFlashcardsResult = {
  cards: Array<{
    frontText: string;
    backText: string;
  }>;
};

export type EssayReviewResult = {
  scoreMin: number;
  scoreMax: number;
  overview: string;
  strengths: string[];
  mistakes: string[];
  nextSteps: string[];
  planningSignals: string[];
};

export type EssayDocumentInput =
  | {
      kind: "text";
      text: string;
    }
  | {
      kind: "file";
      mimeType: string;
      fileName: string;
      base64Data: string;
    };

export type PlanningGuidanceResult = {
  reasoning: string[];
  title: string;
  description: string;
  nextStep: string;
};

export type WeeklyReviewResult = {
  summary: string;
  wins: string[];
  focusAreas: string[];
  nextActions: string[];
};

export type AssistantSnapshotResult = {
  headline: string;
  summary: string;
  quickPrompts: string[];
  actions: string[];
};

export type AssistantReplyResult = {
  answer: string;
  actions: string[];
  citations: string[];
};

export type StudentAssistantContext = {
  prepYear: number | null;
  targetExams: string[];
  completedMinutesThisWeek: number;
  recentGrades: Array<{
    subject: string;
    title: string;
    score: number;
  }>;
  upcomingTasks: Array<{
    subject: string;
    title: string;
    dueLabel: string;
  }>;
  recentFeedback: string[];
};

export type NewsInsightResult = {
  summary: string;
  whyItMatters: string;
  oralQuestion: string;
};

function getProviderMode() {
  return process.env.AI_PROVIDER ?? "auto";
}

function shouldUseOpenAI() {
  return getProviderMode() !== "local" && Boolean(process.env.OPENAI_API_KEY);
}

function truncate(value: string, length = 280) {
  return value.length > length ? `${value.slice(0, length - 3)}...` : value;
}

function getResponseOutputText(payload: Record<string, unknown>) {
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text;
  }

  const output = Array.isArray(payload.output) ? payload.output : [];
  const chunks: string[] = [];

  for (const item of output) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const content = Array.isArray((item as { content?: unknown[] }).content)
      ? ((item as { content: Array<Record<string, unknown>> }).content ?? [])
      : [];

    for (const part of content) {
      if (part.type === "output_text" && typeof part.text === "string") {
        chunks.push(part.text);
      }
    }
  }

  return chunks.join("\n").trim();
}

async function recordAIGeneration(input: {
  userId: string;
  featureName: string;
  sourceEntityType: string;
  sourceEntityId: string;
  modelName: string;
  status: string;
  inputSummary: string;
  outputSummary?: string;
  costEstimate?: number;
  inputTokens?: number;
  cachedInputTokens?: number;
  outputTokens?: number;
  durationMs?: number;
  requestHash?: string;
  requestKey?: string;
  responseJson?: unknown;
  cacheHit?: boolean;
  blockedReason?: string;
}) {
  try {
    await prisma.aIGeneration.create({
      data: {
        userId: input.userId,
        featureName: input.featureName,
        sourceEntityType: input.sourceEntityType,
        sourceEntityId: input.sourceEntityId,
        modelName: input.modelName,
        status: input.status,
        inputSummary: truncate(input.inputSummary),
        outputSummary: input.outputSummary ? truncate(input.outputSummary) : null,
        costEstimate: input.costEstimate,
        inputTokens: input.inputTokens,
        cachedInputTokens: input.cachedInputTokens,
        outputTokens: input.outputTokens,
        durationMs: input.durationMs,
        requestHash: input.requestHash,
        requestKey: input.requestKey,
        responseJson: input.responseJson === undefined
          ? undefined
          : input.responseJson as Prisma.InputJsonValue,
        cacheHit: input.cacheHit ?? false,
        blockedReason: input.blockedReason
      }
    });
  } catch (error) {
    console.error("AI_GENERATION_LOG_FAILED", error);
  }
}

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

async function getAIBlockReason(userId: string) {
  const config = getAIGuardrailConfig();
  const pendingSince = new Date(Date.now() - 10 * 60 * 1000);
  const [globalSpend, userSpend, dailyRequests, globalPending, userPending] = await Promise.all([
    prisma.aIGeneration.aggregate({
      where: { status: "COMPLETED", createdAt: { gte: startOfUtcMonth() } },
      _sum: { costEstimate: true }
    }),
    prisma.aIGeneration.aggregate({
      where: { userId, status: "COMPLETED", createdAt: { gte: startOfUtcMonth() } },
      _sum: { costEstimate: true }
    }),
    prisma.aIGeneration.count({
      where: {
        userId,
        status: { in: ["PENDING", "COMPLETED"] },
        cacheHit: false,
        modelName: { not: "local-rules" },
        createdAt: { gte: startOfUtcDay() }
      }
    }),
    prisma.aIGeneration.count({ where: { status: "PENDING", createdAt: { gte: pendingSince } } }),
    prisma.aIGeneration.count({ where: { userId, status: "PENDING", createdAt: { gte: pendingSince } } })
  ]);

  if (globalPending >= config.globalConcurrentLimit) return "GLOBAL_CONCURRENT_LIMIT";
  if (userPending >= config.userConcurrentLimit) return "USER_CONCURRENT_LIMIT";
  // Keep a 5% safety margin for requests already running on another server instance.
  if ((globalSpend._sum.costEstimate ?? 0) >= config.globalMonthlyBudgetUsd * 0.95) return "GLOBAL_MONTHLY_BUDGET";
  if ((userSpend._sum.costEstimate ?? 0) >= config.userMonthlyBudgetUsd * 0.95) return "USER_MONTHLY_BUDGET";
  if (dailyRequests >= config.userDailyRequestLimit) return "USER_DAILY_REQUEST_LIMIT";
  return null;
}

async function findCachedAIResponse<T>(userId: string, requestHash: string, taskId: AITaskId) {
  const createdAfter = new Date(Date.now() - getAICacheTtlSeconds(taskId) * 1000);
  const cached = await prisma.aIGeneration.findFirst({
    where: {
      userId,
      requestHash,
      status: "COMPLETED",
      createdAt: { gte: createdAfter }
    },
    orderBy: { createdAt: "desc" }
  });
  return cached?.responseJson ? cached.responseJson as T : null;
}

async function callOpenAIJson<T>(input: {
  userId: string;
  taskId: AITaskId;
  sourceEntityType: string;
  sourceEntityId: string;
  additionalInstructions?: string;
  prompt: string;
  requestInput?: unknown;
  schemaName: string;
  schema: Record<string, unknown>;
  reasoningEffort?: ReasoningEffort;
  maxOutputTokens?: number;
}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!shouldUseOpenAI() || !apiKey) {
    return null;
  }

  const task = getAITaskDefinition(input.taskId);
  const modelName = getAIModel(input.taskId);
  const instructions = [task.systemInstructions, input.additionalInstructions].filter(Boolean).join("\n");
  const requestPayload = input.requestInput ?? input.prompt;
  const requestHash = createHash("sha256")
    .update(JSON.stringify({ taskId: input.taskId, modelName, instructions, requestPayload, schema: input.schema }))
    .digest("hex");

  const cached = await findCachedAIResponse<T>(input.userId, requestHash, input.taskId);
  if (cached) {
    await recordAIGeneration({
      userId: input.userId,
      featureName: task.featureName,
      sourceEntityType: input.sourceEntityType,
      sourceEntityId: input.sourceEntityId,
      modelName,
      status: "COMPLETED",
      inputSummary: `${task.label} - reponse reutilisee`,
      outputSummary: "Cache IA utilise sans nouvel appel payant.",
      costEstimate: 0,
      inputTokens: 0,
      cachedInputTokens: 0,
      outputTokens: 0,
      requestHash,
      responseJson: cached,
      cacheHit: true
    });
    return cached;
  }

  const blockedReason = await getAIBlockReason(input.userId);
  if (blockedReason) {
    await recordAIGeneration({
      userId: input.userId,
      featureName: task.featureName,
      sourceEntityType: input.sourceEntityType,
      sourceEntityId: input.sourceEntityId,
      modelName,
      status: "BLOCKED",
      inputSummary: `${task.label} - appel bloque`,
      outputSummary: "Limite de consommation atteinte.",
      costEstimate: 0,
      requestHash,
      blockedReason
    });
    return null;
  }

  const guardrails = getAIGuardrailConfig();
  const requestKey = `${input.userId}:${requestHash}:${Math.floor(Date.now() / (guardrails.duplicateWindowSeconds * 1000))}`;
  let generationId: string;
  try {
    const generation = await prisma.aIGeneration.create({
      data: {
        userId: input.userId,
        featureName: task.featureName,
        sourceEntityType: input.sourceEntityType,
        sourceEntityId: input.sourceEntityId,
        modelName,
        status: "PENDING",
        inputSummary: truncate(`${task.label} - ${input.sourceEntityType}`),
        requestHash,
        requestKey
      }
    });
    generationId = generation.id;
  } catch (error) {
    if (isUniqueConstraintError(error)) return null;
    throw error;
  }

  const startedAt = Date.now();

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelName,
        reasoning: {
          effort: input.reasoningEffort ?? "medium"
        },
        instructions,
        input: requestPayload,
        max_output_tokens: input.maxOutputTokens ?? 1400,
        text: {
          format: {
            type: "json_schema",
            name: input.schemaName,
            schema: input.schema,
            strict: true
          }
        }
      })
    });

    const payload = (await response.json()) as Record<string, unknown>;
    if (!response.ok) {
      throw new Error(`OpenAI request failed: ${response.status}`);
    }

    const outputText = getResponseOutputText(payload);
    if (!outputText) {
      throw new Error("OpenAI response was empty.");
    }

    const parsed = JSON.parse(outputText) as T;
    const usage = parseAIUsage(payload);
    const costEstimate = estimateAICostUsd(input.taskId, usage);

    await prisma.aIGeneration.update({
      where: { id: generationId },
      data: {
        status: "COMPLETED",
        outputSummary: "Sortie structuree validee.",
        responseJson: parsed as Prisma.InputJsonValue,
        costEstimate,
        inputTokens: usage.inputTokens,
        cachedInputTokens: usage.cachedInputTokens,
        outputTokens: usage.outputTokens,
        durationMs: Date.now() - startedAt
      }
    });

    return parsed;
  } catch (error) {
    await prisma.aIGeneration.update({
      where: { id: generationId },
      data: {
        status: "FAILED",
        outputSummary: truncate(error instanceof Error ? error.message : "Erreur IA"),
        durationMs: Date.now() - startedAt
      }
    }).catch(() => undefined);

    return null;
  }
}

function getLines(text: string) {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function getWords(text: string) {
  return text
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);
}

function buildLocalSummary(text: string, count: number) {
  const lines = getLines(text);
  return (lines.length > 0 ? lines : [truncate(text, 180)]).slice(0, count);
}

function buildLocalFlashcards(text: string, chapter: string) {
  const cards = getLines(text)
    .flatMap((line, index) => {
      if (line.includes(":")) {
        const [front, ...rest] = line.split(":");
        const back = rest.join(":").trim();
        if (front.trim() && back) {
          return [{ frontText: front.trim(), backText: back }];
        }
      }

      return [
        {
          frontText: `Point cle ${index + 1} - ${chapter}`,
          backText: line
        }
      ];
    })
    .filter((card) => card.backText.length > 10)
    .slice(0, 12);

  return cards;
}

function buildLocalEssayReview(input: {
  subject: string;
  examType: string;
  targetExam: string;
  essayText: string;
}) {
  const text = input.essayText;
  const words = getWords(text);
  const paragraphs = getLines(text);
  const lower = text.toLowerCase();
  const hasExamples = /\d{4}|exemple|par exemple|selon|romer|solow|lucas|schumpeter|bretton|omc/.test(lower);
  const hasStructure =
    /introduction|conclusion|problematique|plan|premiere partie|deuxieme partie/.test(lower) ||
    paragraphs.length >= 4;
  const hasPrecision = /\d{2,4}|%|loi|modele|croissance|mondialisation|probabilite|variance/.test(lower);

  let scoreBase = 7;
  if (words.length > 500) scoreBase += 2;
  if (words.length > 900) scoreBase += 1;
  if (hasStructure) scoreBase += 2;
  if (hasExamples) scoreBase += 2;
  if (hasPrecision) scoreBase += 1;

  const scoreMin = Math.max(4, Math.min(17, scoreBase - 1));
  const scoreMax = Math.max(scoreMin + 1, Math.min(19, scoreBase + 1));

  const strengths = [
    hasStructure
      ? "La copie a une structure identifiable, ce qui aide deja a lire le raisonnement."
      : "L'intention de reponse est visible, ce qui donne une base de travail exploitable.",
    hasExamples
      ? "Des exemples, dates ou auteurs apparaissent et peuvent etre mieux valorises."
      : "Le fond du cours semble present et peut etre rendu plus concret avec des exemples.",
    hasPrecision
      ? "Certains points du cours sont formules avec precision."
      : "Le sujet est pris au serieux et peut rapidement gagner en precision."
  ];

  const mistakes = [
    !hasStructure
      ? "La copie manque de charpente nette : problematique, progression et conclusion doivent etre plus visibles."
      : "La progression argumentative doit encore etre rendue plus demonstrative entre les parties.",
    !hasExamples
      ? "Les exemples, auteurs ou dates sont encore trop peu nombreux pour convaincre au niveau concours."
      : "Les references sont presentes mais pas toujours exploitees pour prouver une idee.",
    words.length < 500
      ? "La densite reste trop faible pour viser haut sur une epreuve de concours."
      : "La copie doit gagner en selectivite pour eviter les passages trop descriptifs."
  ];

  const nextSteps = [
    `Refaire un plan propre sur le sujet ${input.subject} en 15 minutes.`,
    "Reprendre la copie avec un code couleur : these, preuve, exemple, transition.",
    "Transformer les erreurs relevees en points de methode a revoir cette semaine."
  ];

  const planningSignals = [
    "Ajouter un bloc court de relecture methodologique apres la prochaine copie.",
    "Prevoir une session ciblee sur les exemples et references mobilisables.",
    "Faire remonter cette matiere dans le planning sans retirer les autres."
  ];

  return {
    scoreMin,
    scoreMax,
    overview: `Retour ${input.examType} pour ${input.targetExam} : la copie a une base exploitable, mais elle doit gagner en precision, en preuves et en lisibilite concours.`,
    strengths,
    mistakes,
    nextSteps,
    planningSignals
  };
}

function buildLocalPlanningGuidance(input: {
  targetExamSummary: string;
  coherenceTitle: string;
  coherenceHelper: string;
  weakPointLabels: string[];
  recentEssayMistakes: string[];
  dueFlashcards: number;
  completedSessions: number;
}) {
  const mainWeakPoint = input.weakPointLabels[0];
  const essaySignal = input.recentEssayMistakes[0];

  return {
    reasoning: [
      `${input.coherenceTitle} : ${input.coherenceHelper}`,
      mainWeakPoint
        ? `La priorite monte sur ${mainWeakPoint.toLowerCase()}, mais le planning garde plusieurs matieres en mouvement.`
        : "Le planning reste volontairement equilibre entre les matieres.",
      input.dueFlashcards > 0
        ? `${input.dueFlashcards} cartes sont dues : la repetition espacee doit rester dans la semaine.`
        : "La file de flashcards est sous controle pour l'instant.",
      essaySignal
        ? `Les derniers retours de copie indiquent aussi ce point de vigilance : ${essaySignal.toLowerCase()}`
        : "Aucun signal copie recent ne force de correction lourde dans la semaine."
    ],
    title: shouldUseOpenAI() ? "IA OpenAI connectee" : "Coach local actif",
    description: shouldUseOpenAI()
      ? "Le planning combine maintenant les donnees eleve avec un moteur IA connecte et des sorties structurees."
      : "Le planning est deja pilote par un coach local structure. Une vraie IA OpenAI peut etre activee ensuite sans refaire le produit.",
    nextStep:
      input.completedSessions < 2
        ? `Le prochain enjeu est de stabiliser le rythme reel de travail pour ${input.targetExamSummary}.`
        : `La prochaine optimisation visera a mieux repartir les blocs pour ${input.targetExamSummary}.`
  };
}

function buildLocalAssistantSnapshot(input: {
  weakPointLabels: string[];
  dueFlashcards: number;
  resourceTitle?: string;
  essayTitle?: string;
}) {
  return {
    headline: "Assistant prepa ECG",
    summary:
      "Pose une question, relie un cours ou une copie, et utilise le chat comme un vrai binome de travail pour comprendre, resumer, memoriser et corriger.",
    quickPrompts: [
      "Resume-moi ce cours en points essentiels",
      "Transforme ce chapitre en flashcards",
      "Explique-moi cette correction simplement",
      "Donne-moi une methode pour une dissertation de prepa",
      "Interroge-moi sur ce chapitre"
    ],
    actions: [
      input.dueFlashcards > 0
        ? `${input.dueFlashcards} cartes peuvent nourrir des revisions actives.`
        : "Les flashcards restent disponibles pour entretenir les notions deja vues.",
      input.resourceTitle
        ? `Ressource recente disponible : ${input.resourceTitle}.`
        : "Ajoute ou ouvre une ressource pour demander un resume, une fiche ou des cartes.",
      input.essayTitle
        ? `Derniere copie disponible : ${input.essayTitle}.`
        : "Depose une copie pour obtenir une explication de correction plus precise."
    ]
  };
}

function buildLocalNewsInsight(input: {
  sectionLabel: string;
  targetLanguage: string;
  articleTitle: string;
  sourceName: string;
  excerpt: string;
}) {
  const lower = `${input.articleTitle} ${input.excerpt}`.toLowerCase();
  const angle =
    /inflation|taux|rates|growth|croissance|trade|commerce|budget|debt|dette|jobs|emploi/.test(lower)
      ? "les grands equilibres economiques"
      : /election|vote|government|gouvernement|democracy|democratie|migration|border|frontiere/.test(lower)
        ? "la vie politique et les rapports de puissance"
        : /climate|energy|energie|war|guerre|china|chine|technology|technologie|ai/.test(lower)
          ? "les mutations geopolitiques et technologiques"
          : "une question solide d'actualite internationale";

  const oralQuestion =
    input.targetLanguage === "anglais"
      ? `Why does this article from ${input.sourceName} matter for a prep student following current affairs?`
      : input.targetLanguage === "espagnol"
        ? `Por que este articulo de ${input.sourceName} puede ser util para un alumno de prepa que sigue la actualidad?`
        : input.targetLanguage === "allemand"
          ? `Warum kann dieser Artikel aus ${input.sourceName} fur einen Prepastudenten beim Verfolgen der Aktualitat nutzlich sein?`
          : `Perche questo articolo di ${input.sourceName} puo essere utile a uno studente di prepa che segue l'attualita?`;

  return {
    summary: `Cet article de ${input.sourceName} semble utile pour suivre ${angle} dans la rubrique ${input.sectionLabel}.`,
    whyItMatters:
      "Il peut nourrir la comprehension du monde contemporain, enrichir les exemples mobilisables a l'oral et donner de la matiere pour les essais de langue.",
    oralQuestion
  };
}

function getAssistantResourceLines(text?: string, limit = 4) {
  if (!text) {
    return [];
  }

  return getLines(text)
    .filter((line) => line.length > 12)
    .slice(0, limit);
}

function getAssistantEssayHighlights(text?: string) {
  if (!text) {
    return [];
  }

  try {
    const parsed = JSON.parse(text) as {
      overview?: unknown;
      strengths?: unknown;
      mistakes?: unknown;
      nextSteps?: unknown;
    };
    const highlights: string[] = [];

    if (typeof parsed.overview === "string" && parsed.overview.trim()) {
      highlights.push(parsed.overview.trim());
    }

    if (Array.isArray(parsed.mistakes)) {
      highlights.push(
        ...parsed.mistakes.filter((value): value is string => typeof value === "string").slice(0, 2)
      );
    }

    if (Array.isArray(parsed.nextSteps)) {
      highlights.push(
        ...parsed.nextSteps.filter((value): value is string => typeof value === "string").slice(0, 2)
      );
    }

    return highlights.slice(0, 4);
  } catch {
    return getLines(text).slice(0, 4);
  }
}

function normalizeAssistantText(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ");
}

function getAssistantKeywords(text: string, limit = 8) {
  const stopwords = new Set([
    "alors",
    "avec",
    "avoir",
    "cette",
    "comment",
    "dans",
    "depuis",
    "donc",
    "elle",
    "elles",
    "entre",
    "etre",
    "fait",
    "faire",
    "faut",
    "leur",
    "mais",
    "meme",
    "pour",
    "pourquoi",
    "plus",
    "quand",
    "quel",
    "quelle",
    "quelles",
    "quels",
    "sans",
    "sont",
    "sous",
    "tout",
    "tous",
    "tres",
    "une",
    "des",
    "les",
    "est",
    "que",
    "qui",
    "sur",
    "pas",
    "par",
    "dans",
    "comme",
    "cela",
    "cest",
    "etre",
    "mon",
    "ma",
    "mes",
    "ton",
    "ta",
    "tes",
    "leur",
    "leurs",
    "nous",
    "vous",
    "cela",
    "aussi",
    "juste",
    "bien"
  ]);

  const seen = new Set<string>();

  return normalizeAssistantText(text)
    .split(/\s+/)
    .filter((word) => word.length >= 4 && !stopwords.has(word))
    .filter((word) => {
      if (seen.has(word)) {
        return false;
      }

      seen.add(word);
      return true;
    })
    .slice(0, limit);
}

function getAssistantRelevantItems(items: string[], query: string, count: number) {
  const keywords = getAssistantKeywords(query);

  if (!items.length) {
    return [];
  }

  if (!keywords.length) {
    return items.slice(0, count);
  }

  const ranked = items
    .map((item) => {
      const normalizedItem = normalizeAssistantText(item);
      const score = keywords.reduce((total, keyword) => {
        return normalizedItem.includes(keyword) ? total + Math.min(keyword.length, 6) : total;
      }, 0);

      return { item, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, count)
    .map((entry) => entry.item);

  return ranked.length ? ranked : items.slice(0, count);
}

function buildLocalAssistantQuiz(items: string[]) {
  return items.slice(0, 3).map((item, index) => {
    if (item.includes(":")) {
      const [left] = item.split(":");
      return `${index + 1}. Explique : ${left.trim()}.`;
    }

    return `${index + 1}. Que retiens-tu de cette idee : ${item}`;
  });
}

export function getAIStatusMeta(): AIStatusMeta {
  if (shouldUseOpenAI()) {
    return {
      isLive: true,
      providerLabel: "OpenAI",
      title: "IA OpenAI connectee",
      description:
        "Le site peut utiliser le moteur OpenAI via l'API Responses avec des sorties structurees pour les ressources, les copies et le pilotage eleve.",
      nextStep: "Le suivi peut maintenant devenir plus fin a mesure que l'etudiant accumule des revisions et des retours de copies."
    };
  }

  return {
    isLive: false,
    providerLabel: "Local",
    title: "Coach local actif",
    description:
      "Le site fonctionne deja avec une couche IA locale structuree. Elle relie profil, flashcards, ressources et copies, mais sans modele externe tant qu'aucune cle OpenAI n'est configuree.",
    nextStep:
      "Ajoute ensuite OPENAI_API_KEY pour passer du mode local a une IA OpenAI plus puissante sans changer l'application."
  };
}

export async function generateResourceSummary(input: {
  userId: string;
  resourceId: string;
  title: string;
  subject: string;
  chapter: string;
  text: string;
}) {
  const local = { items: buildLocalSummary(input.text, 4) };
  const remote = await callOpenAIJson<ResourceSummaryResult>({
    userId: input.userId,
    taskId: "resource_summary",
    sourceEntityType: "Resource",
    sourceEntityId: input.resourceId,
    prompt: `Ressource : ${input.title}\nMatiere : ${input.subject}\nChapitre : ${input.chapter}\n\nContenu :\n${input.text}\n\nRetourne 4 points de resume tres utiles pour un etudiant de prepa.`,
    schemaName: "resource_summary",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        items: {
          type: "array",
          items: { type: "string" }
        }
      },
      required: ["items"]
    },
    reasoningEffort: "low",
    maxOutputTokens: 700
  });

  if (remote?.items?.length) {
    return remote;
  }

  await recordAIGeneration({
    userId: input.userId,
    featureName: "resource_summary",
    sourceEntityType: "Resource",
    sourceEntityId: input.resourceId,
    modelName: "local-rules",
    status: "COMPLETED",
    inputSummary: `${input.title} - ${input.subject} - ${input.chapter}`,
    outputSummary: `${local.items.length} elements generes.`
  });

  return local;
}

export async function generateResourceSheet(input: {
  userId: string;
  resourceId: string;
  title: string;
  subject: string;
  chapter: string;
  text: string;
}) {
  const local = { items: buildLocalSummary(input.text, 6) };
  const remote = await callOpenAIJson<ResourceSummaryResult>({
    userId: input.userId,
    taskId: "resource_sheet",
    sourceEntityType: "Resource",
    sourceEntityId: input.resourceId,
    prompt: `Ressource : ${input.title}\nMatiere : ${input.subject}\nChapitre : ${input.chapter}\n\nContenu :\n${input.text}\n\nRetourne 6 lignes de fiche de revision directement memorisables.`,
    schemaName: "resource_sheet",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        items: {
          type: "array",
          items: { type: "string" }
        }
      },
      required: ["items"]
    },
    reasoningEffort: "low",
    maxOutputTokens: 900
  });

  if (remote?.items?.length) {
    return remote;
  }

  await recordAIGeneration({
    userId: input.userId,
    featureName: "resource_sheet",
    sourceEntityType: "Resource",
    sourceEntityId: input.resourceId,
    modelName: "local-rules",
    status: "COMPLETED",
    inputSummary: `${input.title} - ${input.subject} - ${input.chapter}`,
    outputSummary: `${local.items.length} elements generes.`
  });

  return local;
}

export async function generateResourceFlashcards(input: {
  userId: string;
  resourceId: string;
  title: string;
  subject: string;
  chapter: string;
  text: string;
}) {
  const local = { cards: buildLocalFlashcards(input.text, input.chapter) };
  const remote = await callOpenAIJson<ResourceFlashcardsResult>({
    userId: input.userId,
    taskId: "resource_flashcards",
    sourceEntityType: "Resource",
    sourceEntityId: input.resourceId,
    prompt: `Ressource : ${input.title}\nMatiere : ${input.subject}\nChapitre : ${input.chapter}\n\nContenu :\n${input.text}\n\nRetourne jusqu'a 12 flashcards de revision utiles et precises.`,
    schemaName: "resource_flashcards",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        cards: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              frontText: { type: "string" },
              backText: { type: "string" }
            },
            required: ["frontText", "backText"]
          }
        }
      },
      required: ["cards"]
    },
    reasoningEffort: "medium",
    maxOutputTokens: 1200
  });

  if (remote?.cards?.length) {
    return remote;
  }

  await recordAIGeneration({
    userId: input.userId,
    featureName: "resource_flashcards",
    sourceEntityType: "Resource",
    sourceEntityId: input.resourceId,
    modelName: "local-rules",
    status: "COMPLETED",
    inputSummary: `${input.title} - ${input.subject} - ${input.chapter}`,
    outputSummary: `${local.cards.length} cartes generees.`
  });

  return local;
}

export async function generateEssayReview(input: {
  userId: string;
  essayId: string;
  subject: string;
  examType: string;
  targetExam: string;
  rubric?: {
    title: string;
    criteria: string[];
  };
  essayContent: EssayDocumentInput;
}) {
  const rubricContext = input.rubric?.criteria.length
    ? `\nGrille professeur : ${input.rubric.title}\nCriteres : ${input.rubric.criteria.join(" | ")}`
    : "\nAucune grille professeur specifique n'est disponible.";
  const local =
    input.essayContent.kind === "text"
      ? buildLocalEssayReview({
          subject: input.subject,
          examType: input.examType,
          targetExam: input.targetExam,
          essayText: input.essayContent.text
        })
      : {
          scoreMin: 7,
          scoreMax: 11,
          overview:
            "La copie a bien ete deposee au format fichier. En mode local, la lecture fine d'un PDF ou d'une photo reste limitee sans moteur de vision/OCR.",
          strengths: [
            "Le depot devient beaucoup plus simple pour l'etudiant.",
            "La copie peut maintenant etre relue ensuite par l'IA ou par un professeur.",
            "Le fichier reste rattache a l'historique de progression."
          ],
          mistakes: [
            "La correction locale ne peut pas encore lire ligne par ligne un document image ou PDF.",
            "La methode, les exemples et la structure ne peuvent donc pas etre verifies avec precision en mode local.",
            "Pour une correction riche sur photo/PDF, il faut activer OpenAI."
          ],
          nextSteps: [
            "Activer OpenAI pour lire automatiquement les photos et les PDFs.",
            "Ajouter ensuite un retour professeur si besoin.",
            "Exploiter les remarques dans le planning et les ressources."
          ],
          planningSignals: [
            "Conserver un bloc de methode dans la semaine.",
            "Prevoir une vraie relecture de la copie des que la lecture du document est disponible.",
            "Ne pas tirer de conclusion trop precise tant que la copie n'a pas ete lue."
          ]
        };

  const baseSchema = {
    type: "object",
    additionalProperties: false,
    properties: {
      scoreMin: { type: "number" },
      scoreMax: { type: "number" },
      overview: { type: "string" },
      strengths: { type: "array", items: { type: "string" } },
      mistakes: { type: "array", items: { type: "string" } },
      nextSteps: { type: "array", items: { type: "string" } },
      planningSignals: { type: "array", items: { type: "string" } }
    },
    required: ["scoreMin", "scoreMax", "overview", "strengths", "mistakes", "nextSteps", "planningSignals"]
  } as const;

  if (input.essayContent.kind === "text") {
    const remote = await callOpenAIJson<EssayReviewResult>({
      userId: input.userId,
      taskId: "essay_review",
      sourceEntityType: "Essay",
      sourceEntityId: input.essayId,
      prompt: `Matiere : ${input.subject}\nType d'epreuve : ${input.examType}\nConcours cible : ${input.targetExam}${rubricContext}\n\nCopie etudiante :\n${input.essayContent.text}\n\nRetourne une correction structuree avec fourchette de note, points forts, erreurs majeures et prochaines actions de travail.`,
      schemaName: "essay_review",
      schema: baseSchema,
      reasoningEffort: "medium",
      maxOutputTokens: 1500
    });

    if (remote) {
      return remote;
    }
  } else {
    const instruction = `Matiere : ${input.subject}\nType d'epreuve : ${input.examType}\nConcours cible : ${input.targetExam}${rubricContext}\n\nAnalyse ${input.essayContent.mimeType === "application/pdf" ? "ce PDF" : "cette photo"} de copie et retourne une correction structuree.`;
    const fileContent = input.essayContent.mimeType === "application/pdf"
      ? {
          type: "input_file",
          filename: input.essayContent.fileName,
          file_data: `data:${input.essayContent.mimeType};base64,${input.essayContent.base64Data}`
        }
      : {
          type: "input_image",
          image_url: `data:${input.essayContent.mimeType};base64,${input.essayContent.base64Data}`
        };
    const remote = await callOpenAIJson<EssayReviewResult>({
      userId: input.userId,
      taskId: "essay_review",
      sourceEntityType: "Essay",
      sourceEntityId: input.essayId,
      prompt: `${instruction}\nFichier : ${input.essayContent.fileName}`,
      requestInput: [{ role: "user", content: [{ type: "input_text", text: instruction }, fileContent] }],
      schemaName: "essay_review_file",
      schema: baseSchema,
      reasoningEffort: "medium",
      maxOutputTokens: 1800
    });
    if (remote) return remote;
  }

  await recordAIGeneration({
    userId: input.userId,
    featureName: "essay_review",
    sourceEntityType: "Essay",
    sourceEntityId: input.essayId,
    modelName: "local-rules",
    status: "COMPLETED",
    inputSummary: `${input.subject} - ${input.examType} - ${input.targetExam}`,
    outputSummary: `Correction locale ${local.scoreMin}-${local.scoreMax}.`
  });

  return local;
}

export async function generatePlanningGuidance(input: {
  userId: string;
  targetExamSummary: string;
  coherenceTitle: string;
  coherenceHelper: string;
  weakPointLabels: string[];
  recentEssayMistakes: string[];
  dueFlashcards: number;
  completedSessions: number;
}) {
  const local = buildLocalPlanningGuidance(input);
  const remote = await callOpenAIJson<PlanningGuidanceResult>({
    userId: input.userId,
    taskId: "planning_guidance",
    sourceEntityType: "Student",
    sourceEntityId: input.userId,
    prompt: `Objectif concours : ${input.targetExamSummary}\nCohérence actuelle : ${input.coherenceTitle} - ${input.coherenceHelper}\nLacunes : ${input.weakPointLabels.join(", ") || "aucune"}\nErreurs recentes en copie : ${input.recentEssayMistakes.join(" | ") || "aucune"}\nCartes dues : ${input.dueFlashcards}\nSessions deja completees : ${input.completedSessions}\n\nRetourne 4 raisons pedagogiques, un titre d'etat IA, une description et une prochaine etape.`,
    schemaName: "planning_guidance",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        reasoning: { type: "array", items: { type: "string" } },
        title: { type: "string" },
        description: { type: "string" },
        nextStep: { type: "string" }
      },
      required: ["reasoning", "title", "description", "nextStep"]
    },
    reasoningEffort: "medium",
    maxOutputTokens: 900
  });

  if (remote) {
    return remote;
  }

  return local;
}

export async function generateWeeklyReview(input: {
  userId: string;
  completedMinutes: number;
  completedBlocks: number;
  reviewedFlashcards: number;
  dueFlashcards: number;
  recentGrades: Array<{ subject: string; score: number }>;
  weakPointLabels: string[];
  completedTaskTitles: string[];
}) {
  const strongestGrade = input.recentGrades.slice().sort((left, right) => right.score - left.score)[0];
  const local: WeeklyReviewResult = {
    summary: `${input.completedBlocks} blocs valides pour ${input.completedMinutes} minutes de travail cette semaine.`,
    wins: [
      input.completedBlocks > 0 ? `${input.completedBlocks} blocs menes jusqu'a validation.` : "Aucun bloc valide pour le moment.",
      input.reviewedFlashcards > 0 ? `${input.reviewedFlashcards} flashcards revisees.` : "La repetition espacee reste a relancer.",
      strongestGrade ? `${strongestGrade.subject} : ${strongestGrade.score}/20 sur une note recente.` : "Les prochaines notes permettront de mesurer la progression."
    ],
    focusAreas: [
      ...input.weakPointLabels.slice(0, 2),
      ...(input.dueFlashcards > 0 ? [`${input.dueFlashcards} flashcards dues`] : [])
    ].slice(0, 3),
    nextActions: input.completedTaskTitles.length > 0
      ? input.completedTaskTitles.slice(0, 3)
      : ["Valider le prochain bloc propose dans le planning."]
  };
  const remote = await callOpenAIJson<WeeklyReviewResult>({
    userId: input.userId,
    taskId: "weekly_review",
    sourceEntityType: "Student",
    sourceEntityId: input.userId,
    prompt: `Blocs valides : ${input.completedBlocks}\nMinutes validees : ${input.completedMinutes}\nFlashcards revisees : ${input.reviewedFlashcards}\nFlashcards dues : ${input.dueFlashcards}\nNotes recentes : ${input.recentGrades.map((grade) => `${grade.subject} ${grade.score}/20`).join(" | ") || "aucune"}\nPoints faibles : ${input.weakPointLabels.join(" | ") || "aucun"}\nTaches terminees : ${input.completedTaskTitles.join(" | ") || "aucune"}\n\nRetourne un bilan court, trois reussites maximum, trois points de vigilance maximum et trois prochaines actions maximum.`,
    schemaName: "weekly_review",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        summary: { type: "string" },
        wins: { type: "array", items: { type: "string" } },
        focusAreas: { type: "array", items: { type: "string" } },
        nextActions: { type: "array", items: { type: "string" } }
      },
      required: ["summary", "wins", "focusAreas", "nextActions"]
    },
    reasoningEffort: "low",
    maxOutputTokens: 700
  });

  return remote ?? local;
}

export async function generateAssistantSnapshot(input: {
  userId: string;
  weakPointLabels: string[];
  dueFlashcards: number;
  resourceTitle?: string;
  essayTitle?: string;
}) {
  const local = buildLocalAssistantSnapshot(input);
  const remote = await callOpenAIJson<AssistantSnapshotResult>({
    userId: input.userId,
    taskId: "assistant_snapshot",
    sourceEntityType: "Student",
    sourceEntityId: input.userId,
    prompt: `Lacunes : ${input.weakPointLabels.join(", ") || "aucune"}\nCartes dues : ${input.dueFlashcards}\nDerniere ressource utile : ${input.resourceTitle ?? "aucune"}\nDerniere copie : ${input.essayTitle ?? "aucune"}\n\nRetourne une synthese courte, 5 entrees rapides et 3 actions creees.`,
    schemaName: "assistant_snapshot",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        headline: { type: "string" },
        summary: { type: "string" },
        quickPrompts: { type: "array", items: { type: "string" } },
        actions: { type: "array", items: { type: "string" } }
      },
      required: ["headline", "summary", "quickPrompts", "actions"]
    },
    reasoningEffort: "low",
    maxOutputTokens: 800
  });

  if (remote) {
    return remote;
  }

  return local;
}

export async function generateNewsInsight(input: {
  userId: string;
  sectionLabel: string;
  targetLanguage: string;
  articleTitle: string;
  sourceName: string;
  excerpt: string;
  articleUrl: string;
}) {
  const local = buildLocalNewsInsight(input);
  const remote = await callOpenAIJson<NewsInsightResult>({
    userId: input.userId,
    taskId: "news_insight",
    sourceEntityType: "NewsArticle",
    sourceEntityId: input.articleUrl,
    prompt: `Rubrique : ${input.sectionLabel}\nLangue cible : ${input.targetLanguage}\nSource : ${input.sourceName}\nTitre : ${input.articleTitle}\nExtrait : ${input.excerpt}\n\nRetourne une synthese tres concrete en 3 champs : un resume court, pourquoi cet article vaut le detour pour un eleve de prepa, et une question d'oral dans la langue cible.`,
    schemaName: "news_insight",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        summary: { type: "string" },
        whyItMatters: { type: "string" },
        oralQuestion: { type: "string" }
      },
      required: ["summary", "whyItMatters", "oralQuestion"]
    },
    reasoningEffort: "low",
    maxOutputTokens: 500
  });

  if (remote) {
    return remote;
  }

  return local;
}

export async function generateAssistantReply(input: {
  userId: string;
  prompt: string;
  history: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
  weakPointLabels: string[];
  dueFlashcards: number;
  selectedResourceTitle?: string;
  selectedResourceContent?: string;
  selectedEssayTitle?: string;
  selectedEssaySummary?: string;
  studentContext: StudentAssistantContext;
}) {
  const lowerPrompt = input.prompt.toLowerCase();
  const normalizedPrompt = lowerPrompt.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const historyText = input.history.map((message) => `${message.role}: ${message.content}`).join("\n");
  const searchText = `${input.prompt}\n${historyText}`;
  const resourceLines = getAssistantRelevantItems(
    getAssistantResourceLines(input.selectedResourceContent, 8),
    searchText,
    4
  );
  const essayHighlights = getAssistantRelevantItems(
    getAssistantEssayHighlights(input.selectedEssaySummary),
    searchText,
    4
  );
  const citations = [
    input.selectedResourceTitle ? `Ressource : ${input.selectedResourceTitle}` : null,
    input.selectedEssayTitle ? `Copie : ${input.selectedEssayTitle}` : null,
    input.weakPointLabels[0] ? `Point a surveiller : ${input.weakPointLabels[0]}` : null,
    input.studentContext.recentGrades[0]
      ? `Progression : ${input.studentContext.recentGrades[0].subject} ${input.studentContext.recentGrades[0].score}/20`
      : null
  ].filter((value): value is string => Boolean(value));

  let answer =
    "Je peux t'aider comme un vrai chatbot de travail : expliquer un cours, resumer un document, transformer un chapitre en flashcards, analyser une copie ou reformuler une methode de concours.";

  const actions = [
    input.selectedResourceTitle
      ? `Utiliser ${input.selectedResourceTitle} comme support principal de la reponse.`
      : "Relier une ressource pour obtenir des reponses plus precises.",
    input.selectedEssayTitle
      ? `Exploiter la copie ${input.selectedEssayTitle} pour relire les erreurs recurrentes.`
      : "Relier une copie pour discuter d'une correction ou d'une methode.",
    input.dueFlashcards > 0
      ? `Tu peux aussi reutiliser ${input.dueFlashcards} cartes deja dues si tu demandes un mini-test.`
      : "Tu peux demander un mini-test, une fiche ou des flashcards sur n'importe quel chapitre."
  ];

  if (
    normalizedPrompt.includes("planning") ||
    normalizedPrompt.includes("soir") ||
    normalizedPrompt.includes("semaine")
  ) {
    const nextTasks = input.studentContext.upcomingTasks.slice(0, 3);
    answer = nextTasks.length > 0
      ? `Le planning reste l'endroit ou valider tes blocs. D'apres les donnees actuelles, les prochaines priorites sont :\n\n${nextTasks
          .map((task, index) => `${index + 1}. ${task.title} en ${task.subject} (${task.dueLabel}).`)
          .join("\n")}\n\nTu as valide ${input.studentContext.completedMinutesThisWeek} minutes cette semaine. Le planning placera ces taches dans les premiers creneaux compatibles.`
      : `Le planning reste l'endroit ou valider tes blocs. Tu as valide ${input.studentContext.completedMinutesThisWeek} minutes cette semaine et aucune tache urgente n'est actuellement en attente.`;
  } else if (
    normalizedPrompt.includes("progres") ||
    normalizedPrompt.includes("niveau") ||
    normalizedPrompt.includes("note") ||
    normalizedPrompt.includes("moyenne") ||
    normalizedPrompt.includes("lacune") ||
    normalizedPrompt.includes("faible")
  ) {
    const grades = input.studentContext.recentGrades.slice(0, 4);
    const feedback = input.studentContext.recentFeedback.slice(0, 3);
    answer = grades.length > 0 || feedback.length > 0
      ? `Voici ce que montrent tes donnees recentes :\n\n${grades
          .map((grade) => `- ${grade.subject} : ${grade.score}/20 (${grade.title})`)
          .join("\n")}${feedback.length > 0 ? `\n\nRetours a retenir :\n${feedback.map((item) => `- ${item}`).join("\n")}` : ""}${input.weakPointLabels.length > 0 ? `\n\nPoints a consolider : ${input.weakPointLabels.join(", ")}.` : ""}`
      : "Je n'ai pas encore assez de notes ou de corrections pour evaluer ta progression. Les prochaines donnees saisies par tes professeurs permettront une analyse plus fiable.";
  } else if (normalizedPrompt.includes("flashcard") || normalizedPrompt.includes("anki")) {
    if (input.selectedResourceTitle && resourceLines.length > 0) {
      answer = `A partir de ${input.selectedResourceTitle}, je construirais des cartes tres courtes et tres ciblees.\n\nExemples utiles :\n${resourceLines
        .slice(0, 3)
        .map((line, index) => `${index + 1}. ${line}`)
        .join("\n")}\n\nSi tu veux, je peux ensuite te proposer une vraie serie de cartes question/reponse sur ce document.`;
    } else {
      answer =
        "Pour de bonnes flashcards type Anki, il faut des cartes tres simples, une idee par carte, et des reponses courtes. Donne-moi un chapitre ou relie une ressource, et je peux te generer une premiere serie propre.";
    }
  } else if (
    normalizedPrompt.includes("interroge") ||
    normalizedPrompt.includes("quiz") ||
    normalizedPrompt.includes("teste") ||
    normalizedPrompt.includes("questionne")
  ) {
    if (resourceLines.length > 0) {
      answer = `D'accord, je te teste sur ${input.selectedResourceTitle ?? "ce support"}.\n\n${buildLocalAssistantQuiz(
        resourceLines
      ).join("\n")}\n\nReponds question par question et je te corrige ensuite.`;
    } else {
      answer =
        "Je peux te tester, mais il faut me relier un cours ou un chapitre pour que les questions soient vraiment utiles.";
    }
  } else if (
    normalizedPrompt.includes("explique") ||
    normalizedPrompt.includes("pourquoi") ||
    normalizedPrompt.includes("comment") ||
    normalizedPrompt.includes("difference") ||
    normalizedPrompt.includes("differe")
  ) {
    if (resourceLines.length > 0) {
      answer = `Voici l'explication la plus utile a partir de ${input.selectedResourceTitle ?? "la ressource choisie"} :\n\n${resourceLines
        .map((line, index) => `${index + 1}. ${line}`)
        .join("\n")}\n\nEn clair : retiens surtout le mecanisme, puis un exemple ou une consequence pour pouvoir le reutiliser en copie.`;
    } else if (essayHighlights.length > 0) {
      answer = `Si je reformule simplement a partir de ${input.selectedEssayTitle ?? "ta copie"} :\n\n${essayHighlights
        .map((line, index) => `${index + 1}. ${line}`)
        .join("\n")}\n\nDis-moi si tu veux que je te le reexplique encore plus simplement ou sous forme de methode.`;
    } else {
      answer =
        "Je peux t'expliquer clairement, mais j'ai besoin soit d'un support relie, soit d'une question un peu plus precise sur la notion qui te bloque.";
    }
  } else if (normalizedPrompt.includes("resume") || normalizedPrompt.includes("synthese")) {
    if (input.selectedResourceTitle && resourceLines.length > 0) {
      answer = `Resume rapide de ${input.selectedResourceTitle} :\n\n${resourceLines
        .map((line, index) => `${index + 1}. ${line}`)
        .join("\n")}\n\nJe peux aussi transformer ce resume en fiche plus structuree si tu veux.`;
    } else {
      answer =
        "Je peux te faire un vrai resume, mais j'ai besoin d'un support concret. Relie un cours ou colle un texte, et je te le reformule en version concise et exploitable.";
    }
  } else if (
    normalizedPrompt.includes("copie") ||
    normalizedPrompt.includes("correction") ||
    normalizedPrompt.includes("dissertation") ||
    normalizedPrompt.includes("essai")
  ) {
    if (input.selectedEssayTitle && essayHighlights.length > 0) {
      answer = `Sur ${input.selectedEssayTitle}, voici ce qui ressort le plus clairement :\n\n${essayHighlights
        .map((line, index) => `${index + 1}. ${line}`)
        .join("\n")}\n\nSi tu veux, je peux maintenant transformer cela en conseils de methode tres concrets pour la prochaine copie.`;
    } else if (input.selectedEssayTitle) {
      answer = `Je peux analyser ${input.selectedEssayTitle}, mais la correction detaillee n'est pas encore assez exploitable. Des qu'un retour plus complet est disponible, je peux le reformuler en erreurs recurrentes, points forts et priorites de methode.`;
    } else {
      answer =
        "Relie une copie pour que je puisse commenter une correction de maniere precise : ce qui manque dans l'introduction, la qualite du plan, la rigueur en maths ou l'usage des references selon la matiere.";
    }
  } else if (
    normalizedPrompt.includes("methode") ||
    normalizedPrompt.includes("problematique")
  ) {
    if (essayHighlights.length > 0) {
      answer = `A partir de ${input.selectedEssayTitle ?? "ta copie"}, la methode a renforcer est surtout celle-ci :\n\n${essayHighlights
        .map((line, index) => `${index + 1}. ${line}`)
        .join("\n")}\n\nSi tu veux, je peux maintenant te donner une methode tres concrete pour la prochaine dissertation ou le prochain exercice.`;
    } else {
      answer =
        "En prepa, une bonne methode vaut des points partout : il faut annoncer clairement la demarche, garder un fil logique et faire servir chaque reference ou calcul a une idee precise. Si tu me dis la matiere et l'exercice vise, je peux te donner une methode beaucoup plus ciblee.";
    }
  } else if (input.selectedResourceTitle && resourceLines.length > 0) {
    answer = `Je m'appuie sur ${input.selectedResourceTitle}. Les idees les plus utiles a retenir sont :\n\n${resourceLines
      .map((line, index) => `${index + 1}. ${line}`)
      .join("\n")}\n\nJe peux maintenant t'en faire une fiche, des flashcards ou un quiz.`;
  } else if (input.selectedEssayTitle && essayHighlights.length > 0) {
    answer = `Je peux deja m'appuyer sur la copie ${input.selectedEssayTitle}.\n\nPoints saillants :\n${essayHighlights
      .map((line, index) => `${index + 1}. ${line}`)
      .join("\n")}\n\nDis-moi si tu veux une explication simple, une reformulation en methode ou une liste d'erreurs a ne plus refaire.`;
  }

  const remote = await callOpenAIJson<AssistantReplyResult>({
    userId: input.userId,
    taskId: "assistant_reply",
    sourceEntityType: "Student",
    sourceEntityId: input.userId,
    additionalInstructions:
      "N'insiste pas sur l'organisation du temps sauf si l'etudiant le demande explicitement.",
    prompt: `Question etudiant : ${input.prompt}
Historique recent :
${historyText || "aucun"}

Points de vigilance connus : ${input.weakPointLabels.join(", ") || "aucun"}
Cartes deja disponibles : ${input.dueFlashcards}
Annee de prepa : ${input.studentContext.prepYear ?? "non renseignee"}
Concours et ecoles vises : ${input.studentContext.targetExams.join(", ") || "non renseignes"}
Travail valide cette semaine : ${input.studentContext.completedMinutesThisWeek} minutes
Notes recentes : ${input.studentContext.recentGrades.map((grade) => `${grade.subject} ${grade.score}/20 (${grade.title})`).join(" | ") || "aucune"}
Taches en attente : ${input.studentContext.upcomingTasks.map((task) => `${task.title} - ${task.subject} - ${task.dueLabel}`).join(" | ") || "aucune"}
Retours recents : ${input.studentContext.recentFeedback.join(" | ") || "aucun"}
Ressource selectionnee : ${input.selectedResourceTitle ?? "aucune"}
Contenu ressource : ${input.selectedResourceContent ?? "aucun"}
Copie selectionnee : ${input.selectedEssayTitle ?? "aucune"}
Synthese copie : ${input.selectedEssaySummary ?? "aucune"}

Retourne une reponse de vrai chatbot utile, 3 suites possibles et les elements de contexte utilises. Si la question porte sur l'organisation, reoriente brievement vers l'onglet planning puis reponds au besoin sans transformer toute la reponse en coaching de planning.`,
    schemaName: "assistant_reply",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        answer: { type: "string" },
        actions: { type: "array", items: { type: "string" } },
        citations: { type: "array", items: { type: "string" } }
      },
      required: ["answer", "actions", "citations"]
    },
    reasoningEffort: "medium",
    maxOutputTokens: 1100
  });

  if (remote) {
    return remote;
  }

  await recordAIGeneration({
    userId: input.userId,
    featureName: "assistant_reply",
    sourceEntityType: "Student",
    sourceEntityId: input.userId,
    modelName: "local-rules",
    status: "COMPLETED",
    inputSummary: `Question assistant de ${input.prompt.length} caracteres.`,
    outputSummary: "Reponse locale generee."
  });

  return {
    answer,
    actions,
    citations
  };
}
