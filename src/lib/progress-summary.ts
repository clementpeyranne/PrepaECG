export type ProgressGrade = {
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
};

export function buildProgressSummary(grades: ProgressGrade[], subjects: string[], category: string) {
  const filteredGrades = grades.filter((grade) => subjects.includes(grade.subject)
    && Number.isFinite(grade.score) && grade.score >= 0 && grade.score <= 20
    && (category === "Concours blancs" ? grade.sourceType === "mock_exam" : grade.semesterLabel === category))
    .sort((a, b) => b.capturedAtIso.localeCompare(a.capturedAtIso) || a.id.localeCompare(b.id));
  const average = (values: ProgressGrade[]) => values.length ? values.reduce((sum, grade) => sum + grade.score, 0) / values.length : null;
  const subjectCharts = subjects.map((subject) => {
    const entries = filteredGrades.filter((grade) => grade.subject === subject).slice().reverse();
    const mean = average(entries);
    const trend = entries.length >= 2 ? entries.at(-1)!.score - entries[0].score : null;
    const status = mean === null ? "Sans note" : entries.length === 1 ? "Premier résultat"
      : mean < 11.5 ? "À consolider" : trend! <= -1 ? "À suivre" : mean >= 13.5 ? "Résultats solides" : "À suivre";
    return {
      subject, average: mean, count: entries.length, status,
      trendLabel: trend === null ? "" : trend >= 1 ? "En progression" : trend <= -1 ? "En baisse" : "Stable",
      points: entries.slice(-5).map((grade) => ({ id: grade.id, label: grade.dateLabel, value: grade.score, title: grade.title }))
    };
  });
  const describe = (status: string) => subjectCharts.filter((subject) => subject.status === status)
    .map((subject) => `${subject.subject} : ${subject.average!.toFixed(1)}/20 de moyenne${subject.trendLabel ? ` · ${subject.trendLabel.toLowerCase()}` : ""}.`);
  return {
    filteredGrades,
    selectedAverage: average(filteredGrades),
    subjectCharts,
    visualReading: {
      strongAreas: describe("Résultats solides"),
      watchAreas: describe("À suivre"),
      consolidateAreas: describe("À consolider")
    }
  };
}
