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
  subtitle?: string;
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
  const renderAccountCard = () => (
    <div className="panel-dark hero-glow rounded-[24px] p-4 text-sand lg:rounded-[28px] lg:p-6">
      <p className="text-xs uppercase tracking-[0.25em] text-sand/58">Compte</p>
      {userLabel ? <p className="mt-4 text-sm font-semibold text-white">{userLabel}</p> : null}
      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 bg-white/6 px-4 py-2 text-sm font-medium text-sand transition hover:border-white/35 hover:bg-white/10"
        >
          Retour a l'accueil
        </Link>
        <form action={logoutAction}>
          <button
            type="submit"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:bg-sand"
          >
            Se deconnecter
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-app-gradient text-ink">
      <div className="mx-auto flex min-h-screen max-w-[1660px] flex-col gap-6 px-4 py-4 lg:flex-row lg:px-6 lg:py-6">
        <aside className="panel-surface surface-grid w-full rounded-[32px] p-5 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:w-[320px] lg:overflow-y-auto lg:p-6">
          <div className="mb-8">
            <div className="inline-flex rounded-full border border-white/70 bg-white/55 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-pine/70">
              {audience === "student" ? "Prepa ECG OS" : "Espace professeur"}
            </div>
            <h1 className="mt-4 font-display text-[2.15rem] tracking-[-0.04em] text-ink lg:text-[2.15rem]">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-3 max-w-[24rem] text-sm leading-7 text-pine/78">{subtitle}</p>
            ) : null}
          </div>

          <SidebarNav items={navigation} />

          <div className="mt-8 hidden lg:block">
            <ThemeSwitcher />
          </div>

          <div className="mt-8 hidden lg:block">
            {renderAccountCard()}
          </div>
        </aside>

        <main className="panel-surface-strong surface-grid flex-1 rounded-[32px] p-4 sm:p-5 lg:rounded-[36px] lg:p-8">
          {children}

          <div className="mt-5 space-y-5 lg:hidden">
            <ThemeSwitcher compact />
            {renderAccountCard()}
          </div>
        </main>
      </div>
    </div>
  );
}
