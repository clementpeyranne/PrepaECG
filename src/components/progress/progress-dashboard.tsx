"use client";

import { useMemo, useState } from "react";

import { createGradeAction } from "@/app/actions/progress";
import { SectionCard } from "@/components/ui/section-card";

type ProgressDashboardProps = {
  profile: {
    className: string;
    targetExamSummary: string;
  };
  summaryCards: Array<{
    label: string;
    value: string;
    helper: string;
  }>;
  subjectCharts: Array<{
    subject: string;
    status: string;
    latestScore: number | null;
    trendLabel: string;
    helper: string;
    points: Array<{
      label: string;
      value: number;
      title: string;
    }>;
  }>;
  gradeFormSubjects: Array<{
    code: string;
    name: string;
  }>;
  averageCardsBase: {
    strongestSubject: {
      label: string;
      average: number | null;
    } | null;
    weakestSubject: {
      label: string;
      average: number | null;
    } | null;
    correctedEssaysCount: number;
    averageEssayScore: number | null;
  };
  grades: Array<{
    id: string;
    title: string;
    subject: string;
    score: number;
    dateLabel: string;
    capturedAtIso: string;
    teacherName: string;
    sourceType: string;
    sourceLabel: string;
    semesterLabel: string;
  }>;
  categories: string[];
  visualReading: {
    strongAreas: string[];
    watchAreas: string[];
    consolidateAreas: string[];
  };
  essayProgress: Array<{
    id: string;
    title: string;
    subject: string;
    status: string;
    scoreLabel: string;
    summary: string;
    nextStep: string;
  }>;
};

function MiniLineChart({
  points
}: {
  points: Array<{
    label: string;
    value: number;
    title: string;
  }>;
}) {
  if (points.length === 0) {
    return <div className="rounded-2xl bg-sand px-4 py-5 text-sm text-pine/70">Pas encore de notes.</div>;
  }

  const width = 340;
  const height = 120;
  const paddingLeft = 34;
  const paddingRight = 16;
  const paddingTop = 12;
  const paddingBottom = 26;
  const step = points.length === 1 ? 0 : (width - paddingLeft - paddingRight) / (points.length - 1);

  const coordinates = points.map((point, index) => {
    const x = paddingLeft + index * step;
    const y = height - paddingBottom - (point.value / 20) * (height - paddingTop - paddingBottom);
    return { ...point, x, y };
  });

  const polyline = coordinates.map((point) => `${point.x},${point.y}`).join(" ");
  const axisLabels = [0, 5, 10, 15, 20];

  return (
    <div className="rounded-[24px] bg-sand p-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-32 w-full">
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

        {coordinates.map((point) => (
          <g key={`${point.label}-${point.title}`}>
            <circle cx={point.x} cy={point.y} r="4" fill="#12322b" />
            <text x={point.x} y={point.y - 10} textAnchor="middle" fontSize="10" fill="#12322b">
              {point.value.toFixed(1)}
            </text>
          </g>
        ))}
      </svg>

      <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-pine/62">
        {points.map((point) => (
          <span key={`${point.label}-${point.title}`}>{point.label}</span>
        ))}
      </div>
    </div>
  );
}

export function ProgressDashboard({
  profile,
  summaryCards,
  subjectCharts,
  gradeFormSubjects,
  averageCardsBase,
  grades,
  categories,
  visualReading,
  essayProgress
}: ProgressDashboardProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0] ?? "Semestre 1");
  const [expandedGradeId, setExpandedGradeId] = useState<string | null>(null);

  const filteredGrades = useMemo(() => {
    if (selectedCategory === "Concours blancs") {
      return grades.filter((grade) => grade.sourceType === "mock_exam");
    }

    return grades.filter((grade) => grade.semesterLabel === selectedCategory);
  }, [grades, selectedCategory]);

  const selectedAverage = useMemo(() => {
    if (filteredGrades.length === 0) {
      return null;
    }

    return filteredGrades.reduce((sum, grade) => sum + grade.score, 0) / filteredGrades.length;
  }, [filteredGrades]);

  const averageSummaryCards = [
    {
      label: `Moyenne ${selectedCategory.toLowerCase()}`,
      value: selectedAverage !== null ? `${selectedAverage.toFixed(1)}/20` : "--",
      helper: `${filteredGrades.length} note(s) dans cette categorie`
    },
    ...summaryCards
  ];

  const defaultDate = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <div className="grid gap-5 lg:grid-cols-4">
        {averageSummaryCards.map((card) => (
          <SectionCard key={card.label} eyebrow="Signal" title={card.value} description={card.label}>
            <div className="rounded-2xl bg-sand p-4 text-sm leading-7 text-pine/78">{card.helper}</div>
          </SectionCard>
        ))}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard
          eyebrow="Notes"
          title="Evolution par matiere"
          description="Chaque graphique montre l'evolution des notes. Le chiffre a droite correspond a la moyenne de la matiere."
        >
          <div className="space-y-4">
            {subjectCharts.map((subject) => {
              const subjectAverage =
                subject.points.length > 0
                  ? subject.points.reduce((sum, point) => sum + point.value, 0) / subject.points.length
                  : null;

              return (
                <div key={subject.subject} className="rounded-[24px] border border-ink/8 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-3">
                        <p className="font-semibold text-ink">{subject.subject}</p>
                        <span className="rounded-full bg-moss/10 px-3 py-1 text-xs text-pine">
                          {subject.status}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-pine/76">{subject.helper}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-clay">
                        {subjectAverage !== null ? `${subjectAverage.toFixed(1)}/20` : "--"}
                      </p>
                      <p className="mt-1 text-xs text-pine/60">Moyenne</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <MiniLineChart points={subject.points} />
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>

        <div className="space-y-5">
          <SectionCard
            eyebrow="Filtre"
            title="Quelle moyenne afficher ?"
            description={`${profile.className} - ${profile.targetExamSummary}`}
            accent="soft"
          >
            <div className="flex flex-wrap gap-3">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
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
            eyebrow="Saisie"
            title="Ajouter une note"
            description="Saisie d'une note entree par un professeur au fil de l'annee."
            accent="soft"
          >
            <form action={createGradeAction} className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-pine/80">Matiere</span>
                <select
                  name="subjectCode"
                  className="w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-pine"
                >
                  {gradeFormSubjects.map((subject) => (
                    <option key={subject.code} value={subject.code}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-pine/80">Type</span>
                <select
                  name="sourceType"
                  defaultValue="teacher_entry"
                  className="w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-pine"
                >
                  <option value="teacher_entry">Note classique</option>
                  <option value="mock_exam">Concours blanc</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-pine/80">Intitule</span>
                <input
                  name="title"
                  placeholder="Ex. Concours blanc maths"
                  className="w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-pine"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-pine/80">Note /20</span>
                  <input
                    name="score"
                    type="number"
                    step="0.5"
                    min="0"
                    max="20"
                    className="w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-pine"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-pine/80">Date</span>
                  <input
                    name="capturedAt"
                    type="date"
                    defaultValue={defaultDate}
                    className="w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-pine"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-pine/80">Professeur</span>
                <input
                  name="teacherName"
                  placeholder="Ex. Mme Laurent"
                  className="w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-pine"
                />
              </label>

              <button
                type="submit"
                className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-sand transition hover:bg-pine"
              >
                Ajouter la note
              </button>
            </form>
          </SectionCard>

          <SectionCard
            eyebrow="Lecture simple"
            title="Ou ca va, ou ca coince"
            description="Une synthese rapide, sans surcharger la page."
          >
            <div className="space-y-4">
              <div className="rounded-2xl bg-sand p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-pine/55">Ca va bien</p>
                <div className="mt-3 space-y-2 text-sm leading-7 text-pine/82">
                  {visualReading.strongAreas.length > 0 ? (
                    visualReading.strongAreas.map((item) => <p key={item}>{item}</p>)
                  ) : (
                    <p>Pas encore de zone tres solide identifiee clairement.</p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl bg-sand p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-pine/55">A surveiller</p>
                <div className="mt-3 space-y-2 text-sm leading-7 text-pine/82">
                  {visualReading.watchAreas.length > 0 ? (
                    visualReading.watchAreas.map((item) => <p key={item}>{item}</p>)
                  ) : (
                    <p>Rien de franchement instable pour l'instant.</p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl bg-sand p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-pine/55">A consolider</p>
                <div className="mt-3 space-y-2 text-sm leading-7 text-pine/82">
                  {visualReading.consolidateAreas.map((item) => (
                    <p key={item}>{item}</p>
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>

      <div className="mt-5">
        <SectionCard
          eyebrow="Carnet de notes"
          title="Notes repertoriees"
          description="Vue type carnet : une ligne par note, avec le detail qui s'ouvre quand on clique."
        >
          <div className="overflow-hidden rounded-[24px] border border-ink/8">
            <div className="grid grid-cols-[1.1fr_0.7fr_0.5fr_0.7fr] bg-ink px-4 py-3 text-xs uppercase tracking-[0.2em] text-sand/75">
              <p>Evaluation</p>
              <p>Matiere</p>
              <p>Note</p>
              <p>Date</p>
            </div>
            <div className="divide-y divide-ink/8 bg-white">
              {filteredGrades.map((grade) => {
                const isOpen = expandedGradeId === grade.id;

                return (
                  <div key={grade.id}>
                    <button
                      type="button"
                      onClick={() => setExpandedGradeId(isOpen ? null : grade.id)}
                      className="grid w-full grid-cols-[1.1fr_0.7fr_0.5fr_0.7fr] items-center px-4 py-4 text-left text-sm transition hover:bg-sand/50"
                    >
                      <p className="font-medium text-ink">{grade.title}</p>
                      <p className="text-pine/76">{grade.subject}</p>
                      <p className="font-semibold text-clay">{grade.score.toFixed(1)}/20</p>
                      <p className="text-pine/70">{grade.dateLabel}</p>
                    </button>

                    {isOpen ? (
                      <div className="border-t border-ink/8 bg-sand/45 px-4 py-4 text-sm leading-7 text-pine/80">
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

      <div className="mt-5">
        <SectionCard
          eyebrow="Copies"
          title="Retours les plus utiles"
          description="Les copies restent visibles ici seulement pour ce qu'elles apportent a la lecture de la progression."
        >
          <div className="grid gap-4 lg:grid-cols-3">
            {essayProgress.map((essay) => (
              <div key={essay.id} className="rounded-2xl border border-ink/8 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-ink">{essay.title}</p>
                  <span className="text-sm font-semibold text-clay">{essay.scoreLabel}</span>
                </div>
                <p className="mt-2 text-sm text-pine/75">{essay.subject}</p>
                <p className="mt-3 text-sm leading-7 text-pine/80">{essay.nextStep}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
