export const dynamic = "force-dynamic";

import Link from "next/link";
import type { Route } from "next";

import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { getTeacherResourcesData } from "@/lib/resources";

export default async function TeacherResourcesPage() {
  const data = await getTeacherResourcesData();

  return (
    <div>
      <PageHeader
        title="Ressources professeur"
        actionLabel="Deposer un cours"
        actionHref={"/teacher/resources/new" as Route}
      />

      <SectionCard
        eyebrow="Depots recents"
        title="Bibliotheque publiee"
      >
        <div className="space-y-4">
          {data.resources.map((resource) => (
            <Link
              key={resource.id}
              href={`/teacher/resources/${resource.id}` as Route}
              className="block rounded-[24px] border border-ink/8 p-5 transition hover:border-pine/20 hover:bg-sand"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{resource.title}</p>
                  <p className="mt-1 text-sm text-pine/75">
                    {resource.audience} - {resource.chapter}
                  </p>
                </div>
                <div className="text-right">
                  <p className="rounded-full bg-mist px-3 py-1 text-xs text-pine">{resource.type}</p>
                  <p className="mt-2 text-xs text-pine/60">{resource.uploadedAt}</p>
                  <p className="mt-2 text-xs text-pine/60">
                    {resource.sourceKind === "FILE_UPLOAD" ? "Fichier" : "Texte"}
                  </p>
                  <p className="mt-2 text-xs text-pine/60">
                    IA {resource.aiEnabled ? "activee" : "desactivee"}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
