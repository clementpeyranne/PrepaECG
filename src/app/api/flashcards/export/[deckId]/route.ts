import { NextResponse } from "next/server";

import { getFlashcardExportPayload } from "@/lib/flashcards";

type RouteContext = {
  params: Promise<{
    deckId: string;
  }>;
};

export async function GET(_: Request, context: RouteContext) {
  const { deckId } = await context.params;
  const payload = await getFlashcardExportPayload(deckId);

  if (!payload) {
    return NextResponse.json({ error: "Deck introuvable" }, { status: 404 });
  }

  const filename = `${payload.rootTitle.toLowerCase().replace(/[^a-z0-9]+/gi, "-") || "deck"}.json`;

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`
    }
  });
}
