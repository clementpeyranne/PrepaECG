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

const previewIcons = { planning: CalendarDays, flashcards: Layers, copies: PenLine } as const;

/** Aperçu de l'espace de travail : carte opaque légèrement inclinée en 3D (décorative). */
export function AuthPreview({
  items
}: {
  items: Array<{ icon: keyof typeof previewIcons; title: string; text: string }>;
}) {
  return (
    <div className="scene mt-9" aria-hidden="true">
      <div
        data-tilt="6"
        className="float-a rounded-[26px] border border-white/12 bg-[linear-gradient(160deg,rgba(255,255,255,0.12),rgba(255,255,255,0.04))] p-3 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl"
      >
        <ul className="space-y-2">
          {items.map(({ icon, title, text }) => {
            const Icon = previewIcons[icon];
            return (
              <li key={title} className="flex items-center gap-3.5 rounded-[18px] bg-white/[0.07] px-3.5 py-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-clay to-moss text-white shadow-[0_10px_24px_rgba(0,0,0,0.25)]">
                  <Icon size={18} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-white">{title}</span>
                  <span className="block truncate text-[13px] text-sand/70">{text}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
