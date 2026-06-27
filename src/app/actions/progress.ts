"use server";

import { revalidatePath } from "next/cache";

import { createStudentGrade } from "@/lib/student-app";

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getNumber(formData: FormData, key: string) {
  return Number(getString(formData, key));
}

export async function createGradeAction(formData: FormData) {
  await createStudentGrade({
    subjectCode: getString(formData, "subjectCode"),
    title: getString(formData, "title"),
    score: getNumber(formData, "score"),
    capturedAt: getString(formData, "capturedAt"),
    sourceType: getString(formData, "sourceType"),
    teacherName: getString(formData, "teacherName")
  });

  revalidatePath("/progress");
}
