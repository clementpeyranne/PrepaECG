import { LegalMeta, LegalSection } from "@/components/public/legal-document";
import { PublicPageShell } from "@/components/public/public-page-shell";
import { LEGAL_LAST_UPDATED_LABEL } from "@/lib/legal";
import { getPublicSiteConfig } from "@/lib/public-site";

export default function LegalNoticePage() {
  const site = getPublicSiteConfig();

  return (
    <PublicPageShell
      eyebrow="Cadre legal"
      title="Mentions legales"
      intro="Identification de l'editeur, de la direction de publication et de l'hebergeur de la plateforme."
    >
      <LegalMeta version={LEGAL_LAST_UPDATED_LABEL} />
      <LegalSection title="Editeur du service">
        <p><strong>{site.legalName}</strong></p>
        <p>{site.legalStatus}</p>
        {site.legalRegistration ? <p>Immatriculation : {site.legalRegistration}</p> : null}
        <p>Adresse : {site.legalAddress}</p>
        <p>Telephone : {site.legalPhone}</p>
        <p>Email : <a className="font-semibold text-ink underline" href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a></p>
      </LegalSection>

      <LegalSection title="Direction de la publication">
        <p>{site.publicationDirector}</p>
      </LegalSection>

      <LegalSection title="Hebergement">
        <p><strong>{site.hostingName}</strong></p>
        <p>{site.hostingAddress}</p>
        <p>
          Le service utilise egalement Supabase pour la base de donnees et le stockage prive des
          documents. Les details relatifs a ces traitements figurent dans la politique de confidentialite.
        </p>
      </LegalSection>

      <LegalSection title="Propriete intellectuelle">
        <p>
          La structure, l'interface, les textes propres au service, le code et les elements graphiques
          de Prepa ECG OS sont proteges par le droit applicable. Toute reproduction ou reutilisation
          substantielle sans autorisation est interdite, hors exceptions prevues par la loi.
        </p>
        <p>
          Les utilisateurs conservent leurs droits sur les cours, copies, fiches et cartes qu'ils
          deposent. Ils garantissent disposer des autorisations necessaires pour les partager dans
          leur environnement d'etablissement.
        </p>
      </LegalSection>

      <LegalSection title="Signalement et contact">
        <p>
          Pour signaler un contenu illicite, une atteinte aux droits, une faille de securite ou une
          difficulte d'acces, ecris a <a className="font-semibold text-ink underline" href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a>
          {" "}en precisant la page concernee et les elements utiles au traitement de la demande.
        </p>
      </LegalSection>
    </PublicPageShell>
  );
}
