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
    <header className="panel-dark hero-glow mb-6 flex flex-col gap-5 rounded-[28px] px-5 py-6 text-sand lg:mb-8 lg:flex-row lg:items-end lg:justify-between lg:rounded-[32px] lg:px-7 lg:py-7">
      <div>
        <div className="inline-flex rounded-full border border-white/12 bg-white/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-sand/68">
          Espace de progression
        </div>
        <h1 className="mt-4 font-display text-[2.4rem] tracking-[-0.05em] sm:text-[2.7rem] lg:text-[3rem]">{title}</h1>
        {description ? (
          <p className="mt-3 max-w-3xl text-sm leading-7 text-sand/82 lg:text-[15px]">{description}</p>
        ) : null}
      </div>
      {actionLabel ? actionHref ? (
        <Link
          href={actionHref}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:translate-y-[-1px] hover:bg-sand sm:w-auto"
        >
          {actionLabel}
        </Link>
      ) : (
        <button className="min-h-12 w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:translate-y-[-1px] hover:bg-sand sm:w-auto">
          {actionLabel}
        </button>
      ) : null}
    </header>
  );
}
