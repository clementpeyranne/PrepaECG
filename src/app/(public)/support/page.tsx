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
      <section className="mt-5 rounded-[26px] bg-white/80 p-5 shadow-panel">
        <h2 className="font-display text-2xl text-ink">Donnees personnelles</h2>
        <p className="mt-3 text-sm leading-8 text-pine/82">
          Pour demander l'acces, la rectification, la portabilite ou la suppression de tes donnees,
          ecris depuis l'adresse liee a ton compte en precisant la demande. Une verification d'identite
          complementaire n'est demandee qu'en cas de doute raisonnable.
        </p>
        <a
          href={`mailto:${site.privacyEmail}?subject=Exercice%20de%20mes%20droits%20RGPD`}
          className="mt-5 inline-flex items-center rounded-full border border-ink/10 px-5 py-3 text-sm font-semibold text-ink transition hover:border-pine"
        >
          {site.privacyEmail}
        </a>
      </section>
    </PublicPageShell>
  );
}
