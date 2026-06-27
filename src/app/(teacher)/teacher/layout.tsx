import type { ReactNode } from "react";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { teacherNavigation } from "@/lib/mock-data";
import { getCurrentUser, getUserLandingPath, requireRole } from "@/lib/auth";

export default async function TeacherLayout({ children }: { children: ReactNode }) {
  const allowedRoles: UserRole[] = [UserRole.TEACHER, UserRole.ADMIN];
  const existingUser = await getCurrentUser();
  if (!existingUser) {
    redirect("/login");
  }

  if (!allowedRoles.includes(existingUser.role)) {
    redirect(await getUserLandingPath(existingUser));
  }

  const teacher = await requireRole(allowedRoles);

  return (
    <AppShell
      audience="teacher"
      navigation={teacherNavigation}
      title={`${teacher.firstName} ${teacher.lastName}`}
      subtitle="Un espace volontairement sobre pour deposer des ressources, des grilles et des retours utiles."
      userLabel={`${teacher.email}`}
    >
      {children}
    </AppShell>
  );
}
