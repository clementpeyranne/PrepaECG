import type { ReactNode } from "react";
import Link from "next/link";

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
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-6 lg:px-8">
        <div className="panel-dark rounded-[34px] px-6 py-7 text-sand shadow-panel lg:px-8">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.35em] text-sand/55">{eyebrow}</p>
              <h1 className="mt-4 font-display text-4xl leading-tight lg:text-6xl">{title}</h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-sand/78">{intro}</p>
            </div>

            <Link
              href="/"
              className="inline-flex items-center rounded-full border border-sand/15 px-5 py-2.5 text-sm font-semibold text-sand transition hover:border-sand/35"
            >
              Retour a l'accueil
            </Link>
          </div>
        </div>

        {site.isIncomplete ? (
          <section className="mt-6 rounded-[26px] border border-clay/15 bg-clay/10 px-5 py-4 text-sm leading-7 text-clay shadow-panel">
            Certaines informations legales utilisent encore des champs a renseigner avant l'ouverture
            publique definitive.
          </section>
        ) : null}

        <section className="panel-surface-strong mt-6 rounded-[30px] px-6 py-6 shadow-panel lg:px-8 lg:py-8">
          {children}
        </section>

        <footer className="mt-6 flex flex-col gap-3 rounded-[24px] bg-white/70 px-5 py-4 shadow-panel">
          <PublicFooterLinks />
          <p className="text-sm text-pine/72">
            Besoin d'aide ? Ecris a{" "}
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
