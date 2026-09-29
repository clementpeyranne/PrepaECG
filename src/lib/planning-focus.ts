const FOCUS_PREFIX = "flashcard-focus:v1:";

export type FlashcardFocusState = {
  elapsedSeconds: number;
  heartbeatAt: Date | null;
};

export function parseFlashcardFocusState(value: string | null | undefined): FlashcardFocusState {
  if (!value?.startsWith(FOCUS_PREFIX)) return { elapsedSeconds: 0, heartbeatAt: null };

  try {
    const parsed = JSON.parse(value.slice(FOCUS_PREFIX.length)) as {
      elapsedSeconds?: unknown;
      heartbeatAt?: unknown;
    };
    const elapsedSeconds = typeof parsed.elapsedSeconds === "number" && Number.isSafeInteger(parsed.elapsedSeconds)
      ? Math.max(0, parsed.elapsedSeconds)
      : 0;
    const heartbeatAt = typeof parsed.heartbeatAt === "string" ? new Date(parsed.heartbeatAt) : null;

    return {
      elapsedSeconds,
      heartbeatAt: heartbeatAt && Number.isFinite(heartbeatAt.getTime()) ? heartbeatAt : null
    };
  } catch {
    return { elapsedSeconds: 0, heartbeatAt: null };
  }
}

export function serializeFlashcardFocusState(state: FlashcardFocusState) {
  return `${FOCUS_PREFIX}${JSON.stringify({
    elapsedSeconds: Math.max(0, Math.floor(state.elapsedSeconds)),
    heartbeatAt: state.heartbeatAt?.toISOString() ?? null
  })}`;
}
