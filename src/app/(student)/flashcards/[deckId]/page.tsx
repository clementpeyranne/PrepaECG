export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";

import { FlashcardBrowser } from "@/components/flashcards/flashcard-browser";
import { FlashcardFocusTimer } from "@/components/flashcards/flashcard-focus-timer";
import { FlashcardMathProvider } from "@/components/flashcards/flashcard-math-provider";
import { ReviewCardPanel } from "@/components/flashcards/review-card-panel";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { getFlashcardDeckData } from "@/lib/flashcards";

export default async function DeckDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ deckId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { deckId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const planningEntryId =
    typeof resolvedSearchParams.planningEntryId === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(resolvedSearchParams.planningEntryId)
      ? resolvedSearchParams.planningEntryId
      : "";
  const data = await getFlashcardDeckData(deckId);

  if (!data) {
    notFound();
  }

  return (
    <div>
      <FlashcardMathProvider />
      <PageHeader title={data.deck.title} />

      {planningEntryId ? <FlashcardFocusTimer planningEntryId={planningEntryId} /> : null}

      <div className="space-y-5">
        <ReviewCardPanel
          deckId={data.deck.id}
          card={data.reviewCard}
          reviewOptions={data.reviewOptions}
          planningEntryId={planningEntryId}
        />

        <SectionCard
          eyebrow="Progression"
          title="Ou en est ce deck ?"
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
          totalCards={data.browserTotal}
          remoteSearch
          deckId={data.deck.id}
          title="Cartes du deck"
        />
      </div>
    </div>
  );
}
