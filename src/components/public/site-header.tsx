import Link from "next/link";

import { continueAsCurrentUserAction } from "@/app/actions/auth";
import { BrandMark } from "@/components/brand/brand-mark";

export function SiteHeader({ signedIn, anchors = true }: { signedIn: boolean; anchors?: boolean }) {
  return (
    <header className="sticky top-3 z-40 mx-auto w-full max-w-7xl px-4 lg:px-8">
      <div className="flex items-center justify-between gap-4 rounded-full border border-white/70 bg-white/90 py-2 text-ink pl-2 pr-2 shadow-[0_18px_50px_rgba(20,34,29,0.1)] backdrop-blur-xl sm:pl-3">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Prépatempo, accueil">
          <BrandMark size={36} />
          <span className="font-display text-lg font-semibold tracking-[-0.03em] text-ink">Prépatempo</span>
        </Link>

        {anchors ? (
          <nav className="hidden items-center gap-1 md:flex" aria-label="Sections">
            {[
              ["#fonctionnalites", "Fonctionnalités"],
              ["#methode", "Méthode"],
              ["#annales", "Annales"]
            ].map(([href, label]) => (
              <a key={href} href={href} className="rounded-full px-4 py-2 text-sm font-medium text-pine transition hover:bg-sand hover:text-ink">
                {label}
              </a>
            ))}
          </nav>
        ) : null}

        <div className="flex items-center gap-2">
          {signedIn ? (
            <form action={continueAsCurrentUserAction}>
              <button type="submit" className="btn-primary rounded-full px-4 py-2.5 text-sm font-semibold text-white sm:px-5">
                Ouvrir l’espace
              </button>
            </form>
          ) : (
            <>
              <Link href="/login" className="hidden rounded-full px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-white/80 sm:inline-flex">
                Se connecter
              </Link>
              <Link href="/signup" className="btn-primary inline-flex rounded-full px-4 py-2.5 text-sm font-semibold text-white sm:px-5">
                Créer un compte
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
