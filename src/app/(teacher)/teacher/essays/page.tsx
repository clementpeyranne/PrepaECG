export const dynamic = "force-dynamic";

import { randomUUID } from "node:crypto";
import Link from "next/link";
import type { Route } from "next";
import { CheckCircle2, ExternalLink, FileText, PenLine, Sparkles } from "lucide-react";

import { addTeacherEssayFeedbackAction } from "@/app/actions/essays";
import { PendingSubmitButton } from "@/components/forms/pending-submit-button";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page-header";
import { getTeacherEssaysQueueData, getTeacherRubricsData } from "@/lib/essays";

const fieldClass =
  "mt-2 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm leading-6 text-ink outline-none transition focus:border-pine";

function getTeacherFeedbackMessage(status: string | null) {
  if (status === "feedback_saved") {
    return { text: "Retour enregistré et envoyé à l’élève.", tone: "success" as const };
  }
  if (status === "feedback_exists") {
    return { text: "Un retour existait déjà pour cette copie. Aucun doublon n’a été ajouté.", tone: "warning" as const };
  }
  if (status === "feedback_invalid") {
    return { text: "Le retour n’a pas pu être enregistré. Vérifie l’appréciation générale et la note (entre 0 et 20), puis recommence.", tone: "error" as const };
  }
  return null;
}

export default async function TeacherEssaysPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [data, rubricsData] = await Promise.all([getTeacherEssaysQueueData(), getTeacherRubricsData()]);
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const status = typeof resolvedSearchParams.status === "string" ? resolvedSearchParams.status : null;
  const view = resolvedSearchParams.vue === "corrigees" ? "corrigees" : "a-corriger";
  const message = getTeacherFeedbackMessage(status);
  const toReview = data.essays.filter((essay) => !essay.hasTeacherFeedback && essay.status !== "Corrigée");
  const reviewed = data.essays.filter((essay) => essay.hasTeacherFeedback || essay.status === "Corrigée");
  const essays = view === "corrigees" ? reviewed : toReview;

  return (
    <div>
      <PageHeader title="Copies" description="Les copies que les élèves de la prépa t’ont envoyées, avec leurs consignes." />

      {message ? <Notice tone={message.tone} className="mb-5">{message.text}</Notice> : null}

      <nav className="mb-5 inline-flex rounded-full border border-white/80 bg-white/80 p-1 shadow-[0_10px_24px_rgba(20,34,29,0.06)]" aria-label="Filtrer les copies">
        {[
          { id: "a-corriger", label: "À corriger", count: toReview.length },
          { id: "corrigees", label: "Corrigées", count: reviewed.length }
        ].map((tab) => (
          <Link
            key={tab.id}
            href={`/teacher/essays?vue=${tab.id}` as Route}
            aria-current={view === tab.id ? "page" : undefined}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
              view === tab.id ? "bg-ink text-sand shadow-[0_8px_20px_rgba(20,34,29,0.18)]" : "text-pine hover:bg-sand"
            }`}
          >
            {tab.label}
            <span className={`rounded-full px-2 text-xs tabular-nums ${view === tab.id ? "bg-white/15" : "bg-sand"}`}>{tab.count}</span>
          </Link>
        ))}
      </nav>

      {essays.length === 0 ? (
        <div className="panel-surface-strong rounded-[28px] p-5">
          <EmptyState
            icon={view === "corrigees" ? CheckCircle2 : PenLine}
            title={view === "corrigees" ? "Aucune copie corrigée pour l’instant" : "Aucune copie à corriger"}
            text={view === "corrigees" ? "Les copies apparaîtront ici dès l’envoi d’un retour." : "Les nouvelles copies envoyées par les élèves apparaîtront ici."}
          />
        </div>
      ) : (
        <div className="space-y-5">
          {essays.map((essay) => {
            const rubrics = rubricsData.rubrics.filter((rubric) => rubric.subjectId === essay.subjectId);
            const isReviewed = essay.hasTeacherFeedback || essay.status === "Corrigée";
            return (
              <article key={essay.id} id={`copie-${essay.id}`} className="panel-surface-strong reveal scroll-mt-6 rounded-[28px] p-5 lg:p-6">
                <header className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-display text-2xl font-semibold text-ink">{essay.title}</h2>
                    <p className="mt-1 text-sm text-pine/85">
                      <span className="font-semibold text-ink">{essay.student}</span> · {essay.subject} · {essay.examType} · {essay.targetExam}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                    <span className="rounded-full bg-sand px-3 py-1 text-pine">Reçue le {essay.createdAtLabel}</span>
                    <span className={`rounded-full px-3 py-1 ${isReviewed ? "bg-moss/15 text-pine" : "bg-clay/12 text-clay"}`}>{essay.status}</span>
                    {essay.fileUrl ? (
                      <a href={essay.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1 text-sand transition hover:bg-pine">
                        Ouvrir la copie <ExternalLink size={13} aria-hidden="true" />
                      </a>
                    ) : null}
                  </div>
                </header>

                {essay.instructions || essay.latestAiSummary ? (
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {essay.instructions ? (
                      <div className="rounded-2xl bg-sand p-4 text-sm leading-6 text-ink">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-pine/75">Consignes de l’élève</p>
                        <p className="mt-1.5 whitespace-pre-wrap">{essay.instructions}</p>
                      </div>
                    ) : null}
                    {essay.latestAiSummary ? (
                      <div className="rounded-2xl border border-clay/20 bg-clay/[0.06] p-4 text-sm leading-6 text-ink">
                        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-clay">
                          <Sparkles size={13} aria-hidden="true" /> Pré-correction IA, indicative
                        </p>
                        <p className="mt-1.5">{essay.latestAiSummary}</p>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div className={`mt-5 grid gap-5 ${isReviewed ? "" : "xl:grid-cols-[1.05fr_0.95fr]"}`}>
                  <details open={!isReviewed} className="group rounded-[22px] border border-ink/10 bg-white">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-ink">
                      <span className="flex items-center gap-2">
                        <FileText size={16} className="text-clay" aria-hidden="true" />
                        Copie ({essay.mimeType.startsWith("image/") ? "photo" : "PDF"})
                      </span>
                      <span className="text-xs font-medium text-pine/75 group-open:hidden">Afficher</span>
                      <span className="hidden text-xs font-medium text-pine/75 group-open:inline">Masquer</span>
                    </summary>
                    {essay.fileUrl ? (
                      essay.mimeType === "application/pdf" ? (
                        <iframe src={essay.fileUrl} title={`Copie ${essay.title}`} className="h-[620px] w-full rounded-b-[22px] border-t border-ink/8 bg-white" />
                      ) : essay.mimeType.startsWith("image/") ? (
                        <div className="h-[620px] overflow-y-auto overscroll-contain border-t border-ink/8 p-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={essay.fileUrl} alt={`Copie ${essay.title}`} className="w-full rounded-[14px] bg-white object-contain" />
                        </div>
                      ) : null
                    ) : (
                      <p className="border-t border-ink/8 px-4 py-6 text-sm text-pine/80">Le fichier de la copie n’est pas disponible.</p>
                    )}
                  </details>

                  {isReviewed ? (
                    <Notice tone="success">Retour envoyé à l’élève pour cette copie.</Notice>
                  ) : (
                    <form action={addTeacherEssayFeedbackAction} className="space-y-4 rounded-[22px] bg-sand/70 p-4 lg:p-5">
                      <input type="hidden" name="essayId" value={essay.id} />
                      <input type="hidden" name="submissionKey" value={randomUUID()} />
                      <p className="font-display text-xl font-semibold text-ink">Retour de correction</p>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block text-sm font-semibold text-ink">
                          Note sur 20 <span className="font-normal text-pine/75">(facultatif)</span>
                          <input name="score" type="number" min="0" max="20" step="0.25" inputMode="decimal" placeholder="Ex. 12,5" className={fieldClass} />
                        </label>
                        <label className="block text-sm font-semibold text-ink">
                          Grille de correction
                          <select name="rubricId" defaultValue="" className={fieldClass}>
                            <option value="">Grille par défaut</option>
                            {rubrics.map((rubric) => (
                              <option key={rubric.id} value={rubric.id}>{rubric.title}</option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <label className="block text-sm font-semibold text-ink">
                        Appréciation générale <span className="text-clay">*</span>
                        <textarea name="overview" required rows={3} placeholder="Ce qui ressort de la copie en quelques phrases." className={fieldClass} />
                      </label>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block text-sm font-semibold text-ink">
                          Points forts
                          <textarea name="strengths" rows={3} placeholder="Une idée par ligne" className={fieldClass} />
                        </label>
                        <label className="block text-sm font-semibold text-ink">
                          Erreurs principales
                          <textarea name="mistakes" rows={3} placeholder="Une idée par ligne" className={fieldClass} />
                        </label>
                      </div>
                      <label className="block text-sm font-semibold text-ink">
                        Conseils pour la suite
                        <textarea name="nextSteps" rows={3} placeholder="Une idée par ligne" className={fieldClass} />
                        <span className="mt-1.5 block text-xs font-normal leading-5 text-pine/80">
                          Le premier conseil devient une tâche dans le planning de l’élève, à faire sous 3 jours.
                        </span>
                      </label>
                      <label className="block text-sm font-semibold text-ink">
                        Points à retravailler en priorité
                        <textarea name="planningSignals" rows={2} placeholder="Une idée par ligne" className={fieldClass} />
                        <span className="mt-1.5 block text-xs font-normal leading-5 text-pine/80">
                          Le premier point apparaît dans les points à renforcer de l’élève (à défaut, la première erreur).
                        </span>
                      </label>
                      <PendingSubmitButton
                        label="Envoyer le retour"
                        pendingLabel="Envoi du retour..."
                        className="btn-primary w-full rounded-full px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                      />
                    </form>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
