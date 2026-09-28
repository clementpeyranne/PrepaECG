"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Check, FileUp, Layers3, Undo2 } from "lucide-react";

import { markPlanningSessionDone, markPlanningSessionPlanned } from "@/app/(student)/planning/actions";
import type { PlanningActionResult } from "@/app/(student)/planning/actions";

export type TodayPlanEntry = {
  id: string;
  time: string;
  plannedStartAt: string | null;
  subjectId: string | null;
  subject: string;
  title: string;
  duration: number;
  status: string;
  persisted: boolean;
  sessionType: string;
  requiresSubmission: boolean;
  hasSubmission: boolean;
  requiresFlashcards: boolean;
  hasFlashcardReview: boolean;
};

type TodayPlanChecklistProps = {
  entries: TodayPlanEntry[];
};

export function TodayPlanChecklist({ entries }: TodayPlanChecklistProps) {
  if (!entries.length) return <p className="rounded-2xl bg-sand p-5 text-sm text-pine">Aucun bloc prevu pour cette journee.</p>;
  return (
    <div className="space-y-3">
      {entries.map((entry) => {
        const isDone = entry.status === "COMPLETED";
        return (
          <div key={entry.id} className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border p-3 sm:gap-5 sm:p-5 ${isDone ? "border-moss/30 bg-moss/10" : "border-ink/10 bg-sand/50"}`}>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-pine">{entry.time} · {entry.duration} min</p>
                <p className="mt-2 break-words font-semibold">{entry.title}</p>
                <p className="mt-1 text-sm text-pine/75">{entry.subject}{isDone ? " · Fait" : ""}</p>
                {entry.requiresSubmission && isDone && !entry.hasSubmission ? (
                  <p className="mt-2 text-xs font-semibold text-clay">Attention : copie non deposee.</p>
                ) : null}
                {entry.requiresFlashcards ? (
                  <p className={`mt-2 text-xs font-semibold ${entry.hasFlashcardReview ? "text-pine" : "text-clay"}`}>
                    {entry.hasFlashcardReview ? "Revision de flashcards detectee." : "Revise au moins une carte pour valider ce bloc."}
                  </p>
                ) : null}
              </div>
              <ValidationControls entry={entry} />
          </div>
        );
      })}
    </div>
  );
}

type StatusFormProps = {
  action: (formData: FormData) => Promise<PlanningActionResult>;
  entry: TodayPlanEntry;
  label: string;
  forceMissingSubmission?: boolean;
  disabled?: boolean;
  onResult?: (result: PlanningActionResult) => void;
};

function ValidationControls({ entry }: { entry: TodayPlanEntry }) {
  const [showMissingCopyWarning, setShowMissingCopyWarning] = useState(false);
  const [error, setError] = useState("");
  const isDone = entry.status === "COMPLETED";
  const planningQuery = new URLSearchParams({ planningEntryId: entry.id }).toString();

  function handleValidation() {
    setError("");
    if (entry.requiresSubmission && !entry.hasSubmission) {
      setShowMissingCopyWarning(true);
    }
  }

  function handleResult(result: PlanningActionResult) {
    if (result.ok) return;
    if (result.reason === "missing_copy") setShowMissingCopyWarning(true);
    else if (result.reason === "flashcards_required") setError("Termine d'abord une revision de flashcards.");
    else setError("Ce bloc n'est plus disponible. Recharge la page.");
  }

  return (
    <div className="w-[132px] space-y-2 sm:w-[170px]">
      {isDone ? (
        <StatusForm action={markPlanningSessionPlanned} entry={entry} label="Annuler" onResult={handleResult} />
      ) : entry.requiresSubmission && !entry.hasSubmission ? (
        <button type="button" onClick={handleValidation} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-ink px-3 py-2 text-xs font-semibold text-sand transition hover:bg-pine focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay sm:text-sm">
          <Check size={16} aria-hidden="true" /> Valider
        </button>
      ) : (
        <StatusForm
          action={markPlanningSessionDone}
          entry={entry}
          label="Valider"
          disabled={entry.requiresFlashcards && !entry.hasFlashcardReview}
          onResult={handleResult}
        />
      )}

      {entry.requiresSubmission ? (
        <Link href={`/essays/new?${planningQuery}`} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-3 py-2 text-center text-xs font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 sm:text-sm">
          <FileUp size={16} aria-hidden="true" /> Deposer une copie
        </Link>
      ) : null}
      {entry.requiresFlashcards ? (
        <Link href={`/flashcards?${planningQuery}`} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-3 py-2 text-center text-xs font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 sm:text-sm">
          <Layers3 size={16} aria-hidden="true" /> Faire les cartes
        </Link>
      ) : null}

      {showMissingCopyWarning && !isDone ? (
        <div className="rounded-2xl border border-clay/20 bg-clay/10 p-3 text-xs text-clay" role="alert">
          <p className="font-semibold">Attention : copie non deposee.</p>
          <StatusForm action={markPlanningSessionDone} entry={entry} label="Valider quand meme" forceMissingSubmission onResult={handleResult} />
        </div>
      ) : null}
      {error ? <p role="alert" className="text-xs text-clay">{error}</p> : null}
    </div>
  );
}

function StatusForm({ action, entry, label, forceMissingSubmission = false, disabled = false, onResult }: StatusFormProps) {
  const [error, setError] = useState(false);
  return (
    <form className="max-w-[110px] sm:max-w-[160px]" action={async (formData) => {
      setError(false);
      try {
        const result = await action(formData);
        onResult?.(result);
      }
      catch (cause) {
        if (cause && typeof cause === "object" && "digest" in cause && String(cause.digest).startsWith("NEXT_REDIRECT")) throw cause;
        setError(true);
      }
    }}>
      <input type="hidden" name="entryId" value={entry.id} />
      {forceMissingSubmission ? <input type="hidden" name="confirmMissingSubmission" value="yes" /> : null}
      <SubmitButton label={label} title={entry.title} isDone={entry.status === "COMPLETED"} disabled={disabled} />
      {error ? <p role="alert" className="mt-2 text-xs text-clay">Non enregistre. Reessaie ou recharge la page.</p> : null}
    </form>
  );
}

function SubmitButton({ label, title, isDone, disabled }: { label: string; title: string; isDone: boolean; disabled: boolean }) {
  const { pending } = useFormStatus();
  const accessibleLabel = isDone ? `Annuler la validation de ${title}` : `${label} ${title}`;

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      aria-label={accessibleLabel}
      className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay disabled:cursor-not-allowed disabled:opacity-45 sm:text-sm ${isDone ? "border border-ink/15 text-pine hover:bg-mist" : "bg-ink text-sand hover:bg-pine"}`}
    >
      {isDone ? <Undo2 size={16} aria-hidden="true" /> : <Check size={16} aria-hidden="true" />}
      {pending ? "En cours..." : label}
    </button>
  );
}
