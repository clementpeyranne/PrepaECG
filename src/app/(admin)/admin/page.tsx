import Link from "next/link";

import { AdminStatGrid } from "@/components/admin/admin-stat-grid";
import { AuthEventTable } from "@/components/admin/auth-event-table";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { getAdminOverviewData } from "@/lib/admin";

export default async function AdminDashboardPage() {
  const data = await getAdminOverviewData();
  return (
    <div>
      <PageHeader eyebrow="Administration" title="Vue d'ensemble" />
      <AdminStatGrid stats={data.stats} />

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_0.55fr]">
        <SectionCard title="Activite recente">
          <AuthEventTable events={data.recentEvents} />
          <Link href="/admin/activity" className="mt-5 inline-flex text-sm font-semibold text-pine underline decoration-pine/30 underline-offset-4">
            Ouvrir tout le journal
          </Link>
        </SectionCard>

        <SectionCard title="Utilisation" accent="dark">
          <div className="space-y-3">
            {[
              ["Ressources", data.content.resources],
              ["Copies", data.content.essays],
              ["Flashcards", data.content.cards],
              ["Blocs valides", data.content.completedSessions]
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
                <span className="text-sm text-sand/80">{label}</span>
                <span className="font-display text-2xl text-white">{value}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
