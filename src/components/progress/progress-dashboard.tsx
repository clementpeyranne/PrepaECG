"use client";

import { useState } from "react";

import { SectionCard } from "@/components/ui/section-card";
import { buildProgressSummary, type ProgressGrade } from "@/lib/progress-summary";

type ProgressDashboardProps = {
  subjects: string[];
  grades: ProgressGrade[];
  categories: string[];
};

function MiniLineChart({
  points,
  subject
}: {
  points: Array<{
    id: string;
    label: string;
    value: number;
    title: string;
  }>;
  subject: string;
}) {
  if (points.length === 0) {
    return <div className="rounded-2xl bg-sand px-4 py-5 text-sm text-pine/70">Pas encore de notes pour cette période.</div>;
  }

  const width = 340;
  const height = 148;
  const paddingLeft = 34;
  const paddingRight = 16;
  const paddingTop = 22;
  const paddingBottom = 30;
  const step = points.length === 1 ? 0 : (width - paddingLeft - paddingRight) / (points.length - 1);

  const coordinates = points.map((point, index) => {
    const x = points.length === 1 ? (width + paddingLeft - paddingRight) / 2 : paddingLeft + index * step;
    const y = height - paddingBottom - (point.value / 20) * (height - paddingTop - paddingBottom);
    return { ...point, x, y };
  });

  const polyline = coordinates.map((point) => `${point.x},${point.y}`).join(" ");
  const axisLabels = [0, 5, 10, 15, 20];

  return (
    <div className="rounded-[24px] bg-sand p-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-36 w-full" role="img" aria-label={`Notes en ${subject}, de 0 à 20`}>
        <title>{points.map((point) => `${point.label} : ${point.value.toFixed(1)}/20, ${point.title}`).join(" ; ")}</title>
        {axisLabels.map((label) => {
          const y = height - paddingBottom - (label / 20) * (height - paddingTop - paddingBottom);
          return (
            <g key={label}>
              <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="#d6d0c3" />
              <text x={paddingLeft - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#5f726d">
                {label}
              </text>
            </g>
          );
        })}

        <polyline fill="none" stroke="#b86a4b" strokeWidth="3" points={polyline} />

        {coordinates.map((point, index) => (
          <g key={point.id}>
            <circle cx={point.x} cy={point.y} r="4" fill="#12322b" />
            <text x={point.x} y={point.y - 10} textAnchor="middle" fontSize="10" fill="#12322b">
              {point.value.toFixed(1)}
            </text>
            <text x={point.x} y={height - 8} textAnchor={coordinates.length === 1 ? "middle" : index === 0 ? "start" : index === coordinates.length - 1 ? "end" : "middle"} fontSize="10" fill="#5f726d">{point.label}</text>
          </g>
        ))}
      </svg>

    </div>
  );
}

export function ProgressDashboard({
  subjects,
  grades,
  categories
}: ProgressDashboardProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0] ?? "Semestre 1");
  const [expandedGradeId, setExpandedGradeId] = useState<string | null>(null);

  const { filteredGrades, selectedAverage, subjectCharts, visualReading } = buildProgressSummary(grades, subjects, selectedCategory);

  return (
    <div>
      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard
          title="Évolution par matière"
        >
          <div className="space-y-4">
            {subjectCharts.map((subject) => {
              return (
                <div key={subject.subject} data-subject={subject.subject} className="min-w-0 rounded-[24px] border border-ink/8 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="font-semibold text-ink">{subject.subject}</p>
                        <span className="rounded-full bg-moss/10 px-3 py-1 text-xs text-pine">
                          {subject.status}
                        </span>
                      </div>
                      {subject.count > 0 ? <p className="mt-2 text-sm text-pine/76">{subject.count} note{subject.count > 1 ? "s" : ""}{subject.count > 5 ? " · 5 dernières affichées" : ""}{subject.trendLabel ? ` · ${subject.trendLabel}` : ""}</p> : null}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-clay">
                        {subject.average !== null ? `${subject.average.toFixed(1)}/20` : "--"}
                      </p>
                      <p className="mt-1 text-xs text-pine/60">Moyenne de la période</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <MiniLineChart points={subject.points} subject={subject.subject} />
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>

        <div className="space-y-5">
          <SectionCard
            title="Choisir une période"
            accent="soft"
          >
            <div className="mb-4 flex items-end justify-between gap-4 rounded-2xl bg-sand p-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-pine/55">Moyenne de la période</p>
                <p className="mt-2 font-display text-3xl text-ink">
                  {selectedAverage !== null ? `${selectedAverage.toFixed(1)}/20` : "--"}
                </p>
              </div>
              <p className="text-right text-sm text-pine/70">{filteredGrades.length} note{filteredGrades.length !== 1 ? "s" : ""}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => { setSelectedCategory(category); setExpandedGradeId(null); }}
                  aria-pressed={selectedCategory === category}
                  className={`rounded-full px-4 py-3 text-sm transition ${
                    selectedCategory === category ? "bg-ink text-sand" : "bg-white text-pine hover:bg-mist"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Bilan par matière"
          >
            {filteredGrades.length === 0 ? <p className="text-sm text-pine/75">Pas encore de notes pour cette période.</p> : <div className="space-y-4">
              <div className="rounded-2xl bg-sand p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-pine/55">Points forts</p>
                <div className="mt-3 space-y-2 text-sm leading-7 text-pine/82">
                  {visualReading.strongAreas.length > 0 ? (
                    visualReading.strongAreas.map((item) => <p key={item}>{item}</p>)
                  ) : (
                    <p>Aucun point fort mis en évidence pour cette période.</p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl bg-sand p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-pine/55">À suivre</p>
                <div className="mt-3 space-y-2 text-sm leading-7 text-pine/82">
                  {visualReading.watchAreas.length > 0 ? (
                    visualReading.watchAreas.map((item) => <p key={item}>{item}</p>)
                  ) : (
                    <p>Aucun point particulier à signaler dans cette catégorie.</p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl bg-sand p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-pine/55">À consolider</p>
                <div className="mt-3 space-y-2 text-sm leading-7 text-pine/82">
                  {visualReading.consolidateAreas.length === 0 ? <p>Aucun point à consolider mis en évidence pour cette période.</p> : visualReading.consolidateAreas.map((item) => (
                    <p key={item}>{item}</p>
                  ))}
                </div>
              </div>
              {subjectCharts.some((subject) => subject.count === 1) ? <p className="text-xs text-pine/65">Une seule note ne permet pas encore d’établir une tendance.</p> : null}
            </div>}
          </SectionCard>
        </div>
      </div>

      <div className="mt-5">
        <SectionCard
          title="Notes"
        >
          <div className="overflow-hidden rounded-[24px] border border-ink/8">
            <div className="grid grid-cols-[1.1fr_0.7fr_0.5fr_0.7fr] bg-ink px-4 py-3 text-xs uppercase tracking-[0.2em] text-sand/75">
              <p>Évaluation</p>
              <p>Matière</p>
              <p>Note</p>
              <p>Date</p>
            </div>
            <div className="divide-y divide-ink/8 bg-white">
              {filteredGrades.length === 0 ? <p className="p-4 text-sm text-pine/75">Pas encore de notes pour cette période.</p> : null}
              {filteredGrades.map((grade) => {
                const isOpen = expandedGradeId === grade.id;

                return (
                  <div key={grade.id}>
                    <button
                      type="button"
                      onClick={() => setExpandedGradeId(isOpen ? null : grade.id)}
                      aria-expanded={isOpen}
                      aria-controls={`grade-${grade.id}`}
                      className="grid w-full grid-cols-[1.1fr_0.7fr_0.5fr_0.7fr] items-center px-4 py-4 text-left text-sm transition hover:bg-sand/50"
                    >
                      <p className="min-w-0 break-words font-medium text-ink">{grade.title}</p>
                      <p className="min-w-0 break-words text-pine/76">{grade.subject}</p>
                      <p className="font-semibold text-clay">{grade.score.toFixed(1)}/20</p>
                      <p className="text-pine/70">{grade.dateLabel}</p>
                    </button>

                    {isOpen ? (
                      <div id={`grade-${grade.id}`} className="border-t border-ink/8 bg-sand/45 px-4 py-4 text-sm leading-7 text-pine/80">
                        <p>Type : {grade.sourceLabel}</p>
                        <p>Semestre : {grade.semesterLabel}</p>
                        <p>Professeur : {grade.teacherName}</p>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </SectionCard>
      </div>

    </div>
  );
}
