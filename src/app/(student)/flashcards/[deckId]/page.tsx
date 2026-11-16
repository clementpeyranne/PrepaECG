export const dynamic = "force-dynamic";

import { StatTile } from "@/components/ui/stat-tile";
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
          title="Révisions du deck"
        >
          <div className="grid gap-3 md:grid-cols-4">
            <StatTile label="Taux de réussite" value={data.stats.retention > 0 ? `${data.stats.retention}%` : "–"} />
            <StatTile label="Cartes révisées" value={`${data.stats.reviewedCards}/${data.stats.total}`} />
            <StatTile label="À revoir aujourd'hui" value={data.stats.due} />
            <StatTile label="Nouvelles" value={data.stats.newCards} />
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
