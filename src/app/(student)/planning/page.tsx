export const dynamic = "force-dynamic";

import { TodayPlanChecklist } from "@/components/planning/today-plan-checklist";
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

      <SectionCard
        eyebrow="Vue semaine"
        title="Semaine proposee"
      >
        <div className="scrollbar-none flex gap-3 overflow-x-auto pb-2 md:grid md:overflow-visible md:pb-0 md:[grid-template-columns:repeat(7,minmax(0,1fr))]">
          {data.week.map((day) => (
            <div
              key={`${day.dayLabel}-${day.dateLabel}`}
              className={`min-w-[268px] rounded-[22px] p-4 md:min-w-0 ${day.isToday ? "bg-ink text-sand" : "bg-sand text-ink"}`}
            >
              <p className="text-sm font-semibold">{day.dayLabel}</p>
              <p className={`mt-1 text-xs ${day.isToday ? "text-sand/60" : "text-pine/60"}`}>
                {day.dateLabel} - {day.availableHours}h ciblees
              </p>
              <div className="mt-4 space-y-2 text-xs">
                {day.entries.map((entry) => (
                  <div
                    key={entry.id}
                    className={`rounded-2xl px-3 py-2 ${day.isToday ? "bg-white/10" : "bg-white/70"}`}
                  >
                    <p className="font-semibold">
                      {entry.time} - {entry.subject}
                    </p>
                    <p className={day.isToday ? "text-sand/80" : "text-pine/75"}>{entry.title}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <SectionCard
          eyebrow="Aujourd'hui"
          title="Blocs de la journee"
        >
          <TodayPlanChecklist entries={data.todayPlan.entries} />
        </SectionCard>

        <div className="space-y-5">
          <SectionCard
            eyebrow="Ajustements"
            title="Curseurs du planning"
          >
            <div className="space-y-4">
              {data.adjustments.map((adjustment) => (
                <div key={adjustment.label} className="rounded-2xl bg-sand p-4">
                  <p className="text-sm font-semibold">{adjustment.label}</p>
                  <p className="mt-2 text-sm text-pine/75">{adjustment.value}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="Echeances"
            title="A garder en vue"
          >
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
    </div>
  );
}
