import type { ReactNode } from "react";
import Link from "next/link";

import { AuthBrand, AuthOrbs } from "./auth-visual";
import { PublicFooterLinks } from "./public-footer-links";
import { getPublicSiteConfig } from "@/lib/public-site";

export function PublicPageShell({
  eyebrow,
  title,
  intro,
  children
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
}) {
  const site = getPublicSiteConfig();

  return (
    <main className="bg-app-gradient">
      <div className="stagger mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-6 lg:px-8">
        <div className="panel-dark spotlight relative overflow-hidden rounded-[34px] px-6 py-7 text-sand shadow-panel lg:px-10 lg:py-10">
          <AuthOrbs />
          <div className="relative flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-3xl">
              <AuthBrand />
              <p className="text-xs uppercase tracking-[0.35em] text-sand/70">{eyebrow}</p>
              <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.04] lg:text-6xl">
                <span className="text-gradient-light">{title}</span>
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-sand/78">{intro}</p>
            </div>

            <Link
              href="/"
              className="inline-flex items-center rounded-full border border-sand/15 px-5 py-2.5 text-sm font-semibold text-sand transition hover:border-sand/35"
            >
              Retour à l'accueil
            </Link>
          </div>
        </div>

        {site.isIncomplete ? (
          <section className="panel-surface-strong mt-6 rounded-[26px] border-l-4 !border-l-clay px-5 py-4 text-sm font-medium leading-7 text-clay">
            Certaines informations légales ne sont pas encore renseignées. Le service reste en phase pilote.
          </section>
        ) : null}

        <section className="panel-surface-strong mt-6 rounded-[30px] px-6 py-6 shadow-panel lg:px-8 lg:py-8">
          {children}
        </section>

        <footer className="panel-surface-strong mt-6 flex flex-col gap-3 rounded-[24px] px-5 py-4">
          <PublicFooterLinks />
          <p className="text-sm text-pine/80">
            Besoin d'aide ? Écris à{" "}
            <a className="font-semibold text-ink transition hover:text-pine" href={`mailto:${site.supportEmail}`}>
              {site.supportEmail}
            </a>
            .
          </p>
        </footer>
      </div>
    </main>
  );
}
