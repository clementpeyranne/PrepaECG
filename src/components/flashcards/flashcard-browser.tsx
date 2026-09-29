"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";

import {
  FlashcardRichContent,
  stripCardHtml
} from "@/components/flashcards/flashcard-rich-content";
import type { FlashcardBrowserCard } from "@/lib/flashcards";

const PAGE_SIZE = 50;

type FlashcardBrowserProps = {
  cards: FlashcardBrowserCard[];
  totalCards?: number;
  remoteSearch?: boolean;
  deckId?: string;
  title?: string;
  description?: string;
};

type BrowserPageResponse = {
  cards: FlashcardBrowserCard[];
  total: number;
  nextOffset: number | null;
};

export function FlashcardBrowser({
  cards,
  totalCards,
  remoteSearch = false,
  deckId,
  title = "Toutes les cartes",
  description
}: FlashcardBrowserProps) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [remoteCards, setRemoteCards] = useState(cards);
  const [remoteTotal, setRemoteTotal] = useState(totalCards ?? cards.length);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const filteredCards = useMemo(() => {
    if (remoteSearch) return cards;
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return cards;

    return cards.filter((card) =>
      [
        card.deckPath ?? card.deckTitle ?? "",
        card.subject ?? "",
        stripCardHtml(card.frontText),
        stripCardHtml(card.backText),
        card.statusLabel
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [cards, query, remoteSearch]);

  useEffect(() => {
    if (!remoteSearch) {
      setVisibleCount(PAGE_SIZE);
      return;
    }

    const normalizedQuery = deferredQuery.trim();
    if (!normalizedQuery) {
      setRemoteCards(cards);
      setRemoteTotal(totalCards ?? cards.length);
      setLoadError("");
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      setLoadError("");
      const params = new URLSearchParams({ q: normalizedQuery, offset: "0" });
      if (deckId) params.set("deckId", deckId);

      try {
        const response = await fetch(`/api/flashcards/cards?${params.toString()}`, {
          signal: controller.signal,
          cache: "no-store"
        });
        if (!response.ok) throw new Error("FLASHCARDS_LOAD_FAILED");
        const result = (await response.json()) as BrowserPageResponse;
        setRemoteCards(result.cards);
        setRemoteTotal(result.total);
      } catch {
        if (!controller.signal.aborted) {
          setLoadError("La recherche n'a pas pu aboutir. Reessaie dans quelques secondes.");
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [cards, deckId, deferredQuery, remoteSearch, totalCards]);

  const visibleCards = remoteSearch ? remoteCards : filteredCards.slice(0, visibleCount);
  const resultTotal = remoteSearch ? remoteTotal : filteredCards.length;
  const hasMore = remoteSearch
    ? remoteCards.length < remoteTotal
    : visibleCount < filteredCards.length;

  const loadMore = async () => {
    if (!remoteSearch) {
      setVisibleCount((count) => count + PAGE_SIZE);
      return;
    }

    setIsLoading(true);
    setLoadError("");
    const params = new URLSearchParams({
      q: query.trim(),
      offset: String(remoteCards.length)
    });
    if (deckId) params.set("deckId", deckId);

    try {
      const response = await fetch(`/api/flashcards/cards?${params.toString()}`, {
        cache: "no-store"
      });
      if (!response.ok) throw new Error("FLASHCARDS_LOAD_FAILED");
      const result = (await response.json()) as BrowserPageResponse;
      setRemoteCards((current) => [...current, ...result.cards]);
      setRemoteTotal(result.total);
    } catch {
      setLoadError("Les cartes suivantes n'ont pas pu etre chargees.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-[28px] border border-white/80 bg-white p-5 shadow-panel">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-pine/55">Navigateur</p>
          <h2 className="mt-3 font-display text-2xl text-ink">{title}</h2>
          {description ? <p className="mt-2 text-sm leading-6 text-pine/75">{description}</p> : null}
          <p className="mt-3 text-xs uppercase tracking-[0.18em] text-pine/55">
            {visibleCards.length} sur {resultTotal} carte{resultTotal > 1 ? "s" : ""} affichee
            {visibleCards.length > 1 ? "s" : ""}
            {isLoading ? " - chargement..." : ""}
          </p>
        </div>
        <label className="block lg:w-[320px]">
          <span className="mb-2 block text-sm font-medium text-pine/80">Rechercher</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Question, reponse, deck, matiere..."
            className="w-full rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-pine"
          />
        </label>
      </div>

      <div className="mt-5 max-h-[860px] space-y-3 overflow-y-auto pr-2">
        {loadError ? (
          <div className="rounded-2xl border border-clay/20 bg-clay/10 p-4 text-sm text-clay">
            {loadError}
          </div>
        ) : null}

        {!isLoading && visibleCards.length === 0 ? (
          <div className="rounded-2xl bg-sand p-5 text-sm text-pine/75">
            Aucune carte ne correspond a la recherche.
          </div>
        ) : (
          visibleCards.map((card) => (
            <details key={card.id} className="rounded-2xl border border-ink/8 bg-sand/60 p-4">
              <summary className="cursor-pointer list-none">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="max-w-[min(100%,52rem)]">
                    <FlashcardRichContent
                      value={card.frontText}
                      className="max-h-[5.75rem] overflow-hidden text-base font-semibold leading-7 text-ink [&_p]:my-0 [&_mjx-container]:inline-block [&_mjx-container]:max-w-full [&_mjx-container]:align-middle"
                    />
                    <p className="mt-1 text-sm text-pine/75">
                      {card.deckPath ?? card.deckTitle ?? "Deck"} - {card.subject ?? "Matiere"} - {card.statusLabel}
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs text-pine">
                    {card.nextReviewLabel}
                  </span>
                </div>
              </summary>
              <div className="mt-4 rounded-2xl bg-white px-4 py-4 text-sm text-pine/85">
                <FlashcardRichContent value={card.backText} />
              </div>
            </details>
          ))
        )}

        {hasMore ? (
          <button
            type="button"
            onClick={loadMore}
            disabled={isLoading}
            className="w-full rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm font-semibold text-ink transition hover:border-pine hover:text-pine disabled:cursor-wait disabled:opacity-60"
          >
            {isLoading ? "Chargement..." : "Afficher 50 cartes de plus"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
