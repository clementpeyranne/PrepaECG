import { PublicPageShell } from "@/components/public/public-page-shell";

const points = [
  "Le compte est personnel et ne doit pas etre partage.",
  "Les contenus deposes doivent rester conformes au cadre scolaire et au droit applicable.",
  "Chaque utilisateur s'engage a respecter l'etablissement auquel il est rattache.",
  "Les fonctionnalites IA viennent en appui du travail, sans remplacer le jugement pedagogique du professeur.",
  "L'editeur peut faire evoluer le service pour des raisons de securite, d'amelioration ou de maintenance."
];

export default function TermsPage() {
  return (
    <PublicPageShell
      eyebrow="Conditions"
      title="Conditions generales d'utilisation"
      intro="L'usage de la plateforme implique l'acceptation du cadre ci-dessous."
    >
      <div className="space-y-4">
        {points.map((point, index) => (
          <section key={point} className="rounded-[24px] bg-white/82 p-5 shadow-panel">
            <p className="text-xs uppercase tracking-[0.25em] text-pine/55">Point {index + 1}</p>
            <p className="mt-3 text-sm leading-8 text-pine/82">{point}</p>
          </section>
        ))}
      </div>
    </PublicPageShell>
  );
}
