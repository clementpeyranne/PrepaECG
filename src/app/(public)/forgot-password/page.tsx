import Link from "next/link";
import { redirect } from "next/navigation";

import { forgotPasswordAction } from "@/app/actions/auth";
import { PublicFooterLinks } from "@/components/public/public-footer-links";
import { getPasswordResetMode } from "@/lib/app-config";
import { getCurrentUser, getUserLandingPath } from "@/lib/auth";
import { isRecoveryEmailConfigured } from "@/lib/mail";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false }, referrer: "no-referrer" as const };

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
  const resetMode = getPasswordResetMode();
  const emailEnabled = resetMode === "email" && isRecoveryEmailConfigured();
  const resetToken = resolvedSearchParams.resetToken;
  const resetLink = resetMode === "direct-link" && typeof resetToken === "string" && /^[a-f0-9]{64}$/.test(resetToken)
    ? `/reset-password?token=${resetToken}`
    : null;
  const configuredEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() ?? "";
  const supportEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(configuredEmail) && !configuredEmail.includes("a-renseigner")
    ? configuredEmail
    : null;

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
              {resetMode === "direct-link"
                ? "Entre ton email pour reinitialiser ton compte de demonstration."
                : emailEnabled ? "Indique ton email pour recevoir un lien valable une heure."
                : "La reinitialisation automatique par email n'est pas encore disponible."}
            </p>

            <div className="mt-10 rounded-[24px] bg-sand/8 p-5 text-sm leading-7 text-sand/82">
              {resetMode === "direct-link"
                ? "Ce lien est reserve aux essais en local, sans envoi d'email."
                : "Ne communique jamais ton mot de passe, meme au support."}
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

            {resetMode === "direct-link" || emailEnabled ? <form action={forgotPasswordAction} className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-pine/80">Email</span>
                <input
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  placeholder="toi@exemple.fr"
                  className="w-full rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-pine"
                />
              </label>

              <button
                type="submit"
                className="w-full rounded-full bg-ink px-5 py-3 text-sm font-semibold text-sand transition hover:bg-pine"
              >
                {emailEnabled ? "Recevoir le lien par email" : "Generer un lien"}
              </button>
            </form> : (
              <p className="mt-6 text-sm leading-7 text-pine/80">
                {supportEmail ? <>
                  Pour obtenir de l'aide, contacte <a className="font-semibold underline" href={`mailto:${encodeURIComponent(supportEmail)}`}>{supportEmail}</a>.
                </> : "Contacte le responsable de la plateforme pour obtenir de l'aide."}
                {" "}Aucun email de reinitialisation n'a ete envoye depuis cette page.
              </p>
            )}

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
