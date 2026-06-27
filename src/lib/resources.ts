import { DeckOrigin, ResourceType, UserRole } from "@prisma/client";

import { isDemoModeEnabled } from "./app-config";
import { getCurrentUserClass, requireRole } from "./auth";
import { generateResourceFlashcards, generateResourceSheet, generateResourceSummary } from "./ai";
import { prisma } from "./db";
import { ensureReferenceData } from "./reference-data";
import { getStoredFileName, getStoredFileUrl, readStoredFileBuffer, saveUploadedFile } from "./storage";
import { ensureDemoStudent } from "./student-app";

type OutputType = "SUMMARY" | "SHEET" | "FLASHCARDS";

type SeededTeacher = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
};

type SeededResource = {
  id: string;
  title: string;
  subjectCode: string;
  chapterSlug: string;
  teacherId: string;
  resourceType: ResourceType;
  description: string;
  content: string;
};

export type ResourceExplorerItem = {
  id: string;
  title: string;
  subject: string;
  chapter: string;
  type: string;
  teacher: string;
  summary: string;
  aiEnabled: boolean;
  generatedOutputs: number;
};

export type ResourcesOverviewData = {
  resources: ResourceExplorerItem[];
  stats: {
    totalResources: number;
    totalTeachers: number;
    totalChapters: number;
  };
};

export type TeacherResourcesData = {
  resources: Array<{
    id: string;
    title: string;
    type: string;
    audience: string;
    chapter: string;
    uploadedAt: string;
    aiEnabled: boolean;
    sourceKind: string;
  }>;
  subjects: Array<{
    code: string;
    name: string;
  }>;
  chapters: Array<{
    id: string;
    name: string;
    subjectCode: string;
  }>;
};

export type TeacherResourceDetailData = {
  id: string;
  title: string;
  subject: string;
  chapter: string;
  type: string;
  summary: string;
  content: string | null;
  fileUrl: string | null;
  fileName: string | null;
  mimeType: string;
  sourceKind: string;
  aiEnabled: boolean;
  uploadedAt: string;
};

export type ResourceFormOptions = {
  subjects: Array<{
    code: string;
    name: string;
  }>;
  chapters: Array<{
    id: string;
    name: string;
    subjectCode: string;
  }>;
};

export type ResourceDetailData = {
  id: string;
  title: string;
  subject: string;
  chapter: string;
  type: string;
  teacher: string;
  summary: string;
  content: string | null;
  aiEnabled: boolean;
  fileUrl: string | null;
  fileName: string | null;
  mimeType: string;
  sourceKind: string;
  outputs: Array<{
    id: string;
    type: OutputType;
    title: string;
    content: string[];
    createdAtLabel: string;
    deckId?: string;
    deckTitle?: string;
  }>;
};

const SEEDED_TEACHERS: SeededTeacher[] = [
  {
    id: "teacher-demo-laurent",
    email: "laurent@prepaos.local",
    firstName: "Claire",
    lastName: "Laurent"
  },
  {
    id: "teacher-demo-dumas",
    email: "dumas@prepaos.local",
    firstName: "Marc",
    lastName: "Dumas"
  },
  {
    id: "teacher-demo-caron",
    email: "caron@prepaos.local",
    firstName: "Sophie",
    lastName: "Caron"
  }
];

const SEEDED_CHAPTERS = [
  { slug: "esh-croissance", subjectCode: "ESH", name: "Croissance" },
  { slug: "esh-mondialisation", subjectCode: "ESH", name: "Mondialisation" },
  { slug: "maths-probabilites", subjectCode: "MATHS", name: "Probabilites" },
  { slug: "maths-methodologie", subjectCode: "MATHS", name: "Methodologie" },
  { slug: "hgg-mondialisation", subjectCode: "HGG", name: "Mondialisation" },
  { slug: "hgg-geopolitique", subjectCode: "HGG", name: "Geopolitique" },
  { slug: "hgg-methodologie", subjectCode: "HGG", name: "Methodologie" },
  { slug: "ang-vocabulaire", subjectCode: "ANG", name: "Vocabulaire" },
  { slug: "cg-methodologie", subjectCode: "CG", name: "Methodologie" }
] as const;

const SEEDED_RESOURCES: SeededResource[] = [
  {
    id: "resource-demo-esh-growth",
    title: "Cours ESH - Les theories de la croissance",
    subjectCode: "ESH",
    chapterSlug: "esh-croissance",
    teacherId: "teacher-demo-laurent",
    resourceType: ResourceType.COURSE,
    description: "Cours dense sur Solow, Romer, Lucas et les enjeux de la croissance endogene.",
    content: `Solow : modele de croissance exogene fonde sur l'accumulation du capital et le progres technique exogene.
Romer : la croissance endogene repose sur la production d'idees, la recherche et les externalites de connaissance.
Lucas : le capital humain nourrit durablement la croissance.
Schumpeter : l'innovation cree un processus de destruction creatrice.
Attention : toujours relier les auteurs a une idee precise dans la copie.
Exemple : la politique d'innovation peut soutenir la croissance potentielle.
Erreur classique : citer un auteur sans expliquer son mecanisme.`
  },
  {
    id: "resource-demo-esh-globalization",
    title: "Fiche ESH - Mondialisation financiere",
    subjectCode: "ESH",
    chapterSlug: "esh-mondialisation",
    teacherId: "teacher-demo-laurent",
    resourceType: ResourceType.SUMMARY,
    description: "Fiche courte sur la liberalisation financiere, les flux de capitaux et les crises.",
    content: `Mondialisation financiere : integration croissante des marches de capitaux a l'echelle mondiale.
Liberalisation : ouverture progressive des mouvements de capitaux.
Avantage : meilleure allocation theorique de l'epargne.
Risque : contagion plus rapide des crises.
Exemple : crise asiatique de 1997.
Point de vigilance : distinguer finance de marche et financement de l'economie reelle.`
  },
  {
    id: "resource-demo-maths-laws",
    title: "Cours Maths - Lois usuelles et esperance",
    subjectCode: "MATHS",
    chapterSlug: "maths-probabilites",
    teacherId: "teacher-demo-dumas",
    resourceType: ResourceType.COURSE,
    description: "Cours central sur Bernoulli, binomiale, geometrique et Poisson.",
    content: `Variable aleatoire discrete : prend un nombre fini ou denombrable de valeurs.
Loi de Bernoulli : une experience a deux issues, succes ou echec.
Loi binomiale : somme de n variables de Bernoulli independantes de meme parametre p.
Esperance de B(n,p) : n x p.
Variance de B(n,p) : n x p x (1-p).
Approximation de Poisson : utile quand n est grand et p petit.
Erreur classique : oublier les conditions d'application d'une approximation.`
  },
  {
    id: "resource-demo-maths-method",
    title: "Methode Maths - Rediger un raisonnement propre",
    subjectCode: "MATHS",
    chapterSlug: "maths-methodologie",
    teacherId: "teacher-demo-dumas",
    resourceType: ResourceType.METHOD,
    description: "Attendus de redaction et erreurs les plus penalisees en copie.",
    content: `Une redaction propre justifie chaque implication utile.
Il faut annoncer la methode avant les calculs longs.
Un resultat non encadre ou non commente est fragile.
Erreur classique : sauter une hypothese de depart.
Conseil : faire apparaitre clairement les notations et les conclusions.`
  },
  {
    id: "resource-demo-hgg-method",
    title: "Methode dissertation HGG",
    subjectCode: "HGG",
    chapterSlug: "hgg-methodologie",
    teacherId: "teacher-demo-caron",
    resourceType: ResourceType.METHOD,
    description: "Les attendus exacts sur la problematique, le plan et les transitions.",
    content: `Problematique : reformuler le sujet en tension analytique.
Plan : chaque partie doit faire progresser la demonstration.
Transition : elle relie les parties en explicitant la limite de la precedente.
Reference : une date ou un exemple doit servir une idee.
Erreur classique : reciter un cours sans repondre au sujet.`
  },
  {
    id: "resource-demo-hgg-dates",
    title: "Chronologie HGG - Dates incontournables",
    subjectCode: "HGG",
    chapterSlug: "hgg-mondialisation",
    teacherId: "teacher-demo-caron",
    resourceType: ResourceType.SUMMARY,
    description: "Chronologie de dates qui reviennent souvent en colle et en dissertation.",
    content: `1944 : accords de Bretton Woods.
1971 : fin de la convertibilite dollar-or.
1989 : chute du mur de Berlin.
1995 : creation de l'OMC.
2001 : entree de la Chine a l'OMC.
Conseil : toujours rattacher la date a sa portee geoeconomique ou geopolitique.`
  }
];

function formatResourceType(type: ResourceType) {
  const labels: Record<ResourceType, string> = {
    COURSE: "Cours",
    SUMMARY: "Fiche",
    EXERCISE: "Exercice",
    CORRECTION: "Correction",
    METHOD: "Methode",
    REPORT: "Rapport"
  };

  return labels[type];
}

function getTeacherName(firstName: string, lastName: string) {
  return `M${firstName.endsWith("e") ? "me" : "."} ${lastName}`;
}

function getSummaryExcerpt(text: string) {
  const normalized = text.replace(/\s+/g, " ").trim();
  return normalized.length > 180 ? `${normalized.slice(0, 177)}...` : normalized;
}

function getNonEmptyLines(text: string) {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function isTextResourceMimeType(mimeType: string) {
  return mimeType.startsWith("text/") || mimeType === "application/json";
}

async function getResourceReadableText(resource: { storageKey: string; mimeType: string; sourceKind: string }) {
  if (resource.sourceKind === "TEXT_PASTE") {
    return resource.storageKey.trim();
  }

  if (!isTextResourceMimeType(resource.mimeType)) {
    return null;
  }

  try {
    const buffer = await readStoredFileBuffer(resource.storageKey);
    return buffer.toString("utf8").trim() || null;
  } catch {
    return null;
  }
}

function getOutputTitle(type: OutputType) {
  if (type === "SUMMARY") {
    return "Resume IA";
  }

  if (type === "SHEET") {
    return "Fiche de revision";
  }

  return "Flashcards generees";
}

function formatOutputContent(type: OutputType, payload: Record<string, unknown>) {
  if (type === "FLASHCARDS") {
    const deckTitle = typeof payload.deckTitle === "string" ? payload.deckTitle : "Deck IA";
    const count = typeof payload.count === "number" ? payload.count : 0;
    const samples = Array.isArray(payload.samples) ? payload.samples.map(String) : [];

    return [
      `${count} cartes ont ete generees dans le deck "${deckTitle}".`,
      ...samples.slice(0, 4).map((sample) => `Carte : ${sample}`)
    ];
  }

  const items = Array.isArray(payload.items) ? payload.items.map(String) : [];
  return items;
}

export async function ensureDemoResources() {
  const { prepClass } = await ensureReferenceData();
  const subjects = await prisma.subject.findMany();
  const subjectMap = new Map(subjects.map((subject) => [subject.code, subject]));

  for (const chapter of SEEDED_CHAPTERS) {
    const subject = subjectMap.get(chapter.subjectCode);
    if (!subject) {
      continue;
    }

    await prisma.chapter.upsert({
      where: { slug: chapter.slug },
      update: {
        name: chapter.name,
        subjectId: subject.id
      },
      create: {
        slug: chapter.slug,
        name: chapter.name,
        subjectId: subject.id
      }
    });
  }

  if (!isDemoModeEnabled() || !prepClass) {
    return;
  }

  for (const teacher of SEEDED_TEACHERS) {
    await prisma.user.upsert({
      where: { email: teacher.email },
      update: {
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        role: "TEACHER"
      },
      create: {
        id: teacher.id,
        email: teacher.email,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        role: "TEACHER"
      }
    });

    const teacherRecord = await prisma.user.findUnique({
      where: { email: teacher.email }
    });

    if (teacherRecord) {
      await prisma.classMembership.upsert({
        where: {
          userId_classId: {
            userId: teacherRecord.id,
            classId: prepClass.id
          }
        },
        update: {
          roleInClass: "teacher"
        },
        create: {
          userId: teacherRecord.id,
          classId: prepClass.id,
          roleInClass: "teacher"
        }
      });
    }
  }

  const teachers = await prisma.user.findMany({
    where: {
      email: {
        in: SEEDED_TEACHERS.map((teacher) => teacher.email)
      }
    }
  });

  const teacherMap = new Map(
    SEEDED_TEACHERS.map((seededTeacher) => [
      seededTeacher.id,
      teachers.find((teacher) => teacher.email === seededTeacher.email)
    ])
  );
  const chapters = await prisma.chapter.findMany();
  const chapterMap = new Map(chapters.map((chapter) => [chapter.slug, chapter]));

  for (const resource of SEEDED_RESOURCES) {
    const subject = subjectMap.get(resource.subjectCode);
    const chapter = chapterMap.get(resource.chapterSlug);
    const teacher = teacherMap.get(resource.teacherId);

    if (!subject || !chapter || !teacher) {
      continue;
    }

    await prisma.resource.upsert({
      where: { id: resource.id },
      update: {
        uploaderId: teacher.id,
        classId: prepClass.id,
        subjectId: subject.id,
        chapterId: chapter.id,
        title: resource.title,
        description: resource.description,
        resourceType: resource.resourceType,
        storageKey: resource.content,
        mimeType: "text/plain",
        sourceKind: "TEXT_PASTE",
        isAiActionsEnabled: true
      },
      create: {
        id: resource.id,
        uploaderId: teacher.id,
        classId: prepClass.id,
        subjectId: subject.id,
        chapterId: chapter.id,
        title: resource.title,
        description: resource.description,
        resourceType: resource.resourceType,
        storageKey: resource.content,
        mimeType: "text/plain",
        sourceKind: "TEXT_PASTE",
        isAiActionsEnabled: true
      }
    });
  }
}

export async function getResourcesOverviewData(): Promise<ResourcesOverviewData> {
  await ensureDemoResources();
  const { user } = await ensureDemoStudent();
  const membership = await getCurrentUserClass(user.id);

  const resources = await prisma.resource.findMany({
    where: membership?.classId
      ? {
          OR: [{ classId: membership.classId }, { classId: null }]
        }
      : undefined,
    include: {
      uploader: true,
      subject: true,
      chapter: true,
      aiOutputs: true
    },
    orderBy: { createdAt: "desc" }
  });

  const mappedResources = resources.map((resource) => ({
    id: resource.id,
    title: resource.title,
    subject: resource.subject.name,
    chapter: resource.chapter?.name ?? "Sans chapitre",
    type: formatResourceType(resource.resourceType),
    teacher: getTeacherName(resource.uploader.firstName, resource.uploader.lastName),
    summary: resource.description || getSummaryExcerpt(resource.storageKey),
    aiEnabled: resource.isAiActionsEnabled,
    generatedOutputs: resource.aiOutputs.length
  }));

  return {
    resources: mappedResources,
    stats: {
      totalResources: mappedResources.length,
      totalTeachers: new Set(mappedResources.map((resource) => resource.teacher)).size,
      totalChapters: new Set(mappedResources.map((resource) => resource.chapter)).size
    }
  };
}

export async function getTeacherResourcesData(): Promise<TeacherResourcesData> {
  await ensureDemoResources();
  const teacher = await requireRole([UserRole.TEACHER, UserRole.ADMIN]);
  const membership = await getCurrentUserClass(teacher.id);

  const [resources, subjects, chapters] = await Promise.all([
    prisma.resource.findMany({
      where: {
        uploaderId: teacher.id,
        ...(membership?.classId
          ? {
              OR: [{ classId: membership.classId }, { classId: null }]
            }
          : {})
      },
      include: {
        subject: true,
        chapter: true
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.subject.findMany({
      orderBy: { name: "asc" }
    }),
    prisma.chapter.findMany({
      include: {
        subject: true
      },
      orderBy: [{ subject: { name: "asc" } }, { name: "asc" }]
    })
  ]);

  return {
    resources: resources.map((resource) => ({
      id: resource.id,
      title: resource.title,
      type: formatResourceType(resource.resourceType),
      audience: `${resource.subject.name} - ${resource.chapter?.name ?? "Sans chapitre"} - ECG`,
      chapter: resource.chapter?.name ?? "Sans chapitre",
      uploadedAt: resource.createdAt.toLocaleDateString("fr-FR"),
      aiEnabled: resource.isAiActionsEnabled,
      sourceKind: resource.sourceKind
    })),
    ...formatResourceFormOptions(subjects, chapters)
  };
}

export async function getResourceFormOptions(): Promise<ResourceFormOptions> {
  await ensureDemoResources();

  const [subjects, chapters] = await Promise.all([
    prisma.subject.findMany({
      orderBy: { name: "asc" }
    }),
    prisma.chapter.findMany({
      include: {
        subject: true
      },
      orderBy: [{ subject: { name: "asc" } }, { name: "asc" }]
    })
  ]);

  return formatResourceFormOptions(subjects, chapters);
}

function formatResourceFormOptions(
  subjects: Array<{ code: string; name: string }>,
  chapters: Array<{ id: string; name: string; subject: { code: string } }>
): ResourceFormOptions {
  return {
    subjects: subjects.map((subject) => ({
      code: subject.code,
      name: subject.name
    })),
    chapters: chapters.map((chapter) => ({
      id: chapter.id,
      name: chapter.name,
      subjectCode: chapter.subject.code
    }))
  };
}

export async function getResourceDetailData(resourceId: string): Promise<ResourceDetailData | null> {
  const { user } = await ensureDemoStudent();
  await ensureDemoResources();
  const membership = await getCurrentUserClass(user.id);

  const resource = await prisma.resource.findFirst({
    where: {
      id: resourceId,
      ...(membership?.classId
        ? {
            OR: [{ classId: membership.classId }, { classId: null }]
          }
        : {})
    },
    include: {
      uploader: true,
      subject: true,
      chapter: true,
      aiOutputs: {
        where: {
          userId: user.id
        },
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!resource) {
    return null;
  }

  const content = await getResourceReadableText(resource);
  const fileUrl = resource.sourceKind === "FILE_UPLOAD" ? await getStoredFileUrl(resource.storageKey) : null;

  return {
    id: resource.id,
    title: resource.title,
    subject: resource.subject.name,
    chapter: resource.chapter?.name ?? "Sans chapitre",
    type: formatResourceType(resource.resourceType),
    teacher: getTeacherName(resource.uploader.firstName, resource.uploader.lastName),
    summary: resource.description || (content ? getSummaryExcerpt(content) : "Document depose par le professeur."),
    content,
    aiEnabled: resource.isAiActionsEnabled && Boolean(content),
    fileUrl,
    fileName: resource.sourceKind === "FILE_UPLOAD" ? getStoredFileName(resource.storageKey) : null,
    mimeType: resource.mimeType,
    sourceKind: resource.sourceKind,
    outputs: resource.aiOutputs.map((output) => {
      const payload =
        typeof output.contentJson === "object" && output.contentJson && !Array.isArray(output.contentJson)
          ? (output.contentJson as Record<string, unknown>)
          : {};

      return {
        id: output.id,
        type: output.outputType as OutputType,
        title: getOutputTitle(output.outputType as OutputType),
        content: formatOutputContent(output.outputType as OutputType, payload),
        createdAtLabel: output.createdAt.toLocaleDateString("fr-FR"),
        deckId: typeof payload.deckId === "string" ? payload.deckId : undefined,
        deckTitle: typeof payload.deckTitle === "string" ? payload.deckTitle : undefined
      };
    })
  };
}

export async function getTeacherResourceDetailData(resourceId: string): Promise<TeacherResourceDetailData | null> {
  await ensureDemoResources();
  const teacher = await requireRole([UserRole.TEACHER, UserRole.ADMIN]);
  const membership = await getCurrentUserClass(teacher.id);

  const resource = await prisma.resource.findFirst({
    where: {
      id: resourceId,
      uploaderId: teacher.id,
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
  });

  if (!resource) {
    return null;
  }

  const content = await getResourceReadableText(resource);
  const fileUrl = resource.sourceKind === "FILE_UPLOAD" ? await getStoredFileUrl(resource.storageKey) : null;

  return {
    id: resource.id,
    title: resource.title,
    subject: resource.subject.name,
    chapter: resource.chapter?.name ?? "Sans chapitre",
    type: formatResourceType(resource.resourceType),
    summary: resource.description || (content ? getSummaryExcerpt(content) : "Document depose."),
    content,
    fileUrl,
    fileName: resource.sourceKind === "FILE_UPLOAD" ? getStoredFileName(resource.storageKey) : null,
    mimeType: resource.mimeType,
    sourceKind: resource.sourceKind,
    aiEnabled: resource.isAiActionsEnabled,
    uploadedAt: resource.createdAt.toLocaleDateString("fr-FR")
  };
}

export async function createTeacherResource(input: {
  title: string;
  subjectCode: string;
  chapterId: string;
  resourceType: string;
  description: string;
  content: string;
  file: File | null;
  aiEnabled: boolean;
}) {
  await ensureDemoResources();
  const teacher = await requireRole([UserRole.TEACHER, UserRole.ADMIN]);
  const membership = await getCurrentUserClass(teacher.id);
  const chapter = await prisma.chapter.findFirst({
    where: { id: input.chapterId },
    include: { subject: true }
  });

  const hasTextContent = Boolean(input.content.trim());
  const hasFile = Boolean(input.file && input.file.size > 0);

  if (!membership?.classId || !chapter || !input.title.trim() || (!hasTextContent && !hasFile)) {
    return;
  }

  const normalizedType = Object.values(ResourceType).includes(input.resourceType as ResourceType)
    ? (input.resourceType as ResourceType)
    : ResourceType.COURSE;

  const uploadedFile = hasFile ? await saveUploadedFile(input.file as File, "resources") : null;
  const storageKey = uploadedFile ? uploadedFile.storageKey : input.content.trim();
  const mimeType = uploadedFile?.mimeType || "text/plain";
  const sourceKind = uploadedFile ? "FILE_UPLOAD" : "TEXT_PASTE";
  const description =
    input.description.trim() ||
    (hasTextContent
      ? getSummaryExcerpt(input.content)
      : uploadedFile
        ? `Document ${uploadedFile.originalName} depose par le professeur.`
        : null);

  await prisma.resource.create({
    data: {
      uploaderId: teacher.id,
      classId: membership.classId,
      subjectId: chapter.subject.id,
      chapterId: chapter.id,
      title: input.title.trim(),
      description,
      resourceType: normalizedType,
      storageKey,
      mimeType,
      sourceKind,
      isAiActionsEnabled: input.aiEnabled
    }
  });
}

export async function generateResourceOutput(resourceId: string, type: OutputType) {
  const { user } = await ensureDemoStudent();
  await ensureDemoResources();

  const resource = await prisma.resource.findFirst({
    where: {
      id: resourceId,
      isAiActionsEnabled: true
    },
    include: {
      subject: true,
      chapter: true
    }
  });

  if (!resource) {
    return;
  }

  const text = await getResourceReadableText(resource);
  if (!text) {
    return;
  }
  const chapterName = resource.chapter?.name ?? "Sans chapitre";

  if (type === "FLASHCARDS") {
    const existingDeck = await prisma.flashcardDeck.findFirst({
      where: {
        sourceResourceId: resource.id,
        ownerUserId: user.id
      }
    });

    if (existingDeck) {
      await prisma.resourceAIOutput.deleteMany({
        where: {
          resourceId: resource.id,
          userId: user.id,
          outputType: type
        }
      });

      await prisma.resourceAIOutput.create({
        data: {
          resourceId: resource.id,
          userId: user.id,
          outputType: type,
          contentJson: {
            deckId: existingDeck.id,
            deckTitle: existingDeck.title,
            count: await prisma.flashcard.count({
              where: { deckId: existingDeck.id }
            }),
            samples: []
          }
        }
      });

      return;
    }

    const flashcards = await generateResourceFlashcards({
      userId: user.id,
      resourceId: resource.id,
      title: resource.title,
      subject: resource.subject.name,
      chapter: chapterName,
      text
    });
    const cards = flashcards.cards;
    const deck = await prisma.flashcardDeck.create({
      data: {
        ownerUserId: user.id,
        classId: resource.classId,
        subjectId: resource.subjectId,
        chapterId: resource.chapterId,
        sourceResourceId: resource.id,
        title: resource.title,
        description: `Deck IA cree depuis la ressource ${resource.title}`,
        createdByType: DeckOrigin.AI
      }
    });

    if (cards.length > 0) {
      await prisma.flashcard.createMany({
        data: cards.map((card, index) => ({
          deckId: deck.id,
          frontText: card.frontText,
          backText: card.backText,
          position: index + 1
        }))
      });
    }

    await prisma.resourceAIOutput.deleteMany({
      where: {
        resourceId: resource.id,
        userId: user.id,
        outputType: type
      }
    });

    await prisma.resourceAIOutput.create({
      data: {
        resourceId: resource.id,
        userId: user.id,
        outputType: type,
        contentJson: {
          deckId: deck.id,
          deckTitle: deck.title,
          count: cards.length,
          samples: cards.slice(0, 4).map((card) => card.frontText)
        }
      }
    });

    return;
  }

  const items =
    type === "SUMMARY"
      ? (
          await generateResourceSummary({
            userId: user.id,
            resourceId: resource.id,
            title: resource.title,
            subject: resource.subject.name,
            chapter: chapterName,
            text
          })
        ).items
      : (
          await generateResourceSheet({
            userId: user.id,
            resourceId: resource.id,
            title: resource.title,
            subject: resource.subject.name,
            chapter: chapterName,
            text
          })
        ).items;

  await prisma.resourceAIOutput.deleteMany({
    where: {
      resourceId: resource.id,
      userId: user.id,
      outputType: type
    }
  });

  await prisma.resourceAIOutput.create({
    data: {
      resourceId: resource.id,
      userId: user.id,
      outputType: type,
      contentJson: {
        items
      }
    }
  });
}

export function getResourceActionLabels(aiEnabled: boolean) {
  if (!aiEnabled) {
    return [];
  }

  return [
    { value: "SUMMARY" as const, label: "Resumer" },
    { value: "SHEET" as const, label: "Faire une fiche" },
    { value: "FLASHCARDS" as const, label: "Generer des flashcards" }
  ];
}
