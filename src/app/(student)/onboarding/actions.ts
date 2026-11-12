"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { saveStudentOnboarding } from "@/lib/student-app";

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getNumber(formData: FormData, key: string, fallback: number) {
  const raw = Number(formData.get(key));
  return Number.isFinite(raw) && raw > 0 ? raw : fallback;
}

function getOptionalNumber(formData: FormData, key: string) {
  const raw = String(formData.get(key) ?? "").trim();
  if (!raw) {
    return null;
  }

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function submitOnboarding(formData: FormData) {
  const bceSchools = formData.getAll("bceSchools").map(String).filter(Boolean);
  const ecricomeSchools = formData.getAll("ecricomeSchools").map(String).filter(Boolean);

  await saveStudentOnboarding({
    firstName: getString(formData, "firstName"),
    lastName: getString(formData, "lastName"),
    humanities: getString(formData, "humanities") === "HGG" ? "HGG" : "ESH",
    mathsOption: getString(formData, "mathsOption") === "APPROFONDIES" ? "APPROFONDIES" : "APPLIQUEES",
    prepYear: getNumber(formData, "prepYear", 2),
    classId: getString(formData, "classId"),
    lv2Language:
      getString(formData, "lv2Language") === "ALLEMAND"
        ? "ALLEMAND"
        : getString(formData, "lv2Language") === "ITALIEN"
          ? "ITALIEN"
          : "ESPAGNOL",
    weekdayDailyHours: getNumber(formData, "weekdayDailyHours", 3),
    weekendDailyHours: getNumber(formData, "weekendDailyHours", 5),
    weekdayStart: getString(formData, "weekdayStart") || "18:00",
    weekdayEnd: getString(formData, "weekdayEnd") || "21:30",
    weekendStart: getString(formData, "weekendStart") || "09:30",
    weekendEnd: getString(formData, "weekendEnd") || "14:30",
    sessionBlockMinutes: getNumber(formData, "sessionBlockMinutes", 50),
    shortBreakMinutes: getNumber(formData, "shortBreakMinutes", 10),
    longBreakMinutes: getNumber(formData, "longBreakMinutes", 25),
    breakEveryBlocks: getNumber(formData, "breakEveryBlocks", 2),
    energyLevel: getString(formData, "energyLevel") || "modere",
    bacAverage: getOptionalNumber(formData, "bacAverage"),
    bacMention: getString(formData, "bacMention"),
    subjectAssessments: readAssessments(formData, "assessment"),
    bacSubjectAssessments: readAssessments(formData, "bac"),
    bceSchools,
    ecricomeSchools
  });

  for (const path of ["/dashboard", "/onboarding", "/planning", "/progress", "/assistant", "/actualites"]) {
    revalidatePath(path);
  }
  redirect("/dashboard");
}

function readAssessments(formData: FormData, prefix: string) {
  const fields = { MATHS: "Maths", ESH: "Esh", HGG: "Hgg", CG: "Cg", ANG: "Ang", ESP: "Esp", ALL: "All", ITA: "Ita" };
  return Object.fromEntries(Object.entries(fields).filter(([, suffix]) => formData.has(prefix + suffix)).map(([code, suffix]) => [code, getOptionalNumber(formData, prefix + suffix)]));
}
