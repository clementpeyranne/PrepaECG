"use server";

import { revalidatePath } from "next/cache";

import { createTeacherResource, generateResourceOutput } from "@/lib/resources";

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getBoolean(formData: FormData, key: string) {
  return String(formData.get(key) ?? "") === "on";
}

export async function createTeacherResourceAction(formData: FormData) {
  const maybeFile = formData.get("file");

  await createTeacherResource({
    title: getString(formData, "title"),
    subjectCode: getString(formData, "subjectCode"),
    chapterId: getString(formData, "chapterId"),
    resourceType: getString(formData, "resourceType"),
    description: getString(formData, "description"),
    content: getString(formData, "content"),
    file: maybeFile instanceof File ? maybeFile : null,
    aiEnabled: getBoolean(formData, "aiEnabled")
  });

  revalidatePath("/teacher/resources");
  revalidatePath("/teacher/resources/new");
  revalidatePath("/resources");
}

export async function generateResourceOutputAction(formData: FormData) {
  const resourceId = getString(formData, "resourceId");
  const outputType = getString(formData, "outputType") as "SUMMARY" | "SHEET" | "FLASHCARDS";

  if (!resourceId || !outputType) {
    return;
  }

  await generateResourceOutput(resourceId, outputType);

  revalidatePath("/resources");
  revalidatePath(`/resources/${resourceId}`);
  revalidatePath("/flashcards");
  revalidatePath("/planning");
}
