import type { ReactNode } from "react";
import Link from "next/link";

import { logoutAction } from "@/app/actions/auth";
import { SidebarNav } from "@/components/navigation/sidebar-nav";
import { ThemeSwitcher } from "@/components/layout/theme-switcher";
import type { NavItem } from "@/lib/mock-data";

type AppShellProps = {
  audience: "student" | "teacher";
  navigation: NavItem[];
  title: string;
  subtitle: string;
  userLabel?: string;
  children: ReactNode;
};

export function AppShell({
  audience,
  navigation,
  title,
  subtitle,
  userLabel,
  children
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-app-gradient text-ink">
      <div className="mx-auto flex min-h-screen max-w-[1660px] flex-col gap-6 px-4 py-4 lg:flex-row lg:px-6 lg:py-6">
        <aside className="panel-surface surface-grid w-full rounded-[32px] p-5 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:w-[320px] lg:overflow-y-auto lg:p-6">
          <div className="mb-8">
            <div className="inline-flex rounded-full border border-white/70 bg-white/55 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-pine/70">
              {audience === "student" ? "Prepa ECG OS" : "Espace professeur"}
            </div>
            <h1 className="mt-4 font-display text-3xl tracking-[-0.04em] text-ink lg:text-[2.15rem]">
              {title}
            </h1>
            <p className="mt-3 max-w-[24rem] text-sm leading-7 text-pine/78">{subtitle}</p>
          </div>

          <SidebarNav items={navigation} />

          <ThemeSwitcher />

          <div className="panel-dark hero-glow mt-8 rounded-[28px] p-5 text-sand lg:p-6">
            <p className="text-xs uppercase tracking-[0.25em] text-sand/58">Vision</p>
            <p className="mt-4 font-display text-2xl tracking-[-0.04em] text-white">
              Travailler avec plus de clarte, plus de constance, plus d&apos;ambition.
            </p>
            <p className="mt-3 text-sm leading-7 text-sand/84">
              Un espace unique pour garder le rythme, mesurer les efforts reels et transformer le
              volume de travail en progression visible.
            </p>
            {userLabel ? (
              <p className="mt-5 text-xs uppercase tracking-[0.22em] text-sand/58">{userLabel}</p>
            ) : null}
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/"
                className="inline-flex rounded-full border border-white/15 bg-white/6 px-4 py-2 text-sm font-medium text-sand transition hover:border-white/35 hover:bg-white/10"
              >
                Retour a l'accueil
              </Link>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:bg-sand"
                >
                  Se deconnecter
                </button>
              </form>
            </div>
          </div>
        </aside>

        <main className="panel-surface-strong surface-grid flex-1 rounded-[36px] p-5 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
