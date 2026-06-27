import type { ReactNode } from "react";

type SectionCardProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
  accent?: "default" | "dark" | "soft";
};

export function SectionCard({
  eyebrow,
  title,
  description,
  children,
  accent = "default"
}: SectionCardProps) {
  const accents = {
    default: "panel-surface-strong text-ink",
    dark: "panel-dark text-sand",
    soft: "panel-surface text-ink"
  };

  return (
    <section className={`rounded-[30px] p-5 lg:p-6 ${accents[accent]}`}>
      {eyebrow ? (
        <div className="inline-flex rounded-full border border-current/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-current/60">
          {eyebrow}
        </div>
      ) : null}
      <div className="mt-4">
        <h2 className="font-display text-[1.9rem] tracking-[-0.04em]">{title}</h2>
        {description ? <p className="mt-3 max-w-3xl text-sm leading-7 text-current/76">{description}</p> : null}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}
