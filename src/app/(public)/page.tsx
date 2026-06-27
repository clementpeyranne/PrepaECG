import Link from "next/link";

import { continueAsCurrentUserAction } from "@/app/actions/auth";
import { getCurrentUser } from "@/lib/auth";

const pillars = [
  {
    title: "Savoir quoi travailler",
    text: "Un tableau de bord quotidien qui transforme les lacunes, les cartes dues et les echeances en actions concretes."
  },
  {
    title: "Memoriser durablement",
    text: "Un moteur de flashcards integre au reste de l'application pour faire remonter ce qui compte au bon moment."
  },
  {
    title: "Booster les resultats concours",
    text: "Des ressources, un feedback IA structure et un planning qui aide a convertir le volume de travail en progression."
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
              <p className="text-xs uppercase tracking-[0.35em] text-sand/60">Plateforme de travail</p>
              <h1 className="mt-4 max-w-4xl font-display text-5xl leading-tight lg:text-7xl">
                Le centre du travail quotidien en prepa ECG.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-sand/78">
                Planning, flashcards, ressources, copies, progression et assistant reunis dans un
                seul espace de travail.
              </p>
            </div>

            <div className="rounded-[30px] bg-sand/8 p-6 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.25em] text-sand/50">Boucle produit</p>
              <div className="mt-4 space-y-3 text-sm text-sand/85">
                <p>1. Detecter les lacunes</p>
                <p>2. Prioriser la bonne matiere</p>
                <p>3. Planifier une session realiste</p>
                <p>4. Reviser activement</p>
                <p>5. Reintegrer le feedback dans le systeme</p>
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
                  Reprendre mon espace
                </button>
              </form>
            ) : (
              <>
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center rounded-full bg-clay px-6 py-3 text-sm font-semibold text-white transition hover:bg-clay/90"
                >
                  Creer un compte
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
              <p className="text-xs uppercase tracking-[0.25em] text-pine/60">Fonction cle</p>
              <h2 className="mt-3 font-display text-2xl text-ink">{pillar.title}</h2>
              <p className="mt-3 text-sm leading-7 text-pine/80">{pillar.text}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
