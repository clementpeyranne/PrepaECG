import type { Class } from "@prisma/client";
import { cache } from "react";

import { prisma } from "./db";
import { isDemoModeEnabled } from "./app-config";

export const DEFAULT_CLASS_ID = "class-demo-ecg2";
export const DEFAULT_CLASS_NAME = "ECG 2 - Demo";
export const DEFAULT_CLASS_ACCESS_CODE = "DEMO-ECG";

export const SUBJECT_REFERENCES = [
  { code: "MATHS", name: "Maths" },
  { code: "ESH", name: "ESH" },
  { code: "HGG", name: "HGG" },
  { code: "CG", name: "Culture generale" },
  { code: "ANG", name: "Anglais" }
] as const;

const ensureDemoClass = cache(async (): Promise<Class | null> => {
  if (!isDemoModeEnabled()) {
    return null;
  }

  return prisma.class.upsert({
    where: { id: DEFAULT_CLASS_ID },
    update: {
      name: DEFAULT_CLASS_NAME,
      yearLabel: "2026",
      track: "ECG",
      accessCode: DEFAULT_CLASS_ACCESS_CODE
    },
    create: {
      id: DEFAULT_CLASS_ID,
      name: DEFAULT_CLASS_NAME,
      yearLabel: "2026",
      track: "ECG",
      accessCode: DEFAULT_CLASS_ACCESS_CODE
    }
  });
});

const ensureSubjects = cache(async () => {
  const existingSubjects = await prisma.subject.findMany({
    orderBy: { name: "asc" }
  });

  const existingByCode = new Map(
    existingSubjects.map((subject) => [subject.code, subject.name] as const)
  );

  const missingOrOutdated = SUBJECT_REFERENCES.filter(
    (subject) => existingByCode.get(subject.code) !== subject.name
  );

  if (missingOrOutdated.length === 0 && existingSubjects.length >= SUBJECT_REFERENCES.length) {
    return existingSubjects;
  }

  await Promise.all(
    missingOrOutdated.map((subject) =>
      prisma.subject.upsert({
        where: { code: subject.code },
        update: { name: subject.name },
        create: subject
      })
    )
  );

  return prisma.subject.findMany({
    orderBy: { name: "asc" }
  });
});

export async function ensureReferenceData() {
  const [prepClass, subjects] = await Promise.all([ensureDemoClass(), ensureSubjects()]);

  return { prepClass, subjects };
}
