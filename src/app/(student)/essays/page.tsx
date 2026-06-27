export const dynamic = "force-dynamic";

import Link from "next/link";
import type { Route } from "next";

import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { getStudentEssaysOverviewData } from "@/lib/essays";

export default async function EssaysPage() {
  const data = await getStudentEssaysOverviewData();

  return (
    <div>
      <PageHeader
        title="Copies"
        actionLabel="Deposer une copie"
        actionHref={"/essays/new" as Route}
      />

      <SectionCard
        eyebrow="Historique"
        title="Copies deposees"
      >
        <div className="space-y-4">
          {data.essays.map((essay) => (
            <Link
              key={essay.id}
              href={`/essays/${essay.id}`}
              className="block rounded-[24px] border border-ink/8 p-5 transition hover:border-pine/25 hover:bg-sand"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{essay.title}</p>
                  <p className="mt-1 text-sm text-pine/75">
                    {essay.subject} - {essay.examType} - {essay.targetExam}
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-pine/55">
                    {essay.createdAtLabel} - {essay.latestFeedbackLabel} - {essay.latestScoreRange}
                  </p>
                </div>
                <span className="rounded-full bg-clay/10 px-3 py-1 text-xs text-clay">
                  {essay.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
