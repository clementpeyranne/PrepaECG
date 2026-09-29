"use server";

import { revalidatePath } from "next/cache";
import { SessionStatus, SessionType } from "@prisma/client";

import { prisma } from "@/lib/db";
import { parseFlashcardFocusState, serializeFlashcardFocusState } from "@/lib/planning-focus";
import { ensureDemoStudent, getStudentPlanningData } from "@/lib/student-app";

export type PlanningActionResult =
  | { ok: true }
  | { ok: false; reason: "missing_copy" | "flashcards_time_required" | "unavailable" };

export type FlashcardFocusResult =
  | { ok: true; elapsedSeconds: number; requiredSeconds: number; complete: boolean }
  | { ok: false; reason: "unavailable" };

const MAX_FOCUS_HEARTBEAT_SECONDS = 15;

type FreezablePlanningEntry = {
  id: string;
  persisted: boolean;
  subjectId: string | null;
  plannedStartAt: string | null;
  duration: number;
  sessionType: string;
  title: string;
};

async function freezePlanningDay(userId: string, entries: FreezablePlanningEntry[]) {
  const unpersistedEntries = entries.filter((block) => !block.persisted);
  if (unpersistedEntries.length === 0) return;

  await prisma.$transaction(
    unpersistedEntries.map((block) => prisma.studySession.upsert({
        where: { id: block.id },
        update: {},
        create: {
          id: block.id,
          studentId: userId,
          subjectId: block.subjectId,
          plannedStartAt: block.plannedStartAt ? new Date(block.plannedStartAt) : null,
          plannedDurationMin: block.duration,
          sessionType: block.sessionType as SessionType,
          goalText: block.title,
          status: SessionStatus.PLANNED,
          createdByType: "planning"
        }
      }))
  );
}

async function persistPlanningEntry(formData: FormData, status: SessionStatus): Promise<PlanningActionResult> {
  const { user } = await ensureDemoStudent();
  const entryId = String(formData.get("entryId") ?? formData.get("sessionId") ?? "").trim();
  const planning = await getStudentPlanningData();
  const day = planning.hasProfile ? planning.week.find((day) => day.entries.some((entry) => entry.id === entryId)) : null;
  const entry = day?.entries.find((entry) => entry.id === entryId);
  if (!day || !entry) return { ok: false, reason: "unavailable" };

  if (status === SessionStatus.COMPLETED) {
    if (entry.requiresFlashcards && !entry.hasCompletedFlashcardTime) {
      return { ok: false, reason: "flashcards_time_required" };
    }
    if (entry.requiresSubmission && !entry.hasSubmission && formData.get("confirmMissingSubmission") !== "yes") {
      return { ok: false, reason: "missing_copy" };
    }
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await prisma.$transaction(async (tx) => {
        // Freeze the whole suggested day before changing one block. Stable IDs make retries safe.
        for (const block of day.entries.filter((block) => !block.persisted)) {
          await tx.studySession.upsert({
            where: { id: block.id },
            update: {},
            create: {
              id: block.id,
              studentId: user.id,
              subjectId: block.subjectId,
              plannedStartAt: block.plannedStartAt ? new Date(block.plannedStartAt) : null,
              plannedDurationMin: block.duration,
              sessionType: block.sessionType as SessionType,
              goalText: block.title,
              status: SessionStatus.PLANNED,
              createdByType: "planning"
            }
          });
        }
        const result = await tx.studySession.updateMany({
          where: { id: entryId, studentId: user.id },
          data: { status, actualDurationMin: status === SessionStatus.COMPLETED ? entry.duration : null }
        });
        if (result.count !== 1) throw new Error("PLANNING_ENTRY_UNAVAILABLE");
        if (entry.taskId) {
          await tx.task.updateMany({
            where: { id: entry.taskId, studentId: user.id },
            data: { status: status === SessionStatus.COMPLETED ? "done" : "todo" }
          });
        }
      });
      break;
    } catch (error) {
      const retryable = error && typeof error === "object" && "code" in error &&
        (error.code === "P2002" || error.code === "P2034");
      if (!retryable || attempt === 2) throw error;
    }
  }

  for (const path of ["/planning", "/dashboard", "/progress", "/assistant"]) revalidatePath(path);
  return { ok: true };
}

export async function markPlanningSessionDone(formData: FormData) {
  return persistPlanningEntry(formData, SessionStatus.COMPLETED);
}

export async function markPlanningSessionPlanned(formData: FormData) {
  return persistPlanningEntry(formData, SessionStatus.PLANNED);
}

export async function recordFlashcardFocusHeartbeat(entryId: string): Promise<FlashcardFocusResult> {
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(entryId)) return { ok: false, reason: "unavailable" };

  const { user } = await ensureDemoStudent();
  const planning = await getStudentPlanningData();
  const day = planning.hasProfile
    ? planning.week.find((candidate) => candidate.entries.some((entry) => entry.id === entryId))
    : null;
  const entry = day?.entries.find((candidate) => candidate.id === entryId);

  if (!day || !entry || !entry.requiresFlashcards) return { ok: false, reason: "unavailable" };

  await freezePlanningDay(user.id, day.entries);

  const now = new Date();
  const session = await prisma.studySession.findFirst({
    where: { id: entryId, studentId: user.id, sessionType: SessionType.FLASHCARDS_REVIEW },
    select: { usefulnessFeedback: true, plannedDurationMin: true }
  });
  if (!session) return { ok: false, reason: "unavailable" };

  const focus = parseFlashcardFocusState(session.usefulnessFeedback);
  const elapsedSinceHeartbeat = focus.heartbeatAt
    ? Math.floor((now.getTime() - focus.heartbeatAt.getTime()) / 1000)
    : 0;
  const increment = Math.max(0, Math.min(MAX_FOCUS_HEARTBEAT_SECONDS, elapsedSinceHeartbeat));
  const nextElapsedSeconds = focus.elapsedSeconds + increment;
  const nextFocusValue = serializeFlashcardFocusState({
    elapsedSeconds: nextElapsedSeconds,
    heartbeatAt: now
  });

  const updated = await prisma.studySession.updateMany({
    where: {
      id: entryId,
      studentId: user.id,
      usefulnessFeedback: session.usefulnessFeedback
    },
    data: {
      usefulnessFeedback: nextFocusValue,
      status: SessionStatus.IN_PROGRESS
    }
  });

  let current = nextElapsedSeconds;
  if (updated.count !== 1) {
    const latest = await prisma.studySession.findFirst({
      where: { id: entryId, studentId: user.id },
      select: { usefulnessFeedback: true }
    });
    current = parseFlashcardFocusState(latest?.usefulnessFeedback).elapsedSeconds;
  }
  const requiredSeconds = session.plannedDurationMin * 60;

  return {
    ok: true,
    elapsedSeconds: Math.min(current, requiredSeconds),
    requiredSeconds,
    complete: current >= requiredSeconds
  };
}
