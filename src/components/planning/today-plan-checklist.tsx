"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Check, Undo2 } from "lucide-react";

import { markPlanningSessionDone, markPlanningSessionPlanned } from "@/app/(student)/planning/actions";

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
        const needsSubmission =
          entry.sessionType === "ESSAY_PRACTICE" ||
          entry.sessionType === "CHAPTER_REVISION" ||
          entry.sessionType === "EXERCISE_TRAINING";

        return (
          <div key={entry.id} className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border p-3 sm:gap-5 sm:p-5 ${isDone ? "border-moss/30 bg-moss/10" : "border-ink/10 bg-sand/50"}`}>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-pine">{entry.time} · {entry.duration} min</p>
                <p className="mt-2 break-words font-semibold">{entry.title}</p>
                <p className="mt-1 text-sm text-pine/75">{entry.subject}{isDone ? " · Fait" : ""}</p>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-pine sm:text-sm">
                  {needsSubmission ? <Link href="/essays/new" className="underline decoration-clay/50 underline-offset-4 hover:text-clay">Deposer une copie</Link> : null}
                  {entry.sessionType === "FLASHCARDS_REVIEW" ? <Link href="/flashcards" className="underline decoration-clay/50 underline-offset-4 hover:text-clay">Ouvrir les flashcards</Link> : null}
                </div>
              </div>
              {isDone ? (
                <StatusForm action={markPlanningSessionPlanned} entry={entry} label="Annuler" />
              ) : (
                <StatusForm action={markPlanningSessionDone} entry={entry} label="Valider" />
              )}
          </div>
        );
      })}
    </div>
  );
}

type StatusFormProps = {
  action: (formData: FormData) => Promise<void>;
  entry: TodayPlanEntry;
  label: string;
};

function StatusForm({ action, entry, label }: StatusFormProps) {
  const [error, setError] = useState(false);
  return (
    <form className="max-w-[110px] sm:max-w-[160px]" action={async (formData) => {
      setError(false);
      try { await action(formData); }
      catch (cause) {
        if (cause && typeof cause === "object" && "digest" in cause && String(cause.digest).startsWith("NEXT_REDIRECT")) throw cause;
        setError(true);
      }
    }}>
      <input type="hidden" name="entryId" value={entry.id} />
      <SubmitButton label={label} title={entry.title} isDone={entry.status === "COMPLETED"} />
      {error ? <p role="alert" className="mt-2 text-xs text-clay">Non enregistre. Reessaie ou recharge la page.</p> : null}
    </form>
  );
}

function SubmitButton({ label, title, isDone }: { label: string; title: string; isDone: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={`${isDone ? "Annuler la validation de" : "Valider"} ${title}`}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay disabled:cursor-wait disabled:opacity-70 sm:px-4 sm:text-sm ${isDone ? "border border-ink/15 text-pine hover:bg-mist" : "bg-ink text-sand hover:bg-pine"}`}
    >
      {isDone ? <Undo2 size={16} aria-hidden="true" /> : <Check size={16} aria-hidden="true" />}
      {pending ? "En cours..." : label}
    </button>
  );
}
