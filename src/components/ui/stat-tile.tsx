import type { ReactNode } from "react";

/**
 * Tuile de chiffre clé. Le libellé réserve deux lignes : les chiffres d'une même rangée
 * restent alignés, même quand un libellé est plus long que les autres.
 */
export function StatTile({
  label,
  value,
  helper,
  tone = "sand",
  size = "md"
}: {
  label: string;
  value: ReactNode;
  helper?: ReactNode;
  tone?: "sand" | "white";
  size?: "md" | "lg";
}) {
  return (
    <div className={`flex h-full flex-col rounded-2xl p-4 ${tone === "sand" ? "bg-sand" : "border border-white/80 bg-white/80"}`}>
      <p className="min-h-[2.5em] text-[11px] font-semibold uppercase leading-[1.25] tracking-[0.16em] text-pine/85">{label}</p>
      <p className={`mt-2 font-display font-semibold leading-none tabular-nums tracking-[-0.04em] text-ink ${size === "lg" ? "text-4xl" : "text-3xl"}`}>
        {value}
      </p>
      {helper ? <p className="mt-2.5 text-sm leading-6 text-pine/80">{helper}</p> : null}
    </div>
  );
}
