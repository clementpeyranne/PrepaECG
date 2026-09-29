import Link from "next/link";

import { LegalList, LegalMeta, LegalSection } from "@/components/public/legal-document";
import { PublicPageShell } from "@/components/public/public-page-shell";
import { LEGAL_LAST_UPDATED_LABEL, PRIVACY_VERSION } from "@/lib/legal";
import { getPublicSiteConfig } from "@/lib/public-site";

const processing = [
  {
    title: "Compte et rattachement a la prepa",
    data: "Nom, prenom, email, role, etablissement, langue vivante et parametres du profil.",
    purpose: "Creer l'espace personnel, isoler chaque etablissement et gerer les acces.",
    basis: "Execution du service demande et interet legitime de securisation.",
    retention: "Pendant la vie du compte, puis suppression des donnees actives apres une demande de fermeture validee, sous reserve des sauvegardes techniques temporaires."
  },
  {
    title: "Travail et progression",
    data: "Planning, temps de travail valide, flashcards et revisions, notes, objectifs, points a consolider et statistiques de progression.",
    purpose: "Fournir le suivi pedagogique et adapter les outils de travail.",
    basis: "Execution du service demande.",
    retention: "Pendant la vie du compte ou jusqu'a suppression par l'utilisateur lorsque la fonction le permet."
  },
  {
    title: "Documents et echanges pedagogiques",
    data: "Cours, ressources, copies, photos ou PDF, corrections, grilles et commentaires professeur.",
    purpose: "Permettre les depots, corrections et partages au sein du bon etablissement.",
    basis: "Execution du service demande.",
    retention: "Pendant la vie du compte et tant que le partage pedagogique reste necessaire, puis suppression sur demande legitime ou fermeture du service."
  },
  {
    title: "Fonctions d'intelligence artificielle",
    data: "Demande saisie et, uniquement si l'utilisateur les associe a l'action, extraits de ressources, copies, corrections ou contexte de progression.",
    purpose: "Repondre, resumer, creer des fiches ou cartes et proposer une correction ou un planning.",
    basis: "Execution de la fonctionnalite demandee par l'utilisateur.",
    retention: "Les metadonnees de generation suivent la vie du compte. Si OpenAI est active, les donnees API suivent aussi les conditions de conservation du fournisseur indiquees ci-dessous."
  },
  {
    title: "Securite et assistance",
    data: "Dates de connexion, type d'appareil, evenement de securite, empreintes quotidiennes non reversibles de l'email et de l'adresse reseau, demandes de support.",
    purpose: "Proteger les comptes, prevenir les abus, diagnostiquer un incident et assister les utilisateurs.",
    basis: "Interet legitime a securiser le service et ses utilisateurs.",
    retention: "Journaux de securite : 90 jours maximum. Compteurs anti-abus : 15 minutes. Echanges de support : le temps necessaire a la resolution puis archivage limite."
  }
];

export default function PrivacyPage() {
  const site = getPublicSiteConfig();
  return (
    <PublicPageShell
      eyebrow="Protection des donnees"
      title="Politique de confidentialite"
      intro="Cette politique explique simplement quelles donnees sont utilisees, pourquoi, par qui et pendant combien de temps."
    >
      <LegalMeta version={`${PRIVACY_VERSION} - mise a jour ${LEGAL_LAST_UPDATED_LABEL}`} />

      <LegalSection title="Responsable du traitement">
        <p>
          Le responsable du traitement est <strong>{site.legalName}</strong>, {site.legalStatus}, joignable
          pour toute question relative aux donnees a <a className="font-semibold text-ink underline" href={`mailto:${site.privacyEmail}`}>{site.privacyEmail}</a>.
        </p>
      </LegalSection>

      <LegalSection title="Donnees, finalites et durees">
        <div className="grid gap-4">
          {processing.map((item) => (
            <article key={item.title} className="rounded-[22px] border border-ink/8 bg-white/65 p-5">
              <h3 className="font-semibold text-ink">{item.title}</h3>
              <dl className="mt-3 grid gap-2">
                <div><dt className="inline font-semibold text-pine">Donnees : </dt><dd className="inline">{item.data}</dd></div>
                <div><dt className="inline font-semibold text-pine">Pourquoi : </dt><dd className="inline">{item.purpose}</dd></div>
                <div><dt className="inline font-semibold text-pine">Base legale : </dt><dd className="inline">{item.basis}</dd></div>
                <div><dt className="inline font-semibold text-pine">Conservation : </dt><dd className="inline">{item.retention}</dd></div>
              </dl>
            </article>
          ))}
        </div>
      </LegalSection>

      <LegalSection title="Qui peut acceder aux donnees ?">
        <LegalList items={[
          "L'utilisateur accede a ses propres donnees et contenus.",
          "Les professeurs accedent uniquement aux ressources de leur environnement et aux copies qui leur sont adressees.",
          "L'administrateur gere les comptes, les etablissements et la securite ; l'administration n'est pas un outil de surveillance pedagogique individuelle.",
          "Les prestataires techniques n'accedent aux donnees que pour fournir leurs services et selon leurs engagements contractuels."
        ]} />
      </LegalSection>

      <LegalSection title="Prestataires et transferts">
        <LegalList items={[
          "Vercel Inc. : hebergement et execution de l'application.",
          "Supabase : base PostgreSQL et stockage prive des PDF, photos et ressources, actuellement dans la region Stockholm de l'Union europeenne.",
          "Resend : envoi des emails de recuperation uniquement lorsqu'il sera active.",
          "OpenAI : fonctions IA uniquement lorsqu'une cle API est active et qu'une action IA est demandee. Les donnees envoyees via l'API ne sont pas utilisees par defaut pour entrainer les modeles."
        ]} />
        <p>
          Certains prestataires sont etablis hors de l'Espace economique europeen. Les transferts
          eventuels doivent etre encadres par les mecanismes prevus par le RGPD et les accords de
          traitement applicables. Les fonctions Resend et OpenAI restent inactives tant que leur
          configuration n'est pas finalisee.
        </p>
      </LegalSection>

      <LegalSection title="Intelligence artificielle">
        <p>
          L'IA fournit une aide au travail et une indication pedagogique. Elle ne prend aucune decision
          produisant un effet juridique sur l'eleve, ne remplace pas le professeur et peut commettre des
          erreurs. Une note ou correction generee par IA doit etre verifiee avant d'etre utilisee.
        </p>
        <p>
          Evite d'inclure des donnees sensibles ou des informations concernant des tiers dans une
          demande. Les documents ne sont joints a une demande IA que lorsque la fonctionnalite le prevoit.
        </p>
      </LegalSection>

      <LegalSection title="Tes droits">
        <p>
          Tu peux demander l'acces, la rectification, l'effacement, la limitation ou la portabilite de
          tes donnees et t'opposer aux traitements fondes sur l'interet legitime. Ecris a
          {" "}<a className="font-semibold text-ink underline" href={`mailto:${site.privacyEmail}?subject=Exercice%20de%20mes%20droits%20RGPD`}>{site.privacyEmail}</a>.
          Une preuve d'identite peut etre demandee uniquement en cas de doute raisonnable sur l'auteur de la demande.
        </p>
        <p>
          Une reponse est apportee dans le delai legal, en principe un mois. Tu peux aussi adresser une
          reclamation a la <a className="font-semibold text-ink underline" href="https://www.cnil.fr/fr/plaintes" target="_blank" rel="noreferrer">CNIL</a>.
        </p>
      </LegalSection>

      <LegalSection title="Mineurs">
        <p>
          Le service est destine aux preparationnaires. Un utilisateur de moins de 15 ans ne doit pas
          creer seul un compte lorsque le traitement repose sur son consentement ; l'accord conjoint
          du titulaire de l'autorite parentale est alors requis. L'information doit rester comprise par
          l'eleve, qui peut exercer ses droits directement.
        </p>
      </LegalSection>

      <LegalSection title="Cookies et stockage sur l'appareil">
        <p>
          Aucun traceur publicitaire ni outil de mesure d'audience n'est actuellement installe. Le
          service utilise seulement une session de connexion et des preferences locales indispensables
          ou demandees. Le detail figure sur la page <Link className="font-semibold text-ink underline" href="/cookies">Cookies et stockage local</Link>.
        </p>
      </LegalSection>

      <LegalSection title="Evolution de cette politique">
        <p>
          Toute evolution importante des finalites, des destinataires ou des droits fera l'objet d'une
          information visible. La version et la date de mise a jour permettent d'identifier le texte applicable.
        </p>
      </LegalSection>
    </PublicPageShell>
  );
}
