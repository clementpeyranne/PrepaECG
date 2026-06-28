import Link from "next/link";
import { redirect } from "next/navigation";

import { resetPasswordAction } from "@/app/actions/auth";
import { PublicFooterLinks } from "@/components/public/public-footer-links";
import { getCurrentUser, getPasswordResetTokenState, getUserLandingPath } from "@/lib/auth";

export const dynamic = "force-dynamic";

const stateMessages: Record<string, string> = {
  missing: "Le lien de reinitialisation est incomplet.",
  invalid: "Ce lien n'est pas reconnu.",
  expired: "Ce lien a expire. Demande-en un nouveau.",
  used: "Ce lien a deja ete utilise.",
  valid: ""
};

export default async function ResetPasswordPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  if (user) {
    redirect(await getUserLandingPath(user));
  }

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const token = typeof resolvedSearchParams.token === "string" ? resolvedSearchParams.token : "";
  const message =
    typeof resolvedSearchParams.message === "string" ? resolvedSearchParams.message : null;
  const tokenState = await getPasswordResetTokenState(token);
  const tokenMessage = tokenState.status === "valid" ? null : stateMessages[tokenState.status];

  return (
    <main className="bg-app-gradient">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center px-4 py-8 lg:px-8">
        <section className="w-full rounded-[34px] border border-white/70 bg-white/84 p-6 shadow-panel lg:p-8">
          <p className="text-xs uppercase tracking-[0.25em] text-pine/55">Nouveau mot de passe</p>
          <h1 className="mt-3 font-display text-4xl text-ink lg:text-5xl">Choisir un nouveau mot de passe</h1>

          {message ? (
            <div className="mt-5 rounded-[20px] border border-clay/15 bg-clay/10 px-4 py-3 text-sm text-clay">
              {message}
            </div>
          ) : null}

          {tokenMessage ? (
            <div className="mt-5 rounded-[20px] border border-clay/15 bg-clay/10 px-4 py-4 text-sm text-clay">
              {tokenMessage}
            </div>
          ) : (
            <form action={resetPasswordAction} className="mt-6 grid gap-4 lg:max-w-2xl">
              <input type="hidden" name="token" value={token} />

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-pine/80">Nouveau mot de passe</span>
                <input
                  type="password"
                  name="password"
                  placeholder="Au moins 8 caracteres"
                  className="w-full rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-pine"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-pine/80">Confirmation</span>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Retape le meme mot de passe"
                  className="w-full rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-pine"
                />
              </label>

              <button
                type="submit"
                className="mt-2 w-full rounded-full bg-ink px-5 py-3 text-sm font-semibold text-sand transition hover:bg-pine"
              >
                Enregistrer le nouveau mot de passe
              </button>
            </form>
          )}

          <div className="mt-6 flex flex-col gap-3">
            <Link href="/forgot-password" className="text-sm font-semibold text-ink transition hover:text-pine">
              Demander un nouveau lien
            </Link>
            <PublicFooterLinks />
          </div>
        </section>
      </div>
    </main>
  );
}
