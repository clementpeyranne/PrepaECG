"use server";

import { FlashcardRating } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createFlashcard,
  createFlashcardDeck,
  createFlashcardShare,
  importFlashcardArchive,
  importSharedFlashcardDeck,
  reviewFlashcard
} from "@/lib/flashcards";

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function redirectWithFlashcardsMessage(
  status: "success" | "error",
  message: string,
  decksImported = 0,
  cardsImported = 0
): never {
  const params = new URLSearchParams({
    flashcardsStatus: status,
    flashcardsMessage: message,
    flashcardsDecks: String(decksImported),
    flashcardsCards: String(cardsImported)
  });

  redirect(`/flashcards?${params.toString()}`);
}

export async function createDeckAction(formData: FormData) {
  const kind = getString(formData, "kind");

  await createFlashcardDeck({
    title: getString(formData, "title"),
    subjectCode: getString(formData, "subjectCode"),
    parentDeckId: kind === "subdeck" ? getString(formData, "parentDeckId") || undefined : undefined
  });

  revalidatePath("/flashcards");
}

export async function createCardAction(formData: FormData) {
  const deckId = getString(formData, "deckId");
  await createFlashcard({
    deckId,
    frontText: getString(formData, "frontText"),
    backText: getString(formData, "backText")
  });

  revalidatePath("/flashcards");
  if (deckId) {
    revalidatePath(`/flashcards/${deckId}`);
  }
}

export async function reviewCardAction(formData: FormData) {
  const cardId = getString(formData, "cardId");
  const deckId = getString(formData, "deckId");
  const ratingRaw = getString(formData, "rating");

  if (!cardId || !deckId) {
    return;
  }

  const rating = FlashcardRating[ratingRaw as keyof typeof FlashcardRating];
  if (!rating) {
    return;
  }

  await reviewFlashcard({
    cardId,
    deckId,
    rating
  });

  revalidatePath("/flashcards");
  revalidatePath(`/flashcards/${deckId}`);
  revalidatePath("/dashboard");
  revalidatePath("/planning");
}

export async function createShareAction(formData: FormData) {
  const deckId = getString(formData, "deckId");
  if (!deckId) {
    return;
  }

  await createFlashcardShare(deckId);
  revalidatePath("/flashcards");
}

export async function importShareCodeAction(formData: FormData) {
  const shareCode = getString(formData, "shareCode");
  if (!shareCode) {
    redirectWithFlashcardsMessage("error", "Le code de partage est vide.");
  }

  const result = await importSharedFlashcardDeck(shareCode);
  revalidatePath("/flashcards");
  revalidatePath("/dashboard");
  revalidatePath("/planning");
  redirectWithFlashcardsMessage(
    result.ok ? "success" : "error",
    result.message,
    result.decksImported,
    result.cardsImported
  );
}

export async function importFlashcardFileAction(formData: FormData) {
  const archive = formData.get("archive");
  if (!(archive instanceof File)) {
    redirectWithFlashcardsMessage("error", "Aucun fichier n'a ete selectionne.");
  }

  const file = archive;
  const result = await importFlashcardArchive(file);
  revalidatePath("/flashcards");
  revalidatePath("/dashboard");
  revalidatePath("/planning");
  redirectWithFlashcardsMessage(
    result.ok ? "success" : "error",
    result.message,
    result.decksImported,
    result.cardsImported
  );
}
