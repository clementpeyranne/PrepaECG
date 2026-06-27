"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

import { reviewCardAction } from "@/app/(student)/flashcards/actions";
import { FlashcardRichContent } from "@/components/flashcards/flashcard-rich-content";

type ReviewCard = {
  id: string;
  frontText: string;
  backText: string;
  tags: string[];
};

type ReviewCardPanelProps = {
  deckId: string;
  card: ReviewCard | null;
  reviewOptions: Array<{
    value: string;
    label: string;
    nextReviewLabel: string;
  }>;
};

export function ReviewCardPanel({ deckId, card, reviewOptions }: ReviewCardPanelProps) {
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    setShowAnswer(false);
  }, [card?.id]);

  if (!card) {
    return (
      <div className="rounded-[32px] bg-ink p-8 text-sand shadow-panel">
        <p className="text-xs uppercase tracking-[0.25em] text-sand/55">Revision</p>
        <h2 className="mt-3 font-display text-3xl">File vide</h2>
        <p className="mt-4 text-sm leading-7 text-sand/82">
          Aucune carte n'est due dans ce deck pour l'instant. Tu peux ajouter de nouvelles cartes
          ou revenir plus tard.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[32px] bg-ink p-8 text-sand shadow-panel">
      <p className="text-xs uppercase tracking-[0.25em] text-sand/55">Revision</p>
      <h2 className="mt-3 font-display text-4xl">Carte du moment</h2>

      <div className="mt-6 rounded-[28px] bg-white/10 p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.25em] text-sand/55">Question</p>
        <div className="mt-5 text-2xl md:text-3xl md:leading-[3.2rem]">
          <FlashcardRichContent value={card.frontText} />
        </div>
      </div>

      {showAnswer ? (
        <div className="mt-4 rounded-[28px] bg-white/10 p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.25em] text-sand/55">Reponse</p>
          <div className="mt-5 text-lg text-sand/88 md:text-xl">
            <FlashcardRichContent value={card.backText} />
          </div>
        </div>
      ) : null}

      <div className="mt-6">
        {!showAnswer ? (
          <button
            type="button"
            onClick={() => setShowAnswer(true)}
            className="rounded-full bg-clay px-6 py-3 text-sm font-semibold text-white transition hover:bg-clay/90"
          >
            Afficher la reponse
          </button>
        ) : (
          <form action={reviewCardAction} className="space-y-4">
            <input type="hidden" name="cardId" value={card.id} />
            <input type="hidden" name="deckId" value={deckId} />
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {reviewOptions.map((rating) => (
                <RatingButton
                  key={rating.value}
                  value={rating.value}
                  label={rating.label}
                  nextReviewLabel={rating.nextReviewLabel}
                />
              ))}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function RatingButton({
  value,
  label,
  nextReviewLabel
}: {
  value: string;
  label: string;
  nextReviewLabel: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      name="rating"
      value={value}
      disabled={pending}
      className="rounded-[24px] border border-sand/20 px-5 py-4 text-left text-sand transition hover:border-sand/40 disabled:cursor-wait disabled:opacity-70"
    >
      <p className="text-sm font-semibold">{pending ? "..." : label}</p>
      <p className="mt-2 text-xs uppercase tracking-[0.18em] text-sand/55">
        Reproposee dans {nextReviewLabel}
      </p>
    </button>
  );
}
