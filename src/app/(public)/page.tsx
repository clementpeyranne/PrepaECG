import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Layers,
  PenLine,
  Sigma,
  Sparkles,
  TrendingUp
} from "lucide-react";

import { continueAsCurrentUserAction } from "@/app/actions/auth";
import { BrandMark } from "@/components/brand/brand-mark";
import { HeroScene } from "@/components/public/hero-scene";
import { PublicFooterLinks } from "@/components/public/public-footer-links";
import { SiteHeader } from "@/components/public/site-header";
import annals from "@/data/math-annals.json";
import { getCurrentUser } from "@/lib/auth";

const subjects = [
  "ESH",
  "HGG",
  "Maths appliquées",
  "Maths approfondies",
  "Anglais",
  "Allemand",
  "Espagnol",
  "Italien",
  "Culture générale"
];

const week = [
  { day: "L", blocks: [60, 30] },
  { day: "M", blocks: [40, 45] },
  { day: "M", blocks: [70] },
  { day: "J", blocks: [35, 35] },
  { day: "V", blocks: [55, 25] },
  { day: "S", blocks: [80] },
  { day: "D", blocks: [30] }
];

const steps = [
  {
    number: "01",
    title: "Configurer le parcours",
    text: "ESH ou HGG, maths appliquées ou approfondies, LV2 : le planning suit les choix faits dans le profil."
  },
  {
    number: "02",
    title: "Suivre le programme du jour",
    text: "Des séances précises, avec le dépôt de la copie quand l’exercice le demande."
  },
  {
    number: "03",
    title: "Valider et progresser",
    text: "Le travail validé nourrit la progression et le classement anonyme, sans confondre connexion et travail."
  }
];

const schools = ["Écricome", "emlyon", "EDHEC", "HEC", "Maths 2"];

export default async function HomePage() {
  const user = await getCurrentUser();
  const records = annals.records as Array<{ year: number }>;
  const annalCount = records.length;
  const years = records.map((record) => record.year);
  const firstYear = Math.min(...years);
  const lastYear = Math.max(...years);

  const primaryCta = user ? (
    <form action={continueAsCurrentUserAction}>
      <button type="submit" className="btn-primary group inline-flex items-center gap-2 rounded-full px-7 py-4 text-sm font-semibold text-white">
        Ouvrir l’espace de travail
        <ArrowRight size={17} className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
      </button>
    </form>
  ) : (
    <Link href="/signup" className="btn-primary group inline-flex items-center gap-2 rounded-full px-7 py-4 text-sm font-semibold text-white">
      Créer un compte
      <ArrowRight size={17} className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
    </Link>
  );

  return (
    <main className="relative overflow-x-clip">
      <SiteHeader signedIn={Boolean(user)} />

      {/* ------------------------------------------------------------ Hero */}
      <section className="mx-auto mt-6 max-w-7xl px-4 lg:px-8">
        <div className="panel-dark spotlight relative overflow-hidden rounded-[40px] px-6 pb-8 pt-10 text-sand sm:px-10 lg:px-14 lg:pb-14 lg:pt-16">
          <div className="header-orbs" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_1fr]">
            <div className="stagger relative">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3.5 py-1.5 text-[12px] font-semibold text-sand/85 backdrop-blur">
                <span className="pulse-dot inline-block h-2 w-2 rounded-full bg-clay text-clay" />
                Pilote gratuit sur invitation · Prépa ECG
              </p>
              <h1 className="mt-6 font-display text-[2.9rem] font-semibold leading-[0.98] tracking-[-0.055em] sm:text-6xl lg:text-[4.6rem]">
                Le centre du travail quotidien en <span className="text-gradient-light">prépa ECG.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-8 text-sand/78 lg:text-lg">
                Planning, flashcards, ressources, copies, progression et assistant réunis dans un seul espace de travail.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                {primaryCta}
                {user ? null : (
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 px-7 py-4 text-sm font-semibold text-sand backdrop-blur transition hover:border-white/40 hover:bg-white/10"
                  >
                    Se connecter
                  </Link>
                )}
              </div>
              <div className="mt-8 flex flex-wrap gap-2 text-[12px] text-sand/70">
                {["ESH ou HGG", "Maths appliquées ou approfondies", "LV2 au choix"].map((item) => (
                  <span key={item} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5">
                    <CheckCircle2 size={13} className="text-moss" aria-hidden="true" />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <HeroScene />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- Matières */}
      <section className="marquee mx-auto mt-10 max-w-7xl overflow-hidden" aria-label="Matières suivies">
        <div className="marquee__track gap-3 py-2">
          {[...subjects, ...subjects].map((subject, index) => (
            <span
              key={`${subject}-${index}`}
              aria-hidden={index >= subjects.length ? "true" : undefined}
              className="inline-flex items-center gap-3 whitespace-nowrap rounded-full border border-white/70 bg-white/60 px-5 py-2.5 font-display text-lg font-medium tracking-[-0.02em] text-ink shadow-[0_10px_30px_rgba(20,34,29,0.06)] backdrop-blur"
            >
              <span className="h-2 w-2 rounded-full bg-gradient-to-br from-clay to-moss" />
              {subject}
            </span>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------- Fonctionnalités */}
      <section id="fonctionnalites" className="mx-auto mt-20 max-w-7xl scroll-mt-28 px-4 lg:mt-28 lg:px-8">
        <div className="reveal max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-clay">Fonctionnalités</p>
          <h2 className="mt-4 font-display text-4xl font-semibold leading-[1.05] tracking-[-0.045em] text-ink lg:text-6xl">
            Tout le travail de prépa, <span className="text-gradient">au même endroit.</span>
          </h2>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {/* Planning */}
          <article data-tilt="5" className="panel-surface-strong spotlight reveal rounded-[32px] p-7 md:col-span-2">
            <div className="grid gap-8 md:grid-cols-[0.9fr_1.1fr] md:items-center">
              <div>
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-ink text-sand shadow-[0_14px_30px_rgba(20,34,29,0.25)]">
                  <CalendarDays size={22} aria-hidden="true" />
                </span>
                <h3 className="mt-6 font-display text-3xl font-semibold text-ink">Organiser le travail</h3>
                <p className="mt-3 text-[15px] leading-7 text-pine/80">
                  Un planning pour répartir les révisions et préparer les prochaines échéances.
                </p>
              </div>
              <div className="rounded-[24px] border border-white/80 bg-sand/70 p-4" aria-hidden="true">
                <div className="grid grid-cols-7 gap-2">
                  {week.map((day, dayIndex) => (
                    <div key={dayIndex} className="flex flex-col items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-pine/60">{day.day}</span>
                      <div className="flex h-36 w-full flex-col justify-end gap-1.5 rounded-xl bg-white/70 p-1">
                        {day.blocks.map((height, blockIndex) => (
                          <span
                            key={blockIndex}
                            className="grow-y block w-full rounded-lg"
                            style={{
                              height: `${height}%`,
                              animationDelay: `${dayIndex * 90 + blockIndex * 60}ms`,
                              background:
                                blockIndex % 2 === 0
                                  ? "linear-gradient(180deg, rgb(var(--color-clay)), rgb(var(--color-clay) / 0.7))"
                                  : "linear-gradient(180deg, rgb(var(--color-moss)), rgb(var(--color-moss) / 0.7))"
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </article>

          {/* Flashcards */}
          <article data-tilt="7" className="panel-dark spotlight reveal rounded-[32px] p-7 text-sand">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-clay">
              <Layers size={22} aria-hidden="true" />
            </span>
            <h3 className="mt-6 font-display text-3xl font-semibold">Mémoriser durablement</h3>
            <p className="mt-3 text-[15px] leading-7 text-sand/75">
              Des flashcards à revoir au bon moment, selon les réponses et les révisions précédentes.
            </p>
            <div className="flip mt-6 h-28" tabIndex={0} aria-label="Exemple de flashcard : survoler pour la retourner">
              <div className="flip__inner">
                <div className="flip__face flex flex-col justify-between rounded-[20px] bg-white p-4 text-ink">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-clay">Anglais · Recto</p>
                  <p className="font-display text-lg">to keep pace with</p>
                </div>
                <div className="flip__face flip__face--back flex flex-col justify-between rounded-[20px] bg-gradient-to-br from-clay to-[#e6946f] p-4 text-white">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/75">Verso</p>
                  <p className="font-display text-lg">suivre le rythme de</p>
                </div>
              </div>
            </div>
          </article>

          {/* Annales */}
          <article id="annales" data-tilt="6" className="panel-surface-strong spotlight reveal scroll-mt-28 rounded-[32px] p-7">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-clay/12 text-clay">
              <Sigma size={22} aria-hidden="true" />
            </span>
            <h3 className="mt-6 font-display text-3xl font-semibold text-ink">S’entraîner aux concours</h3>
            <p className="mt-3 text-[15px] leading-7 text-pine/80">
              Des annales et un espace pour déposer les copies et retrouver les corrections.
            </p>
            <p className="mt-6 font-display text-5xl font-semibold tracking-[-0.05em] text-ink">
              {annalCount}
              <span className="ml-2 text-base font-medium tracking-normal text-pine/70">
                sujets de maths, {firstYear}–{lastYear}
              </span>
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {schools.map((school) => (
                <span key={school} className="rounded-full border border-ink/10 bg-white/70 px-2.5 py-1 text-[12px] font-semibold text-pine">
                  {school}
                </span>
              ))}
            </div>
          </article>

          {/* Ressources */}
          <article data-tilt="6" className="panel-surface-strong spotlight reveal rounded-[32px] p-7">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-moss/15 text-pine">
              <BookOpen size={22} aria-hidden="true" />
            </span>
            <h3 className="mt-6 font-display text-3xl font-semibold text-ink">Retrouver les cours</h3>
            <p className="mt-3 text-[15px] leading-7 text-pine/80">
              Les cours et documents partagés par les professeurs de la prépa, classés par matière et par chapitre.
            </p>
            <div className="mt-6 space-y-2" aria-hidden="true">
              {["Croissance et fluctuations", "Probabilités discrètes", "Mondialisation et territoires"].map((item, index) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl bg-white/70 px-3 py-2.5 text-sm text-ink" style={{ marginLeft: `${index * 14}px` }}>
                  <PenLine size={14} className="text-clay" />
                  {item}
                </div>
              ))}
            </div>
          </article>

          {/* Progression */}
          <article data-tilt="6" className="panel-surface-strong spotlight reveal rounded-[32px] p-7">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-ink text-sand">
              <TrendingUp size={22} aria-hidden="true" />
            </span>
            <h3 className="mt-6 font-display text-3xl font-semibold text-ink">Suivre la progression</h3>
            <p className="mt-3 text-[15px] leading-7 text-pine/80">
              Résultats, points à renforcer et classement anonyme fondé sur le travail réellement validé.
            </p>
            <div className="mt-6 space-y-3" aria-hidden="true">
              {[
                ["Maths", 78],
                ["ESH", 64],
                ["Anglais", 86]
              ].map(([label, value], index) => (
                <div key={label}>
                  <div className="flex justify-between text-[12px] font-semibold text-pine/70">
                    <span>{label}</span>
                  </div>
                  <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-mist">
                    <div
                      className="grow-x h-full rounded-full bg-gradient-to-r from-clay to-moss"
                      style={{ width: `${value}%`, animationDelay: `${index * 150}ms` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </article>

          {/* Assistant */}
          <article data-tilt="3" className="glow-border panel-surface-strong spotlight reveal rounded-[32px] p-7 md:col-span-2 lg:col-span-3">
            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div className="flex gap-5">
                <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-clay to-moss text-white shadow-[0_14px_30px_rgba(var(--accent-primary),0.35)]">
                  <Sparkles size={22} aria-hidden="true" />
                </span>
                <div>
                  <h3 className="font-display text-3xl font-semibold text-ink">Assistant IA</h3>
                  <p className="mt-3 text-[15px] leading-7 text-pine/80">
                    Fiches de révision, résumés de ressources et aide à la correction des copies, avec des limites d’usage claires.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 lg:justify-end">
                {["Fiche de révision", "Résumé de ressource", "Correction de copie", "Création de flashcards", "Bilan hebdomadaire"].map((task) => (
                  <span key={task} className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/75 px-4 py-2 text-sm font-medium text-ink shadow-[0_8px_20px_rgba(20,34,29,0.05)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-clay" />
                    {task}
                  </span>
                ))}
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* ----------------------------------------------------------- Méthode */}
      <section id="methode" className="mx-auto mt-24 max-w-7xl scroll-mt-28 px-4 lg:mt-32 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="reveal lg:sticky lg:top-32 lg:self-start">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-clay">Méthode</p>
            <h2 className="mt-4 font-display text-4xl font-semibold leading-[1.05] tracking-[-0.045em] text-ink lg:text-6xl">
              Une méthode simple, <span className="text-gradient">jour après jour.</span>
            </h2>
            <p className="mt-5 max-w-md text-[15px] leading-7 text-pine/80">
              Une plateforme unique pour organiser le travail, mémoriser et progresser sans se disperser.
            </p>
          </div>
          <ol className="space-y-5">
            {steps.map((step) => (
              <li key={step.number} data-tilt="4" className="panel-surface-strong spotlight reveal flex gap-6 rounded-[30px] p-7">
                <span className="font-display text-5xl font-semibold tracking-[-0.06em] text-transparent [-webkit-text-stroke:1.5px_rgb(var(--color-clay))]">
                  {step.number}
                </span>
                <div>
                  <h3 className="font-display text-2xl font-semibold text-ink">{step.title}</h3>
                  <p className="mt-2 text-[15px] leading-7 text-pine/80">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ------------------------------------------------------ Appel final */}
      <section className="mx-auto mt-24 max-w-7xl px-4 lg:mt-32 lg:px-8">
        <div className="glow-border panel-dark spotlight reveal relative overflow-hidden rounded-[40px] px-6 py-14 text-center text-sand sm:px-12 lg:py-20">
          <div className="header-orbs" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <BrandMark size={64} className="mx-auto" />
          <h2 className="mx-auto mt-8 max-w-3xl font-display text-4xl font-semibold leading-[1.02] tracking-[-0.05em] sm:text-5xl lg:text-7xl">
            Ton rythme. <span className="text-gradient-light">Tes ambitions.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-base leading-8 text-sand/75">
            Rejoins l’espace de travail de ta prépa avec le code fourni par l’établissement.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {primaryCta}
            {user ? null : (
              <Link href="/login" className="inline-flex items-center justify-center rounded-full border border-white/20 px-7 py-4 text-sm font-semibold text-sand transition hover:border-white/40 hover:bg-white/10">
                Se connecter
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ Pied */}
      <footer className="mx-auto mb-8 mt-16 max-w-7xl px-4 lg:px-8">
        <div className="flex flex-col gap-5 rounded-[28px] border border-white/60 bg-white/60 px-6 py-6 shadow-panel backdrop-blur md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <BrandMark size={34} />
            <div>
              <p className="font-display text-base font-semibold text-ink">Prépatempo</p>
              <p className="text-[13px] text-pine/70">Ton rythme. Tes ambitions.</p>
            </div>
          </div>
          <PublicFooterLinks />
        </div>
      </footer>
    </main>
  );
}
