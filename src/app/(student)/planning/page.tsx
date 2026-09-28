export const dynamic = "force-dynamic";

import { PlanningCalendar } from "@/components/planning/planning-calendar";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { getStudentPlanningData } from "@/lib/student-app";

export default async function PlanningPage() {
  const data = await getStudentPlanningData();

  if (!data.hasProfile) {
    return (
      <div>
        <PageHeader
          title="Planning intelligent"
          actionLabel="Configurer mon profil"
          actionHref="/onboarding"
        />

        <SectionCard eyebrow="Configuration" title="Activer le profil" accent="soft">
          <div className="rounded-[24px] bg-white/75 p-6 text-sm leading-7 text-pine/80">Complete ton profil pour activer cette page.</div>
        </SectionCard>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Planning intelligent"
        actionLabel="Modifier ma configuration"
        actionHref="/onboarding"
      />

      <SectionCard title="Mon emploi du temps">
        <PlanningCalendar week={data.week} />
      </SectionCard>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <SectionCard eyebrow="Ajustements" title="Curseurs du planning">
          <div className="space-y-4">
            {data.adjustments.map((adjustment) => (
              <div key={adjustment.label} className="rounded-2xl bg-sand p-4">
                <p className="text-sm font-semibold">{adjustment.label}</p>
                <p className="mt-2 text-sm text-pine/75">{adjustment.value}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard eyebrow="Echeances" title="A garder en vue">
          <div className="space-y-3">
            {data.upcomingTasks.map((task) => (
              <div key={`${task.title}-${task.dueLabel}`} className="rounded-2xl bg-sand p-4">
                <p className="font-semibold">{task.title}</p>
                <p className="mt-1 text-sm text-pine/75">{task.subject}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.22em] text-pine/55">{task.dueLabel}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
