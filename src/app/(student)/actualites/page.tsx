export const dynamic = "force-dynamic";

import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { getStudentNewsData } from "@/lib/news";

export default async function ActualitesPage() {
  const data = await getStudentNewsData();

  if (!data.hasProfile) {
    return (
      <div>
        <PageHeader
          title="Actualites"
          description="L'onglet selectionnera ensuite automatiquement de bons articles de presse pour les langues."
          actionLabel="Configurer mon profil"
          actionHref="/onboarding"
        />

        <SectionCard
          eyebrow="Avant de commencer"
          title="Choisis d'abord ta LV2"
          description="La rubrique depend de ton profil : anglais britannique, anglais americain et langue vivante 2."
          accent="soft"
        >
          <div className="rounded-[24px] bg-white/75 p-6">
            <p className="text-sm leading-7 text-pine/80">
              Une fois la configuration eleve remplie, cette page pourra adapter automatiquement
              la troisieme actualite a ta LV2.
            </p>
          </div>
        </SectionCard>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Actualites"
        description={`LV1 anglais et LV2 ${data.lv2Label.toLowerCase()}.`}
      />

      <div className="grid gap-5 xl:grid-cols-3">
        {data.sections.map((section) => (
          <SectionCard
            key={section.id}
            eyebrow={section.sourceLabel}
            title={section.sourceName}
            description={`${section.languageLabel} - ${section.publishedAtLabel}`}
            accent={section.id === "lv2" ? "soft" : undefined}
          >
            <div className="space-y-4">
              <div className="rounded-[22px] bg-sand p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-pine/55">
                    {section.hasFreshArticle
                      ? section.isLive
                        ? "Article recent"
                        : "Article memorise"
                      : "Aucune nouveaute recente"}
                  </p>
                  <a
                    href={section.articleUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-ink transition hover:bg-mist"
                  >
                    Ouvrir l'article
                  </a>
                </div>
                <p className="mt-3 font-semibold text-ink">{section.articleTitle}</p>
                <p className="mt-3 text-sm leading-7 text-pine/80">{section.excerpt}</p>
              </div>
            </div>
          </SectionCard>
        ))}
      </div>
    </div>
  );
}
