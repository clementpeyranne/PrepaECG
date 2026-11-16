import type { ReactNode } from "react";
import Link from "next/link";
import type { Route } from "next";
import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  text,
  actionLabel,
  actionHref,
  children
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  actionLabel?: string;
  actionHref?: Route;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-[24px] border border-dashed border-ink/15 bg-sand/60 px-6 py-10 text-center">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-clay shadow-[0_10px_24px_rgba(20,34,29,0.08)]">
        <Icon size={22} aria-hidden="true" />
      </span>
      <p className="mt-4 font-display text-xl font-semibold text-ink">{title}</p>
      <p className="mt-2 max-w-md text-sm leading-6 text-pine/80">{text}</p>
      {actionLabel && actionHref ? (
        <Link href={actionHref} className="btn-primary mt-5 inline-flex rounded-full px-5 py-2.5 text-sm font-semibold text-white">
          {actionLabel}
        </Link>
      ) : null}
      {children}
    </div>
  );
}
