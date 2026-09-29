import { NextRequest, NextResponse } from "next/server";

import { getFlashcardBrowserPage } from "@/lib/flashcards";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? "";
  const deckId = request.nextUrl.searchParams.get("deckId") ?? "";
  const rawOffset = Number(request.nextUrl.searchParams.get("offset") ?? "0");
  const offset = Number.isSafeInteger(rawOffset) ? rawOffset : 0;

  try {
    const result = await getFlashcardBrowserPage({ query, deckId, offset });
    return NextResponse.json(result, {
      headers: { "Cache-Control": "private, no-store" }
    });
  } catch {
    return NextResponse.json(
      { error: "Impossible de charger les cartes." },
      { status: 401, headers: { "Cache-Control": "private, no-store" } }
    );
  }
}
