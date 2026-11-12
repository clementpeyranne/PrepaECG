import { LegalMeta, LegalSection } from "@/components/public/legal-document";
import { PublicPageShell } from "@/components/public/public-page-shell";
import { LEGAL_LAST_UPDATED_LABEL } from "@/lib/legal";

const entries = [
  {
    name: "prepa_auth",
    place: "Cookie sécurisé et inaccessible au JavaScript",
    purpose: "Maintenir la connexion et protéger l'accès au compte.",
    duration: "14 jours maximum ou jusqu'à la déconnexion."
  },
  {
    name: "prepa-theme",
    place: "Stockage local du navigateur",
    purpose: "Mémoriser l'ambiance visuelle choisie.",
    duration: "Jusqu'à sa suppression dans les données du navigateur."
  },
  {
    name: "prepa-install-prompt-dismissed",
    place: "Stockage local du navigateur",
    purpose: "Ne plus afficher la proposition d'installation après son refus.",
    duration: "Jusqu'à sa suppression dans les données du navigateur."
  },
  {
    name: "Historique local de l'assistant",
    place: "Stockage local du navigateur",
    purpose: "Retrouver les conversations sur l'appareil utilisé.",
    duration: "Jusqu'à leur suppression dans l'interface ou dans les données du navigateur."
  }
];

export default function CookiesPage() {
  return (
    <PublicPageShell
      eyebrow="Traceurs"
      title="Cookies et stockage local"
      intro="Le service n'utilise actuellement ni publicité, ni suivi inter-sites, ni mesure d'audience."
    >
      <LegalMeta version={LEGAL_LAST_UPDATED_LABEL} />
      <LegalSection title="Pourquoi aucune bannière n'est affichée">
        <p>
          Les seuls mécanismes actuellement utilisés sont strictement nécessaires à la connexion ou
          servent à mémoriser des choix demandés par l'utilisateur. Aucun consentement publicitaire ou
          analytique n'est donc sollicité. Une bannière de choix sera ajoutée avant l'activation de tout
          traceur non essentiel.
        </p>
      </LegalSection>

      <LegalSection title="Liste des stockages">
        <div className="grid gap-4">
          {entries.map((entry) => (
            <article key={entry.name} className="rounded-[22px] border border-ink/8 bg-white/65 p-5">
              <h3 className="font-semibold text-ink">{entry.name}</h3>
              <p className="mt-2"><strong>Emplacement :</strong> {entry.place}</p>
              <p><strong>Finalité :</strong> {entry.purpose}</p>
              <p><strong>Durée :</strong> {entry.duration}</p>
            </article>
          ))}
        </div>
      </LegalSection>

      <LegalSection title="Comment les supprimer">
        <p>
          La déconnexion supprime la session. Les autres préférences peuvent être supprimées depuis les
          réglages de données du navigateur. Cette suppression peut réinitialiser le thème, la proposition
          d'installation et l'historique local de l'assistant, sans effacer les documents enregistrés sur le compte.
        </p>
      </LegalSection>
    </PublicPageShell>
  );
}
