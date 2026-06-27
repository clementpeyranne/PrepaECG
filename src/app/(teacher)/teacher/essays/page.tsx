export const dynamic = "force-dynamic";

import { randomUUID } from "node:crypto";

import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { addTeacherEssayFeedbackAction } from "@/app/actions/essays";
import { PendingSubmitButton } from "@/components/forms/pending-submit-button";
import { getTeacherEssaysQueueData } from "@/lib/essays";

function getTeacherFeedbackMessage(status: string | null) {
  if (status === "feedback_saved") {
    return {
      text: "Retour professeur enregistre. Il a ete envoye une seule fois.",
      tone: "success" as const
    };
  }

  if (status === "feedback_exists") {
    return {
      text: "Ce retour professeur etait deja enregistre. Aucun doublon n'a ete ajoute.",
      tone: "warning" as const
    };
  }

  if (status === "feedback_invalid") {
    return {
      text: "Le retour n'a pas pu etre enregistre. Verifie les champs obligatoires puis recommence.",
      tone: "error" as const
    };
  }

  return null;
}

export default async function TeacherEssaysPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const data = await getTeacherEssaysQueueData();
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const status = typeof resolvedSearchParams.status === "string" ? resolvedSearchParams.status : null;
  const message = getTeacherFeedbackMessage(status);

  return (
    <div>
      <PageHeader
        title="Copies"
        description="Suivi des copies et retours enseignant."
      />

      <SectionCard
        eyebrow="A relire"
        title="Copies recentes"
        description="Copies en attente ou deja corrigees."
      >
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

        <div className="space-y-4">
          {data.essays.map((essay) => (
            <div key={essay.id} className="rounded-[24px] border border-ink/8 p-5">
              <p className="font-semibold">{essay.title}</p>
              <p className="mt-1 text-sm text-pine/75">
                {essay.student} - {essay.subject} - {essay.examType} - {essay.targetExam}
              </p>
              <p className="mt-3 text-sm text-pine/80">Statut : {essay.status}</p>
              <p className="mt-2 text-sm text-pine/70">{essay.latestAiSummary}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.18em] text-pine/55">{essay.createdAtLabel}</p>

              {essay.fileUrl ? (
                <div className="mt-4 rounded-[20px] border border-ink/8 bg-sand/55 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-pine/80">
                      Copie jointe : {essay.mimeType.startsWith("image/") ? "photo" : "PDF"}
                    </p>
                    <a
                      href={essay.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:bg-mist"
                    >
                      Ouvrir la copie
                    </a>
                  </div>

                  <p className="mt-3 text-xs uppercase tracking-[0.16em] text-pine/55">
                    Defilement dans ce bloc
                  </p>

                  {essay.mimeType === "application/pdf" ? (
                    <div className="mt-4 overflow-hidden rounded-[18px] border border-ink/10 bg-white">
                      <div className="flex items-center justify-between border-b border-ink/8 bg-mist/45 px-4 py-2 text-xs uppercase tracking-[0.14em] text-pine/65">
                        <span>Lecteur PDF</span>
                        <span>Fais defiler la copie ici</span>
                      </div>
                      <iframe
                        src={essay.fileUrl}
                        title={`Copie ${essay.title}`}
                        className="h-[560px] w-full bg-white"
                      />
                    </div>
                  ) : essay.mimeType.startsWith("image/") ? (
                    <div className="mt-4 overflow-hidden rounded-[18px] border border-ink/10 bg-white">
                      <div className="flex items-center justify-between border-b border-ink/8 bg-mist/45 px-4 py-2 text-xs uppercase tracking-[0.14em] text-pine/65">
                        <span>Lecteur photo</span>
                        <span>Fais defiler la copie ici</span>
                      </div>
                      <div className="h-[560px] overflow-y-auto overscroll-contain p-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={essay.fileUrl}
                          alt={`Copie ${essay.title}`}
                          className="w-full rounded-[14px] bg-white object-contain"
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {essay.hasTeacherFeedback ? (
                <div className="mt-4 rounded-[20px] border border-pine/15 bg-pine/10 px-4 py-3 text-sm text-pine">
                  Retour professeur deja envoye pour cette copie.
                </div>
              ) : (
                <form action={addTeacherEssayFeedbackAction} className="mt-4 space-y-3">
                  <input type="hidden" name="essayId" value={essay.id} />
                  <input type="hidden" name="submissionKey" value={randomUUID()} />
                  <div className="grid gap-3 md:grid-cols-2">
                    <input
                      name="scoreMin"
                      placeholder="Note min"
                      className="rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-pine"
                    />
                    <input
                      name="scoreMax"
                      placeholder="Note max"
                      className="rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-pine"
                    />
                  </div>
                  <textarea
                    name="overview"
                    rows={3}
                    placeholder="Vue d'ensemble du retour professeur"
                    className="w-full rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-pine"
                  />
                  <textarea
                    name="strengths"
                    rows={3}
                    placeholder="Points forts, une ligne par idee"
                    className="w-full rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-pine"
                  />
                  <textarea
                    name="mistakes"
                    rows={3}
                    placeholder="Erreurs majeures, une ligne par idee"
                    className="w-full rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-pine"
                  />
                  <textarea
                    name="nextSteps"
                    rows={3}
                    placeholder="Prochaines etapes, une ligne par idee"
                    className="w-full rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-pine"
                  />
                  <textarea
                    name="planningSignals"
                    rows={3}
                    placeholder="Conseils de planning, une ligne par idee"
                    className="w-full rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-pine"
                  />
                  <PendingSubmitButton
                    label="Ajouter le retour professeur"
                    pendingLabel="Envoi du retour..."
                    className="rounded-full bg-ink px-4 py-3 text-sm font-semibold text-sand transition hover:bg-pine disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </form>
              )}
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
