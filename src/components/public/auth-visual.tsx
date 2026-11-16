import Link from "next/link";
import { CalendarDays, Layers, PenLine } from "lucide-react";

import { BrandMark } from "@/components/brand/brand-mark";

export function AuthBrand() {
  return (
    <Link href="/" className="mb-8 inline-flex items-center gap-2.5" aria-label="Prépatempo, accueil">
      <BrandMark size={38} />
      <span className="font-display text-lg font-semibold tracking-[-0.03em] text-white">Prépatempo</span>
    </Link>
  );
}

export function AuthOrbs() {
  return (
    <div className="header-orbs" aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
  );
}

/** Pile de cartes en 3D, purement décorative. */
export function AuthVisual() {
  const cards = [
    { icon: CalendarDays, label: "Planning", text: "Séances du jour", z: 0, x: 0, y: 0, tone: "bg-white text-ink" },
    { icon: Layers, label: "Flashcards", text: "Cartes à revoir", z: 50, x: 26, y: 22, tone: "bg-gradient-to-br from-clay to-[#e6946f] text-white" },
    { icon: PenLine, label: "Copies", text: "Corrections", z: 100, x: 52, y: 44, tone: "bg-ink/85 text-sand border border-white/15" }
  ];

  return (
    <div className="scene mt-10 hidden h-48 lg:block" aria-hidden="true">
      <div className="scene__stage float-a relative h-full" style={{ transform: "rotateX(22deg) rotateY(-18deg) rotateZ(4deg)" }}>
        {cards.map(({ icon: Icon, label, text, z, x, y, tone }) => (
          <div
            key={label}
            className={`absolute w-56 rounded-[22px] p-4 shadow-[0_30px_70px_rgba(0,0,0,0.4)] ${tone}`}
            style={{ transform: `translate3d(${x}px, ${y}px, ${z}px)` }}
          >
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] opacity-75">
              <Icon size={14} /> {label}
            </p>
            <p className="mt-3 font-display text-lg font-semibold">{text}</p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-current/15">
              <div className="grow-x h-full w-3/5 rounded-full bg-current/60" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
