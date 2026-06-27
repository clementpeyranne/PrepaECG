export const dynamic = "force-dynamic";

import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { getStudentDashboardData } from "@/lib/student-app";

export default async function DashboardPage() {
  const data = await getStudentDashboardData();

  if (!data.hasProfile) {
    return (
      <div>
        <PageHeader
          title="Tableau de bord"
          description="Configure ton profil pour activer ton espace de travail."
          actionLabel="Configurer mon profil"
          actionHref="/onboarding"
        />

        <SectionCard
          eyebrow="Configuration"
          title="Activer le profil"
          description="Renseigne ta configuration pour faire apparaitre ton tableau de bord."
          accent="soft"
        >
          <div className="rounded-[24px] bg-white/75 p-6">
            <p className="text-sm leading-7 text-pine/80">
              Une fois le profil rempli, tu retrouveras ici ton rythme de travail, tes priorites et
              tes points de vigilance.
            </p>
          </div>
        </SectionCard>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Tableau de bord"
        actionLabel="Modifier mon profil"
        actionHref="/onboarding"
      />

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <SectionCard
          eyebrow="Classement anonyme"
          title={data.anonymousRanking.title}
          description={data.anonymousRanking.subtitle}
          accent="dark"
        >
          <div className="grid gap-3">
            {data.anonymousRanking.windows.map((window) => (
              <div key={window.id} className="rounded-2xl bg-white/10 px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-sand">{window.label}</p>
                  <span className="rounded-full border border-white/20 px-3 py-1 text-xs text-sand/85">
                    {Math.round(window.userMinutes / 60)}h travaillees
                  </span>
                </div>
                <p className="mt-3 text-sm leading-7 text-sand/88">
                  {window.cohortSize > 0
                    ? `${window.aheadCount} etudiants ayant des objectifs proches des tiens ont plus travaille que toi sur cette periode.`
                    : "Pas encore assez d'etudiants comparables pour afficher un classement fiable."}
                </p>
                <p className="mt-2 text-xs text-sand/65">{window.helper}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="Metriques utiles"
          title="Progression de la semaine"
          description="Des signaux qui aident a reajuster le travail, pas a culpabiliser."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {data.stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl bg-sand p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-pine/55">{stat.label}</p>
                <p className="mt-3 font-display text-3xl">{stat.value}</p>
                <p className="mt-2 text-sm text-pine/75">{stat.helper}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <SectionCard
          eyebrow="Planning"
          title="Le jour en cours"
        >
          <div className="space-y-3">
            {data.sessions.map((session) => (
              <div key={session.id} className="rounded-2xl border border-ink/8 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{session.time}</p>
                  <span className="rounded-full bg-moss/10 px-3 py-1 text-xs text-pine">
                    {session.duration} min
                  </span>
                </div>
                <p className="mt-2 font-medium text-ink">{session.title}</p>
                <p className="mt-1 text-sm text-pine/75">{session.subject}</p>
                <p className="mt-3 text-sm text-pine/70">{session.reason}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="Lacunes"
          title="Ce qui doit remonter"
          accent="soft"
        >
          <div className="space-y-3">
            {data.weakPoints.map((point) => (
              <div key={point.label} className="rounded-2xl bg-white/70 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{point.label}</p>
                  <span className="rounded-full bg-clay/10 px-3 py-1 text-xs text-clay">
                    {point.severity}
                  </span>
                </div>
                <p className="mt-2 text-sm text-pine/80">{point.reason}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="Echeances"
          title="Ce qui approche"
        >
          <div className="space-y-3">
            {data.deadlines.map((deadline) => (
              <div key={deadline.label} className="rounded-2xl bg-sand p-4">
                <p className="font-semibold">{deadline.label}</p>
                <p className="mt-2 text-sm text-pine/75">{deadline.when}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
