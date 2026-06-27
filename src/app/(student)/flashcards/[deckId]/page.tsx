export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";

import { FlashcardBrowser } from "@/components/flashcards/flashcard-browser";
import { FlashcardMathProvider } from "@/components/flashcards/flashcard-math-provider";
import { ReviewCardPanel } from "@/components/flashcards/review-card-panel";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { getFlashcardDeckData } from "@/lib/flashcards";

export default async function DeckDetailPage({
  params
}: {
  params: Promise<{ deckId: string }>;
}) {
  const { deckId } = await params;
  const data = await getFlashcardDeckData(deckId);

  if (!data) {
    notFound();
  }

  return (
    <div>
      <FlashcardMathProvider />
      <PageHeader
        title={data.deck.title}
        description={`Revision du deck ${data.deck.subject} - ${data.deck.chapter}. Ici, on se concentre uniquement sur la carte en cours et la progression du deck.`}
      />

      <div className="space-y-5">
        <ReviewCardPanel
          deckId={data.deck.id}
          card={data.reviewCard}
          reviewOptions={data.reviewOptions}
        />

        <SectionCard
          eyebrow="Progression"
          title="Ou en est ce deck ?"
          description="Sous la carte, tu retrouves l'essentiel : ton taux de reussite, combien de cartes ont deja ete revisees et la pression du jour."
        >
          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-sand p-4 text-sm">
              <p className="text-pine/60">Taux de reussite</p>
              <p className="mt-2 font-display text-3xl text-ink">
                {data.stats.retention > 0 ? `${data.stats.retention}%` : "--"}
              </p>
            </div>
            <div className="rounded-2xl bg-sand p-4 text-sm">
              <p className="text-pine/60">Cartes revisees</p>
              <p className="mt-2 font-display text-3xl text-ink">
                {data.stats.reviewedCards}/{data.stats.total}
              </p>
            </div>
            <div className="rounded-2xl bg-sand p-4 text-sm">
              <p className="text-pine/60">A revoir aujourd'hui</p>
              <p className="mt-2 font-display text-3xl text-ink">{data.stats.due}</p>
            </div>
            <div className="rounded-2xl bg-sand p-4 text-sm">
              <p className="text-pine/60">Nouvelles</p>
              <p className="mt-2 font-display text-3xl text-ink">{data.stats.newCards}</p>
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="mt-5">
        <FlashcardBrowser
          cards={data.browserCards}
          title="Cartes du deck"
          description="Toutes les cartes du deck restent consultables et recherchables, meme hors session de revision."
        />
      </div>
    </div>
  );
}
