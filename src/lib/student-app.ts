import { Prisma, SessionStatus, SessionType, UserRole } from "@prisma/client";
import { cache } from "react";

import { getCurrentUserClass, requireRole } from "./auth";
import { generateAssistantSnapshot, getAIStatusMeta } from "./ai";
import { prisma } from "./db";
import { isDemoModeEnabled } from "./app-config";
import { ensureReferenceData, SUBJECT_REFERENCES } from "./reference-data";

const BCE_SCHOOLS = ["HEC", "ESSEC", "ESCP", "EDHEC", "emlyon", "SKEMA", "Audencia", "NEOMA"];
const ECRICOME_SCHOOLS = ["KEDGE", "NEOMA", "Montpellier BS", "Rennes SB", "Excelia"];
const SCHOOL_WEIGHTS: Record<string, number> = {
  HEC: 5,
  ESSEC: 5,
  ESCP: 5,
  EDHEC: 4,
  emlyon: 4,
  SKEMA: 3,
  Audencia: 3,
  NEOMA: 3,
  KEDGE: 2,
  "Montpellier BS": 2,
  "Rennes SB": 2,
  Excelia: 2
};

type SubjectCode = (typeof SUBJECT_REFERENCES)[number]["code"];
export type Lv2Language = "ESPAGNOL" | "ALLEMAND" | "ITALIEN";

type LanguagePreferencesPayload = {
  lv1: "ANGLAIS";
  lv2: Lv2Language;
};

export type OnboardingInput = {
  firstName: string;
  lastName: string;
  prepYear: number;
  classId: string;
  lv2Language: Lv2Language;
  weekdayDailyHours: number;
  weekendDailyHours: number;
  weekdayStart: string;
  weekdayEnd: string;
  weekendStart: string;
  weekendEnd: string;
  sessionBlockMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  breakEveryBlocks: number;
  energyLevel: string;
  bacAverage?: number | null;
  bacMention?: string;
  subjectAssessments: Record<SubjectCode, number | null>;
  bacSubjectAssessments: Record<SubjectCode, number | null>;
  bceSchools: string[];
  ecricomeSchools: string[];
};

type TargetExamsPayload = {
  bceSchools: string[];
  ecricomeSchools: string[];
};

type WorkRankingWindow = {
  id: "today" | "threeDays" | "week";
  label: string;
  aheadCount: number;
  cohortSize: number;
  userMinutes: number;
  helper: string;
};

type EnergyProfilePayload = {
  languagePreferences: LanguagePreferencesPayload;
  energyLevel: string;
  weekdayDailyHours: number;
  weekendDailyHours: number;
  weekdayStart: string;
  weekdayEnd: string;
  weekendStart: string;
  weekendEnd: string;
  sessionBlockMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  breakEveryBlocks: number;
  productivitySignals: {
    canShiftBasedOnPerformance: boolean;
  };
  assessments: {
    bacAverage: number | null;
    bacMention: string | null;
    subjectAssessments: Record<SubjectCode, number | null>;
    bacSubjectAssessments: Record<SubjectCode, number | null>;
  };
};

export function getLv2LanguageLabel(language: Lv2Language) {
  const labels: Record<Lv2Language, string> = {
    ESPAGNOL: "Espagnol",
    ALLEMAND: "Allemand",
    ITALIEN: "Italien"
  };

  return labels[language];
}

export function getLanguagePreferences(
  energyProfile?: EnergyProfilePayload | Prisma.JsonObject | null
): LanguagePreferencesPayload {
  const rawPreferences =
    energyProfile && typeof energyProfile === "object" && "languagePreferences" in energyProfile
      ? (energyProfile.languagePreferences as Partial<LanguagePreferencesPayload> | undefined)
      : undefined;

  const lv2 = rawPreferences?.lv2;
  const safeLv2: Lv2Language =
    lv2 === "ALLEMAND" || lv2 === "ITALIEN" || lv2 === "ESPAGNOL" ? lv2 : "ESPAGNOL";

  return {
    lv1: "ANGLAIS",
    lv2: safeLv2
  };
}

function startOfToday() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function setTime(date: Date, time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const next = new Date(date);
  next.setHours(hours, minutes, 0, 0);
  return next;
}

function minutesFromTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function getAssessmentEntries(subjectAssessments: Record<SubjectCode, number | null>) {
  return SUBJECT_REFERENCES.map((subject) => ({
    ...subject,
    score: subjectAssessments[subject.code]
  }));
}

function getEffectiveAssessments(input: OnboardingInput) {
  const concoursAssessments = getAssessmentEntries(input.subjectAssessments);
  const hasConcoursData = concoursAssessments.some((assessment) => assessment.score !== null);

  if (hasConcoursData) {
    return concoursAssessments;
  }

  return getAssessmentEntries(input.bacSubjectAssessments);
}

function getWeakPointCandidates(input: OnboardingInput) {
  const assessments = getEffectiveAssessments(input);
  const withScores = assessments
    .filter((assessment) => assessment.score !== null)
    .sort((left, right) => (left.score ?? 20) - (right.score ?? 20));

  if (withScores.length >= 3) {
    return withScores.slice(0, 3).map((assessment, index) => ({
      code: assessment.code,
      subjectName: assessment.name,
      label: `${assessment.name} - ${assessment.score}/20`,
      description:
        index === 0
          ? "Cette matiere demande un vrai renforcement pour ne pas prendre de retard."
          : "Cette matiere doit etre remise dans une repartition solide du travail."
    }));
  }

  return [
    {
      code: "MATHS" as SubjectCode,
      subjectName: "Maths",
      label: "Maths - regularite a construire",
      description: "Installer tres vite un rythme stable et des automatismes."
    },
    {
      code: "ESH" as SubjectCode,
      subjectName: "ESH",
      label: "ESH - methode et references",
      description: "Structurer les connaissances et la capacite a les mobiliser."
    },
    {
      code: "HGG" as SubjectCode,
      subjectName: "HGG",
      label: "HGG - memorisation longue",
      description: "Construire les repères dates, notions et exemples des le debut."
    }
  ];
}

function getBalancedSubjects(input: OnboardingInput) {
  const assessments = getEffectiveAssessments(input);
  const sorted = [...assessments].sort((left, right) => {
    const leftScore = left.score ?? 20;
    const rightScore = right.score ?? 20;
    return leftScore - rightScore;
  });

  const unique = sorted.slice(0, 3);

  if (unique.length === 3) {
    return unique;
  }

  return SUBJECT_REFERENCES.slice(0, 3).map((subject) => ({
    ...subject,
    score: input.subjectAssessments[subject.code]
  }));
}

function getTargetExamSummary(targets: TargetExamsPayload) {
  const summary = [...targets.bceSchools, ...targets.ecricomeSchools];
  return summary.length > 0 ? summary.slice(0, 4).join(", ") : "A preciser";
}

function getTargetExamList(targets: TargetExamsPayload) {
  return [...targets.bceSchools, ...targets.ecricomeSchools];
}

function normalizeTargets(targets: TargetExamsPayload) {
  return [...getTargetExamList(targets)].sort();
}

function shareComparableTargets(left: TargetExamsPayload, right: TargetExamsPayload) {
  const leftTargets = new Set(getTargetExamList(left));
  const rightTargets = new Set(getTargetExamList(right));

  if (leftTargets.size === 0 || rightTargets.size === 0) {
    return false;
  }

  return [...leftTargets].some((target) => rightTargets.has(target));
}

function getCurrentWeekStart() {
  const now = startOfToday();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(now, diff);
}

function getDayLabel(date: Date) {
  return date.toLocaleDateString("fr-FR", { weekday: "long" });
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getDateLabel(date: Date) {
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function getCoherenceFeedback(targets: TargetExamsPayload, weekdayDailyHours: number, weekendDailyHours: number) {
  const selectedSchools = [...targets.bceSchools, ...targets.ecricomeSchools];
  const highestAmbition = selectedSchools.reduce(
    (current, school) => Math.max(current, SCHOOL_WEIGHTS[school] ?? 2),
    2
  );
  const recommendedWeekday =
    highestAmbition >= 5 ? 4 : highestAmbition === 4 ? 3.5 : highestAmbition === 3 ? 3 : 2.5;
  const recommendedWeekend = highestAmbition >= 5 ? 7 : highestAmbition === 4 ? 6 : 5;
  const actualWeighted = weekdayDailyHours * 5 + weekendDailyHours * 2;
  const recommendedWeighted = recommendedWeekday * 5 + recommendedWeekend * 2;
  const ratio = actualWeighted / recommendedWeighted;

  if (ratio < 0.55) {
    return {
      title: "Charge tres insuffisante",
      helper: "L'objectif ecoles / volume de travail semble trop decale."
    };
  }

  if (ratio < 0.8) {
    return {
      title: "Charge fragile",
      helper: "Le cadre existe, mais il reste sans doute trop leger pour l'objectif annonce."
    };
  }

  if (ratio <= 1.15) {
    return {
      title: "Charge coherente",
      helper: "Le volume semble globalement aligne avec le niveau d'ambition."
    };
  }

  return {
    title: "Charge ambitieuse",
    helper: "Le volume est eleve ; il faudra surveiller la soutenabilite et la regularite."
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function ratioPercent(value: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  return Math.round((value / total) * 100);
}

function formatDurationMinutes(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) {
    return `${minutes} min`;
  }

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h${String(minutes).padStart(2, "0")}`;
}

function getAverageScore(feedbacks: Array<{ scoreMin: number | null; scoreMax: number | null }>) {
  const scored = feedbacks
    .map((feedback) => {
      if (feedback.scoreMin === null || feedback.scoreMax === null) {
        return null;
      }

      return (feedback.scoreMin + feedback.scoreMax) / 2;
    })
    .filter((score): score is number => score !== null);

  if (!scored.length) {
    return null;
  }

  return scored.reduce((sum, score) => sum + score, 0) / scored.length;
}

function getProgressFeedbackPayload(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      overview: "Feedback indisponible.",
      strengths: [] as string[],
      mistakes: [] as string[],
      nextSteps: [] as string[]
    };
  }

  const payload = value as Record<string, unknown>;

  return {
    overview: typeof payload.overview === "string" ? payload.overview : "Feedback indisponible.",
    strengths: Array.isArray(payload.strengths) ? payload.strengths.map(String) : [],
    mistakes: Array.isArray(payload.mistakes) ? payload.mistakes.map(String) : [],
    nextSteps: Array.isArray(payload.nextSteps) ? payload.nextSteps.map(String) : []
  };
}

function getSemesterLabel(date: Date) {
  const month = date.getMonth() + 1;
  return month >= 9 || month <= 1 ? "Semestre 1" : "Semestre 2";
}

async function ensureDemoGrades(studentId: string) {
  const existingGrades = await prisma.studentGrade.count({
    where: { studentId }
  });

  if (existingGrades > 0) {
    return;
  }

  const subjects = await prisma.subject.findMany({
    where: {
      code: {
        in: ["MATHS", "ESH", "HGG", "ANG"]
      }
    }
  });

  const subjectMap = new Map(subjects.map((subject) => [subject.code, subject]));
  const today = startOfToday();

  const demoGrades = [
    { subjectCode: "MATHS", title: "DS probabilites", score: 8, daysAgo: 118, sourceType: "teacher_entry", teacherName: "M. Dumas" },
    { subjectCode: "MATHS", title: "DM lois usuelles", score: 10.5, daysAgo: 92, sourceType: "teacher_entry", teacherName: "M. Dumas" },
    { subjectCode: "MATHS", title: "Concours blanc maths", score: 11.5, daysAgo: 7, sourceType: "mock_exam", teacherName: "Equipe concours" },
    { subjectCode: "ESH", title: "Dissertation croissance", score: 11, daysAgo: 110, sourceType: "teacher_entry", teacherName: "Mme Laurent" },
    { subjectCode: "ESH", title: "DS mondialisation", score: 12.5, daysAgo: 28, sourceType: "teacher_entry", teacherName: "Mme Laurent" },
    { subjectCode: "ESH", title: "Concours blanc ESH", score: 13, daysAgo: 6, sourceType: "mock_exam", teacherName: "Equipe concours" },
    { subjectCode: "HGG", title: "Dissertation geopolitique", score: 12, daysAgo: 102, sourceType: "teacher_entry", teacherName: "Mme Caron" },
    { subjectCode: "HGG", title: "Devoir dates et enjeux", score: 13.5, daysAgo: 19, sourceType: "teacher_entry", teacherName: "Mme Caron" },
    { subjectCode: "ANG", title: "Version anglaise", score: 13, daysAgo: 96, sourceType: "teacher_entry", teacherName: "Mme Green" },
    { subjectCode: "ANG", title: "Essai anglais", score: 14, daysAgo: 12, sourceType: "teacher_entry", teacherName: "Mme Green" }
  ] as const;

  await prisma.studentGrade.createMany({
    data: demoGrades
      .map((grade) => {
        const subject = subjectMap.get(grade.subjectCode);
        if (!subject) {
          return null;
        }

        return {
          studentId,
          subjectId: subject.id,
          title: grade.title,
          score: grade.score,
          maxScore: 20,
          sourceType: grade.sourceType,
          teacherName: grade.teacherName,
          capturedAt: addDays(today, -grade.daysAgo)
        };
      })
      .filter((grade): grade is NonNullable<typeof grade> => Boolean(grade))
  });
}

export const ensureDemoStudent = cache(async () => {
  const { prepClass, subjects } = await ensureReferenceData();
  const user = await requireRole([UserRole.STUDENT, UserRole.ADMIN]);
  const membership = await getCurrentUserClass(user.id);

  if (membership?.class) {
    return {
      user,
      prepClass: membership.class,
      subjects
    };
  }

  if (!isDemoModeEnabled() || !prepClass) {
    throw new Error("CLASS_REQUIRED");
  }

  await prisma.classMembership.upsert({
    where: {
      userId_classId: {
        userId: user.id,
        classId: prepClass.id
      }
    },
    update: {
      roleInClass: "student"
    },
    create: {
      userId: user.id,
      classId: prepClass.id,
      roleInClass: "student"
    }
  });
  return {
    user,
    prepClass,
    subjects
  };
});

async function ensureDemoBenchmarkStudents() {
  if (!isDemoModeEnabled()) {
    return;
  }

  const existingBenchmarks = await prisma.user.count({
    where: {
      email: {
        startsWith: "benchmark-demo-"
      }
    }
  });

  if (existingBenchmarks > 0) {
    return;
  }

  const { prepClass } = await ensureReferenceData();
  if (!prepClass) {
    return;
  }

  const cohort = [
    { firstName: "Alice", lastName: "Martin", email: "benchmark-demo-1@prepaos.local", prepYear: 2, targets: { bceSchools: ["HEC", "ESSEC"], ecricomeSchools: [] }, minutes: [160, 130, 90, 120, 80, 0, 0] },
    { firstName: "Hugo", lastName: "Petit", email: "benchmark-demo-2@prepaos.local", prepYear: 2, targets: { bceSchools: ["HEC", "ESSEC", "ESCP"], ecricomeSchools: [] }, minutes: [190, 150, 120, 90, 70, 60, 0] },
    { firstName: "Lina", lastName: "Bernard", email: "benchmark-demo-3@prepaos.local", prepYear: 2, targets: { bceSchools: ["ESSEC", "ESCP"], ecricomeSchools: ["NEOMA"] }, minutes: [120, 110, 75, 80, 60, 40, 0] },
    { firstName: "Noah", lastName: "Robert", email: "benchmark-demo-4@prepaos.local", prepYear: 2, targets: { bceSchools: ["EDHEC", "emlyon"], ecricomeSchools: ["NEOMA"] }, minutes: [100, 85, 70, 60, 50, 0, 0] },
    { firstName: "Emma", lastName: "Garcia", email: "benchmark-demo-5@prepaos.local", prepYear: 2, targets: { bceSchools: ["HEC", "ESCP"], ecricomeSchools: [] }, minutes: [210, 150, 110, 95, 80, 45, 0] },
    { firstName: "Leo", lastName: "Moreau", email: "benchmark-demo-6@prepaos.local", prepYear: 2, targets: { bceSchools: ["SKEMA", "Audencia"], ecricomeSchools: ["NEOMA"] }, minutes: [85, 75, 65, 40, 35, 0, 0] },
    { firstName: "Jade", lastName: "Roux", email: "benchmark-demo-7@prepaos.local", prepYear: 2, targets: { bceSchools: ["HEC", "ESSEC"], ecricomeSchools: [] }, minutes: [170, 135, 90, 100, 75, 50, 0] },
    { firstName: "Adam", lastName: "Fontaine", email: "benchmark-demo-8@prepaos.local", prepYear: 2, targets: { bceSchools: ["EDHEC", "emlyon", "SKEMA"], ecricomeSchools: [] }, minutes: [110, 95, 80, 70, 55, 20, 0] },
    { firstName: "Sarah", lastName: "Mercier", email: "benchmark-demo-9@prepaos.local", prepYear: 1, targets: { bceSchools: ["HEC", "ESSEC"], ecricomeSchools: [] }, minutes: [90, 80, 60, 55, 40, 0, 0] },
    { firstName: "Louis", lastName: "Faure", email: "benchmark-demo-10@prepaos.local", prepYear: 2, targets: { bceSchools: ["HEC", "ESSEC", "ESCP"], ecricomeSchools: [] }, minutes: [200, 145, 115, 100, 65, 30, 0] },
    { firstName: "Mia", lastName: "Andre", email: "benchmark-demo-11@prepaos.local", prepYear: 2, targets: { bceSchools: ["NEOMA", "Audencia"], ecricomeSchools: ["KEDGE"] }, minutes: [75, 60, 55, 50, 35, 0, 0] },
    { firstName: "Tom", lastName: "Chevalier", email: "benchmark-demo-12@prepaos.local", prepYear: 2, targets: { bceSchools: ["HEC", "ESSEC"], ecricomeSchools: [] }, minutes: [145, 120, 85, 95, 70, 20, 0] }
  ] as const;

  const subjects = await prisma.subject.findMany({
    where: {
      code: {
        in: ["MATHS", "ESH", "HGG"]
      }
    }
  });

  const subjectIds = subjects.map((subject) => subject.id);
  const weekStart = addDays(startOfToday(), -6);

  for (const [index, entry] of cohort.entries()) {
    const user = await prisma.user.upsert({
      where: { email: entry.email },
      update: {
        firstName: entry.firstName,
        lastName: entry.lastName,
        role: "STUDENT"
      },
      create: {
        email: entry.email,
        firstName: entry.firstName,
        lastName: entry.lastName,
        role: "STUDENT"
      }
    });

    await prisma.classMembership.upsert({
      where: {
        userId_classId: {
          userId: user.id,
          classId: prepClass.id
        }
      },
      update: {
        roleInClass: "student"
      },
      create: {
        userId: user.id,
        classId: prepClass.id,
        roleInClass: "student"
      }
    });

    const energyProfilePayload: EnergyProfilePayload = {
      languagePreferences: { lv1: "ANGLAIS", lv2: index % 3 === 0 ? "ESPAGNOL" : index % 3 === 1 ? "ALLEMAND" : "ITALIEN" },
      energyLevel: "modere",
      weekdayDailyHours: 3,
      weekendDailyHours: 5,
      weekdayStart: "18:00",
      weekdayEnd: "21:30",
      weekendStart: "09:30",
      weekendEnd: "14:30",
      sessionBlockMinutes: 50,
      shortBreakMinutes: 10,
      longBreakMinutes: 25,
      breakEveryBlocks: 2,
      productivitySignals: {
        canShiftBasedOnPerformance: true
      },
      assessments: {
        bacAverage: null,
        bacMention: null,
        subjectAssessments: {
          MATHS: 11,
          ESH: 12,
          HGG: 11,
          CG: 12,
          ANG: 13
        },
        bacSubjectAssessments: {
          MATHS: null,
          ESH: null,
          HGG: null,
          CG: null,
          ANG: null
        }
      }
    };

    const benchmarkTargetsPayload: TargetExamsPayload = {
      bceSchools: [...entry.targets.bceSchools],
      ecricomeSchools: [...entry.targets.ecricomeSchools]
    };

    await prisma.studentProfile.upsert({
      where: { userId: user.id },
      update: {
        classId: prepClass.id,
        prepYear: entry.prepYear,
        targetExams: benchmarkTargetsPayload satisfies Prisma.JsonObject,
        weeklyGoalHours: 25,
        energyProfile: energyProfilePayload satisfies Prisma.JsonObject
      },
      create: {
        userId: user.id,
        classId: prepClass.id,
        prepYear: entry.prepYear,
        targetExams: benchmarkTargetsPayload satisfies Prisma.JsonObject,
        weeklyGoalHours: 25,
        energyProfile: energyProfilePayload satisfies Prisma.JsonObject
      }
    });

    await prisma.studySession.deleteMany({
      where: {
        studentId: user.id,
        createdByType: "benchmark"
      }
    });

    const completedSessions: Prisma.StudySessionCreateManyInput[] = entry.minutes
      .filter((minutes) => minutes > 0)
      .map((minutes, dayIndex) => ({
        studentId: user.id,
        subjectId: subjectIds[dayIndex % Math.max(subjectIds.length, 1)] ?? null,
        plannedStartAt: setTime(addDays(weekStart, dayIndex), "18:00"),
        plannedDurationMin: minutes,
        actualDurationMin: minutes,
        sessionType:
          dayIndex % 3 === 0
            ? SessionType.CHAPTER_REVISION
            : dayIndex % 3 === 1
              ? SessionType.FLASHCARDS_REVIEW
              : SessionType.ESSAY_PRACTICE,
        goalText: "Bloc de travail benchmark",
        status: SessionStatus.COMPLETED,
        createdByType: "benchmark"
      }));

    if (completedSessions.length > 0) {
      await prisma.studySession.createMany({
        data: completedSessions
      });
    }
  }
}

function sumCompletedMinutesBetween(
  sessions: Array<{
    plannedStartAt: Date | null;
    plannedDurationMin: number;
    actualDurationMin: number | null;
    status: string;
  }>,
  startDate: Date
) {
  return sessions.reduce((total, session) => {
    if (session.status !== "COMPLETED") {
      return total;
    }

    const sessionDate = session.plannedStartAt;
    if (!sessionDate || sessionDate < startDate) {
      return total;
    }

    return total + (session.actualDurationMin ?? session.plannedDurationMin);
  }, 0);
}

async function getAnonymousWorkRanking(
  currentUserId: string,
  currentTargets: TargetExamsPayload,
  prepYear: number
): Promise<{
  title: string;
  subtitle: string;
  windows: WorkRankingWindow[];
}> {
  await ensureDemoBenchmarkStudents();

  const today = startOfToday();
  const threeDaysStart = addDays(today, -2);
  const weekStart = addDays(today, -6);

  const profiles = await prisma.studentProfile.findMany({
    include: {
      user: true
    }
  });

  const comparableProfiles = profiles.filter((profile) => {
    if (profile.userId === currentUserId) {
      return false;
    }

    if (profile.prepYear !== prepYear) {
      return false;
    }

    const targets = (profile.targetExams as TargetExamsPayload | null) ?? {
      bceSchools: [],
      ecricomeSchools: []
    };

    return shareComparableTargets(currentTargets, targets);
  });

  const userIds = [currentUserId, ...comparableProfiles.map((profile) => profile.userId)];
  const sessions = await prisma.studySession.findMany({
    where: {
      studentId: {
        in: userIds
      },
      status: "COMPLETED",
      plannedStartAt: {
        gte: weekStart
      }
    },
    select: {
      studentId: true,
      plannedStartAt: true,
      plannedDurationMin: true,
      actualDurationMin: true,
      status: true
    }
  });

  const sessionsByUser = new Map<string, typeof sessions>();
  for (const session of sessions) {
    const existing = sessionsByUser.get(session.studentId) ?? [];
    existing.push(session);
    sessionsByUser.set(session.studentId, existing);
  }

  const currentUserSessions = sessionsByUser.get(currentUserId) ?? [];
  const cohortSize = comparableProfiles.length;

  const windows: WorkRankingWindow[] = [
    {
      id: "today",
      label: "Aujourd'hui",
      aheadCount: 0,
      cohortSize,
      userMinutes: 0,
      helper: ""
    },
    {
      id: "threeDays",
      label: "3 derniers jours",
      aheadCount: 0,
      cohortSize,
      userMinutes: 0,
      helper: ""
    },
    {
      id: "week",
      label: "Cette semaine",
      aheadCount: 0,
      cohortSize,
      userMinutes: 0,
      helper: ""
    }
  ];

  const boundaries = {
    today,
    threeDays: threeDaysStart,
    week: weekStart
  };

  const currentTotals = {
    today: sumCompletedMinutesBetween(currentUserSessions, boundaries.today),
    threeDays: sumCompletedMinutesBetween(currentUserSessions, boundaries.threeDays),
    week: sumCompletedMinutesBetween(currentUserSessions, boundaries.week)
  };

  for (const profile of comparableProfiles) {
    const peerSessions = sessionsByUser.get(profile.userId) ?? [];
    const peerTotals = {
      today: sumCompletedMinutesBetween(peerSessions, boundaries.today),
      threeDays: sumCompletedMinutesBetween(peerSessions, boundaries.threeDays),
      week: sumCompletedMinutesBetween(peerSessions, boundaries.week)
    };

    if (peerTotals.today > currentTotals.today) {
      windows[0].aheadCount += 1;
    }

    if (peerTotals.threeDays > currentTotals.threeDays) {
      windows[1].aheadCount += 1;
    }

    if (peerTotals.week > currentTotals.week) {
      windows[2].aheadCount += 1;
    }
  }

  windows[0].userMinutes = currentTotals.today;
  windows[1].userMinutes = currentTotals.threeDays;
  windows[2].userMinutes = currentTotals.week;

  for (const window of windows) {
    window.helper =
      cohortSize > 0
        ? `${window.aheadCount} eleves comparables ont fait plus que toi sur cette periode.`
        : "Pas encore assez d'etudiants comparables pour afficher un classement fiable.";
  }

  return {
    title: "Classement anonyme",
    subtitle:
      cohortSize > 0
        ? "Comparaison avec des etudiants de meme annee qui visent des ecoles proches."
        : "Le classement s'activera vraiment des qu'il y aura assez d'etudiants comparables.",
    windows
  };
}

export async function getOnboardingOptions() {
  const { prepClass, subjects, user } = await ensureDemoStudent();
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: user.id }
  });
  const energyProfile = (profile?.energyProfile as EnergyProfilePayload | null) ?? null;
  const languagePreferences = getLanguagePreferences(energyProfile);

  return {
    classes: [prepClass],
    subjects,
    user: {
      firstName: user.firstName,
      lastName: user.lastName
    },
    preferences: {
      prepYear: profile?.prepYear ?? 2,
      lv2Language: languagePreferences.lv2
    },
    bceSchools: BCE_SCHOOLS,
    ecricomeSchools: ECRICOME_SCHOOLS
  };
}

export async function saveStudentOnboarding(input: OnboardingInput) {
  const { user } = await ensureDemoStudent();
  const today = startOfToday();
  const tomorrow = addDays(today, 1);
  const inThreeDays = addDays(today, 3);
  const weakPointCandidates = getWeakPointCandidates(input);
  const balancedSubjects = getBalancedSubjects(input);
  const weeklyGoalHours = input.weekdayDailyHours * 5 + input.weekendDailyHours * 2;

  const targetExamsPayload: TargetExamsPayload = {
    bceSchools: input.bceSchools,
    ecricomeSchools: input.ecricomeSchools
  };

  const energyProfilePayload: EnergyProfilePayload = {
    languagePreferences: {
      lv1: "ANGLAIS",
      lv2: input.lv2Language
    },
    energyLevel: input.energyLevel,
    weekdayDailyHours: input.weekdayDailyHours,
    weekendDailyHours: input.weekendDailyHours,
    weekdayStart: input.weekdayStart,
    weekdayEnd: input.weekdayEnd,
    weekendStart: input.weekendStart,
    weekendEnd: input.weekendEnd,
    sessionBlockMinutes: input.sessionBlockMinutes,
    shortBreakMinutes: input.shortBreakMinutes,
    longBreakMinutes: input.longBreakMinutes,
      breakEveryBlocks: input.breakEveryBlocks,
      productivitySignals: {
        canShiftBasedOnPerformance: true
      },
      assessments: {
        bacAverage: input.bacAverage ?? null,
        bacMention: input.bacMention || null,
        subjectAssessments: input.subjectAssessments,
        bacSubjectAssessments: input.bacSubjectAssessments
      }
    };

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: {
        firstName: input.firstName,
        lastName: input.lastName
      }
    });

    const profile = await tx.studentProfile.upsert({
      where: { userId: user.id },
      update: {
        classId: input.classId,
        prepYear: input.prepYear,
        targetExams: targetExamsPayload satisfies Prisma.JsonObject,
        weeklyGoalHours,
        strengthsText: input.bacAverage ? `Bac : ${input.bacAverage}/20` : null,
        weaknessesText: null,
        energyProfile: energyProfilePayload satisfies Prisma.JsonObject
      },
      create: {
        userId: user.id,
        classId: input.classId,
        prepYear: input.prepYear,
        targetExams: targetExamsPayload satisfies Prisma.JsonObject,
        weeklyGoalHours,
        strengthsText: input.bacAverage ? `Bac : ${input.bacAverage}/20` : null,
        weaknessesText: null,
        energyProfile: energyProfilePayload satisfies Prisma.JsonObject
      }
    });

    await tx.studentAvailabilitySlot.deleteMany({
      where: { studentId: profile.id }
    });

    const weekdaySlots = Array.from({ length: 5 }, (_, index) => ({
      studentId: profile.id,
      dayOfWeek: index + 1,
      startTime: input.weekdayStart,
      endTime: input.weekdayEnd,
      slotType: "study"
    }));

    const weekendSlots = [6, 0].map((dayOfWeek) => ({
      studentId: profile.id,
      dayOfWeek,
      startTime: input.weekendStart,
      endTime: input.weekendEnd,
      slotType: "study"
    }));

    await tx.studentAvailabilitySlot.createMany({
      data: [...weekdaySlots, ...weekendSlots]
    });

    await tx.studySession.deleteMany({
      where: { studentId: user.id }
    });

    await tx.task.deleteMany({
      where: { studentId: user.id }
    });

    await tx.weakPoint.deleteMany({
      where: { studentId: user.id }
    });

    const subjectMapEntries = await tx.subject.findMany({
      where: {
        code: {
          in: SUBJECT_REFERENCES.map((subject) => subject.code)
        }
      }
    });

    const subjectMap = new Map(subjectMapEntries.map((subject) => [subject.code, subject]));

    for (const [index, candidate] of weakPointCandidates.entries()) {
      const subject = subjectMap.get(candidate.code);
      if (!subject) {
        continue;
      }

      await tx.weakPoint.create({
        data: {
          studentId: user.id,
          subjectId: subject.id,
          sourceType: input.prepYear === 1 && !input.subjectAssessments[candidate.code] ? "bac" : "assessment",
          severityScore: Math.max(0.45, 0.9 - index * 0.18),
          label: candidate.label,
          description: candidate.description,
          status: "ACTIVE",
          lastDetectedAt: today
        }
      });
    }

    const taskSubjects = balancedSubjects
      .map((subject) => subjectMap.get(subject.code))
      .filter((subject): subject is NonNullable<typeof subject> => Boolean(subject));

    const firstTarget = input.bceSchools[0] ?? input.ecricomeSchools[0] ?? "concours";

    const tasks = await Promise.all([
      tx.task.create({
        data: {
          studentId: user.id,
          subjectId: taskSubjects[0]?.id,
          title: `Bloc de consolidation ${taskSubjects[0]?.name ?? "Maths"}`,
          description: "Une session ciblee issue des notes et de la repartition de travail.",
          taskType: "REVISION",
          dueAt: tomorrow,
          priorityScore: 0.92,
          status: "todo",
          sourceType: "onboarding"
        }
      }),
      tx.task.create({
        data: {
          studentId: user.id,
          subjectId: taskSubjects[1]?.id,
          title: `File de flashcards ${taskSubjects[1]?.name ?? "ESH"}`,
          description: "Installer une boucle de memorisation reguliere sur une autre matiere.",
          taskType: "FLASHCARDS",
          dueAt: today,
          priorityScore: 0.84,
          status: "todo",
          sourceType: "onboarding"
        }
      }),
      tx.task.create({
        data: {
          studentId: user.id,
          subjectId: taskSubjects[2]?.id,
          title: `Travail type concours ${firstTarget}`,
          description: "Garder une matiere supplementaire active au lieu d'en laisser une de cote.",
          taskType: "ESSAY",
          dueAt: inThreeDays,
          priorityScore: 0.76,
          status: "todo",
          sourceType: "onboarding"
        }
      })
    ]);

    const weekdayStartMinutes = minutesFromTime(input.weekdayStart);
    const weekdayEndMinutes = minutesFromTime(input.weekdayEnd);
    const maxBlocksPerWeekday = Math.max(
      1,
      Math.floor(
        (weekdayEndMinutes - weekdayStartMinutes + input.shortBreakMinutes) /
          (input.sessionBlockMinutes + input.shortBreakMinutes)
      )
    );

    const effectiveBlocks = Math.max(
      1,
      Math.min(maxBlocksPerWeekday, Math.floor((input.weekdayDailyHours * 60) / input.sessionBlockMinutes))
    );

    const firstSessionStart = setTime(today, input.weekdayStart);
    const secondSessionStart = new Date(
      firstSessionStart.getTime() + (input.sessionBlockMinutes + input.shortBreakMinutes) * 60_000
    );
    const longBreak = effectiveBlocks >= input.breakEveryBlocks ? input.longBreakMinutes : input.shortBreakMinutes;
    const thirdSessionStart = new Date(
      secondSessionStart.getTime() + (input.sessionBlockMinutes + longBreak) * 60_000
    );

    await tx.studySession.createMany({
      data: [
        {
          studentId: user.id,
          subjectId: taskSubjects[0]?.id,
          taskId: tasks[0].id,
          plannedStartAt: firstSessionStart,
          plannedDurationMin: input.sessionBlockMinutes,
          sessionType: "CHAPTER_REVISION",
          goalText: `Consolider ${taskSubjects[0]?.name ?? "Maths"} sans desequilibrer le reste`,
          status: "PLANNED",
          createdByType: "onboarding"
        },
        {
          studentId: user.id,
          subjectId: taskSubjects[1]?.id,
          taskId: tasks[1].id,
          plannedStartAt: secondSessionStart,
          plannedDurationMin: Math.max(20, Math.min(input.sessionBlockMinutes, 35)),
          sessionType: "FLASHCARDS_REVIEW",
          goalText: `Faire tourner la repetition espacee en ${taskSubjects[1]?.name ?? "ESH"}`,
          status: "PLANNED",
          createdByType: "onboarding"
        },
        {
          studentId: user.id,
          subjectId: taskSubjects[2]?.id,
          taskId: tasks[2].id,
          plannedStartAt: thirdSessionStart,
          plannedDurationMin: input.sessionBlockMinutes,
          sessionType: "ESSAY_PRACTICE",
          goalText: `Garder ${taskSubjects[2]?.name ?? "HGG"} actif avec une production ou une relecture`,
          status: "PLANNED",
          createdByType: "onboarding"
        }
      ]
    });
  });
}

export async function getStudentShellData() {
  const { user } = await ensureDemoStudent();
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: user.id }
  });

  return {
    title: profile ? user.firstName : "Configuration",
    subtitle: profile
      ? "Organisation, revisions et progression."
      : "Configure ton profil pour demarrer."
  };
}

export async function getStudentDashboardData() {
  const { user } = await ensureDemoStudent();

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: user.id },
    include: {
      class: true,
      availabilitySlots: true
    }
  });

  if (!profile) {
    return {
      hasProfile: false as const,
      userFirstName: user.firstName
    };
  }

  const targetExams = (profile.targetExams as TargetExamsPayload | null) ?? {
    bceSchools: [],
    ecricomeSchools: []
  };
  const energyProfile = (profile.energyProfile as EnergyProfilePayload | null) ?? null;
  const languagePreferences = getLanguagePreferences(energyProfile);
  const anonymousRanking = await getAnonymousWorkRanking(user.id, targetExams, profile.prepYear);

  const [tasks, sessions, weakPoints, flashcards] = await Promise.all([
    prisma.task.findMany({
      where: { studentId: user.id },
      orderBy: [{ dueAt: "asc" }, { priorityScore: "desc" }],
      take: 3,
      include: {
        subject: true
      }
    }),
    prisma.studySession.findMany({
      where: { studentId: user.id },
      orderBy: { plannedStartAt: "asc" },
      take: 3,
      include: {
        subject: true
      }
    }),
    prisma.weakPoint.findMany({
      where: { studentId: user.id },
      orderBy: { severityScore: "desc" },
      take: 3,
      include: {
        subject: true
      }
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

  const weekdayDailyHours = energyProfile?.weekdayDailyHours ?? 3;
  const weekendDailyHours = energyProfile?.weekendDailyHours ?? 5;
  const shortBreakMinutes = energyProfile?.shortBreakMinutes ?? 10;
  const blockMinutes = energyProfile?.sessionBlockMinutes ?? 50;
  const targetExamSummary = getTargetExamSummary(targetExams);
  const today = startOfToday();
  const dueFlashcards = flashcards.filter((card) => {
    const state = card.states[0];
    return !state?.nextReviewAt || state.nextReviewAt <= today;
  }).length;

  return {
    hasProfile: true as const,
    userFirstName: user.firstName,
    profile: {
      prepYear: profile.prepYear,
      className: profile.class.name,
      weeklyGoalHours: profile.weeklyGoalHours ?? weekdayDailyHours * 5 + weekendDailyHours * 2,
      targetExams,
      energyProfile,
      languagePreferences
    },
    anonymousRanking,
    stats: [
      {
        label: "Cible semaine",
        value: `${profile.weeklyGoalHours ?? weekdayDailyHours * 5 + weekendDailyHours * 2}h`,
        helper: `${weekdayDailyHours}h/j semaine - ${weekendDailyHours}h/j week-end`
      },
      {
        label: "Concours vises",
        value: `${targetExams.bceSchools.length + targetExams.ecricomeSchools.length}`,
        helper: targetExamSummary
      },
      {
        label: "Pauses cadencees",
        value: `${shortBreakMinutes} min`,
        helper: `pause longue : ${energyProfile?.longBreakMinutes ?? 20} min`
      },
      {
        label: "Matiere(s) a remonter",
        value: `${weakPoints.length}`,
        helper: "Sans laisser les autres sur le cote"
      }
    ],
    sessions: sessions.map((session) => ({
      id: session.id,
      time: session.plannedStartAt
        ? session.plannedStartAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
        : "--:--",
      duration: session.plannedDurationMin,
      title: session.goalText,
      subject: session.subject?.name ?? "Matiere a definir",
      reason: "Cree pour equilibrer la semaine a partir du profil et des resultats."
    })),
    weakPoints: weakPoints.map((point) => ({
      label: point.label,
      severity: point.severityScore >= 0.75 ? "Forte" : point.severityScore >= 0.55 ? "Moyenne" : "Legere",
      reason:
        point.description ??
        `La matiere ${point.subject?.name ?? "concernee"} doit remonter sans desequilibrer le reste du planning.`
    })),
    deadlines: tasks
      .filter((task) => task.dueAt)
      .map((task) => ({
        label: task.title,
        when: task.dueAt
          ? task.dueAt.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
          : "sans date"
      }))
  };
}

export async function getStudentPlanningData() {
  const { user } = await ensureDemoStudent();

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: user.id },
    include: {
      class: true,
      availabilitySlots: true
    }
  });

  if (!profile) {
    return {
      hasProfile: false as const
    };
  }

  const targetExams = (profile.targetExams as TargetExamsPayload | null) ?? {
    bceSchools: [],
    ecricomeSchools: []
  };
  const energyProfile = (profile.energyProfile as EnergyProfilePayload | null) ?? null;

  const [sessions, weakPoints, tasks, subjects] = await Promise.all([
    prisma.studySession.findMany({
      where: { studentId: user.id },
      include: {
        subject: true
      },
      orderBy: { plannedStartAt: "asc" }
    }),
    prisma.weakPoint.findMany({
      where: { studentId: user.id },
      include: {
        subject: true
      },
      orderBy: { severityScore: "desc" }
    }),
    prisma.task.findMany({
      where: { studentId: user.id },
      include: {
        subject: true
      },
      orderBy: [{ dueAt: "asc" }, { priorityScore: "desc" }]
    }),
    prisma.subject.findMany({
      orderBy: { name: "asc" }
    })
  ]);

  const weekdayDailyHours = energyProfile?.weekdayDailyHours ?? 3;
  const weekendDailyHours = energyProfile?.weekendDailyHours ?? 5;
  const shortBreakMinutes = energyProfile?.shortBreakMinutes ?? 10;
  const longBreakMinutes = energyProfile?.longBreakMinutes ?? 25;
  const breakEveryBlocks = energyProfile?.breakEveryBlocks ?? 2;
  const blockMinutes = energyProfile?.sessionBlockMinutes ?? 50;
  const weekdayStart = energyProfile?.weekdayStart ?? "18:00";
  const weekendStart = energyProfile?.weekendStart ?? "09:30";

  const prioritizedSubjects = [
    ...weakPoints
      .map((point) => point.subject)
      .filter((subject): subject is NonNullable<typeof subject> => Boolean(subject)),
    ...subjects
  ].filter(
    (subject, index, array) => array.findIndex((candidate) => candidate.id === subject.id) === index
  );

  const weekStart = getCurrentWeekStart();
  const today = startOfToday();
  const todayKey = today.toDateString();

  const week = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(weekStart, index);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const availableHours = isWeekend ? weekendDailyHours : weekdayDailyHours;
    const startTime = isWeekend ? weekendStart : weekdayStart;
    const sessionsForDay = sessions.filter(
      (session) => session.plannedStartAt && startOfTodayFrom(session.plannedStartAt).toDateString() === date.toDateString()
    );

    if (sessionsForDay.length > 0) {
      return {
        dayLabel: capitalize(getDayLabel(date)),
        dateLabel: getDateLabel(date),
        isToday: date.toDateString() === todayKey,
        availableHours,
        entries: sessionsForDay.map((session) => ({
          id: session.id,
          time: session.plannedStartAt
            ? session.plannedStartAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
            : "--:--",
          plannedStartAt: session.plannedStartAt ? session.plannedStartAt.toISOString() : null,
          subjectId: session.subjectId,
          subject: session.subject?.name ?? "Matiere",
          title: session.goalText,
          duration: session.plannedDurationMin,
          status: session.status,
          persisted: true,
          sessionType: session.sessionType
        }))
      };
    }

    const blockCount = Math.max(1, Math.floor((availableHours * 60) / blockMinutes));
    const firstStart = setTime(date, startTime);

    const generatedEntries = Array.from({ length: Math.min(3, blockCount) }, (_, sessionIndex) => {
      const subject = prioritizedSubjects[(index + sessionIndex) % prioritizedSubjects.length];
      const appliedBreak =
        sessionIndex === 0 ? 0 : sessionIndex % breakEveryBlocks === 0 ? longBreakMinutes : shortBreakMinutes;
      const offsetMinutes = sessionIndex * blockMinutes + appliedBreak * sessionIndex;
      const slotTime = new Date(firstStart.getTime() + offsetMinutes * 60_000);

      return {
        id: `${date.toISOString()}-${sessionIndex}`,
        time: slotTime.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        plannedStartAt: slotTime.toISOString(),
        subjectId: subject?.id ?? null,
        subject: subject?.name ?? "Matiere",
        title:
          sessionIndex === 0
            ? `Bloc de progression ${subject?.name ?? "matiere"}`
            : sessionIndex === 1
              ? `Repetition active ${subject?.name ?? "matiere"}`
              : `Travail d'entretien ${subject?.name ?? "matiere"}`,
        duration: sessionIndex === 1 ? Math.max(20, Math.min(blockMinutes, 35)) : blockMinutes,
        status: "PLANNED",
        persisted: false,
        sessionType:
          sessionIndex === 0
            ? "CHAPTER_REVISION"
            : sessionIndex === 1
              ? "FLASHCARDS_REVIEW"
              : "ESSAY_PRACTICE"
      };
    });

    return {
      dayLabel: capitalize(getDayLabel(date)),
      dateLabel: getDateLabel(date),
      isToday: date.toDateString() === todayKey,
      availableHours,
      entries: generatedEntries
    };
  });

  const todayPlan = week.find((day) => day.isToday) ?? week[0];

  return {
    hasProfile: true as const,
    week,
    todayPlan,
    adjustments: [
      {
        label: "Charge quotidienne cible",
        value: `${weekdayDailyHours}h semaine / ${weekendDailyHours}h week-end`
      },
      {
        label: "Rythme de blocs",
        value: `${blockMinutes} min + pause ${shortBreakMinutes} min`
      },
      {
        label: "Pause longue",
        value: `Tous les ${breakEveryBlocks} blocs - ${longBreakMinutes} min`
      }
    ],
    profile: {
      className: profile.class.name,
      targetExamSummary: getTargetExamSummary(targetExams)
    },
    upcomingTasks: tasks.slice(0, 4).map((task) => ({
      title: task.title,
      subject: task.subject?.name ?? "Matiere",
      dueLabel: task.dueAt
        ? task.dueAt.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
        : "sans date"
    }))
  };
}

export async function getStudentProgressData() {
  const { user } = await ensureDemoStudent();

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: user.id },
    include: {
      class: true
    }
  });

  if (!profile) {
    return {
      hasProfile: false as const
    };
  }

  await ensureDemoGrades(user.id);

  const targetExams = (profile.targetExams as TargetExamsPayload | null) ?? {
    bceSchools: [],
    ecricomeSchools: []
  };

  const [subjects, grades, weakPoints, flashcards, reviews, essays] = await Promise.all([
    prisma.subject.findMany({
      orderBy: { name: "asc" }
    }),
    prisma.studentGrade.findMany({
      where: { studentId: user.id },
      include: {
        subject: true
      },
      orderBy: { capturedAt: "asc" }
    }),
    prisma.weakPoint.findMany({
      where: { studentId: user.id },
      include: {
        subject: true
      },
      orderBy: { severityScore: "desc" }
    }),
    prisma.flashcard.findMany({
      where: {
        deck: {
          ownerUserId: user.id
        }
      },
      include: {
        deck: {
          include: {
            subject: true,
            chapter: true
          }
        },
        states: {
          where: { userId: user.id }
        }
      }
    }),
    prisma.flashcardReview.findMany({
      where: {
        userId: user.id,
        reviewedAt: {
          gte: addDays(startOfToday(), -13)
        }
      },
      include: {
        flashcard: {
          include: {
            deck: {
              include: {
                subject: true,
                chapter: true
              }
            }
          }
        }
      },
      orderBy: { reviewedAt: "desc" }
    }),
    prisma.essay.findMany({
      where: { studentId: user.id },
      include: {
        subject: true,
        feedbacks: {
          orderBy: { createdAt: "desc" }
        }
      },
      orderBy: { createdAt: "desc" }
    })
  ]);

  const flashcardStates = flashcards.map((card) => card.states[0]).filter(Boolean);
  const dueFlashcards = flashcards.filter((card) => {
    const state = card.states[0];
    return !state?.nextReviewAt || state.nextReviewAt <= new Date();
  }).length;
  const matureCards = flashcardStates.filter((state) => state.status === "REVIEW").length;

  const correctedEssays = essays.filter((essay) => essay.feedbacks.length > 0);
  const allEssayFeedbacks = correctedEssays.flatMap((essay) => essay.feedbacks);
  const averageEssayScore = getAverageScore(allEssayFeedbacks);
  const groupedGrades = subjects
    .map((subject) => {
      const subjectGrades = grades.filter((grade) => grade.subjectId === subject.id);
      const scoreAverage =
        subjectGrades.length > 0
          ? subjectGrades.reduce((sum, grade) => sum + (grade.score / grade.maxScore) * 20, 0) / subjectGrades.length
          : null;
      const latestGrade = subjectGrades.at(-1) ?? null;
      const firstGrade = subjectGrades[0] ?? null;
      const trend =
        latestGrade && firstGrade ? (latestGrade.score / latestGrade.maxScore) * 20 - (firstGrade.score / firstGrade.maxScore) * 20 : 0;
      const weakPoint = weakPoints.find((point) => point.subjectId === subject.id) ?? null;
      const relatedEssayScore = getAverageScore(
        essays
          .filter((essay) => essay.subjectId === subject.id)
          .flatMap((essay) => essay.feedbacks)
          .map((feedback) => ({
            scoreMin: feedback.scoreMin,
            scoreMax: feedback.scoreMax
          }))
      );

      let status = "A consolider";
      if (scoreAverage !== null && scoreAverage >= 13.5 && trend >= 0) {
        status = "Solide";
      } else if (scoreAverage !== null && scoreAverage >= 11.5 && !weakPoint) {
        status = "A surveiller";
      }

      return {
        subject: subject.name,
        grades: subjectGrades,
        average: scoreAverage,
        trend,
        status,
        weakLabel: weakPoint?.label ?? null,
        essayAverage: relatedEssayScore
      };
    })
    .filter((entry) => entry.grades.length > 0);

  const recentGrades = grades.slice(-6);
  const averageRecentGrade =
    recentGrades.length > 0
      ? recentGrades.reduce((sum, grade) => sum + (grade.score / grade.maxScore) * 20, 0) / recentGrades.length
      : null;
  const strongestSubject = [...groupedGrades]
    .filter((entry) => entry.average !== null)
    .sort((left, right) => (right.average ?? 0) - (left.average ?? 0))[0];
  const weakestSubject = [...groupedGrades]
    .filter((entry) => entry.average !== null)
    .sort((left, right) => (left.average ?? 20) - (right.average ?? 20))[0];

  const summaryCards = [
    {
      label: "Point fort",
      value: strongestSubject?.subject ?? "--",
      helper:
        strongestSubject?.average != null ? `${strongestSubject.average.toFixed(1)}/20 de moyenne` : "A preciser"
    },
    {
      label: "A consolider",
      value: weakestSubject?.subject ?? "--",
      helper:
        weakestSubject?.average != null ? `${weakestSubject.average.toFixed(1)}/20 de moyenne` : "A preciser"
    },
    {
      label: "Copies corrigees",
      value: `${correctedEssays.length}`,
      helper:
        averageEssayScore !== null ? `Autour de ${averageEssayScore.toFixed(1)}/20 en moyenne` : "Pas encore de moyenne concours"
    }
  ];

  const subjectCharts = groupedGrades.map((entry) => {
    const points = entry.grades.slice(-5).map((grade) => ({
      label: grade.capturedAt.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
      value: Number((((grade.score / grade.maxScore) * 20)).toFixed(1)),
      title: grade.title
    }));

    const helper = entry.weakLabel
      ? `Vigilance : ${entry.weakLabel}`
      : entry.essayAverage !== null
        ? `Retours de copies autour de ${entry.essayAverage.toFixed(1)}/20`
        : "Pas d'alerte forte sur cette matiere pour l'instant";

    return {
      subject: entry.subject,
      status: entry.status,
      latestScore: points.at(-1)?.value ?? null,
      trendLabel:
        entry.trend >= 1
          ? "En progression"
          : entry.trend <= -1
            ? "En baisse"
            : "Assez stable",
      helper,
      points
    };
  });

  const strongAreas = subjectCharts
    .filter((entry) => entry.status === "Solide")
    .slice(0, 3)
    .map((entry) => `${entry.subject} : ${entry.latestScore?.toFixed(1) ?? "--"}/20 sur la derniere note.`);
  const watchAreas = subjectCharts
    .filter((entry) => entry.status === "A surveiller")
    .slice(0, 3)
    .map((entry) => `${entry.subject} : ${entry.trendLabel.toLowerCase()}.`);
  const consolidateAreas = [
    ...subjectCharts
      .filter((entry) => entry.status === "A consolider")
      .slice(0, 3)
      .map((entry) => `${entry.subject} : ${entry.helper}`),
    ...(dueFlashcards > 0
      ? [`Flashcards : ${dueFlashcards} cartes dues, ce qui fragilise la memorisation.`]
      : []),
    ...(weakPoints[0] ? [`Point faible detecte : ${weakPoints[0].label}.`] : [])
  ].slice(0, 3);

  const essayProgress = essays.slice(0, 3).map((essay) => {
    const latestFeedback = essay.feedbacks[0];
    const payload = latestFeedback ? getProgressFeedbackPayload(latestFeedback.feedbackJson) : null;
    const scoreLabel =
      latestFeedback && latestFeedback.scoreMin !== null && latestFeedback.scoreMax !== null
        ? latestFeedback.scoreMin === latestFeedback.scoreMax
          ? `${latestFeedback.scoreMin}/20`
          : `${latestFeedback.scoreMin}-${latestFeedback.scoreMax}/20`
        : "Sans note";

    return {
      id: essay.id,
      title: essay.title,
      subject: essay.subject.name,
      status:
        essay.status === "TEACHER_REVIEWED"
          ? "Corrigee par un prof"
          : essay.status === "AI_REVIEWED"
            ? "Correction IA disponible"
            : "En attente de correction",
      scoreLabel,
      summary: payload?.overview ?? "Cette copie n'a pas encore de retour exploitable.",
      nextStep: payload?.nextSteps[0] ?? payload?.mistakes[0] ?? "Pas encore de prochain levier explicite."
    };
  });

  return {
    hasProfile: true as const,
    profile: {
      className: profile.class.name,
      targetExamSummary: getTargetExamSummary(targetExams)
    },
    summaryCards,
    subjectCharts,
    gradeFormSubjects: subjects.map((subject) => ({
      code: subject.code,
      name: subject.name
    })),
    averageCardsBase: {
      strongestSubject: strongestSubject
        ? {
            label: strongestSubject.subject,
            average: strongestSubject.average ?? null
          }
        : null,
      weakestSubject: weakestSubject
        ? {
            label: weakestSubject.subject,
            average: weakestSubject.average ?? null
          }
        : null,
      correctedEssaysCount: correctedEssays.length,
      averageEssayScore
    },
    grades: grades
      .slice()
      .sort((left, right) => right.capturedAt.getTime() - left.capturedAt.getTime())
      .map((grade) => ({
        id: grade.id,
        title: grade.title,
        subject: grade.subject.name,
        score: Number((((grade.score / grade.maxScore) * 20)).toFixed(1)),
        dateLabel: grade.capturedAt.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
        capturedAtIso: grade.capturedAt.toISOString(),
        teacherName: grade.teacherName ?? "Professeur",
        sourceType: grade.sourceType,
        sourceLabel: grade.sourceType === "mock_exam" ? "Concours blanc" : "Controle / devoir",
        semesterLabel: getSemesterLabel(grade.capturedAt)
      })),
    visualReading: {
      strongAreas,
      watchAreas,
      consolidateAreas
    },
    categories: ["Semestre 1", "Semestre 2", "Concours blancs"],
    essayProgress,
    latestGradeEntries: grades.slice(-8).reverse().map((grade) => ({
      id: grade.id,
      title: grade.title,
      subject: grade.subject.name,
      scoreLabel: `${Number(((grade.score / grade.maxScore) * 20).toFixed(1))}/20`,
      dateLabel: grade.capturedAt.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
      teacherName: grade.teacherName ?? "Professeur"
    }))
  };
}

export async function createStudentGrade(input: {
  subjectCode: string;
  title: string;
  score: number;
  capturedAt: string;
  sourceType: string;
  teacherName?: string;
}) {
  const { user } = await ensureDemoStudent();
  const subject = await prisma.subject.findUnique({
    where: { code: input.subjectCode }
  });

  if (!subject || !input.title.trim() || Number.isNaN(input.score)) {
    return;
  }

  const capturedAt = new Date(input.capturedAt);
  if (Number.isNaN(capturedAt.getTime())) {
    return;
  }

  await prisma.studentGrade.create({
    data: {
      studentId: user.id,
      subjectId: subject.id,
      title: input.title.trim(),
      score: clamp(input.score, 0, 20),
      maxScore: 20,
      sourceType: input.sourceType.trim() || "teacher_entry",
      teacherName: input.teacherName?.trim() || null,
      capturedAt
    }
  });
}

export async function getStudentAssistantData() {
  const { user } = await ensureDemoStudent();
  const membership = await getCurrentUserClass(user.id);

  const [weakPoints, latestEssay, latestResource, flashcards] = await Promise.all([
    prisma.weakPoint.findMany({
      where: { studentId: user.id },
      orderBy: { severityScore: "desc" },
      take: 3
    }),
    prisma.essay.findFirst({
      where: { studentId: user.id },
      orderBy: { createdAt: "desc" }
    }),
    prisma.resource.findFirst({
      where: membership?.classId
        ? {
            OR: [{ classId: membership.classId }, { classId: null }]
          }
        : undefined,
      orderBy: { createdAt: "desc" }
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

  const dueFlashcards = flashcards.filter((card) => {
    const state = card.states[0];
    return !state?.nextReviewAt || state.nextReviewAt <= new Date();
  }).length;
  const snapshot = await generateAssistantSnapshot({
    userId: user.id,
    weakPointLabels: weakPoints.map((point) => point.label),
    dueFlashcards,
    resourceTitle: latestResource?.title,
    essayTitle: latestEssay?.title
  });

  return {
    prompts: snapshot.quickPrompts,
    responseTitle: snapshot.headline,
    responseSummary: snapshot.summary,
    actions: snapshot.actions,
    aiStatus: getAIStatusMeta()
  };
}

function startOfTodayFrom(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}
