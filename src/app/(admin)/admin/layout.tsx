import type { ReactNode } from "react";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { getCurrentUser, getUserLandingPath, requireRole } from "@/lib/auth";
import { adminNavigation } from "@/lib/navigation";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const existingUser = await getCurrentUser();
  if (!existingUser) redirect("/login");
  if (existingUser.role !== UserRole.ADMIN) redirect(await getUserLandingPath(existingUser));

  const admin = await requireRole([UserRole.ADMIN]);
  return (
    <AppShell
      audience="admin"
      navigation={adminNavigation}
      title="Pilotage"
      userLabel={`${admin.firstName} ${admin.lastName}`}
    >
      {children}
    </AppShell>
  );
}
