import { CalendarClock, Check, Layers, Sparkles } from "lucide-react";

/** Scène 3D décorative de la page d'accueil (parallaxe via MotionEffects). */
export function HeroScene() {
  const sessions = [
    { time: "18:00", subject: "Anglais", task: "Vocabulaire et grammaire du cours", duration: "50 min", done: true },
    { time: "19:00", subject: "Flashcards", task: "Cartes arrivées à échéance", duration: "35 min", done: true },
    { time: "20:30", subject: "ESH", task: "Plan détaillé d’un sujet", duration: "50 min", done: false }
  ];

  return (
    <div className="scene relative mx-auto -my-6 h-[420px] w-full max-w-[560px] max-sm:scale-[0.84] sm:my-0 sm:h-[500px]" data-parallax aria-hidden="true">
      <div className="orbit orbit--1" />
      <div className="orbit orbit--2" />

      <div className="scene__stage absolute inset-0">
        {/* Panneau principal : programme du jour */}
        <div className="scene__layer left-[4%] top-[16%] w-[90%] sm:left-[8%] sm:w-[76%]" style={{ transform: "translateZ(0px)" }}>
          <div className="float-a rounded-[28px] border border-white/15 bg-[linear-gradient(160deg,rgba(255,255,255,0.16),rgba(255,255,255,0.04))] p-5 shadow-[0_40px_100px_rgba(0,0,0,0.45)] backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-sand/60">Programme du jour</p>
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-sand/80">2 sur 3</span>
            </div>
            <div className="mt-4 space-y-2.5">
              {sessions.map((session) => (
                <div key={session.time} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2.5">
                  <span
                    className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                      session.done ? "bg-moss text-white" : "border border-white/25 text-sand/50"
                    }`}
                  >
                    {session.done ? <Check size={14} strokeWidth={3} /> : null}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-white">{session.task}</p>
                    <p className="text-[11px] text-sand/60">
                      {session.time} · {session.subject}
                    </p>
                  </div>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-sand/75">{session.duration}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="grow-x h-full w-2/3 rounded-full bg-gradient-to-r from-clay to-moss" />
            </div>
          </div>
        </div>

        {/* Flashcard qui se retourne */}
        <div className="scene__layer right-[-4%] top-[62%] h-[140px] w-[56%] sm:h-[150px]" style={{ transform: "translateZ(120px)" }}>
          <div className="float-b h-full">
            <div className="flip flip--auto h-full">
              <div className="flip__inner">
                <div className="flip__face rounded-[24px] bg-white p-4 text-ink shadow-[0_40px_90px_rgba(0,0,0,0.4)]">
                  <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-clay">
                    <Layers size={12} /> ESH · Question
                  </p>
                  <p className="mt-3 font-display text-[17px] leading-snug">
                    Qu’est-ce que l’élasticité-prix de la demande ?
                  </p>
                </div>
                <div className="flip__face flip__face--back rounded-[24px] bg-gradient-to-br from-clay to-[#e6946f] p-4 text-white shadow-[0_40px_90px_rgba(0,0,0,0.4)]">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/75">Réponse</p>
                  <p className="mt-3 text-[13px] leading-relaxed">
                    La variation relative de la quantité demandée rapportée à la variation relative du prix.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Anneau de progression */}
        <div className="scene__layer left-[4%] top-[58%] w-[136px]" style={{ transform: "translateZ(170px)" }}>
          <div className="float-c rounded-[24px] border border-white/60 bg-white/90 p-4 text-ink shadow-[0_30px_70px_rgba(0,0,0,0.35)] backdrop-blur">
            <svg viewBox="0 0 100 100" className="mx-auto h-20 w-20 -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgb(var(--color-mist))" strokeWidth="10" />
              <circle
                className="ring-draw"
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="rgb(var(--color-clay))"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray="264"
                strokeDashoffset="74"
              />
            </svg>
            <p className="mt-2 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-pine/70">Semaine</p>
            <p className="text-center font-display text-lg font-semibold">13 h / 18 h</p>
          </div>
        </div>

        {/* Pastilles */}
        <div className="scene__layer right-[2%] top-[2%]" style={{ transform: "translateZ(90px)" }}>
          <div className="float-c flex items-center gap-2 rounded-full border border-white/50 bg-white/90 px-3.5 py-2 text-[12px] font-semibold text-ink shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
            <CalendarClock size={15} className="text-clay" /> Révision prévue dans 3 jours
          </div>
        </div>
        <div className="scene__layer left-[2%] top-[4%] hidden sm:block" style={{ transform: "translateZ(40px)" }}>
          <div className="float-a flex items-center gap-2 rounded-full bg-ink/80 px-3.5 py-2 text-[12px] font-semibold text-sand shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur">
            <Sparkles size={15} className="text-clay" /> Fiche de révision prête
          </div>
        </div>
      </div>
    </div>
  );
}
