"use client";

import { useEffect } from "react";

type AppErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export function AppError({ error, reset }: AppErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[55vh] max-w-xl items-center justify-center px-4 text-center">
      <div className="rounded-[28px] border border-pine/10 bg-white/80 p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-coral">Incident temporaire</p>
        <h1 className="mt-3 text-2xl font-semibold text-pine">Cette page n'a pas pu se charger.</h1>
        <p className="mt-3 text-sm leading-6 text-pine/70">
          Tes donnees sont conservees. Relance simplement la page pour reprendre ton travail.
        </p>
        <button
          className="mt-6 rounded-full bg-pine px-5 py-3 text-sm font-semibold text-white transition hover:bg-pine/90"
          onClick={reset}
          type="button"
        >
          Reessayer
        </button>
      </div>
    </div>
  );
}
