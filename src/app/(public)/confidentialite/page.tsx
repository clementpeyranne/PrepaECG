import Link from "next/link";

import { LegalList, LegalMeta, LegalSection } from "@/components/public/legal-document";
import { PublicPageShell } from "@/components/public/public-page-shell";
import { LEGAL_LAST_UPDATED_LABEL, PRIVACY_VERSION } from "@/lib/legal";
import { getPublicSiteConfig } from "@/lib/public-site";

const processing = [
  {
    title: "Compte et rattachement à la prépa",
    data: "Nom, prénom, email, rôle, établissement, langue vivante et paramètres du profil.",
    purpose: "Créer l'espace personnel, isoler chaque établissement et gérer les accès.",
    basis: "Exécution du service demandé et intérêt légitime de sécurisation.",
    retention: "Pendant la vie du compte, puis suppression des données actives après une demande de fermeture validée, sous réserve des sauvegardes techniques temporaires."
  },
  {
    title: "Travail et progression",
    data: "Planning, temps de travail validé, flashcards et révisions, notes, objectifs, points à consolider et statistiques de progression.",
    purpose: "Fournir le suivi pédagogique et adapter les outils de travail.",
    basis: "Exécution du service demandé.",
    retention: "Pendant la vie du compte ou jusqu'à suppression par l'utilisateur lorsque la fonction le permet."
  },
  {
    title: "Documents et échanges pédagogiques",
    data: "Cours, ressources, copies, photos ou PDF, corrections, grilles et commentaires professeur.",
    purpose: "Permettre les dépôts, corrections et partages au sein du bon établissement.",
    basis: "Exécution du service demandé.",
    retention: "Pendant la vie du compte et tant que le partage pédagogique reste nécessaire, puis suppression sur demande légitime ou fermeture du service."
  },
  {
    title: "Fonctions d'intelligence artificielle",
    data: "Demande saisie et, uniquement si l'utilisateur les associe à l'action, extraits de ressources, copies, corrections ou contexte de progression.",
    purpose: "Répondre, résumer, créer des fiches ou cartes et proposer une correction ou un planning.",
    basis: "Exécution de la fonctionnalité demandée par l'utilisateur.",
    retention: "Les métadonnées de génération suivent la vie du compte. Si OpenAI est activé, les données API suivent aussi les conditions de conservation du fournisseur indiquées ci-dessous."
  },
  {
    title: "Sécurité et assistance",
    data: "Dates de connexion, type d'appareil, événement de sécurité, empreintes quotidiennes non réversibles de l'email et de l'adresse réseau, demandes de support.",
    purpose: "Protéger les comptes, prévenir les abus, diagnostiquer un incident et assister les utilisateurs.",
    basis: "Intérêt légitime à sécuriser le service et ses utilisateurs.",
    retention: "Journaux de sécurité : 90 jours maximum. Compteurs anti-abus : 15 minutes. Échanges de support : le temps nécessaire à la résolution puis archivage limité."
  }
];

export default function PrivacyPage() {
  const site = getPublicSiteConfig();
  return (
    <PublicPageShell
      eyebrow="Protection des données"
      title="Politique de confidentialité"
      intro="Cette politique explique simplement quelles données sont utilisées, pourquoi, par qui et pendant combien de temps."
    >
      <LegalMeta version={`${PRIVACY_VERSION} - mise à jour ${LEGAL_LAST_UPDATED_LABEL}`} />

      <LegalSection title="Responsable du traitement">
        <p>
          Le responsable du traitement est <strong>{site.legalName}</strong>, {site.legalStatus}, joignable
          pour toute question relative aux données à <a className="font-semibold text-ink underline" href={`mailto:${site.privacyEmail}`}>{site.privacyEmail}</a>.
        </p>
      </LegalSection>

      <LegalSection title="Données, finalités et durées">
        <div className="grid gap-4">
          {processing.map((item) => (
            <article key={item.title} className="rounded-[22px] border border-ink/8 bg-white/65 p-5">
              <h3 className="font-semibold text-ink">{item.title}</h3>
              <dl className="mt-3 grid gap-2">
                <div><dt className="inline font-semibold text-pine">Données : </dt><dd className="inline">{item.data}</dd></div>
                <div><dt className="inline font-semibold text-pine">Pourquoi : </dt><dd className="inline">{item.purpose}</dd></div>
                <div><dt className="inline font-semibold text-pine">Base légale : </dt><dd className="inline">{item.basis}</dd></div>
                <div><dt className="inline font-semibold text-pine">Conservation : </dt><dd className="inline">{item.retention}</dd></div>
              </dl>
            </article>
          ))}
        </div>
      </LegalSection>

      <LegalSection title="Qui peut accéder aux données ?">
        <LegalList items={[
          "L'utilisateur accède à ses propres données et contenus.",
          "Les professeurs accèdent uniquement aux ressources de leur environnement et aux copies qui leur sont adressées.",
          "L'administrateur gère les comptes, les établissements et la sécurité ; l'administration n'est pas un outil de surveillance pédagogique individuelle.",
          "Les prestataires techniques n'accèdent aux données que pour fournir leurs services et selon leurs engagements contractuels."
        ]} />
      </LegalSection>

      <LegalSection title="Prestataires et transferts">
        <LegalList items={[
          "Vercel Inc. : hébergement et exécution de l'application.",
          "Supabase : base PostgreSQL et stockage privé des PDF, photos et ressources, actuellement dans la région Stockholm de l'Union européenne.",
          "Resend : envoi des emails de récupération uniquement lorsqu'il sera activé.",
          "OpenAI : fonctions IA uniquement lorsqu'une clé API est active et qu'une action IA est demandée. Les données envoyées via l'API ne sont pas utilisées par défaut pour entraîner les modèles."
        ]} />
        <p>
          Certains prestataires sont établis hors de l'Espace économique européen. Les transferts
          éventuels doivent être encadrés par les mécanismes prévus par le RGPD et les accords de
          traitement applicables. Les fonctions Resend et OpenAI restent inactives tant que leur
          configuration n'est pas finalisée.
        </p>
      </LegalSection>

      <LegalSection title="Intelligence artificielle">
        <p>
          L'IA fournit une aide au travail et une indication pédagogique. Elle ne prend aucune décision
          produisant un effet juridique sur l'élève, ne remplace pas le professeur et peut commettre des
          erreurs. Une note ou correction générée par IA doit être vérifiée avant d'être utilisée.
        </p>
        <p>
          Évite d'inclure des données sensibles ou des informations concernant des tiers dans une
          demande. Les documents ne sont joints à une demande IA que lorsque la fonctionnalité le prévoit.
        </p>
      </LegalSection>

      <LegalSection title="Tes droits">
        <p>
          Tu peux demander l'accès, la rectification, l'effacement, la limitation ou la portabilité de
          tes données et t'opposer aux traitements fondés sur l'intérêt légitime. Écris à
          {" "}<a className="font-semibold text-ink underline" href={`mailto:${site.privacyEmail}?subject=Exercice%20de%20mes%20droits%20RGPD`}>{site.privacyEmail}</a>.
          Une preuve d'identité peut être demandée uniquement en cas de doute raisonnable sur l'auteur de la demande.
        </p>
        <p>
          Une réponse est apportée dans le délai légal, en principe un mois. Tu peux aussi adresser une
          réclamation à la <a className="font-semibold text-ink underline" href="https://www.cnil.fr/fr/plaintes" target="_blank" rel="noreferrer">CNIL</a>.
        </p>
      </LegalSection>

      <LegalSection title="Mineurs">
        <p>
          Le service est destiné aux préparationnaires. Un utilisateur de moins de 15 ans ne doit pas
          créer seul un compte lorsque le traitement repose sur son consentement ; l'accord conjoint
          du titulaire de l'autorité parentale est alors requis. L'information doit rester comprise par
          l'élève, qui peut exercer ses droits directement.
        </p>
      </LegalSection>

      <LegalSection title="Cookies et stockage sur l'appareil">
        <p>
          Aucun traceur publicitaire ni outil de mesure d'audience n'est actuellement installé. Le
          service utilise seulement une session de connexion et des préférences locales indispensables
          ou demandées. Le détail figure sur la page <Link className="font-semibold text-ink underline" href="/cookies">Cookies et stockage local</Link>.
        </p>
      </LegalSection>

      <LegalSection title="Évolution de cette politique">
        <p>
          Toute évolution importante des finalités, des destinataires ou des droits fera l'objet d'une
          information visible. La version et la date de mise à jour permettent d'identifier le texte applicable.
        </p>
      </LegalSection>
    </PublicPageShell>
  );
}
