export const dynamic = "force-dynamic";

import type { Route } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { getTeacherResourceDetailData } from "@/lib/resources";

export default async function TeacherResourceDetailPage({
  params
}: {
  params: Promise<{ resourceId: string }>;
}) {
  const { resourceId } = await params;
  const resource = await getTeacherResourceDetailData(resourceId);

  if (!resource) {
    notFound();
  }

  return (
    <div>
      <PageHeader
        eyebrow={resource.type}
        title={resource.title}
        description={`${resource.subject} · ${resource.chapter}`}
        actionLabel="Retour aux ressources"
        actionHref={"/teacher/resources" as Route}
      />

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <SectionCard eyebrow="Contenu" title="Aperçu de la ressource">
          {resource.summary ? (
            <div className="rounded-[22px] bg-sand p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-pine/75">Description</p>
              <p className="mt-2 text-sm leading-7 text-ink">{resource.summary}</p>
            </div>
          ) : null}

          {resource.content ? (
            <div className="mt-5 rounded-[26px] border border-ink/8 bg-white p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-pine/75">Texte du cours</p>
              <div className="mt-4 space-y-3 text-sm leading-8 text-ink">
                {resource.content.split("\n").filter(Boolean).map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            </div>
          ) : resource.fileUrl ? (
            <div className="mt-5 rounded-[26px] border border-ink/8 bg-white p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-pine/75">Document joint</p>
                <a
                  href={resource.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-sand transition hover:bg-pine"
                >
                  Ouvrir le document
                </a>
              </div>

              {resource.mimeType === "application/pdf" ? (
                <div className="mt-4 overflow-hidden rounded-[20px] border border-ink/8 bg-white">
                  <iframe
                    src={resource.fileUrl}
                    title={resource.fileName ?? resource.title}
                    className="h-[640px] w-full bg-white"
                  />
                </div>
              ) : resource.mimeType.startsWith("image/") ? (
                <div className="mt-4 overflow-hidden rounded-[20px] border border-ink/8 bg-white">
                  <img
                    src={resource.fileUrl}
                    alt={resource.fileName ?? resource.title}
                    className="max-h-[720px] w-full object-contain"
                  />
                </div>
              ) : (
                <div className="mt-4 rounded-[20px] bg-sand p-5 text-sm text-pine/85">
                  {resource.fileName ?? "Document déposé"} est disponible au téléchargement.
                </div>
              )}
            </div>
          ) : null}
        </SectionCard>

        <SectionCard eyebrow="Informations" title="Publication" accent="soft">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-2xl bg-white/75 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-pine/75">Type</p>
              <p className="mt-2 text-sm font-semibold text-ink">{resource.type}</p>
            </div>
            <div className="rounded-2xl bg-white/75 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-pine/75">Format</p>
              <p className="mt-2 text-sm font-semibold text-ink">
                {resource.sourceKind === "FILE_UPLOAD" ? "Fichier" : "Texte"}
              </p>
            </div>
            <div className="rounded-2xl bg-white/75 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-pine/75">Publiée le</p>
              <p className="mt-2 text-sm font-semibold text-ink">{resource.uploadedAt}</p>
            </div>
            <div className="rounded-2xl bg-white/75 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-pine/75">Actions IA</p>
              <p className="mt-2 text-sm font-semibold text-ink">
                {resource.aiEnabled ? "Autorisées pour les élèves" : "Désactivées"}
              </p>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
