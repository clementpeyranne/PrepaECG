export const dynamic = "force-dynamic";

import { randomUUID } from "node:crypto";

import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { createEssaySubmissionAction } from "@/app/actions/essays";
import { PendingSubmitButton } from "@/components/forms/pending-submit-button";
import { getEssaySubmissionFormData } from "@/lib/essays";
import { DocumentUploadForm } from "@/components/forms/document-upload-form";
import { SubjectChapterFields } from "@/components/forms/subject-chapter-fields";
import { getFileStorageDriver, isDemoModeEnabled } from "@/lib/app-config";

function getSubmissionMessage(status: string | null) {
  if (status === "submitted") {
    return {
      text: "Copie bien deposee. Elle a ete enregistree une seule fois.",
      tone: "success" as const
    };
  }

  if (status === "already_submitted") {
    return {
      text: "Cette copie etait deja enregistree. Aucun doublon n'a ete ajoute.",
      tone: "warning" as const
    };
  }

  if (status === "invalid") {
    return {
      text: "Le depot n'a pas pu etre finalise. Verifie le titre et le fichier, puis recommence.",
      tone: "error" as const
    };
  }

  return null;
}

export default async function NewEssayPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const data = await getEssaySubmissionFormData();
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const status = typeof resolvedSearchParams.status === "string" ? resolvedSearchParams.status : null;
  const message = getSubmissionMessage(status);
  const submissionKey = randomUUID();
  const aiEnabled = isDemoModeEnabled() || Boolean(process.env.OPENAI_API_KEY?.trim());
  const isSubmitDisabled = data.teachers.length === 0 && !aiEnabled;

  return (
    <div>
      <PageHeader title="Nouvelle copie" />

      <SectionCard eyebrow="Soumission" title="Deposer un document">
        {message ? (
          <div
            className={`mb-5 rounded-[20px] px-4 py-3 text-sm ${
              message.tone === "success"
                ? "border border-pine/15 bg-pine/10 text-pine"
                : message.tone === "warning"
                  ? "border border-clay/15 bg-clay/10 text-clay"
                  : "border border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {message.text}
          </div>
        ) : null}

        <DocumentUploadForm action={createEssaySubmissionAction} folder="essays" cloud={getFileStorageDriver() === "supabase"}>
          <input type="hidden" name="submissionKey" value={submissionKey} />
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="rounded-[22px] bg-sand p-4">
              <span className="text-sm font-semibold">Titre</span>
              <input
                name="title"
                placeholder="Ex. Dissertation ESH - Croissance et innovation"
                className="mt-3 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-pine"
              />
            </label>

            <SubjectChapterFields subjects={data.subjects} chapters={data.chapters} />

            <label className="rounded-[22px] bg-sand p-4">
              <span className="text-sm font-semibold">Type d'epreuve</span>
              <input
                name="examType"
                defaultValue="Dissertation"
                className="mt-3 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-pine"
              />
            </label>

            <label className="rounded-[22px] bg-sand p-4">
              <span className="text-sm font-semibold">Concours cible</span>
              <input
                name="targetExam"
                defaultValue="BCE"
                className="mt-3 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-pine"
              />
            </label>

            <label className="rounded-[22px] bg-sand p-4">
              <span className="text-sm font-semibold">Correction souhaitee</span>
              <select
                name="correctionMode"
                defaultValue={!data.teachers.length && aiEnabled ? "ai_only" : aiEnabled ? "ai_then_teacher" : "teacher_only"}
                className="mt-3 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-pine"
              >
                {aiEnabled ? <option value="ai_then_teacher">IA puis professeur si besoin</option> : null}
                {aiEnabled ? <option value="ai_only">IA seulement</option> : null}
                <option value="teacher_only">Professeur seulement</option>
              </select>
            </label>

            <label className="rounded-[22px] bg-sand p-4">
              <span className="text-sm font-semibold">Professeur destinataire</span>
              <select
                name="teacherId"
                className="mt-3 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-pine"
              >
                {data.teachers.length > 0 ? (
                  data.teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.label}
                    </option>
                  ))
                ) : (
                  <option value="">Aucun professeur disponible dans cette prepa</option>
                )}
              </select>
              <p className="mt-3 text-sm leading-7 text-pine/75">
                Seuls les professeurs de ton etablissement apparaissent ici.
              </p>
            </label>
          </div>

          <label className="block rounded-[22px] bg-sand p-4">
            <span className="text-sm font-semibold">Consignes eventuelles</span>
            <textarea
              name="instructions"
              rows={3}
              placeholder="Ex. Corrige surtout la methode, la problematique et l'usage des exemples."
              className="mt-3 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm leading-7 outline-none transition focus:border-pine"
            />
          </label>

          <label className="block rounded-[22px] bg-sand p-4">
            <span className="text-sm font-semibold">PDF ou photo de la copie</span>
            <input
              type="file"
              name="file"
              accept="application/pdf,image/jpeg,image/png,image/webp"
              className="mt-3 block w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-2 file:text-sm file:font-semibold file:text-sand focus:border-pine"
            />
          </label>

          <PendingSubmitButton
            label="Envoyer la copie"
            pendingLabel="Depot en cours..."
            disabled={isSubmitDisabled}
            className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-sand transition hover:bg-pine disabled:cursor-not-allowed disabled:opacity-60"
          />

          {isSubmitDisabled ? (
            <p className="text-sm text-clay">
              Aucun professeur n'est encore disponible dans cette prepa pour recevoir la copie.
            </p>
          ) : null}
        </DocumentUploadForm>
      </SectionCard>
    </div>
  );
}
