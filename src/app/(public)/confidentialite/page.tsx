import { PublicPageShell } from "@/components/public/public-page-shell";

const sections = [
  {
    title: "Donnees traitees",
    text: "La plateforme traite les donnees utiles au fonctionnement du compte, du planning, des flashcards, des copies, des ressources et du suivi de progression."
  },
  {
    title: "Finalites",
    text: "Ces donnees servent a faire fonctionner l'espace personnel, personnaliser l'accompagnement, permettre les interactions avec les professeurs et securiser l'acces a l'etablissement rattache."
  },
  {
    title: "Conservation",
    text: "Les donnees sont conservees pendant la duree necessaire a l'usage pedagogique du service, puis supprimees ou anonymisees selon les contraintes legales et operationnelles retenues."
  },
  {
    title: "Droits",
    text: "Chaque utilisateur peut demander l'acces, la rectification ou la suppression de ses donnees, dans la limite des obligations legales de conservation et des contraintes de securite."
  }
];

export default function PrivacyPage() {
  return (
    <PublicPageShell
      eyebrow="Protection des donnees"
      title="Politique de confidentialite"
      intro="Cette page resume comment les donnees personnelles sont utilisees dans l'application."
    >
      <div className="grid gap-5 lg:grid-cols-2">
        {sections.map((section) => (
          <section key={section.title} className="rounded-[24px] bg-white/80 p-5 shadow-panel">
            <h2 className="font-display text-2xl text-ink">{section.title}</h2>
            <p className="mt-3 text-sm leading-8 text-pine/80">{section.text}</p>
          </section>
        ))}
      </div>
    </PublicPageShell>
  );
}
