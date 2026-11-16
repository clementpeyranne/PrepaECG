import Link from "next/link";
import type { Route } from "next";
import { ArrowUpRight } from "lucide-react";

type PageHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
} & (
  | { actionLabel?: undefined; actionHref?: undefined }
  | { actionLabel: string; actionHref: Route }
);

export function PageHeader({ title, description, eyebrow, actionLabel, actionHref }: PageHeaderProps) {
  return (
    <header className="panel-dark hero-glow spotlight mb-6 flex flex-col gap-5 overflow-hidden rounded-[28px] px-5 py-6 text-sand lg:mb-8 lg:flex-row lg:items-end lg:justify-between lg:rounded-[32px] lg:px-8 lg:py-8">
      <div className="header-orbs" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="relative">
        {eyebrow ? (
          <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-sand/70 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-clay shadow-[0_0_10px_rgba(var(--accent-primary),0.9)]" />
            {eyebrow}
          </div>
        ) : null}
        <h1 className="mt-4 font-display text-[2.4rem] leading-[1.05] tracking-[-0.05em] sm:text-[2.7rem] lg:text-[3.2rem]">
          <span className="text-gradient-light">{title}</span>
        </h1>
        {description ? (
          <p className="mt-3 max-w-3xl text-sm leading-7 text-sand/82 lg:text-[15px]">{description}</p>
        ) : null}
      </div>
      {actionLabel ? (
        <Link
          href={actionHref}
          className="group relative inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink shadow-[0_14px_34px_rgba(0,0,0,0.22)] transition hover:-translate-y-0.5 hover:bg-sand sm:w-auto"
        >
          {actionLabel}
          <ArrowUpRight size={16} className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
      ) : null}
    </header>
  );
}
