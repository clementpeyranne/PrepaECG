import Link from "next/link";
import { redirect } from "next/navigation";

import { loginAction } from "@/app/actions/auth";
import { PublicFooterLinks } from "@/components/public/public-footer-links";
import { getCurrentUser, getUserLandingPath } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage({
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
        <div className="grid w-full gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-[36px] bg-ink p-8 text-sand shadow-panel lg:p-10">
            <p className="text-xs uppercase tracking-[0.35em] text-sand/55">Connexion</p>
            <h1 className="mt-4 font-display text-5xl leading-tight lg:text-6xl">
              Retrouver ton espace de travail personnel.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-sand/78">
              Retrouve tes cartes, tes copies, tes ressources et ton planning dans ton espace
              personnel.
            </p>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                "Connexion par email et mot de passe",
                "Session personnelle securisee",
                "Acces eleve ou professeur"
              ].map((item) => (
                <div key={item} className="rounded-[24px] bg-sand/8 p-4 text-sm text-sand/85">
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[32px] border border-white/70 bg-white/82 p-6 shadow-panel lg:p-8">
            <p className="text-xs uppercase tracking-[0.25em] text-pine/55">Acces</p>
            <h2 className="mt-3 font-display text-3xl text-ink">Se connecter</h2>
            <p className="mt-2 text-sm leading-7 text-pine/78">
              Connecte-toi avec ton compte pour retrouver ton avancement personnel.
            </p>

            {message ? (
              <div className="mt-5 rounded-[20px] border border-clay/15 bg-clay/10 px-4 py-3 text-sm text-clay">
                {message}
              </div>
            ) : null}

            <form action={loginAction} className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-pine/80">Email</span>
                <input
                  type="email"
                  name="email"
                  placeholder="toi@exemple.fr"
                  className="w-full rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-pine"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-pine/80">Mot de passe</span>
                <input
                  type="password"
                  name="password"
                  placeholder="Au moins 8 caracteres"
                  className="w-full rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-pine"
                />
              </label>

              <button
                type="submit"
                className="w-full rounded-full bg-ink px-5 py-3 text-sm font-semibold text-sand transition hover:bg-pine"
              >
                Se connecter
              </button>
            </form>

            <div className="mt-4">
              <Link href="/forgot-password" className="text-sm font-semibold text-ink transition hover:text-pine">
                Mot de passe oublie ?
              </Link>
            </div>

            <p className="mt-5 text-sm text-pine/76">
              Pas encore de compte ?{" "}
              <Link href="/signup" className="font-semibold text-ink transition hover:text-pine">
                Creer un compte
              </Link>
            </p>

            <PublicFooterLinks className="mt-5" />
          </section>
        </div>
      </div>
    </main>
  );
}
