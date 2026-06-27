export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";

import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { regenerateEssayAIFeedbackAction } from "@/app/actions/essays";
import { getEssayDetailData } from "@/lib/essays";

export default async function EssayDetailPage({
  params
}: {
  params: Promise<{ essayId: string }>;
}) {
  const { essayId } = await params;
  const data = await getEssayDetailData(essayId);

  if (!data) {
    notFound();
  }

  return (
    <div>
      <PageHeader
        title={data.essay.title}
        description="Le feedback doit orienter le travail suivant : ressources, deck de cartes, ou nouvelle session ciblee."
      />

      <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <SectionCard
          eyebrow="Synthese"
          title={data.aiFeedback[0] ? `Fourchette indicative : ${data.aiFeedback[0].scoreRange}` : "Copie deposee"}
          description={`${data.essay.subject} - ${data.essay.examType} - ${data.essay.targetExam}`}
          accent="soft"
        >
          <p className="text-sm leading-7 text-pine/80">
            Statut : {data.essay.status}. La copie reste relue ici avec un retour IA, puis
            eventuellement un retour professeur.
          </p>
          <form action={regenerateEssayAIFeedbackAction} className="mt-4">
            <input type="hidden" name="essayId" value={data.essay.id} />
            <button
              type="submit"
              className="rounded-full bg-ink px-4 py-3 text-sm font-semibold text-sand transition hover:bg-pine"
            >
              Refaire la correction IA
            </button>
          </form>
        </SectionCard>

        <SectionCard
          eyebrow="Copie"
          title="Copie deposee"
          description={`Envoyee le ${data.essay.createdAtLabel}`}
        >
          {data.essay.fileUrl ? (
            <div className="space-y-4">
              <div className="rounded-[24px] bg-sand p-5 text-sm leading-8 text-pine/82">
                {data.essay.mimeType === "application/pdf"
                  ? "La copie a ete deposee en PDF."
                  : "La copie a ete deposee en photo."}
              </div>
              {data.essay.mimeType === "application/pdf" ? (
                <iframe
                  src={data.essay.fileUrl}
                  className="h-[640px] w-full rounded-[24px] border border-ink/8 bg-white"
                  title="Copie PDF"
                />
              ) : (
                <img
                  src={data.essay.fileUrl}
                  alt="Copie deposee"
                  className="w-full rounded-[24px] border border-ink/8 bg-white object-contain"
                />
              )}
            </div>
          ) : (
            <div className="rounded-[24px] bg-sand p-5 text-sm leading-8 text-pine/82">
              {data.essay.content.split("\n").filter(Boolean).map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        {data.aiFeedback.map((feedback) => (
          <SectionCard
            key={feedback.id}
            eyebrow="Feedback IA"
            title={feedback.scoreRange}
            description={`Genere le ${feedback.createdAtLabel}`}
          >
            <p className="text-sm leading-7 text-pine/82">{feedback.overview}</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <FeedbackColumn title="Points forts" items={feedback.strengths} />
              <FeedbackColumn title="Erreurs majeures" items={feedback.mistakes} />
              <FeedbackColumn title="Prochaines etapes" items={feedback.nextSteps} />
              <FeedbackColumn title="Impact planning" items={feedback.planningSignals} />
            </div>
          </SectionCard>
        ))}

        {data.teacherFeedback.map((feedback) => (
          <SectionCard
            key={feedback.id}
            eyebrow="Feedback professeur"
            title={feedback.scoreRange}
            description={`Ajoute le ${feedback.createdAtLabel}`}
            accent="dark"
          >
            <p className="text-sm leading-7 text-sand/85">{feedback.overview}</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <FeedbackColumn title="Points forts" items={feedback.strengths} dark />
              <FeedbackColumn title="Erreurs majeures" items={feedback.mistakes} dark />
              <FeedbackColumn title="Prochaines etapes" items={feedback.nextSteps} dark />
              <FeedbackColumn title="Impact planning" items={feedback.planningSignals} dark />
            </div>
          </SectionCard>
        ))}
      </div>
    </div>
  );
}

function FeedbackColumn({
  title,
  items,
  dark = false
}: {
  title: string;
  items: string[];
  dark?: boolean;
}) {
  return (
    <div className={`rounded-[22px] p-4 ${dark ? "bg-white/10 text-sand" : "bg-sand text-ink"}`}>
      <p className="text-sm font-semibold">{title}</p>
      <div className={`mt-3 space-y-2 text-sm ${dark ? "text-sand/82" : "text-pine/80"}`}>
        {items.map((item) => (
          <p key={item}>{item}</p>
        ))}
      </div>
    </div>
  );
}
