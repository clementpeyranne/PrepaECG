import type { ReactNode } from "react";

export function LegalMeta({ version }: { version: string }) {
  return (
    <div className="mb-8 flex flex-wrap gap-2 text-xs font-medium text-pine/65">
      <span className="rounded-full bg-sand px-3 py-1.5">Version {version}</span>
      <span className="rounded-full bg-sand px-3 py-1.5">Applicable au service en phase pilote</span>
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-ink/8 py-7 first:border-t-0 first:pt-0">
      <h2 className="font-display text-2xl text-ink sm:text-3xl">{title}</h2>
      <div className="mt-4 space-y-3 text-sm leading-7 text-pine/82">{children}</div>
    </section>
  );
}

export function LegalList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span aria-hidden="true" className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-clay" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

