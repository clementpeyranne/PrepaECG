import { LegalMeta, LegalSection } from "@/components/public/legal-document";
import { PublicPageShell } from "@/components/public/public-page-shell";
import { LEGAL_LAST_UPDATED_LABEL } from "@/lib/legal";
import { getPublicSiteConfig } from "@/lib/public-site";

export default function LegalNoticePage() {
  const site = getPublicSiteConfig();

  return (
    <PublicPageShell
      eyebrow="Cadre légal"
      title="Mentions légales"
      intro="Identification de l'éditeur, de la direction de publication et de l'hébergeur de la plateforme."
    >
      <LegalMeta version={LEGAL_LAST_UPDATED_LABEL} />
      <LegalSection title="Éditeur du service">
        <p><strong>{site.legalName}</strong></p>
        <p>{site.legalStatus}</p>
        {site.legalRegistration ? <p>Immatriculation : {site.legalRegistration}</p> : null}
        <p>Adresse : {site.legalAddress}</p>
        <p>Téléphone : {site.legalPhone}</p>
        <p>Email : <a className="font-semibold text-ink underline" href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a></p>
      </LegalSection>

      <LegalSection title="Direction de la publication">
        <p>{site.publicationDirector}</p>
      </LegalSection>

      <LegalSection title="Hébergement">
        <p><strong>{site.hostingName}</strong></p>
        <p>{site.hostingAddress}</p>
        <p>
          Le service utilise également Supabase pour la base de données et le stockage privé des
          documents. Les détails relatifs à ces traitements figurent dans la politique de confidentialité.
        </p>
      </LegalSection>

      <LegalSection title="Propriété intellectuelle">
        <p>
          La structure, l'interface, les textes propres au service, le code et les éléments graphiques
          de Prépatempo sont protégés par le droit applicable. Toute reproduction ou réutilisation
          substantielle sans autorisation est interdite, hors exceptions prévues par la loi.
        </p>
        <p>
          Les utilisateurs conservent leurs droits sur les cours, copies, fiches et cartes qu'ils
          déposent. Ils garantissent disposer des autorisations nécessaires pour les partager dans
          leur environnement d'établissement.
        </p>
      </LegalSection>

      <LegalSection title="Signalement et contact">
        <p>
          Pour signaler un contenu illicite, une atteinte aux droits, une faille de sécurité ou une
          difficulté d'accès, écris à <a className="font-semibold text-ink underline" href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a>
          {" "}en précisant la page concernée et les éléments utiles au traitement de la demande.
        </p>
      </LegalSection>
    </PublicPageShell>
  );
}
