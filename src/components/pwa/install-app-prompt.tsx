"use client";

import { useEffect, useState } from "react";

type PromptOutcome = "accepted" | "dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: PromptOutcome }>;
};

const DISMISS_KEY = "prepa-install-prompt-dismissed";

function isStandaloneDisplay() {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

export function InstallAppPrompt() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIosHintVisible, setIsIosHintVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || isStandaloneDisplay()) {
      return;
    }

    if (window.localStorage.getItem(DISMISS_KEY) === "1") {
      return;
    }

    const ua = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(ua);
    const isSafari = /safari/.test(ua) && !/crios|fxios/.test(ua);

    if (isIos && isSafari) {
      setIsIosHintVisible(true);
      setIsVisible(true);
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  if (!isVisible) {
    return null;
  }

  async function handleInstall() {
    if (!promptEvent) {
      return;
    }

    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === "accepted") {
      setIsVisible(false);
      setPromptEvent(null);
      setIsIosHintVisible(false);
    }
  }

  function handleDismiss() {
    window.localStorage.setItem(DISMISS_KEY, "1");
    setIsVisible(false);
    setPromptEvent(null);
    setIsIosHintVisible(false);
  }

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4"
      style={{ paddingBottom: "max(0px, env(safe-area-inset-bottom))" }}
    >
      <div className="pointer-events-auto panel-dark flex w-full max-w-xl flex-col gap-3 rounded-[24px] px-5 py-4 text-sand shadow-panel">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-sand/55">Application</p>
          <p className="mt-2 text-sm leading-7 text-sand/84">
            {promptEvent
              ? "Installe Prepa ECG OS sur ton ecran d'accueil pour l'ouvrir comme une vraie application."
              : "Sur iPhone, utilise le bouton Partager puis ajoute l'application sur l'ecran d'accueil."}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {promptEvent ? (
            <button
              type="button"
              onClick={handleInstall}
              className="rounded-full bg-clay px-4 py-2 text-sm font-semibold text-white transition hover:bg-clay/90"
            >
              Installer
            </button>
          ) : null}
          {isIosHintVisible ? (
            <span className="rounded-full border border-sand/15 px-4 py-2 text-sm text-sand/82">
              Safari iPhone : Partager puis Sur l'ecran d'accueil
            </span>
          ) : null}
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-full border border-sand/15 px-4 py-2 text-sm font-semibold text-sand transition hover:border-sand/35"
          >
            Plus tard
          </button>
        </div>
      </div>
    </div>
  );
}
