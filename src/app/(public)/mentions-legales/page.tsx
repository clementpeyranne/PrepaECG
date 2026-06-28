import { PublicPageShell } from "@/components/public/public-page-shell";
import { getPublicSiteConfig } from "@/lib/public-site";

export default function LegalNoticePage() {
  const site = getPublicSiteConfig();

  return (
    <PublicPageShell
      eyebrow="Cadre legal"
      title="Mentions legales"
      intro="Les informations ci-dessous encadrent l'edition et l'hebergement de la plateforme."
    >
      <div className="space-y-8 text-sm leading-8 text-pine/82">
        <section>
          <h2 className="font-display text-2xl text-ink">Editeur</h2>
          <p className="mt-3">
            <strong>{site.legalName}</strong>
            <br />
            {site.legalAddress}
            <br />
            Contact : {site.supportEmail}
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-ink">Responsable de publication</h2>
          <p className="mt-3">{site.publicationDirector}</p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-ink">Hebergement</h2>
          <p className="mt-3">
            {site.hostingName}
            <br />
            {site.hostingAddress}
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-ink">Acces au service</h2>
          <p className="mt-3">
            La plateforme est accessible en ligne pour les eleves, professeurs et administrateurs
            rattaches a un etablissement autorise. L'acces peut etre interrompu ponctuellement pour
            maintenance, evolution ou securisation du service.
          </p>
        </section>
      </div>
    </PublicPageShell>
  );
}
