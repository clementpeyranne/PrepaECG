"use server";

import { askStudentAssistant } from "@/lib/assistant";

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getHistory(formData: FormData) {
  const raw = getString(formData, "history");

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(
        (item): item is { role: "user" | "assistant"; content: string } =>
          Boolean(
            item &&
              typeof item === "object" &&
              (((item as { role?: unknown }).role === "user") ||
                (item as { role?: unknown }).role === "assistant") &&
              typeof (item as { content?: unknown }).content === "string"
          )
      )
      .slice(-6);
  } catch {
    return [];
  }
}

export async function assistantChatAction(formData: FormData) {
  const prompt = getString(formData, "prompt");

  if (!prompt) {
    return {
      answer: "Ecris une vraie demande pour que je puisse t'aider utilement.",
      actions: [],
      citations: []
    };
  }

  return askStudentAssistant({
    prompt,
    history: getHistory(formData),
    resourceId: getString(formData, "resourceId") || undefined,
    essayId: getString(formData, "essayId") || undefined
  });
}
