import Link from "next/link";
import type { Route } from "next";

type PageHeaderProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: Route;
};

export function PageHeader({ title, description, actionLabel, actionHref }: PageHeaderProps) {
  return (
    <header className="panel-dark hero-glow mb-8 flex flex-col gap-5 rounded-[32px] px-6 py-7 text-sand lg:flex-row lg:items-end lg:justify-between lg:px-7">
      <div>
        <div className="inline-flex rounded-full border border-white/12 bg-white/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-sand/68">
          Espace de progression
        </div>
        <h1 className="mt-4 font-display text-4xl tracking-[-0.05em] lg:text-[3rem]">{title}</h1>
        {description ? (
          <p className="mt-3 max-w-3xl text-sm leading-7 text-sand/82 lg:text-[15px]">{description}</p>
        ) : null}
      </div>
      {actionLabel ? actionHref ? (
        <Link
          href={actionHref}
          className="inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:translate-y-[-1px] hover:bg-sand"
        >
          {actionLabel}
        </Link>
      ) : (
        <button className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:translate-y-[-1px] hover:bg-sand">
          {actionLabel}
        </button>
      ) : null}
    </header>
  );
}
