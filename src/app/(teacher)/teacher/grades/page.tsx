export const dynamic = "force-dynamic";

import { ClipboardList, Users } from "lucide-react";

import { createTeacherGradeAction } from "@/app/actions/progress";
import { PendingSubmitButton } from "@/components/forms/pending-submit-button";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { getTeacherGradeEntryData } from "@/lib/student-app";

const fieldClass = "mt-2 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-pine";

function getMessage(status: string | null) {
  if (status === "created") return { tone: "success" as const, text: "Note enregistrée. Elle apparaît dans la progression de l’élève." };
  if (status === "already_exists") return { tone: "warning" as const, text: "Cette note était déjà enregistrée. Aucun doublon n’a été créé." };
  if (status === "invalid") return { tone: "error" as const, text: "La note n’a pas pu être enregistrée. Vérifie l’élève, l’intitulé, la date et la note (entre 0 et 20)." };
  return null;
}

export default async function TeacherGradesPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const data = await getTeacherGradeEntryData();
  const params = searchParams ? await searchParams : {};
  const status = typeof params.status === "string" ? params.status : null;
  const message = getMessage(status);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date());

  return (
    <div>
      <PageHeader title="Notes" description="Saisir les notes de contrôles, devoirs et concours blancs. Elles s’ajoutent à la progression de chaque élève." />
      {message ? <Notice tone={message.tone} className="mb-5">{message.text}</Notice> : null}

      <div className="grid items-start gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard eyebrow="Saisie" title="Ajouter une note">
          {data.students.length === 0 ? (
            <EmptyState icon={Users} title="Aucun élève rattaché" text="Les élèves apparaissent ici après leur inscription avec le code de la prépa." />
          ) : (
            <form action={createTeacherGradeAction} className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-semibold text-ink">
                Élève
                <select name="studentId" required className={fieldClass}>
                  {data.students.map((student) => <option key={student.id} value={student.id}>{student.label}</option>)}
                </select>
              </label>
              <label className="block text-sm font-semibold text-ink">
                Matière
                <select name="subjectId" required className={fieldClass}>
                  {data.subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
                </select>
              </label>
              <label className="block text-sm font-semibold text-ink md:col-span-2">
                Intitulé de l’évaluation
                <input name="title" required placeholder="Ex. DS de probabilités" className={fieldClass} />
              </label>
              <label className="block text-sm font-semibold text-ink">
                Note sur 20
                <input name="score" type="number" min="0" max="20" step="0.25" inputMode="decimal" required className={fieldClass} />
              </label>
              <label className="block text-sm font-semibold text-ink">
                Date
                <input name="capturedAt" type="date" defaultValue={today} required className={fieldClass} />
              </label>
              <label className="block text-sm font-semibold text-ink md:col-span-2">
                Type d’évaluation
                <select name="sourceType" className={fieldClass}>
                  <option value="teacher_entry">Contrôle / devoir</option>
                  <option value="mock_exam">Concours blanc</option>
                </select>
              </label>
              <div className="md:col-span-2">
                <PendingSubmitButton
                  label="Enregistrer la note"
                  pendingLabel="Enregistrement..."
                  className="btn-primary rounded-full px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
                />
              </div>
            </form>
          )}
        </SectionCard>

        <SectionCard eyebrow="Historique" title="Notes saisies récemment" accent="soft">
          {data.recentGrades.length === 0 ? (
            <EmptyState icon={ClipboardList} title="Aucune note saisie" text="Les dernières notes que tu enregistres apparaîtront ici." />
          ) : (
            <ul className="space-y-2.5">
              {data.recentGrades.map((grade) => (
                <li key={grade.id} className="flex items-center justify-between gap-4 rounded-2xl bg-white/85 px-4 py-3">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-ink">{grade.title}</span>
                    <span className="block text-xs text-pine/85">{grade.student} · {grade.subject} · {grade.kind} · {grade.dateLabel}</span>
                  </span>
                  <span className="shrink-0 font-display text-lg font-semibold tabular-nums text-ink">
                    {grade.score.toLocaleString("fr-FR")}/{grade.maxScore}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
