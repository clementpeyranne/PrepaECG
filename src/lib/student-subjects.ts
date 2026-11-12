import { cache } from "react";
import { prisma } from "./db";
import { getActiveSubjectCodes, getAcademicSubjectLabel } from "./academic-path";

// Preferences filter suggestions and lists, never ownership or access to saved documents.
export const getStudentSubjects = cache(async (userId: string) => {
  const profile = await prisma.studentProfile.findUnique({ where: { userId }, select: { energyProfile: true } });
  const energy = profile?.energyProfile ?? null;
  return {
    codes: getActiveSubjectCodes(energy),
    label: (code: string) => getAcademicSubjectLabel(code, energy)
  };
});
