import Link from "next/link";
import { redirect } from "next/navigation";

import { forgotPasswordAction } from "@/app/actions/auth";
import { PublicFooterLinks } from "@/components/public/public-footer-links";
import { getPasswordResetMode, isDemoModeEnabled } from "@/lib/app-config";
import { getCurrentUser, getUserLandingPath } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ForgotPasswordPage({
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
  const resetLink =
    typeof resolvedSearchParams.resetLink === "string" ? resolvedSearchParams.resetLink : null;
  const resetMode = getPasswordResetMode();

  return (
    <main className="bg-app-gradient">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center px-4 py-8 lg:px-8">
        <div className="grid w-full gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="panel-dark rounded-[36px] p-8 text-sand shadow-panel lg:p-10">
            <p className="text-xs uppercase tracking-[0.35em] text-sand/55">Recuperation</p>
            <h1 className="mt-4 font-display text-5xl leading-tight lg:text-6xl">
              Recuperer l'acces a ton compte.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-sand/78">
              Entre ton email pour lancer la reinitialisation du mot de passe.
            </p>

            <div className="mt-10 rounded-[24px] bg-sand/8 p-5 text-sm leading-7 text-sand/82">
              {resetMode === "direct-link" || isDemoModeEnabled()
                ? "Un lien de reinitialisation pourra etre ouvert directement depuis cette page."
                : "En phase publique, le lien pourra ensuite etre envoye par email ou gere par le support."}
            </div>
          </section>

          <section className="rounded-[32px] border border-white/70 bg-white/82 p-6 shadow-panel lg:p-8">
            <p className="text-xs uppercase tracking-[0.25em] text-pine/55">Mot de passe</p>
            <h2 className="mt-3 font-display text-3xl text-ink">Reinitialiser</h2>

            {message ? (
              <div className="mt-5 rounded-[20px] border border-clay/15 bg-clay/10 px-4 py-3 text-sm text-clay">
                {message}
              </div>
            ) : null}

            <form action={forgotPasswordAction} className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-pine/80">Email</span>
                <input
                  type="email"
                  name="email"
                  placeholder="toi@exemple.fr"
                  className="w-full rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-pine"
                />
              </label>

              <button
                type="submit"
                className="w-full rounded-full bg-ink px-5 py-3 text-sm font-semibold text-sand transition hover:bg-pine"
              >
                Generer un lien
              </button>
            </form>

            {resetLink ? (
              <div className="mt-5 rounded-[20px] border border-pine/15 bg-pine/8 px-4 py-4 text-sm text-pine">
                <p className="font-semibold text-ink">Lien pret</p>
                <a className="mt-2 block break-all text-sm text-pine transition hover:text-ink" href={resetLink}>
                  {resetLink}
                </a>
              </div>
            ) : null}

            <div className="mt-6 flex flex-col gap-3">
              <Link href="/login" className="text-sm font-semibold text-ink transition hover:text-pine">
                Retour a la connexion
              </Link>
              <PublicFooterLinks />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
