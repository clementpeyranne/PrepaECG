import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { consumeAuthLimit } from "@/lib/auth-rate-limit";
import { getFileStorageDriver } from "@/lib/app-config";
import { createDirectUpload } from "@/lib/storage";

export async function POST(request: NextRequest) {
  const reply = (data: object, status = 200) => NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
  if (Number(request.headers.get("content-length") || "0") > 4096) return reply({ error: "Requete trop volumineuse." }, 413);
  if (request.headers.get("origin") !== request.nextUrl.origin) return reply({ error: "Acces refuse." }, 403);
  const user = await getCurrentUser();
  if (!user) return reply({ error: "Reconnecte-toi pour deposer un document." }, 401);
  if (getFileStorageDriver() !== "supabase") return reply({ error: "Stockage indisponible." }, 503);
  if (!await consumeAuthLimit(`upload:${user.id}`, 30)) return reply({ error: "Trop de depots. Reessaie dans 15 minutes." }, 429);
  try {
    const input = await request.json();
    const role = input.folder === "essays" || input.folder === "flashcards"
      ? "STUDENT"
      : input.folder === "resources"
        ? "TEACHER"
        : null;
    if (!role || (user.role !== role && user.role !== "ADMIN")) return reply({ error: "Acces refuse." }, 403);
    if (typeof input.name !== "string" || typeof input.mimeType !== "string" || typeof input.size !== "number") return reply({ error: "Fichier invalide." }, 400);
    return reply(await createDirectUpload(user.id, input.folder, input.name, input.mimeType, input.size));
  } catch {
    return reply({ error: "Envoi impossible. Verifie le format et la taille du fichier." }, 400);
  }
}
