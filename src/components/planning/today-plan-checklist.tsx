"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";

import { markPlanningSessionDone, markPlanningSessionPlanned } from "@/app/(student)/planning/actions";

type TodayPlanEntry = {
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
  return (
    <div className="space-y-3">
      {entries.map((entry) => {
        const isDone = entry.status === "COMPLETED";
        const needsSubmission =
          entry.sessionType === "ESSAY_PRACTICE" ||
          entry.sessionType === "CHAPTER_REVISION" ||
          entry.sessionType === "EXERCISE_TRAINING";

        return (
          <div key={entry.id} className="rounded-2xl border border-ink/8 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{entry.title}</p>
                  <span
                    className={`rounded-full px-3 py-1 text-xs ${
                      isDone ? "bg-moss/15 text-pine" : "bg-mist text-pine"
                    }`}
                  >
                    {isDone ? "Fait" : "A faire"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-pine/75">{entry.subject}</p>
              </div>
              <div className="rounded-full bg-mist px-3 py-1 text-xs text-pine">
                {entry.time} - {entry.duration} min
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              {isDone ? (
                <StatusForm action={markPlanningSessionPlanned} entry={entry} label="Remettre en cours" />
              ) : (
                <StatusForm
                  action={markPlanningSessionDone}
                  entry={entry}
                  label={entry.persisted ? "Marquer comme fait" : "Valider ce bloc"}
                />
              )}

              {needsSubmission ? (
                <Link
                  href="/essays/new"
                  className="inline-flex rounded-full border border-clay/20 bg-clay/10 px-4 py-2 text-sm font-medium text-clay transition hover:bg-clay/15"
                >
                  Deposer dans Copies
                </Link>
              ) : null}

              {entry.sessionType === "FLASHCARDS_REVIEW" ? (
                <Link
                  href="/flashcards"
                  className="inline-flex rounded-full border border-ink/10 px-4 py-2 text-sm font-medium text-pine transition hover:bg-sand"
                >
                  Ouvrir les flashcards
                </Link>
              ) : null}
            </div>
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
  return (
    <form action={action}>
      {entry.persisted ? <input type="hidden" name="sessionId" value={entry.id} /> : null}
      <input type="hidden" name="plannedStartAt" value={entry.plannedStartAt ?? ""} />
      <input type="hidden" name="subjectId" value={entry.subjectId ?? ""} />
      <input type="hidden" name="goalText" value={entry.title} />
      <input type="hidden" name="plannedDurationMin" value={String(entry.duration)} />
      <input type="hidden" name="sessionType" value={entry.sessionType} />
      <SubmitButton label={label} />
    </form>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-sand transition hover:bg-pine disabled:cursor-wait disabled:opacity-70"
    >
      {pending ? "Mise a jour..." : label}
    </button>
  );
}
