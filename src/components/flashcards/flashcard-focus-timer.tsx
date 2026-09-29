"use client";

import Link from "next/link";
import { Clock3, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";

import { recordFlashcardFocusHeartbeat } from "@/app/(student)/planning/actions";

type FocusState = {
  elapsedSeconds: number;
  requiredSeconds: number;
  complete: boolean;
};

export function FlashcardFocusTimer({ planningEntryId }: { planningEntryId: string }) {
  const [focus, setFocus] = useState<FocusState | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let pending = false;

    async function heartbeat() {
      if (document.visibilityState !== "visible" || pending) return;
      pending = true;
      try {
        const result = await recordFlashcardFocusHeartbeat(planningEntryId);
        if (cancelled) return;
        if (result.ok) {
          setFocus(result);
          setError(false);
        } else {
          setError(true);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        pending = false;
      }
    }

    void heartbeat();
    const interval = window.setInterval(heartbeat, 10_000);
    const resumeWhenVisible = () => {
      if (document.visibilityState === "visible") void heartbeat();
    };
    document.addEventListener("visibilitychange", resumeWhenVisible);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", resumeWhenVisible);
    };
  }, [planningEntryId]);

  if (error) {
    return (
      <div className="mb-5 rounded-[24px] border border-clay/20 bg-clay/10 px-5 py-4 text-sm text-clay" role="alert">
        Ce bloc de planning n'est plus disponible. Retourne au planning pour le relancer.
      </div>
    );
  }

  const elapsed = focus?.elapsedSeconds ?? 0;
  const required = focus?.requiredSeconds ?? 0;
  const progress = required > 0 ? Math.min(100, Math.round((elapsed / required) * 100)) : 0;
  const remaining = Math.max(0, required - elapsed);

  return (
    <section className="mb-5 rounded-[26px] border border-pine/10 bg-white/80 p-5 shadow-sm" aria-live="polite">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`flex size-11 items-center justify-center rounded-full ${focus?.complete ? "bg-moss/15 text-pine" : "bg-clay/12 text-clay"}`}>
            {focus?.complete ? <CheckCircle2 size={21} aria-hidden="true" /> : <Clock3 size={21} aria-hidden="true" />}
          </div>
          <div>
            <p className="font-semibold text-ink">Temps de revision du planning</p>
            <p className="mt-1 text-sm text-pine/75">
              {!focus ? "Initialisation du chronometre..." : focus.complete ? "Duree atteinte : tu peux valider le bloc." : `${formatDuration(remaining)} restantes`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <p className="font-display text-2xl text-ink">{focus ? `${formatDuration(elapsed)} / ${formatDuration(required)}` : "--"}</p>
          {focus?.complete ? (
            <Link href="/planning" className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-sand transition hover:bg-pine">
              Valider le bloc
            </Link>
          ) : null}
        </div>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-mist">
        <div className="h-full rounded-full bg-clay transition-[width] duration-500" style={{ width: `${progress}%` }} />
      </div>
      <p className="mt-3 text-xs text-pine/65">Le compteur avance uniquement lorsque cette page est ouverte et visible.</p>
    </section>
  );
}

function formatDuration(seconds: number) {
  if (!seconds) return "0 min";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes === 0) return `${remainingSeconds} s`;
  return remainingSeconds === 0 ? `${minutes} min` : `${minutes} min ${remainingSeconds} s`;
}
