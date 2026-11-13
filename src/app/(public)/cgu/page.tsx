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
      title="Conditions générales d'utilisation"
      intro="Ces conditions fixent les règles d'accès et d'utilisation de Prépatempo pendant sa phase pilote."
    >
      <LegalMeta version={`${TERMS_VERSION} - mise à jour ${LEGAL_LAST_UPDATED_LABEL}`} />

      <LegalSection title="1. Objet du service">
        <p>
          Prépatempo rassemble des outils de planning, flashcards, ressources, dépôt de copies,
          progression et assistance pédagogique. Le service vise à aider l'étudiant à organiser son
          travail ; il ne garantit aucun résultat scolaire ou admission à un concours.
        </p>
        <p>Le pilote est gratuit et réservé aux personnes invitées. Aucun abonnement ni paiement n'est demandé pendant cette phase.</p>
      </LegalSection>

      <LegalSection title="2. Accès et compte">
        <LegalList items={[
          "Le compte est personnel. Ses identifiants ne doivent pas être partagés.",
          "L'utilisateur fournit des informations exactes et signale toute utilisation non autorisée.",
          "L'accès dépend d'un code d'établissement ; un professeur doit en plus recevoir une invitation personnelle.",
          "L'utilisateur doit avoir au moins 15 ans ou disposer des autorisations nécessaires selon sa situation."
        ]} />
      </LegalSection>

      <LegalSection title="3. Environnements d'établissement">
        <p>
          Chaque prépa constitue un environnement séparé. Un élève peut transmettre une copie aux
          professeurs rattachés à cet environnement, mais pas aux professeurs d'un autre établissement.
          Les codes d'accès et invitations sont confidentiels et peuvent être renouvelés ou révoqués.
        </p>
      </LegalSection>

      <LegalSection title="4. Contenus déposés et partagés">
        <p>
          L'utilisateur reste responsable des cours, copies, photos, PDF, cartes, liens et commentaires
          qu'il dépose. Il s'engage à ne pas publier de contenu illicite, malveillant, injurieux,
          discriminatoire, contrefaisant ou portant atteinte à la vie privée d'un tiers.
        </p>
        <p>
          L'utilisateur conserve ses droits sur ses contenus et accorde au service une autorisation
          technique, non exclusive et limitée à leur hébergement, leur affichage, leur traitement et
          leur partage avec les destinataires choisis pendant la durée nécessaire au service.
        </p>
      </LegalSection>

      <LegalSection title="5. Flashcards et ressources partagées">
        <p>
          Avant d'importer, d'exporter ou de partager un deck, l'utilisateur vérifie qu'il dispose des
          droits nécessaires, notamment sur les textes, images et extraits de cours. Un partage peut être
          retiré en cas de signalement légitime ou de risque pour la plateforme.
        </p>
      </LegalSection>

      <LegalSection title="6. Intelligence artificielle">
        <p>
          Les sorties de l'IA peuvent être incomplètes ou erronées. Elles constituent une aide et non une
          correction officielle, une décision de notation ou un avis professionnel. L'utilisateur doit
          vérifier toute information importante et le professeur conserve son jugement pédagogique.
        </p>
        <p>
          L'utilisateur ne doit pas envoyer de données sensibles inutiles ni d'informations concernant
          des tiers sans autorisation. Les fonctionnalités IA peuvent être suspendues si le fournisseur
          est indisponible ou si leur coût ne permet plus de les maintenir.
        </p>
      </LegalSection>

      <LegalSection title="7. Disponibilité et phase pilote">
        <p>
          Le service est fourni avec les moyens disponibles pendant sa phase pilote. Des interruptions
          peuvent intervenir pour maintenance, sécurité ou évolution. Les anomalies signalées sont
          traitées avec diligence, sans engagement de disponibilité continue ni d'absence totale d'erreur.
        </p>
      </LegalSection>

      <LegalSection title="8. Suspension ou fermeture">
        <p>
          Un compte peut être suspendu en cas de risque de sécurité, d'utilisation abusive, de partage
          d'accès, d'atteinte aux droits d'autrui ou de manquement grave aux présentes conditions. Sauf
          urgence ou obligation contraire, l'utilisateur peut contacter le support pour comprendre la mesure.
        </p>
        <p>
          L'utilisateur peut demander la fermeture de son compte et l'effacement de ses données selon
          les modalités de la <Link className="font-semibold text-ink underline" href="/confidentialite">politique de confidentialité</Link>.
        </p>
      </LegalSection>

      <LegalSection title="9. Responsabilité">
        <p>
          Chacun reste responsable de son usage du service, de ses sauvegardes utiles et de la vérification
          des contenus. Les limitations prévues ici ne s'appliquent pas lorsqu'elles sont interdites par la loi,
          notamment en cas de faute lourde, dol ou atteinte à l'intégrité physique.
        </p>
      </LegalSection>

      <LegalSection title="10. Évolution des conditions">
        <p>
          Les conditions peuvent évoluer pour tenir compte du produit, de la sécurité ou de la loi. Une
          modification importante sera signalée. La poursuite de l'utilisation pourra nécessiter une
          nouvelle acceptation de la version mise à jour.
        </p>
      </LegalSection>

      <LegalSection title="11. Droit applicable et contact">
        <p>
          Les présentes conditions sont soumises au droit français. Avant toute démarche contentieuse,
          l'utilisateur est invité à contacter <a className="font-semibold text-ink underline" href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a>
          {" "}pour rechercher une solution amiable, sans priver un consommateur de ses droits impératifs.
        </p>
      </LegalSection>
    </PublicPageShell>
  );
}
