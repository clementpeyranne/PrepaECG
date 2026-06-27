"use server";

import { revalidatePath } from "next/cache";
import { SessionStatus, SessionType } from "@prisma/client";

import { prisma } from "@/lib/db";
import { ensureDemoStudent } from "@/lib/student-app";

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getOptionalString(formData: FormData, key: string) {
  const value = getString(formData, key);
  return value || null;
}

function getNumber(formData: FormData, key: string) {
  const parsed = Number(getString(formData, key));
  return Number.isFinite(parsed) ? parsed : null;
}

function getSessionType(formData: FormData) {
  const sessionType = getString(formData, "sessionType");
  if (!Object.values(SessionType).includes(sessionType as SessionType)) {
    return null;
  }

  return sessionType as SessionType;
}

async function persistPlanningEntry(formData: FormData, status: SessionStatus) {
  const { user } = await ensureDemoStudent();
  const sessionId = getString(formData, "sessionId");
  const duration = getNumber(formData, "plannedDurationMin");

  if (sessionId) {
    await prisma.studySession.updateMany({
      where: {
        id: sessionId,
        studentId: user.id
      },
      data: {
        status,
        actualDurationMin: status === SessionStatus.COMPLETED ? duration : null
      }
    });

    return;
  }

  const goalText = getString(formData, "goalText");
  const plannedStartAtRaw = getString(formData, "plannedStartAt");
  const sessionType = getSessionType(formData);

  if (!goalText || !plannedStartAtRaw || !sessionType || !duration) {
    return;
  }

  const plannedStartAt = new Date(plannedStartAtRaw);
  if (Number.isNaN(plannedStartAt.getTime())) {
    return;
  }

  const subjectId = getOptionalString(formData, "subjectId");

  const existingSession = await prisma.studySession.findFirst({
    where: {
      studentId: user.id,
      plannedStartAt,
      goalText,
      sessionType
    },
    select: {
      id: true
    }
  });

  if (existingSession) {
    await prisma.studySession.update({
      where: { id: existingSession.id },
      data: {
        status,
        actualDurationMin: status === SessionStatus.COMPLETED ? duration : null
      }
    });

    return;
  }

  await prisma.studySession.create({
    data: {
      studentId: user.id,
      subjectId,
      plannedStartAt,
      plannedDurationMin: duration,
      actualDurationMin: status === SessionStatus.COMPLETED ? duration : null,
      sessionType,
      goalText,
      status,
      createdByType: "planning"
    }
  });
}

export async function markPlanningSessionDone(formData: FormData) {
  await persistPlanningEntry(formData, SessionStatus.COMPLETED);

  revalidatePath("/planning");
  revalidatePath("/dashboard");
  revalidatePath("/assistant");
}

export async function markPlanningSessionPlanned(formData: FormData) {
  await persistPlanningEntry(formData, SessionStatus.PLANNED);

  revalidatePath("/planning");
  revalidatePath("/dashboard");
  revalidatePath("/assistant");
}
