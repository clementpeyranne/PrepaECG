export const dynamic = "force-dynamic";

import Link from "next/link";
import type { Route } from "next";
import { ArrowUpRight, FileText, FolderOpen, Sparkles, Type } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { getTeacherResourcesData } from "@/lib/resources";

export default async function TeacherResourcesPage() {
  const data = await getTeacherResourcesData();

  return (
    <div>
      <PageHeader
        title="Ressources"
        description="Les cours, fiches et corrections publiés pour les élèves de la prépa."
        actionLabel="Déposer une ressource"
        actionHref={"/teacher/resources/new" as Route}
      />

      <SectionCard
        eyebrow={`${data.resources.length} ressource${data.resources.length > 1 ? "s" : ""}`}
        title="Ressources publiées"
      >
        {data.resources.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="Aucune ressource publiée"
            text="Les ressources déposées ici sont visibles par les élèves de la prépa, classées par matière et par chapitre."
            actionLabel="Déposer une ressource"
            actionHref={"/teacher/resources/new" as Route}
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {data.resources.map((resource) => (
              <Link
                key={resource.id}
                href={`/teacher/resources/${resource.id}` as Route}
                className="group flex h-full flex-col rounded-[22px] border border-ink/8 bg-white p-5 transition hover:-translate-y-0.5 hover:border-clay/30 hover:shadow-[0_14px_30px_rgba(20,34,29,0.08)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="rounded-full bg-ink px-3 py-1 text-xs font-semibold text-sand">{resource.type}</span>
                  <ArrowUpRight size={18} className="text-pine/75 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-clay" aria-hidden="true" />
                </div>
                <p className="mt-3 font-display text-xl font-semibold leading-snug text-ink">{resource.title}</p>
                <p className="mt-1 text-sm text-pine/85">{resource.audience}</p>
                <div className="mt-auto flex flex-wrap items-center gap-2 pt-4 text-xs font-medium text-pine/85">
                  <span className="rounded-full bg-sand px-2.5 py-1">Publiée le {resource.uploadedAt}</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-1">
                    {resource.sourceKind === "FILE_UPLOAD" ? <FileText size={12} aria-hidden="true" /> : <Type size={12} aria-hidden="true" />}
                    {resource.sourceKind === "FILE_UPLOAD" ? "Fichier" : "Texte"}
                  </span>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 ${resource.aiEnabled ? "bg-clay/12 text-clay" : "bg-sand"}`}>
                    <Sparkles size={12} aria-hidden="true" />
                    {resource.aiEnabled ? "Actions IA autorisées" : "Actions IA désactivées"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
