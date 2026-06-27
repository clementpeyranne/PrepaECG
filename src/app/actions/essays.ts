"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { addTeacherEssayFeedback, createEssaySubmission, generateEssayAiFeedback } from "@/lib/essays";

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getNumberOrNull(formData: FormData, key: string) {
  const value = getString(formData, key);
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function createEssaySubmissionAction(formData: FormData) {
  const maybeFile = formData.get("file");
  const result = await createEssaySubmission({
    subjectCode: getString(formData, "subjectCode"),
    chapterId: getString(formData, "chapterId"),
    teacherId: getString(formData, "teacherId"),
    submissionKey: getString(formData, "submissionKey"),
    title: getString(formData, "title"),
    examType: getString(formData, "examType"),
    targetExam: getString(formData, "targetExam"),
    correctionMode: getString(formData, "correctionMode"),
    instructions: getString(formData, "instructions"),
    file: maybeFile instanceof File ? maybeFile : null
  });

  revalidatePath("/essays");
  revalidatePath("/essays/new");
  revalidatePath("/teacher/essays");
  revalidatePath("/planning");
  revalidatePath("/assistant");

  if (result.status === "created") {
    redirect("/essays/new?status=submitted");
  }

  if (result.status === "already_exists") {
    redirect("/essays/new?status=already_submitted");
  }

  redirect("/essays/new?status=invalid");
}

export async function regenerateEssayAIFeedbackAction(formData: FormData) {
  const essayId = getString(formData, "essayId");
  if (!essayId) {
    return;
  }

  await generateEssayAiFeedback(essayId);

  revalidatePath("/essays");
  revalidatePath(`/essays/${essayId}`);
  revalidatePath("/teacher/essays");
  revalidatePath("/planning");
  revalidatePath("/assistant");
}

export async function addTeacherEssayFeedbackAction(formData: FormData) {
  const essayId = getString(formData, "essayId");
  if (!essayId) {
    redirect("/teacher/essays?status=feedback_invalid");
  }

  const result = await addTeacherEssayFeedback({
    essayId,
    submissionKey: getString(formData, "submissionKey"),
    scoreMin: getNumberOrNull(formData, "scoreMin"),
    scoreMax: getNumberOrNull(formData, "scoreMax"),
    overview: getString(formData, "overview"),
    strengths: getString(formData, "strengths"),
    mistakes: getString(formData, "mistakes"),
    nextSteps: getString(formData, "nextSteps"),
    planningSignals: getString(formData, "planningSignals")
  });

  revalidatePath("/teacher/essays");
  revalidatePath("/essays");
  revalidatePath(`/essays/${essayId}`);
  revalidatePath("/planning");
  revalidatePath("/assistant");

  if (result.status === "saved") {
    redirect("/teacher/essays?status=feedback_saved");
  }

  if (result.status === "already_exists") {
    redirect("/teacher/essays?status=feedback_exists");
  }

  redirect("/teacher/essays?status=feedback_invalid");
}
