export const dynamic = "force-dynamic";

import { ListChecks } from "lucide-react";

import { createTeacherRubricAction } from "@/app/actions/essays";
import { PendingSubmitButton } from "@/components/forms/pending-submit-button";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { getTeacherRubricsData } from "@/lib/essays";

const fieldClass = "mt-2 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-pine";

function getMessage(status: string | null) {
  if (status === "created") return { tone: "success" as const, text: "Grille créée. Elle est proposée lors de la correction des copies de cette matière." };
  if (status === "already_exists") return { tone: "warning" as const, text: "Une grille portant ce nom existe déjà pour cette matière." };
  if (status === "invalid") return { tone: "error" as const, text: "Indique la matière, le nom de la grille et au moins un critère." };
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
      <PageHeader title="Grilles de correction" description="Des critères réutilisables, proposés au moment de corriger une copie." />
      {message ? <Notice tone={message.tone} className="mb-5">{message.text}</Notice> : null}

      <div className="grid items-start gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <SectionCard eyebrow="Nouvelle grille" title="Définir les attentes">
          <form action={createTeacherRubricAction} className="space-y-4">
            <label className="block text-sm font-semibold text-ink">
              Matière
              <select name="subjectId" required className={fieldClass}>
                {data.subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
              </select>
            </label>
            <label className="block text-sm font-semibold text-ink">
              Nom de la grille
              <input name="title" required placeholder="Ex. Dissertation ESH - BCE" className={fieldClass} />
            </label>
            <label className="block text-sm font-semibold text-ink">
              Critères
              <textarea name="criteria" required rows={6} placeholder={"Problématique\nStructure\nPrécision des connaissances"} className={fieldClass} />
              <span className="mt-1.5 block text-xs font-normal text-pine/80">Un critère par ligne.</span>
            </label>
            <PendingSubmitButton label="Créer la grille" pendingLabel="Création..." className="btn-primary rounded-full px-6 py-3 text-sm font-semibold text-white disabled:opacity-60" />
          </form>
        </SectionCard>

        <SectionCard eyebrow={`${data.rubrics.length} grille${data.rubrics.length > 1 ? "s" : ""}`} title="Grilles existantes">
          {data.rubrics.length === 0 ? (
            <EmptyState icon={ListChecks} title="Aucune grille pour le moment" text="Crée une première grille : elle sera proposée lors de la correction des copies de la matière." />
          ) : (
            <div className="space-y-3">
              {data.rubrics.map((rubric) => (
                <div key={rubric.id} className="rounded-[22px] border border-ink/8 bg-white p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-lg font-semibold text-ink">{rubric.title}</p>
                      <p className="mt-0.5 text-sm text-pine/85">{rubric.subject} · {rubric.criteria.length} critère{rubric.criteria.length > 1 ? "s" : ""}</p>
                    </div>
                    <span className="rounded-full bg-sand px-3 py-1 text-xs font-semibold text-pine">
                      Utilisée {rubric.usageCount} fois
                    </span>
                  </div>
                  <ol className="mt-4 flex flex-wrap gap-2">
                    {rubric.criteria.map((criterion, index) => (
                      <li key={criterion} className="inline-flex items-center gap-1.5 rounded-full bg-sand px-3 py-1 text-xs text-ink">
                        <span className="font-semibold text-clay">{index + 1}</span>
                        {criterion}
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
