import type { Class } from "@prisma/client";

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

export async function ensureReferenceData() {
  let prepClass: Class | null = null;

  if (isDemoModeEnabled()) {
    prepClass = await prisma.class.upsert({
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
  }

  await Promise.all(
    SUBJECT_REFERENCES.map((subject) =>
      prisma.subject.upsert({
        where: { code: subject.code },
        update: { name: subject.name },
        create: subject
      })
    )
  );

  const subjects = await prisma.subject.findMany({
    orderBy: { name: "asc" }
  });

  return { prepClass, subjects };
}
