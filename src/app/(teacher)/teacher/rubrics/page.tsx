export const dynamic = "force-dynamic";

import { createTeacherRubricAction } from "@/app/actions/essays";
import { PendingSubmitButton } from "@/components/forms/pending-submit-button";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { getTeacherRubricsData } from "@/lib/essays";

function getMessage(status: string | null) {
  if (status === "created") return "La grille a ete creee.";
  if (status === "already_exists") return "Cette grille existe deja.";
  if (status === "invalid") return "Complete le titre, la matiere et au moins un critere.";
  return null;
}

export default async function TeacherRubricsPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const data = await getTeacherRubricsData();
  const params = searchParams ? await searchParams : {};
  const status = typeof params.status === "string" ? params.status : null;
  const message = getMessage(status);

  return (
    <div>
      <PageHeader title="Grilles de correction" />
      <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <SectionCard eyebrow="Nouvelle grille" title="Definir les attentes">
          {message ? <p className="mb-4 rounded-2xl bg-sand p-4 text-sm text-pine">{message}</p> : null}
          <form action={createTeacherRubricAction} className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-pine">Matiere</span>
              <select name="subjectId" required className="w-full rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm">
                {data.subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-pine">Nom de la grille</span>
              <input name="title" required placeholder="Ex. Dissertation ESH - BCE" className="w-full rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-pine">Criteres, un par ligne</span>
              <textarea name="criteria" required rows={6} placeholder={"Problematique\nStructure\nPrecision des connaissances"} className="w-full rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm" />
            </label>
            <PendingSubmitButton label="Creer la grille" pendingLabel="Creation..." className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-sand disabled:opacity-60" />
          </form>
        </SectionCard>

        <SectionCard eyebrow="Base pedagogique" title="Grilles existantes">
          {data.rubrics.length === 0 ? (
            <p className="rounded-2xl bg-sand p-5 text-sm text-pine">Aucune grille creee pour le moment.</p>
          ) : (
            <div className="space-y-4">
              {data.rubrics.map((rubric) => (
                <div key={rubric.id} className="rounded-[24px] border border-ink/8 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{rubric.title}</p>
                      <p className="mt-1 text-sm text-pine/70">{rubric.subject}</p>
                    </div>
                    <span className="rounded-full bg-mist px-3 py-1 text-xs text-pine">{rubric.usageCount} utilisation(s)</span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {rubric.criteria.map((criterion) => <span key={criterion} className="rounded-full bg-sand px-3 py-1 text-xs text-pine">{criterion}</span>)}
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
