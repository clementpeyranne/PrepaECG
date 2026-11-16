import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";

const tones = {
  success: { icon: CheckCircle2, className: "border-moss/30 bg-moss/12 text-pine" },
  warning: { icon: Info, className: "border-clay/25 bg-clay/10 text-ink" },
  error: { icon: AlertCircle, className: "border-red-300 bg-red-50 text-red-800" }
} as const;

/** Message de statut après une action (enregistrement, doublon, erreur). */
export function Notice({ tone, children, className = "" }: { tone: keyof typeof tones; children: ReactNode; className?: string }) {
  const { icon: Icon, className: toneClass } = tones[tone];
  return (
    <div role="status" className={`flex items-start gap-3 rounded-[18px] border px-4 py-3 text-sm leading-6 ${toneClass} ${className}`.trim()}>
      <Icon size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}
