export const dynamic = "force-dynamic";
export const maxDuration = 300;

import { Layers } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { StatTile } from "@/components/ui/stat-tile";
import Link from "next/link";
import type { Route } from "next";

import { FlashcardBrowser } from "@/components/flashcards/flashcard-browser";
import { FlashcardFocusTimer } from "@/components/flashcards/flashcard-focus-timer";
import { FlashcardImportForm } from "@/components/flashcards/flashcard-import-form";
import { FlashcardMathProvider } from "@/components/flashcards/flashcard-math-provider";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import {
  createCardAction,
  createDeckAction,
  createShareAction,
  importFlashcardFileAction,
  importShareCodeAction
} from "@/app/(student)/flashcards/actions";
import { getFlashcardsOverviewData, type FlashcardsOverviewDeckNode } from "@/lib/flashcards";
import { getFileStorageDriver } from "@/lib/app-config";

export default async function FlashcardsPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const data = await getFlashcardsOverviewData();
  const cloudUploadsEnabled = getFileStorageDriver() === "supabase";
  const planningEntryId =
    typeof resolvedSearchParams.planningEntryId === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(resolvedSearchParams.planningEntryId)
      ? resolvedSearchParams.planningEntryId
      : "";
  const planningQuery = planningEntryId ? `?planningEntryId=${encodeURIComponent(planningEntryId)}` : "";
  const reviewHref = (data.reviewDeckId ? `/flashcards/${data.reviewDeckId}${planningQuery}` : `/flashcards${planningQuery}`) as Route;
  const flashcardsStatus =
    typeof resolvedSearchParams.flashcardsStatus === "string"
      ? resolvedSearchParams.flashcardsStatus
      : null;
  const flashcardsMessage =
    typeof resolvedSearchParams.flashcardsMessage === "string"
      ? resolvedSearchParams.flashcardsMessage
      : null;
  const flashcardsDecks =
    typeof resolvedSearchParams.flashcardsDecks === "string"
      ? resolvedSearchParams.flashcardsDecks
      : null;
  const flashcardsCards =
    typeof resolvedSearchParams.flashcardsCards === "string"
      ? resolvedSearchParams.flashcardsCards
      : null;

  return (
    <div>
      <FlashcardMathProvider />
      <PageHeader
        title="Flashcards"
        actionLabel="Réviser maintenant"
        actionHref={reviewHref}
      />

      {planningEntryId ? <FlashcardFocusTimer planningEntryId={planningEntryId} /> : null}

      {flashcardsMessage ? (
        <div
          className={`mb-5 rounded-[24px] border px-5 py-4 text-sm ${
            flashcardsStatus === "success"
              ? "border-pine/15 bg-mist text-pine"
              : "border-clay/20 bg-clay/10 text-clay"
          }`}
        >
          <p className="font-semibold">
            {flashcardsStatus === "success" ? "Import terminé" : "Import non réalisé"}
          </p>
          <p className="mt-1">{flashcardsMessage}</p>
          {flashcardsStatus === "success" && flashcardsDecks && flashcardsCards ? (
            <p className="mt-2 text-xs uppercase tracking-[0.18em] opacity-70">
              {flashcardsDecks} decks - {flashcardsCards} cartes
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="grid items-start gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard
          title="Decks et sous-decks"
        >
          {data.subjectGroups.length === 0 ? (
            <EmptyState
              icon={Layers}
              title="Aucun deck pour le moment"
              text="Crée un premier deck ci-dessous ou importe un deck Anki (.apkg). Les sous-decks sont conservés."
            />
          ) : null}
          <div className="scroll-fade max-h-[560px] space-y-4 overflow-y-auto overscroll-contain pr-1 empty:hidden">
            {data.subjectGroups.map((group) => (
              <div key={group.subject} className="rounded-[24px] border border-ink/8 bg-sand/50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-display text-2xl text-ink">{group.subject}</p>
                    <p className="mt-1 text-sm text-pine/75">
                      {group.deckCount} deck{group.deckCount > 1 ? "s" : ""} et sous-decks · {group.totalCards} carte{group.totalCards > 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="rounded-full bg-clay/10 px-3 py-1 text-xs text-clay">
                    {group.totalDue} à revoir
                  </div>
                </div>

                <div className="mt-4 grid gap-3">
                  {group.decks.map((deck) => renderDeckTree(deck, planningEntryId))}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Révisions"
          accent="soft"
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <StatTile tone="white" label="À revoir" value={data.globalState.due} />
            <StatTile tone="white" label="Decks actifs" value={data.globalState.active} />
            <StatTile tone="white" label="Decks terminés" value={data.globalState.completed} />
          </div>
        </SectionCard>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionCard
          title="Nouveau deck"
        >
          <form action={createDeckAction} className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-pine/80">Type</span>
              <select
                name="kind"
                defaultValue="deck"
                className="w-full rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-pine"
              >
                <option value="deck">Deck</option>
                <option value="subdeck">Sous-deck</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-pine/80">Nom</span>
              <input
                name="title"
                placeholder="Ex. Probabilités"
                className="w-full rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-pine"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-pine/80">Matière</span>
              <select
                name="subjectCode"
                defaultValue={data.subjectsForForms[0]?.code}
                className="w-full rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-pine"
              >
                {data.subjectsForForms.map((subject) => (
                  <option key={subject.code} value={subject.code}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-pine/80">Deck parent pour un sous-deck</span>
              <select
                name="parentDeckId"
                defaultValue=""
                className="w-full rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-pine"
              >
                <option value="">Aucun</option>
                {data.parentDeckOptions.map((deck) => (
                  <option key={deck.id} value={deck.id}>
                    {deck.subject} - {deck.title}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="submit"
              className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-sand transition hover:bg-pine"
            >
              Créer
            </button>
          </form>
        </SectionCard>

        <SectionCard
          title="Ajouter une carte"
        >
          <form action={createCardAction} className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-pine/80">Deck</span>
              <select
                name="deckId"
                className="w-full rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-pine"
              >
                {data.decksForForms.map((deck) => (
                  <option key={deck.id} value={deck.id}>
                    {deck.subject} - {deck.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-pine/80">Question</span>
              <textarea
                name="frontText"
                rows={3}
                placeholder="Recto de la carte"
                className="w-full rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-pine"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-pine/80">Réponse</span>
              <textarea
                name="backText"
                rows={4}
                placeholder="Verso de la carte"
                className="w-full rounded-2xl border border-ink/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-pine"
              />
            </label>

            <button
              type="submit"
              className="rounded-full bg-clay px-5 py-3 text-sm font-semibold text-white transition hover:bg-clay/90"
            >
              Ajouter la carte
            </button>
          </form>
        </SectionCard>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard
          eyebrow="Transfert"
          title="Partager ou exporter un deck"
        >
          <div className="max-h-[860px] space-y-3 overflow-y-auto pr-2">
            {data.transferDecks.map((deck) => (
              <div
                key={deck.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-ink/8 bg-sand/55 p-4"
              >
                <div>
                  <p className="font-semibold text-ink">{deck.title}</p>
                  <p className="mt-1 text-sm text-pine/75">
                    {deck.subject} - {deck.isRoot ? "deck principal" : "sous-deck"}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/api/flashcards/export/${deck.id}`}
                    className="inline-flex rounded-full border border-ink/10 bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-pine hover:text-pine"
                  >
                    Exporter
                  </Link>
                  <form action={createShareAction}>
                    <input type="hidden" name="deckId" value={deck.id} />
                    <button
                      type="submit"
                      className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-sand transition hover:bg-pine"
                    >
                      Créer un code
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-[22px] border border-dashed border-ink/10 bg-white/80 p-4">
            <p className="text-sm font-semibold text-ink">Codes récents</p>
            <div className="mt-3 grid gap-2">
              {data.recentShares.length > 0 ? (
                data.recentShares.map((share) => (
                  <div
                    key={share.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-sand px-3 py-3 text-sm"
                  >
                    <div>
                      <p className="font-semibold text-ink">{share.title}</p>
                      <p className="mt-1 text-pine/75">{share.createdAtLabel}</p>
                    </div>
                    <div className="rounded-full bg-clay/10 px-3 py-1 font-semibold text-clay">
                      {share.shareCode}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-pine/80">Aucun code créé pour le moment.</p>
              )}
            </div>
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="Import"
          title="Importer un deck"
          accent="soft"
        >
          <div className="space-y-5">
            <form action={importShareCodeAction} className="space-y-3">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-pine/80">Code de partage</span>
                <input
                  name="shareCode"
                  placeholder="Ex. PREPA-8F4A21"
                  className="w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm uppercase outline-none transition focus:border-pine"
                />
              </label>

              <button
                type="submit"
                className="rounded-full bg-clay px-5 py-3 text-sm font-semibold text-white transition hover:bg-clay/90"
              >
                Importer ce deck
              </button>
            </form>

            <FlashcardImportForm action={importFlashcardFileAction} cloud={cloudUploadsEnabled}>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-pine/80">Fichier du deck</span>
                <input
                  type="file"
                  name="archive"
                  accept=".json,.apkg,application/json"
                  className="w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm text-pine/80 file:mr-4 file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-2 file:text-sm file:font-semibold file:text-sand"
                />
              </label>

              <p className="text-xs text-pine/80">Formats acceptés : .json (Prépatempo) et .apkg (Anki). Les sous-decks sont conservés.</p>

              <button
                type="submit"
                className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-sand transition hover:bg-pine"
              >
                Importer le fichier
              </button>
            </FlashcardImportForm>
          </div>
        </SectionCard>
      </div>

      <div className="mt-5">
        <FlashcardBrowser
          cards={data.browserCards}
          totalCards={data.browserTotal}
          remoteSearch
        />
      </div>
    </div>
  );
}

function renderDeckTree(deck: FlashcardsOverviewDeckNode, planningEntryId = "") {
  if (deck.isLeaf) {
    return (
      <Link
        key={deck.id}
        href={`/flashcards/${deck.id}${planningEntryId ? `?planningEntryId=${encodeURIComponent(planningEntryId)}` : ""}` as Route}
        className="block rounded-[22px] border border-ink/8 bg-white p-4 transition hover:border-pine/20 hover:bg-mist/40"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-ink">{deck.title}</p>
            <p className="mt-1 text-sm text-pine/75">
              {deck.chapter} · {deck.total} carte{deck.total > 1 ? "s" : ""}
            </p>
          </div>
          <div className="text-right text-xs text-pine/80">
            <p>{deck.due} à revoir</p>
            <p className="mt-1">{deck.retention}% de réussite</p>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <details
      key={deck.id}
      className="rounded-[22px] border border-ink/8 bg-white p-4"
    >
      <summary className="cursor-pointer list-none">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-ink">{deck.title}</p>
            <p className="mt-1 text-sm text-pine/75">
              {deck.childCount} sous-deck{deck.childCount > 1 ? "s" : ""} · {deck.total} carte{deck.total > 1 ? "s" : ""} au total
            </p>
          </div>
          <div className="rounded-full bg-sand px-3 py-1 text-xs text-pine">
            {deck.due} à revoir
          </div>
        </div>
      </summary>

      <div className="mt-4 space-y-3 border-l border-ink/8 pl-4">
        {deck.children.map((childDeck) => renderDeckTree(childDeck, planningEntryId))}
      </div>
    </details>
  );
}
