import Link from "next/link";

import { continueAsCurrentUserAction } from "@/app/actions/auth";
import { PublicFooterLinks } from "@/components/public/public-footer-links";
import { getCurrentUser } from "@/lib/auth";

const pillars = [
  {
    title: "Organiser le travail",
    text: "Un planning pour répartir les révisions et préparer les prochaines échéances."
  },
  {
    title: "Mémoriser durablement",
    text: "Des flashcards à revoir au bon moment, selon les réponses et les révisions précédentes."
  },
  {
    title: "S’entraîner aux concours",
    text: "Des annales et un espace pour déposer les copies et retrouver les corrections."
  }
];

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <main className="bg-app-gradient">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 lg:px-8">
        <section className="overflow-hidden rounded-[36px] bg-ink px-6 py-8 text-sand shadow-panel lg:px-10 lg:py-10">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-sand/60">Prépatempo</p>
              <h1 className="mt-4 max-w-4xl font-display text-5xl leading-tight lg:text-7xl">
                Le centre du travail quotidien en prépa ECG.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-sand/78">
                Planning, flashcards, ressources, copies, progression et assistant reunis dans un
                seul espace de travail.
              </p>
            </div>

            <div className="rounded-[30px] bg-sand/8 p-6 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.25em] text-sand/50">Au quotidien</p>
              <div className="mt-4 space-y-3 text-sm text-sand/85">
                <p>Organiser les séances de travail</p>
                <p>Réviser les cours et les flashcards</p>
                <p>S’entraîner avec les annales</p>
                <p>Retrouver les corrections</p>
                <p>Suivre les résultats</p>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            {user ? (
              <form action={continueAsCurrentUserAction}>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-full bg-clay px-6 py-3 text-sm font-semibold text-white transition hover:bg-clay/90"
                >
                  Ouvrir l’espace de travail
                </button>
              </form>
            ) : (
              <>
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center rounded-full bg-clay px-6 py-3 text-sm font-semibold text-white transition hover:bg-clay/90"
                >
                  Créer un compte
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-full border border-sand/15 px-6 py-3 text-sm font-semibold text-sand transition hover:border-sand/35"
                >
                  Se connecter
                </Link>
              </>
            )}
          </div>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-3">
          {pillars.map((pillar) => (
            <article key={pillar.title} className="rounded-[28px] bg-white/80 p-6 shadow-panel">
              <h2 className="mt-3 font-display text-2xl text-ink">{pillar.title}</h2>
              <p className="mt-3 text-sm leading-7 text-pine/80">{pillar.text}</p>
            </article>
          ))}
        </section>

        <footer className="mt-6 flex flex-col gap-3 rounded-[24px] bg-white/70 px-5 py-4 shadow-panel">
          <PublicFooterLinks />
          <p className="text-sm text-pine/72">
            Une plateforme unique pour organiser le travail, mémoriser et progresser sans se
            disperser.
          </p>
        </footer>
      </div>
    </main>
  );
}
