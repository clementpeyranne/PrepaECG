export const dynamic = "force-dynamic";

import { ProgressDashboard } from "@/components/progress/progress-dashboard";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { getStudentProgressData } from "@/lib/student-app";

export default async function ProgressPage() {
  const data = await getStudentProgressData();

  if (!data.hasProfile) {
    return (
      <div>
        <PageHeader title="Progression" actionLabel="Configurer mon profil" actionHref="/onboarding" />

        <SectionCard eyebrow="Configuration" title="Activer le profil" accent="soft">
          <div className="rounded-[24px] bg-white/75 p-6 text-sm leading-7 text-pine/80">Complete ton profil pour activer cette page.</div>
        </SectionCard>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Progression" />

      <div className="mt-5">
        <ProgressDashboard
          profile={data.profile}
          summaryCards={data.summaryCards}
          subjectCharts={data.subjectCharts}
          gradeFormSubjects={data.gradeFormSubjects}
          averageCardsBase={data.averageCardsBase}
          grades={data.grades}
          categories={data.categories}
          visualReading={data.visualReading}
          essayProgress={data.essayProgress}
        />
      </div>
    </div>
  );
}
