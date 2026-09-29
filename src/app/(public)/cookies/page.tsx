import { LegalMeta, LegalSection } from "@/components/public/legal-document";
import { PublicPageShell } from "@/components/public/public-page-shell";
import { LEGAL_LAST_UPDATED_LABEL } from "@/lib/legal";

const entries = [
  {
    name: "prepa_auth",
    place: "Cookie securise et inaccessible au JavaScript",
    purpose: "Maintenir la connexion et proteger l'acces au compte.",
    duration: "14 jours maximum ou jusqu'a la deconnexion."
  },
  {
    name: "prepa-theme",
    place: "Stockage local du navigateur",
    purpose: "Memoriser l'ambiance visuelle choisie.",
    duration: "Jusqu'a sa suppression dans les donnees du navigateur."
  },
  {
    name: "prepa-install-prompt-dismissed",
    place: "Stockage local du navigateur",
    purpose: "Ne plus afficher la proposition d'installation apres son refus.",
    duration: "Jusqu'a sa suppression dans les donnees du navigateur."
  },
  {
    name: "Historique local de l'assistant",
    place: "Stockage local du navigateur",
    purpose: "Retrouver les conversations sur l'appareil utilise.",
    duration: "Jusqu'a leur suppression dans l'interface ou dans les donnees du navigateur."
  }
];

export default function CookiesPage() {
  return (
    <PublicPageShell
      eyebrow="Traceurs"
      title="Cookies et stockage local"
      intro="Le service n'utilise actuellement ni publicite, ni suivi inter-sites, ni mesure d'audience."
    >
      <LegalMeta version={LEGAL_LAST_UPDATED_LABEL} />
      <LegalSection title="Pourquoi aucune banniere n'est affichee">
        <p>
          Les seuls mecanismes actuellement utilises sont strictement necessaires a la connexion ou
          servent a memoriser des choix demandes par l'utilisateur. Aucun consentement publicitaire ou
          analytique n'est donc sollicite. Une banniere de choix sera ajoutee avant l'activation de tout
          traceur non essentiel.
        </p>
      </LegalSection>

      <LegalSection title="Liste des stockages">
        <div className="grid gap-4">
          {entries.map((entry) => (
            <article key={entry.name} className="rounded-[22px] border border-ink/8 bg-white/65 p-5">
              <h3 className="font-semibold text-ink">{entry.name}</h3>
              <p className="mt-2"><strong>Emplacement :</strong> {entry.place}</p>
              <p><strong>Finalite :</strong> {entry.purpose}</p>
              <p><strong>Duree :</strong> {entry.duration}</p>
            </article>
          ))}
        </div>
      </LegalSection>

      <LegalSection title="Comment les supprimer">
        <p>
          La deconnexion supprime la session. Les autres preferences peuvent etre supprimees depuis les
          reglages de donnees du navigateur. Cette suppression peut reinitialiser le theme, la proposition
          d'installation et l'historique local de l'assistant, sans effacer les documents enregistres sur le compte.
        </p>
      </LegalSection>
    </PublicPageShell>
  );
}
