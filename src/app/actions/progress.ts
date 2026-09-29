"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createTeacherStudentGrade } from "@/lib/student-app";

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getNumber(formData: FormData, key: string) {
  return Number(getString(formData, key));
}

export async function createTeacherGradeAction(formData: FormData) {
  const result = await createTeacherStudentGrade({
    studentId: getString(formData, "studentId"),
    subjectId: getString(formData, "subjectId"),
    title: getString(formData, "title"),
    score: getNumber(formData, "score"),
    capturedAt: getString(formData, "capturedAt"),
    sourceType: getString(formData, "sourceType")
  });

  revalidatePath("/teacher/grades");
  revalidatePath("/progress");
  revalidatePath("/dashboard");
  revalidatePath("/planning");
  redirect(`/teacher/grades?status=${result.status}`);
}
