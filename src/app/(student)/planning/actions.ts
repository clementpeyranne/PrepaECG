"use server";

import { revalidatePath } from "next/cache";
import { SessionStatus, SessionType } from "@prisma/client";

import { prisma } from "@/lib/db";
import { ensureDemoStudent, getStudentPlanningData } from "@/lib/student-app";

export type PlanningActionResult =
  | { ok: true }
  | { ok: false; reason: "missing_copy" | "flashcards_required" | "unavailable" };

async function persistPlanningEntry(formData: FormData, status: SessionStatus): Promise<PlanningActionResult> {
  const { user } = await ensureDemoStudent();
  const entryId = String(formData.get("entryId") ?? formData.get("sessionId") ?? "").trim();
  const planning = await getStudentPlanningData();
  const day = planning.hasProfile ? planning.week.find((day) => day.entries.some((entry) => entry.id === entryId)) : null;
  const entry = day?.entries.find((entry) => entry.id === entryId);
  if (!day || !entry) return { ok: false, reason: "unavailable" };

  if (status === SessionStatus.COMPLETED) {
    if (entry.requiresFlashcards && !entry.hasFlashcardReview) {
      return { ok: false, reason: "flashcards_required" };
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
