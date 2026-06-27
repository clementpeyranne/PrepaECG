import Link from "next/link";
import { redirect } from "next/navigation";

import { signupAction } from "@/app/actions/auth";
import { getCurrentUser, getUserLandingPath } from "@/lib/auth";
import { DEFAULT_CLASS_ACCESS_CODE } from "@/lib/reference-data";

export const dynamic = "force-dynamic";

export default async function SignupPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  if (user) {
    redirect(await getUserLandingPath(user));
  }

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const message =
    typeof resolvedSearchParams.message === "string" ? resolvedSearchParams.message : null;

  return (
    <main className="bg-app-gradient">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center px-4 py-8 lg:px-8">
        <div className="grid w-full gap-6 lg:grid-cols-[1fr_1fr]">
          <section className="rounded-[36px] bg-white/82 p-6 shadow-panel lg:p-8">
            <p className="text-xs uppercase tracking-[0.25em] text-pine/55">Inscription</p>
            <h1 className="mt-3 font-display text-3xl text-ink">Creer un compte</h1>
            <p className="mt-2 text-sm leading-7 text-pine/78">
              L&apos;inscription se fait dans l&apos;environnement de ta prepa grace a un code
              d&apos;acces. Cela permet d&apos;isoler les eleves et professeurs de chaque
              etablissement.
            </p>

            {message ? (
              <div className="mt-5 rounded-[20px] border border-clay/15 bg-clay/10 px-4 py-3 text-sm text-clay">
                {message}
              </div>
            ) : null}

            <form action={signupAction} className="mt-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-pine/80">Prenom</span>
                  <input
                    name="firstName"
                    className="w-full rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-pine"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-pine/80">Nom</span>
                  <input
                    name="lastName"
                    className="w-full rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-pine"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-pine/80">Email</span>
                <input
                  type="email"
                  name="email"
                  className="w-full rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-pine"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-pine/80">Mot de passe</span>
                <input
                  type="password"
                  name="password"
                  className="w-full rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-pine"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-pine/80">Je suis</span>
                <select
                  name="role"
                  defaultValue="student"
                  className="w-full rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-pine"
                >
                  <option value="student">Eleve</option>
                  <option value="teacher">Professeur</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-pine/80">
                  Code d&apos;etablissement
                </span>
                <input
                  name="accessCode"
                  defaultValue={DEFAULT_CLASS_ACCESS_CODE}
                  className="w-full rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm uppercase outline-none transition focus:border-pine"
                />
              </label>

              <button
                type="submit"
                className="w-full rounded-full bg-ink px-5 py-3 text-sm font-semibold text-sand transition hover:bg-pine"
              >
                Creer mon compte
              </button>
            </form>

            <p className="mt-5 text-sm text-pine/76">
              Deja un compte ?{" "}
              <Link href="/login" className="font-semibold text-ink transition hover:text-pine">
                Se connecter
              </Link>
            </p>
          </section>

          <section className="rounded-[36px] bg-ink p-8 text-sand shadow-panel lg:p-10">
            <p className="text-xs uppercase tracking-[0.35em] text-sand/55">Environnement</p>
            <h2 className="mt-4 font-display text-5xl leading-tight">
              Une prepa, un espace de travail ferme.
            </h2>
            <p className="mt-6 text-base leading-8 text-sand/78">
              Les copies, ressources, retours professeurs et interactions sensibles doivent rester
              dans le perimetre du bon etablissement. Le code d&apos;etablissement sert justement a
              lier eleves et professeurs a la meme prepa.
            </p>

            <div className="mt-8 space-y-3 text-sm text-sand/86">
              <p>1. Un compte rejoint un environnement de prepa</p>
              <p>2. Les ressources restent visibles dans cet environnement</p>
              <p>3. Les copies sont adressees aux professeurs de cette meme prepa</p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
