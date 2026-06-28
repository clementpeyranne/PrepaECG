import { PublicPageShell } from "@/components/public/public-page-shell";
import { getPublicSiteConfig } from "@/lib/public-site";

export default function SupportPage() {
  const site = getPublicSiteConfig();

  return (
    <PublicPageShell
      eyebrow="Aide"
      title="Support"
      intro="Pour toute difficulte d'acces, de configuration ou de fonctionnement, un point de contact unique est prevu."
    >
      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-[26px] bg-white/80 p-5 shadow-panel">
          <h2 className="font-display text-2xl text-ink">Comment nous ecrire</h2>
          <p className="mt-3 text-sm leading-8 text-pine/82">
            Envoie ton message en precisant ton etablissement, ton role, la page concernee et une
            capture si besoin.
          </p>
          <a
            href={`mailto:${site.supportEmail}`}
            className="mt-5 inline-flex items-center rounded-full bg-ink px-5 py-3 text-sm font-semibold text-sand transition hover:bg-pine"
          >
            {site.supportEmail}
          </a>
        </section>

        <section className="rounded-[26px] bg-white/80 p-5 shadow-panel">
          <h2 className="font-display text-2xl text-ink">Cas les plus frequents</h2>
          <div className="mt-4 space-y-3 text-sm leading-7 text-pine/80">
            <p>Connexion impossible ou mot de passe a reinitialiser</p>
            <p>Probleme de depot PDF ou photo</p>
            <p>Compte rattache au mauvais etablissement</p>
            <p>Question sur une ressource, une copie ou une correction</p>
          </div>
        </section>
      </div>
    </PublicPageShell>
  );
}
