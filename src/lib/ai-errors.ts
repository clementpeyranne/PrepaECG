export class AIServiceError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = "AIServiceError";
  }
}

export function getAIErrorMessage(error: unknown) {
  return error instanceof AIServiceError
    ? error.message
    : "L'analyse n'a pas abouti. Ton document est conserve. Reessaie dans quelques instants.";
}
