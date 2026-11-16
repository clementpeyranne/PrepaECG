import Link from "next/link";
import { redirect } from "next/navigation";

import { loginAction } from "@/app/actions/auth";
import { AuthBrand, AuthOrbs, AuthPreview } from "@/components/public/auth-visual";
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
        <div className="stagger grid w-full gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="order-2 lg:order-1 panel-dark spotlight relative flex flex-col overflow-hidden rounded-[36px] p-8 text-sand shadow-panel lg:p-10">
            <AuthOrbs />
            <AuthBrand />
            <p className="text-xs uppercase tracking-[0.35em] text-sand/70">Bon retour</p>
            <h1 className="mt-4 font-display text-[2.6rem] font-semibold leading-[1.04] sm:text-5xl lg:text-[3.4rem]">
              Le travail du jour <span className="text-gradient-light">t’attend.</span>
            </h1>
            <p className="mt-5 max-w-md text-base leading-8 text-sand/80">
              Connecte-toi pour retrouver le programme prévu, les cartes à revoir et les retours sur les copies.
            </p>

            <AuthPreview
              items={[
                { icon: "planning", title: "Programme du jour", text: "Les séances prévues, prêtes à valider" },
                { icon: "flashcards", title: "Flashcards", text: "Les cartes arrivées à échéance" },
                { icon: "copies", title: "Copies", text: "Les corrections reçues des professeurs" }
              ]}
            />

            <p className="mt-auto pt-10 text-sm font-medium text-sand/70">Ton rythme. Tes ambitions.</p>
          </section>

          <section className="order-1 lg:order-2 panel-surface-strong spotlight rounded-[32px] p-6 shadow-panel lg:p-8">
            <p className="text-xs uppercase tracking-[0.25em] text-pine/75">Accès</p>
            <h2 className="mt-3 font-display text-3xl text-ink">Se connecter</h2>
            <p className="mt-2 text-sm leading-7 text-pine/85">
              Utilise l’adresse email et le mot de passe du compte.
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
                  className="w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3.5 text-sm outline-none transition focus:border-pine"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-pine/80">Mot de passe</span>
                <input
                  type="password"
                  name="password"
                  placeholder="Au moins 8 caractères"
                  className="w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3.5 text-sm outline-none transition focus:border-pine"
                />
              </label>

              <button
                type="submit"
                className="btn-primary w-full rounded-full px-5 py-3.5 text-sm font-semibold text-white"
              >
                Se connecter
              </button>
            </form>

            <div className="mt-4">
              <Link href="/forgot-password" className="text-sm font-semibold text-ink transition hover:text-pine">
                Mot de passe oublié ?
              </Link>
            </div>

            <p className="mt-5 text-sm text-pine/85">
              Pas encore de compte ?{" "}
              <Link href="/signup" className="font-semibold text-ink transition hover:text-pine">
                Créer un compte
              </Link>
            </p>

            <PublicFooterLinks className="mt-5" />
          </section>
        </div>
      </div>
    </main>
  );
}
