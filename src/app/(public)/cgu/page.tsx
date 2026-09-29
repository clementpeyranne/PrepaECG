import Link from "next/link";

import { LegalList, LegalMeta, LegalSection } from "@/components/public/legal-document";
import { PublicPageShell } from "@/components/public/public-page-shell";
import { LEGAL_LAST_UPDATED_LABEL, TERMS_VERSION } from "@/lib/legal";
import { getPublicSiteConfig } from "@/lib/public-site";

export default function TermsPage() {
  const site = getPublicSiteConfig();
  return (
    <PublicPageShell
      eyebrow="Conditions"
      title="Conditions generales d'utilisation"
      intro="Ces conditions fixent les regles d'acces et d'utilisation de Prepa ECG OS pendant sa phase pilote."
    >
      <LegalMeta version={`${TERMS_VERSION} - mise a jour ${LEGAL_LAST_UPDATED_LABEL}`} />

      <LegalSection title="1. Objet du service">
        <p>
          Prepa ECG OS rassemble des outils de planning, flashcards, ressources, depot de copies,
          progression et assistance pedagogique. Le service vise a aider l'etudiant a organiser son
          travail ; il ne garantit aucun resultat scolaire ou admission a un concours.
        </p>
      </LegalSection>

      <LegalSection title="2. Acces et compte">
        <LegalList items={[
          "Le compte est personnel. Ses identifiants ne doivent pas etre partages.",
          "L'utilisateur fournit des informations exactes et signale toute utilisation non autorisee.",
          "L'acces depend d'un code d'etablissement ; un professeur doit en plus recevoir une invitation personnelle.",
          "L'utilisateur doit avoir au moins 15 ans ou disposer des autorisations necessaires selon sa situation."
        ]} />
      </LegalSection>

      <LegalSection title="3. Environnements d'etablissement">
        <p>
          Chaque prepa constitue un environnement separe. Un eleve peut transmettre une copie aux
          professeurs rattaches a cet environnement, mais pas aux professeurs d'un autre etablissement.
          Les codes d'acces et invitations sont confidentiels et peuvent etre renouveles ou revoques.
        </p>
      </LegalSection>

      <LegalSection title="4. Contenus deposes et partages">
        <p>
          L'utilisateur reste responsable des cours, copies, photos, PDF, cartes, liens et commentaires
          qu'il depose. Il s'engage a ne pas publier de contenu illicite, malveillant, injurieux,
          discriminatoire, contrefaisant ou portant atteinte a la vie privee d'un tiers.
        </p>
        <p>
          L'utilisateur conserve ses droits sur ses contenus et accorde au service une autorisation
          technique, non exclusive et limitee a leur hebergement, leur affichage, leur traitement et
          leur partage avec les destinataires choisis pendant la duree necessaire au service.
        </p>
      </LegalSection>

      <LegalSection title="5. Flashcards et ressources partagees">
        <p>
          Avant d'importer, d'exporter ou de partager un deck, l'utilisateur verifie qu'il dispose des
          droits necessaires, notamment sur les textes, images et extraits de cours. Un partage peut etre
          retire en cas de signalement legitime ou de risque pour la plateforme.
        </p>
      </LegalSection>

      <LegalSection title="6. Intelligence artificielle">
        <p>
          Les sorties de l'IA peuvent etre incompletes ou erronees. Elles constituent une aide et non une
          correction officielle, une decision de notation ou un avis professionnel. L'utilisateur doit
          verifier toute information importante et le professeur conserve son jugement pedagogique.
        </p>
        <p>
          L'utilisateur ne doit pas envoyer de donnees sensibles inutiles ni d'informations concernant
          des tiers sans autorisation. Les fonctionnalites IA peuvent etre suspendues si le fournisseur
          est indisponible ou si leur cout ne permet plus de les maintenir.
        </p>
      </LegalSection>

      <LegalSection title="7. Disponibilite et phase pilote">
        <p>
          Le service est fourni avec les moyens disponibles pendant sa phase pilote. Des interruptions
          peuvent intervenir pour maintenance, securite ou evolution. Les anomalies signalees sont
          traitees avec diligence, sans engagement de disponibilite continue ni d'absence totale d'erreur.
        </p>
      </LegalSection>

      <LegalSection title="8. Suspension ou fermeture">
        <p>
          Un compte peut etre suspendu en cas de risque de securite, d'utilisation abusive, de partage
          d'acces, d'atteinte aux droits d'autrui ou de manquement grave aux presentes conditions. Sauf
          urgence ou obligation contraire, l'utilisateur peut contacter le support pour comprendre la mesure.
        </p>
        <p>
          L'utilisateur peut demander la fermeture de son compte et l'effacement de ses donnees selon
          les modalites de la <Link className="font-semibold text-ink underline" href="/confidentialite">politique de confidentialite</Link>.
        </p>
      </LegalSection>

      <LegalSection title="9. Responsabilite">
        <p>
          Chacun reste responsable de son usage du service, de ses sauvegardes utiles et de la verification
          des contenus. Les limitations prevues ici ne s'appliquent pas lorsqu'elles sont interdites par la loi,
          notamment en cas de faute lourde, dol ou atteinte a l'integrite physique.
        </p>
      </LegalSection>

      <LegalSection title="10. Evolution des conditions">
        <p>
          Les conditions peuvent evoluer pour tenir compte du produit, de la securite ou de la loi. Une
          modification importante sera signalee. La poursuite de l'utilisation pourra necessiter une
          nouvelle acceptation de la version mise a jour.
        </p>
      </LegalSection>

      <LegalSection title="11. Droit applicable et contact">
        <p>
          Les presentes conditions sont soumises au droit francais. Avant toute demarche contentieuse,
          l'utilisateur est invite a contacter <a className="font-semibold text-ink underline" href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a>
          {" "}pour rechercher une solution amiable, sans priver un consommateur de ses droits imperatifs.
        </p>
      </LegalSection>
    </PublicPageShell>
  );
}
