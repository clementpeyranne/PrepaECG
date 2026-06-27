import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { teacherRubrics } from "@/lib/mock-data";

export default function TeacherRubricsPage() {
  return (
    <div>
      <PageHeader
        title="Grilles de correction"
        description="Les grilles sont un levier cle pour rendre le feedback IA plus proche des exigences reelles des concours."
        actionLabel="Nouvelle grille"
      />

      <SectionCard
        eyebrow="Base pedagogique"
        title="Grilles existantes"
        description="Ces grilles nourriront ensuite les futurs workflows de correction assistee."
      >
        <div className="space-y-4">
          {teacherRubrics.map((rubric) => (
            <div key={rubric.title} className="rounded-[24px] border border-ink/8 p-5">
              <p className="font-semibold">{rubric.title}</p>
              <p className="mt-2 text-sm text-pine/80">{rubric.focus}</p>
              <p className="mt-3 text-xs uppercase tracking-[0.22em] text-pine/55">{rubric.usage}</p>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
