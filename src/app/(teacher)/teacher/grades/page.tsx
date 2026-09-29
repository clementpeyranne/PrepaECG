export const dynamic = "force-dynamic";

import { createTeacherGradeAction } from "@/app/actions/progress";
import { PendingSubmitButton } from "@/components/forms/pending-submit-button";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { getTeacherGradeEntryData } from "@/lib/student-app";

function getMessage(status: string | null) {
  if (status === "created") return "La note a ete ajoutee a la progression de l'eleve.";
  if (status === "already_exists") return "Cette note etait deja enregistree. Aucun doublon n'a ete cree.";
  if (status === "invalid") return "La note n'a pas pu etre enregistree. Verifie les informations.";
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

  return (
    <div>
      <PageHeader title="Notes" />
      <SectionCard eyebrow="Progression" title="Ajouter une note">
        {message ? <p className="mb-5 rounded-2xl bg-sand p-4 text-sm text-pine">{message}</p> : null}
        {data.students.length === 0 ? (
          <p className="rounded-2xl bg-sand p-5 text-sm text-pine">Aucun eleve n'est encore rattache a cet etablissement.</p>
        ) : (
          <form action={createTeacherGradeAction} className="grid gap-4 md:grid-cols-2">
            <label>
              <span className="mb-2 block text-sm font-medium text-pine">Eleve</span>
              <select name="studentId" required className="w-full rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm">
                {data.students.map((student) => <option key={student.id} value={student.id}>{student.label}</option>)}
              </select>
            </label>
            <label>
              <span className="mb-2 block text-sm font-medium text-pine">Matiere</span>
              <select name="subjectId" required className="w-full rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm">
                {data.subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
              </select>
            </label>
            <label>
              <span className="mb-2 block text-sm font-medium text-pine">Evaluation</span>
              <input name="title" required placeholder="Ex. DS de probabilites" className="w-full rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm" />
            </label>
            <label>
              <span className="mb-2 block text-sm font-medium text-pine">Note sur 20</span>
              <input name="score" type="number" min="0" max="20" step="0.25" required className="w-full rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm" />
            </label>
            <label>
              <span className="mb-2 block text-sm font-medium text-pine">Date</span>
              <input name="capturedAt" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required className="w-full rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm" />
            </label>
            <label>
              <span className="mb-2 block text-sm font-medium text-pine">Categorie</span>
              <select name="sourceType" className="w-full rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm">
                <option value="teacher_entry">Controle / devoir</option>
                <option value="mock_exam">Concours blanc</option>
              </select>
            </label>
            <div className="md:col-span-2">
              <PendingSubmitButton label="Enregistrer la note" pendingLabel="Enregistrement..." className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-sand disabled:opacity-60" />
            </div>
          </form>
        )}
      </SectionCard>
    </div>
  );
}
