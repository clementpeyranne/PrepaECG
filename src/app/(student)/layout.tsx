import type { ReactNode } from "react";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { studentNavigation } from "@/lib/mock-data";
import { getCurrentUser, getUserLandingPath, requireRole } from "@/lib/auth";
import { getStudentShellData } from "@/lib/student-app";

export const dynamic = "force-dynamic";

export default async function StudentLayout({ children }: { children: ReactNode }) {
  const allowedRoles: UserRole[] = [UserRole.STUDENT, UserRole.ADMIN];
  const existingUser = await getCurrentUser();
  if (!existingUser) {
    redirect("/login");
  }

  if (!allowedRoles.includes(existingUser.role)) {
    redirect(await getUserLandingPath(existingUser));
  }

  const user = await requireRole(allowedRoles);
  const shell = await getStudentShellData();

  return (
    <AppShell
      audience="student"
      navigation={studentNavigation}
      title={shell.title}
      subtitle={shell.subtitle}
      userLabel={`${user.firstName} ${user.lastName}`}
    >
      {children}
    </AppShell>
  );
}
