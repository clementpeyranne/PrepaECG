export const dynamic = "force-dynamic";

import { StatTile } from "@/components/ui/stat-tile";
import Link from "next/link";

import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { getStudentDashboardData } from "@/lib/student-app";

export default async function DashboardPage() {
  const data = await getStudentDashboardData();

  if (!data.hasProfile) {
    return (
      <div>
        <PageHeader title="Tableau de bord" actionLabel="Configurer le profil" actionHref="/onboarding" />

        <SectionCard eyebrow="Configuration" title="Activer le profil" accent="soft">
          <div className="rounded-[24px] bg-white/75 p-6">
            <p className="text-sm leading-7 text-pine/80">Complete ton profil pour activer cette page.</p>
          </div>
        </SectionCard>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Tableau de bord"
        actionLabel="Modifier le profil"
        actionHref="/onboarding"
      />

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <SectionCard
          title={data.anonymousRanking.title}
          accent="dark"
        >
          <div className="grid gap-3">
            {data.anonymousRanking.windows.map((window) => (
              <div key={window.id} className="rounded-2xl bg-white/10 px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-sand">{window.label}</p>
                  <span className="rounded-full border border-white/20 px-3 py-1 text-xs text-sand/85">
                    {formatMinutes(window.userMinutes)} de travail validé
                  </span>
                </div>
                <p className="mt-3 text-sm leading-7 text-sand/88">
                  {window.cohortSize > 0
                    ? window.aheadCount === 0 ? "Aucun étudiant comparable n’a validé plus de temps de travail sur cette période."
                      : `${window.aheadCount} étudiant${window.aheadCount > 1 ? "s" : ""} avec des objectifs proches ${window.aheadCount > 1 ? "ont" : "a"} validé plus de temps de travail sur cette période.`
                    : "Pas encore assez d’étudiants comparables pour afficher un classement."}
                </p>
              </div>
            ))}
          </div>
          <Link href="/planning" className="mt-4 inline-flex text-sm font-semibold text-sand underline decoration-sand/35 underline-offset-4">
            Ouvrir le planning
          </Link>
        </SectionCard>

        <SectionCard
          title="Repères"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {data.stats.map((stat) => (
              <StatTile key={stat.label} label={stat.label} value={stat.value} helper={stat.helper} />
            ))}
          </div>
          <Link href="/progress" className="mt-4 inline-flex text-sm font-semibold text-pine underline decoration-pine/30 underline-offset-4">
            Voir la progression
          </Link>
        </SectionCard>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <SectionCard
          eyebrow="Planning"
          title="Programme du jour"
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
                <p className="mt-3 text-sm text-pine/80">{session.reason}</p>
              </div>
            ))}
          </div>
          <Link href="/planning" className="mt-4 inline-flex text-sm font-semibold text-pine underline decoration-pine/30 underline-offset-4">
            Voir et valider les séances
          </Link>
        </SectionCard>

        <SectionCard
          title="Points à renforcer"
          accent="soft"
        >
          <div className="space-y-3">
            {data.weakPoints.length === 0 ? <p className="text-sm text-pine/75">Aucun point à renforcer identifié à partir des résultats disponibles.</p> : null}
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
          <Link href="/progress" className="mt-4 inline-flex text-sm font-semibold text-pine underline decoration-pine/30 underline-offset-4">
            Consulter le bilan
          </Link>
        </SectionCard>

        <SectionCard
          title="Prochaines échéances"
        >
          <div className="space-y-3">
            {data.deadlines.length === 0 ? <p className="text-sm text-pine/75">Aucune échéance renseignée.</p> : null}
            {data.deadlines.map((deadline) => (
              <div key={deadline.label} className="rounded-2xl bg-sand p-4">
                <p className="font-semibold">{deadline.label}</p>
                <p className="mt-2 text-sm text-pine/75">{deadline.when}</p>
              </div>
            ))}
          </div>
          <Link href="/planning" className="mt-4 inline-flex text-sm font-semibold text-pine underline decoration-pine/30 underline-offset-4">
            Organiser les échéances
          </Link>
        </SectionCard>
      </div>
    </div>
  );
}

function formatMinutes(totalMinutes: number) {
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes > 0 ? `${hours}h${String(minutes).padStart(2, "0")}` : `${hours}h`;
}
