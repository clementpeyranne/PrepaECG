export const dynamic = "force-dynamic";

import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { generateResourceOutputAction } from "@/app/actions/resources";
import { getResourceActionLabels, getResourceDetailData } from "@/lib/resources";

export default async function ResourceDetailPage({
  params
}: {
  params: Promise<{ resourceId: string }>;
}) {
  const { resourceId } = await params;
  const resource = await getResourceDetailData(resourceId);

  if (!resource) {
    notFound();
  }

  const actions = getResourceActionLabels(resource.aiEnabled);

  return (
    <div>
      <PageHeader
        title={resource.title}
        description={`${resource.type} - ${resource.subject}`}
      />

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <SectionCard
          eyebrow="Document"
          title={resource.chapter}
          description={`${resource.chapter} - Depose par ${resource.teacher}`}
        >
          <div className="rounded-[26px] bg-sand p-6">
            <p className="text-sm leading-8 text-pine/80">{resource.summary}</p>
          </div>

          {resource.content ? (
            <div className="mt-5 rounded-[26px] border border-ink/8 bg-white p-6">
              <p className="text-xs uppercase tracking-[0.22em] text-pine/55">Contenu</p>
              <div className="mt-4 space-y-3 text-sm leading-8 text-pine/82">
                {resource.content.split("\n").filter(Boolean).map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            </div>
          ) : resource.fileUrl ? (
            <div className="mt-5 rounded-[26px] border border-ink/8 bg-white p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.22em] text-pine/55">Document joint</p>
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
                <div className="mt-4 rounded-[20px] bg-sand p-5 text-sm text-pine/78">
                  {resource.fileName ?? "Document depose"} est disponible au telechargement.
                </div>
              )}
            </div>
          ) : null}
        </SectionCard>

        <SectionCard
          eyebrow="Actions IA"
          title="Transformer le document"
          description={resource.aiEnabled ? "Resume, fiche ou flashcards." : "Actions IA indisponibles pour ce format."}
          accent="dark"
        >
          {resource.aiEnabled ? (
            <>
              <div className="space-y-3">
                {actions.map((action) => (
                  <form key={action.value} action={generateResourceOutputAction}>
                    <input type="hidden" name="resourceId" value={resource.id} />
                    <input type="hidden" name="outputType" value={action.value} />
                    <button className="flex w-full items-center justify-between rounded-2xl bg-white/10 px-4 py-3 text-left text-sm transition hover:bg-white/15">
                      <span>{action.label}</span>
                      <span className="text-sand/45">IA</span>
                    </button>
                  </form>
                ))}
              </div>
              <div className="mt-4 rounded-[24px] bg-white/10 p-4 text-sm leading-7 text-sand/84">
                Resume, fiche ou creation de flashcards a partir du contenu lisible.
              </div>
            </>
          ) : (
            <div className="rounded-[24px] bg-white/10 p-4 text-sm leading-7 text-sand/84">
              Les actions IA restent disponibles sur les ressources textuelles lisibles directement
              par l'application.
            </div>
          )}
        </SectionCard>
      </div>

      <div className="mt-5">
        <SectionCard
          eyebrow="Sorties"
          title="Ce que l'IA a deja produit"
          description="Les sorties restent accessibles ici pour etre relues, reutilisees ou transformer le cours en revision active."
        >
          {resource.outputs.length === 0 ? (
            <div className="rounded-[24px] bg-sand p-6 text-sm leading-7 text-pine/75">
              Aucune sortie n'a encore ete generee pour cette ressource. Tu peux lancer un resume,
              une fiche ou un deck de flashcards.
            </div>
          ) : (
            <div className="space-y-4">
              {resource.outputs.map((output) => (
                <div key={output.id} className="rounded-[24px] border border-ink/8 bg-sand/45 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink">{output.title}</p>
                      <p className="mt-1 text-sm text-pine/75">Genere le {output.createdAtLabel}</p>
                    </div>
                    {output.deckId && output.deckTitle ? (
                      <Link
                        href={`/flashcards/${output.deckId}` as Route}
                        className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-sand transition hover:bg-pine"
                      >
                        Ouvrir le deck
                      </Link>
                    ) : null}
                  </div>

                  <div className="mt-4 space-y-3 text-sm leading-7 text-pine/82">
                    {output.content.map((item) => (
                      <p key={item}>{item}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
