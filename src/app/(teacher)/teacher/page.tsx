export const dynamic = "force-dynamic";

import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, ClipboardList, FolderOpen, ListChecks, PenLine, Upload } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { StatTile } from "@/components/ui/stat-tile";
import { getTeacherHomeData } from "@/lib/essays";

const actions: Array<{ href: Route; icon: typeof PenLine; title: string; text: string }> = [
  { href: "/teacher/essays", icon: PenLine, title: "Corriger les copies", text: "Lire les copies reçues et envoyer un retour." },
  { href: "/teacher/resources/new" as Route, icon: Upload, title: "Déposer une ressource", text: "Cours, fiche, exercice ou correction pour la prépa." },
  { href: "/teacher/grades", icon: ClipboardList, title: "Saisir une note", text: "Contrôle, devoir ou concours blanc." },
  { href: "/teacher/rubrics", icon: ListChecks, title: "Préparer une grille", text: "Critères de correction réutilisables." }
];

export default async function TeacherHomePage() {
  const data = await getTeacherHomeData();

  return (
    <div>
      <PageHeader
        eyebrow="Espace professeur"
        title={`Bonjour ${data.firstName}`}
        description="Les copies reçues, les ressources publiées et les outils de correction, au même endroit."
        actionLabel="Corriger les copies"
        actionHref="/teacher/essays"
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatTile size="lg" label="Copies à corriger" value={data.stats.toReview} />
        <StatTile size="lg" label="Copies corrigées" value={data.stats.reviewed} />
        <StatTile size="lg" label="Ressources publiées" value={data.stats.resources} />
        <StatTile size="lg" label="Grilles de correction" value={data.stats.rubrics} />
      </div>

      <div className="mt-5 grid items-start gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard eyebrow="À corriger" title="Copies en attente" description="Les plus anciennes en premier.">
          {data.pending.length === 0 ? (
            <EmptyState icon={PenLine} title="Aucune copie en attente" text="Les copies que les élèves t’envoient apparaîtront ici." />
          ) : (
            <ul className="space-y-3">
              {data.pending.map((essay) => (
                <li key={essay.id}>
                  <Link
                    href={`/teacher/essays#copie-${essay.id}` as Route}
                    className="group flex items-center justify-between gap-4 rounded-[20px] border border-ink/8 bg-white px-4 py-3.5 transition hover:-translate-y-0.5 hover:border-clay/30 hover:shadow-[0_14px_30px_rgba(20,34,29,0.08)]"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-ink">{essay.title}</span>
                      <span className="mt-0.5 block text-sm text-pine/80">
                        {essay.student} · {essay.subject} · {essay.examType} · {essay.targetExam}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-3 text-sm text-pine/75">
                      {essay.createdAtLabel}
                      <ArrowRight size={16} className="text-clay transition group-hover:translate-x-1" aria-hidden="true" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard eyebrow="Raccourcis" title="Actions rapides" accent="soft">
          <div className="grid gap-3 sm:grid-cols-2">
            {actions.map(({ href, icon: Icon, title, text }) => (
              <Link
                key={href}
                href={href}
                className="group flex h-full flex-col rounded-[20px] border border-white/80 bg-white/85 p-4 transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(20,34,29,0.08)]"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-ink text-sand transition group-hover:bg-clay">
                  <Icon size={18} aria-hidden="true" />
                </span>
                <span className="mt-3 font-semibold text-ink">{title}</span>
                <span className="mt-1 text-sm leading-6 text-pine/80">{text}</span>
              </Link>
            ))}
          </div>
          <p className="mt-4 flex items-start gap-2 rounded-2xl bg-white/70 px-4 py-3 text-sm leading-6 text-pine/85">
            <FolderOpen size={16} className="mt-1 shrink-0 text-clay" aria-hidden="true" />
            Seules les copies qui te sont envoyées apparaissent ici. L’organisation personnelle des élèves reste privée.
          </p>
        </SectionCard>
      </div>
    </div>
  );
}
