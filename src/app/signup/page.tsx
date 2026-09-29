import Link from "next/link";
import { redirect } from "next/navigation";

import { signupAction } from "@/app/actions/auth";
import { PublicFooterLinks } from "@/components/public/public-footer-links";
import { isDemoModeEnabled } from "@/lib/app-config";
import { getCurrentUser, getUserLandingPath } from "@/lib/auth";
import { DEFAULT_CLASS_ACCESS_CODE } from "@/lib/reference-data";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false }, referrer: "no-referrer" as const };

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
  const invitation = typeof resolvedSearchParams.invitation === "string" && /^[a-f0-9]{64}$/.test(resolvedSearchParams.invitation)
    ? resolvedSearchParams.invitation : "";
  const invitedEmail = invitation && typeof resolvedSearchParams.email === "string" ? resolvedSearchParams.email : "";
  const defaultAccessCode = invitation && typeof resolvedSearchParams.accessCode === "string"
    ? resolvedSearchParams.accessCode : isDemoModeEnabled() ? DEFAULT_CLASS_ACCESS_CODE : "";

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
                  required
                  defaultValue={invitedEmail}
                  autoComplete="email"
                  className="w-full rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-pine"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-pine/80">Mot de passe</span>
                <input
                  type="password"
                  name="password"
                  minLength={8}
                  required
                  autoComplete="new-password"
                  className="w-full rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-pine"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-pine/80">Je suis</span>
                <select
                  name="role"
                  defaultValue={invitation ? "teacher" : "student"}
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
                  defaultValue={defaultAccessCode}
                  placeholder={isDemoModeEnabled() ? DEFAULT_CLASS_ACCESS_CODE : "Ex: PREPA-ECG"}
                  className="w-full rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm uppercase outline-none transition focus:border-pine"
                />
              </label>

              <details open={Boolean(invitation)} className="text-sm text-pine/80">
                <summary className="cursor-pointer font-medium">Invitation professeur</summary>
                <label className="mt-3 block">
                  <span className="mb-2 block">Code personnel, reserve aux professeurs</span>
                  <input name="invitationToken" defaultValue={invitation} autoComplete="off"
                    className="w-full rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm" />
                </label>
              </details>

              <label className="flex items-start gap-3 rounded-2xl border border-ink/10 bg-sand/70 p-4 text-xs leading-6 text-pine/75">
                <input
                  type="checkbox"
                  name="legalAccepted"
                  value="yes"
                  required
                  className="mt-1 h-4 w-4 shrink-0 accent-pine"
                />
                <span>
                  J&apos;accepte les{" "}
                  <Link href="/cgu" target="_blank" className="font-semibold text-ink underline underline-offset-2">
                    CGU
                  </Link>{" "}
                  et je confirme avoir lu la{" "}
                  <Link href="/confidentialite" target="_blank" className="font-semibold text-ink underline underline-offset-2">
                    politique de confidentialite
                  </Link>.
                </span>
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

            <PublicFooterLinks className="mt-5" />
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
              {isDemoModeEnabled() ? null : (
                <p>4. Les professeurs rejoignent la prepa sur invitation personnelle</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
